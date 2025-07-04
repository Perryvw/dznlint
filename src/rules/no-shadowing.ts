// Do not redefine variables that already exist in scope

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory, Diagnostic, DiagnosticSeverity } from "../diagnostic";
import { RuleFactory } from "../linting-rule";
import { InputSource } from "../semantics/program";
import {
    findFirstParent,
    isCompoundName,
    isErrorNode,
    isEvent,
    isExtern,
    isFunctionDefinition,
    isFunctionParameter,
    isInstance,
    isKeyword,
    isNamespace,
    isOnParameter,
    isPort,
    isScopedBlock,
    isVariableDefinition,
} from "../util";
import { VisitorContext } from "../visitor";

export const shadowingVariablesNotAllowed = createDiagnosticsFactory();

export const no_shadowing: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_shadowing", factoryContext.userConfig);

    if (config.isEnabled) {
        const createDiagnostics = (
            newVariable: ast.Identifier,
            originalDefinition: ast.Identifier,
            source: InputSource
        ) => [
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
            const diagnostics: Diagnostic[] = [];

            for (const trigger of node.triggers) {
                if (!isKeyword(trigger) && !isErrorNode(trigger) && trigger.parameterList) {
                    for (const param of trigger.parameterList.parameters) {
                        const previousDefinition = findDeclarationInUpperScope(param.name.text, node, context);
                        if (previousDefinition) {
                            diagnostics.push(
                                ...createDiagnostics(param.name, declarationName(previousDefinition), context.source)
                            );
                        }
                    }
                }
            }

            return diagnostics;
        });

        factoryContext.registerRule<ast.VariableDefinition>(ast.SyntaxKind.VariableDefinition, (node, context) => {
            const previousDefinition = findDeclarationInUpperScope(node.name.text, node, context);
            if (previousDefinition) {
                return [...createDiagnostics(node.name, declarationName(previousDefinition), context.source)];
            }

            return [];
        });

        factoryContext.registerRule<ast.Instance>(ast.SyntaxKind.Instance, (node, context) => {
            const previousDefinition = findDeclarationInUpperScope(node.name.text, node, context);
            if (previousDefinition) {
                return [...createDiagnostics(node.name, declarationName(previousDefinition), context.source)];
            }

            return [];
        });

        factoryContext.registerRule<ast.FunctionDefinition>(ast.SyntaxKind.FunctionDefinition, (node, context) => {
            const diagnostics = [];

            const previousFunctionNameDefinition = findDeclarationInUpperScope(node.name.text, node, context);
            if (previousFunctionNameDefinition && previousFunctionNameDefinition !== node) {
                diagnostics.push(
                    ...createDiagnostics(node.name, declarationName(previousFunctionNameDefinition), context.source)
                );
            }

            if (node.parameters) {
                for (const parameter of node.parameters) {
                    const previousDefinition = findDeclarationInUpperScope(parameter.name.text, parameter, context);
                    if (previousDefinition) {
                        diagnostics.push(
                            ...createDiagnostics(parameter.name, declarationName(previousDefinition), context.source)
                        );
                    }
                }
            }

            return diagnostics;
        });
    }
};

function findDeclarationInUpperScope(
    name: string,
    node: ast.AnyAstNode,
    context: VisitorContext
): ast.AnyAstNode | undefined {
    let scope = findFirstParent(node, isScopedBlock);
    while (scope) {
        const variables = context.typeChecker.findVariablesDeclaredInScope(scope);
        const definition = variables.get(name);
        if (definition && definition !== node) {
            return definition;
        }
        scope = findFirstParent(scope, isScopedBlock);
    }
    return undefined;
}

function declarationName(declaration: ast.AnyAstNode): ast.Identifier {
    if (isFunctionDefinition(declaration)) {
        return declaration.name;
    } else if (isInstance(declaration)) {
        return declaration.name;
    } else if (isVariableDefinition(declaration)) {
        return declaration.name;
    } else if (isOnParameter(declaration)) {
        return declaration.name;
    } else if (isFunctionParameter(declaration)) {
        return declaration.name;
    } else if (isNamespace(declaration)) {
        return isCompoundName(declaration.name) ? declaration.name.name : declaration.name;
    } else if (isEvent(declaration)) {
        return declaration.name;
    } else if (isPort(declaration)) {
        return declaration.name;
    } else if (isExtern(declaration)) {
        return declaration.name;
    } else {
        throw `Don't know how to get name of node of kind  ${ast.SyntaxKind[declaration.kind]}`;
    }
}

export default no_shadowing;
