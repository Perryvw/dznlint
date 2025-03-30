// Do not redefine variables that already exist in scope

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory, DiagnosticSeverity } from "../diagnostic";
import { RuleFactory } from "../linting-rule";
import { InputSource } from "../semantics/program";
import { headTailToList, nodeToSourceRange } from "../util";
import { VisitorContext } from "../visitor";

export const shadowingVariablesNotAllowed = createDiagnosticsFactory();

export const no_shadowing: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_shadowing", factoryContext.userConfig);

    if (config.isEnabled) {
        const createDiagnostics = (newVariable: ast.Identifier, originalDefinition: ast.Identifier, source: InputSource) => [
            // Create error diagnostic at re-definition node
            shadowingVariablesNotAllowed(
                config.severity,
                `Shadowing already defined variable '${newVariable.text}'.`,
                source,
                newVariable.position
            ),
            // Create hint diagnostic pointing back at original definition
            shadowingVariablesNotAllowed(
                DiagnosticSeverity.Hint,
                `Original declaration of '${newVariable.text}' here.`,
                source,
                originalDefinition.position
            ),
        ];

        factoryContext.registerRule<ast.OnStatement>(ast.SyntaxKind.OnStatement, (node, context) => {
            const diagnostics = [];

            for (const trigger of node.triggers) {
                if (trigger.parameterList) {
                    for (const param of trigger.parameterList.parameters) {
                        const previousDefinition = findDeclarationInUpperScope(param.name.text, context);
                        if (previousDefinition) {
                            diagnostics.push(...createDiagnostics(param.name, previousDefinition, context.source));
                        }
                    }
                }
            }

            return diagnostics;
        });

        factoryContext.registerRule<ast.VariableDefinition>(ast.SyntaxKind.VariableDefinition, (node, context) => {
            const previousDefinition = findDeclarationInUpperScope(node.name.text, context);
            if (previousDefinition) {
                return [...createDiagnostics(node.name, previousDefinition, context.source)];
            }

            return [];
        });

        factoryContext.registerRule<ast.Instance>(ast.SyntaxKind.Instance, (node, context) => {
            const previousDefinition = findDeclarationInUpperScope(node.name.text, context);
            if (previousDefinition) {
                return [...createDiagnostics(node.name, previousDefinition, context.source)];
            }

            return [];
        });

        factoryContext.registerRule<ast.FunctionDefinition>(ast.SyntaxKind.FunctionDefinition, (node, context) => {
            const diagnostics = [];

            const previousFunctionNameDefinition = findDeclarationInUpperScope(node.name.text, context);
            if (previousFunctionNameDefinition) {
                diagnostics.push(...createDiagnostics(node.name, previousFunctionNameDefinition, context.source));
            }

            if (node.parameters) {
                for (const { name } of node.parameters) {
                    const previousDefinition = findDeclarationInUpperScope(name.text, context);
                    if (previousDefinition) {
                        diagnostics.push(...createDiagnostics(name, previousDefinition, context.source));
                    }
                }
            }

            return diagnostics;
        });
    }
};

function findDeclarationInUpperScope(name: string, context: VisitorContext): ast.Identifier | undefined {
    for (const scope of context.scopeStack) {
        const previousDefinition = scope.variable_declarations[name];
        if (previousDefinition) {
            return previousDefinition;
        }
    }
    return undefined;
}

export default no_shadowing;
