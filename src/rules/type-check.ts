// Types assigned to variables and function arguments must match

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { RuleFactory } from "../linting-rule";
import { InputSource } from "../semantics/program";
import { findFirstParent, isDollarsLiteral, isEvent, isFunctionDefinition } from "../util";
import { Type } from "../semantics";

export const typeMismatch = createDiagnosticsFactory();

export const type_check: RuleFactory = factoryContext => {
    const config = getRuleConfig("type_check", factoryContext.userConfig);

    if (config.isEnabled) {
        const createTypeMismatchDiagnostic = (
            expectedType: Type,
            actualType: Type,
            source: InputSource,
            position: ast.SourceRange
        ) => {
            return typeMismatch(
                config.severity,
                `Type mismatch: Expected type '${expectedType.name}', but instead got something of type '${actualType.name}'`,
                source,
                position
            );
        };

        factoryContext.registerRule<ast.VariableDefinition>(ast.SyntaxKind.VariableDefinition, (node, context) => {
            // initializer type must match lhs type
            if (node.initializer && !isDollarsLiteral(node.initializer)) {
                const initializerType = context.typeChecker.typeOfNode(node.initializer);
                const variableType = context.typeChecker.typeOfNode(node.type);

                if (initializerType !== variableType) {
                    return [
                        createTypeMismatchDiagnostic(
                            variableType,
                            initializerType,
                            context.source,
                            node.initializer.position
                        ),
                    ];
                }
            }

            return [];
        });

        factoryContext.registerRule<ast.AssignmentStatement>(ast.SyntaxKind.AssignmentStatement, (node, context) => {
            // rhs type must match lhs type
            if (!isDollarsLiteral(node.right)) {
                const rhsType = context.typeChecker.typeOfNode(node.right);
                const lhsType = context.typeChecker.typeOfNode(node.left);

                if (rhsType !== lhsType) {
                    return [createTypeMismatchDiagnostic(lhsType, rhsType, context.source, node.right.position)];
                }
            }

            return [];
        });

        factoryContext.registerRule<ast.CallExpression>(ast.SyntaxKind.CallExpression, (node, context) => {
            const diagnostics = [];

            const functionSymbol = context.typeChecker.symbolOfNode(node.expression);
            let parameters: Array<ast.EventParameter | ast.FunctionParameter> = [];
            if (
                functionSymbol?.declaration &&
                (isEvent(functionSymbol.declaration) || isFunctionDefinition(functionSymbol.declaration))
            ) {
                parameters = functionSymbol.declaration.parameters;
            }

            // rhs type must match lhs type
            let parameterIndex = 0;
            for (const argument of node.arguments.arguments) {
                if (!isDollarsLiteral(argument) && parameterIndex < parameters.length) {
                    const argumentType = context.typeChecker.typeOfNode(argument);
                    const parameterType = context.typeChecker.typeOfNode(parameters[parameterIndex]);

                    if (argumentType !== parameterType) {
                        diagnostics.push(
                            createTypeMismatchDiagnostic(parameterType, argumentType, context.source, argument.position)
                        );
                    }
                }
                parameterIndex++;
            }

            return diagnostics;
        });

        factoryContext.registerRule<ast.ReturnStatement>(ast.SyntaxKind.ReturnStatement, (node, context) => {
            if (!node.returnValue || isDollarsLiteral(node.returnValue)) return [];

            const parentFunc = findFirstParent(node, isFunctionDefinition);

            if (!parentFunc) return []; // Would be weird to have a return not in a parent

            const returnType = context.typeChecker.typeOfNode(parentFunc.returnType);
            const returendType = context.typeChecker.typeOfNode(node.returnValue);

            if (returendType != returnType) {
                return [
                    createTypeMismatchDiagnostic(returnType, returendType, context.source, node.returnValue.position),
                ];
            }

            return [];
        });
    }
};

export default type_check;
