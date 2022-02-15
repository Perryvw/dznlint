// Not using a parameter is not allowed

import { Diagnostic, DiagnosticSeverity } from "..";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { ASTKinds, function_definition, identifier, on } from "../grammar/parser";
import { ASTNode, RuleFactory } from "../linting-rule";
import { headTailToList, nodeToSourceRange } from "../util";
import { VisitorContext } from "../visitor";

export const unusedParameter = createDiagnosticsFactory();

export const no_unused_parameters: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_unused_parameters", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<function_definition>(ASTKinds.function_definition, (node, context) => {
            if (node.parameters.formals) {
                const parameterIdentifiers = headTailToList(node.parameters.formals).map(p => p.name);
                return findUnusedParameters(parameterIdentifiers, node.body, context, config.severity);
            }

            return [];
        });

        factoryContext.registerRule<on>(ASTKinds.on, (node, context) => {
            const parameterIdentifiers = [];
            for (const { parameters } of headTailToList(node.on_trigger_list)) {
                if (parameters?.formals) {
                    for (const { name, assignment } of headTailToList(parameters.formals)) {
                        // Skip parameters with <- assignment
                        if (!assignment) {
                            parameterIdentifiers.push(name);
                        }
                    }
                }
            }

            return findUnusedParameters(parameterIdentifiers, node.statement, context, config.severity);
        });
    }
};

function findUnusedParameters(
    parameters: identifier[],
    body: ASTNode,
    context: VisitorContext,
    severity: DiagnosticSeverity
): Diagnostic[] {
    const seenParameters = new Map<string, { node: identifier; seen: boolean }>();

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
                    nodeToSourceRange(node)
                )
            );
        }
    }

    return diagnostics;
}

function isIdentifier(node: ASTNode): node is identifier {
    return node.kind === ASTKinds.identifier;
}

export default no_unused_parameters;
