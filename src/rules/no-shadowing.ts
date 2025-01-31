// Do not redefine variables that already exist in scope

import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory, DiagnosticSeverity } from "../diagnostic";
import { ASTKinds, function_definition, identifier, instance, on, variable_definition } from "../grammar/parser";
import { RuleFactory } from "../linting-rule";
import { InputSource } from "../semantics/program";
import { headTailToList, nodeToSourceRange } from "../util";
import { VisitorContext } from "../visitor";

export const shadowingVariablesNotAllowed = createDiagnosticsFactory();

export const no_shadowing: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_shadowing", factoryContext.userConfig);

    if (config.isEnabled) {
        const createDiagnostics = (newVariable: identifier, originalDefinition: identifier, source: InputSource) => [
            // Create error diagnostic at re-definition node
            shadowingVariablesNotAllowed(
                config.severity,
                `Shadowing already defined variable '${newVariable.text}'.`,
                source,
                nodeToSourceRange(newVariable)
            ),
            // Create hint diagnostic pointing back at original definition
            shadowingVariablesNotAllowed(
                DiagnosticSeverity.Hint,
                `Original declaration of '${newVariable.text}' here.`,
                source,
                nodeToSourceRange(originalDefinition)
            ),
        ];

        factoryContext.registerRule<on>(ASTKinds.on, (node, context) => {
            const diagnostics = [];

            for (const trigger of headTailToList(node.on_trigger_list)) {
                if (trigger.parameters && trigger.parameters.parameters) {
                    for (const param of headTailToList(trigger.parameters.parameters)) {
                        const previousDefinition = findDeclarationInUpperScope(param.name.text, context);
                        if (previousDefinition) {
                            diagnostics.push(...createDiagnostics(param.name, previousDefinition, context.source));
                        }
                    }
                }
            }

            return diagnostics;
        });

        factoryContext.registerRule<variable_definition>(ASTKinds.variable_definition, (node, context) => {
            const previousDefinition = findDeclarationInUpperScope(node.name.text, context);
            if (previousDefinition) {
                return [...createDiagnostics(node.name, previousDefinition, context.source)];
            }

            return [];
        });

        factoryContext.registerRule<instance>(ASTKinds.instance, (node, context) => {
            const previousDefinition = findDeclarationInUpperScope(node.name.text, context);
            if (previousDefinition) {
                return [...createDiagnostics(node.name, previousDefinition, context.source)];
            }

            return [];
        });

        factoryContext.registerRule<function_definition>(ASTKinds.function_definition, (node, context) => {
            const diagnostics = [];

            const previousFunctionNameDefinition = findDeclarationInUpperScope(node.name.text, context);
            if (previousFunctionNameDefinition) {
                diagnostics.push(...createDiagnostics(node.name, previousFunctionNameDefinition, context.source));
            }

            if (node.parameters.parameters) {
                for (const { name } of headTailToList(node.parameters.parameters)) {
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

function findDeclarationInUpperScope(name: string, context: VisitorContext): identifier | undefined {
    for (const scope of context.scopeStack) {
        const previousDefinition = scope.variable_declarations[name];
        if (previousDefinition) {
            return previousDefinition;
        }
    }
    return undefined;
}

export default no_shadowing;
