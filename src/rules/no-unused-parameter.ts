// Not using a parameter is not allowed

import * as ast from "../grammar/ast";
import { Diagnostic, DiagnosticSeverity } from "..";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { RuleFactory } from "../linting-rule";
import { isErrorNode, isIdentifier, isKeyword } from "../util";
import { VisitorContext } from "../visitor";

export const unusedParameter = createDiagnosticsFactory();

export const no_unused_parameters: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_unused_parameters", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<ast.FunctionDefinition>(ast.SyntaxKind.FunctionDefinition, (node, context) => {
            const parameterIdentifiers = node.parameters.map(p => p.name);
            return findUnusedParameters(parameterIdentifiers, node.body, context, config.severity);
        });

        factoryContext.registerRule<ast.OnStatement>(ast.SyntaxKind.OnStatement, (node, context) => {
            const parameterIdentifiers = [];
            for (const trigger of node.triggers) {
                if (!isKeyword(trigger) && !isErrorNode(trigger) && trigger.parameterList) {
                    for (const { name, assignment } of trigger.parameterList.parameters) {
                        // Skip parameters with <- assignment
                        if (!assignment) {
                            parameterIdentifiers.push(name);
                        }
                    }
                }
            }

            return findUnusedParameters(parameterIdentifiers, node.body, context, config.severity);
        });
    }
};

function findUnusedParameters(
    parameters: ast.Identifier[],
    body: ast.AnyAstNode,
    context: VisitorContext,
    severity: DiagnosticSeverity
): Diagnostic[] {
    const seenParameters = new Map<string, { node: ast.Identifier; seen: boolean }>();

    // Add function parameters to map as unseen
    for (const param of parameters) {
        // Ignore parameters starting with underscore
        if (param.text[0] !== "_") {
            seenParameters.set(param.text, { node: param, seen: false });
        }
    }

    // Visit body trying to find the parameters
    context.visit(body, subNode => {
        if (isIdentifier(subNode) && seenParameters.has(subNode.text)) {
            seenParameters.get(subNode.text)!.seen = true;
        }
    });

    const diagnostics: Diagnostic[] = [];

    // Add diagnostic for all parameters that were not seen again
    for (const { node, seen } of seenParameters.values()) {
        if (!seen) {
            diagnostics.push(
                unusedParameter(
                    severity,
                    `This parameter is not referenced anywhere. You can discard it by renaming to _${node.text}.`,
                    context.source,
                    node.position
                )
            );
        }
    }

    return diagnostics;
}

export default no_unused_parameters;
