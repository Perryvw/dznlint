// Types assigned to variables and function arguments must match

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory, Diagnostic } from "../diagnostic";
import { RuleFactory } from "../linting-rule";
import { InputSource } from "../semantics/program";
import { assertNever, findFirstParent, isDollarsLiteral, isEvent, isExtern, isFunctionDefinition } from "../util";
import { BOOL_TYPE, INTEGER_TYPE, Type, TypeKind, VOID_TYPE } from "../semantics";
import { VisitorContext } from "../visitor";

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
        const createNotAllowedDollarAssignmentDiagnostic = (
            expectedType: Type,
            node: ast.DollarsLiteral,
            source: InputSource
        ) => {
            return typeMismatch(
                config.severity,
                `Type mismatch: Cannot assign dollars literal to variable of type '${expectedType.name}'`,
                source,
                node.position
            );
        };

        factoryContext.registerRule<ast.VariableDefinition>(ast.SyntaxKind.VariableDefinition, (node, context) => {
            // initializer type must match lhs type
            if (node.initializer) {
                const diagnostics: Diagnostic[] = [];
                checkValidTypeAssignment(context, node.initializer, node.type, diagnostics);
                return diagnostics;
            }

            return [];
        });

        factoryContext.registerRule<ast.AssignmentStatement>(ast.SyntaxKind.AssignmentStatement, (node, context) => {
            const diagnostics: Diagnostic[] = [];
            checkValidTypeAssignment(context, node.right, node.left, diagnostics);
            return diagnostics;
        });

        factoryContext.registerRule<ast.CallExpression>(ast.SyntaxKind.CallExpression, (node, context) => {
            const diagnostics: Diagnostic[] = [];

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
                if (parameterIndex < parameters.length) {
                    checkValidTypeAssignment(context, argument, parameters[parameterIndex], diagnostics);
                }
                parameterIndex++;
            }

            return diagnostics;
        });

        factoryContext.registerRule<ast.ReturnStatement>(ast.SyntaxKind.ReturnStatement, (node, context) => {
            const parentFunc = findFirstParent(node, isFunctionDefinition);

            if (!parentFunc) return []; // Would be weird to have a return not in a parent

            if (!node.returnValue) {
                // void return, check if function is void otherwise error
                const returnType = context.typeChecker.typeOfNode(parentFunc.returnType);
                if (returnType.kind !== TypeKind.Void) {
                    return [createTypeMismatchDiagnostic(returnType, VOID_TYPE, context.source, node.position)];
                }
                return [];
            } else {
                const diagnostics: Diagnostic[] = [];
                checkValidTypeAssignment(context, node.returnValue, parentFunc.returnType, diagnostics);
                return diagnostics;
            }
        });

        factoryContext.registerRule<ast.BinaryExpression>(ast.SyntaxKind.BinaryExpression, (node, context) => {
            const diagnostics = [];

            const lhsType = context.typeChecker.typeOfNode(node.left);
            const rhsType = context.typeChecker.typeOfNode(node.right);

            switch (node.operator.text) {
                case "==":
                case "!=": {
                    // For comparisons, expecting lhs type to be equal to rhs type
                    if (!isAssignableTo(rhsType, lhsType)) {
                        diagnostics.push(
                            createTypeMismatchDiagnostic(lhsType, rhsType, context.source, node.right.position)
                        );
                    }
                    break;
                }
                case "&&":
                case "||":
                case "=>": {
                    if (!isAssignableTo(lhsType, BOOL_TYPE)) {
                        diagnostics.push(
                            createTypeMismatchDiagnostic(BOOL_TYPE, lhsType, context.source, node.left.position)
                        );
                    }
                    if (!isAssignableTo(rhsType, BOOL_TYPE)) {
                        diagnostics.push(
                            createTypeMismatchDiagnostic(BOOL_TYPE, rhsType, context.source, node.right.position)
                        );
                    }
                    break;
                }
                case "<":
                case "<=":
                case ">":
                case ">=":
                case "+":
                case "-": {
                    if (!isAssignableTo(lhsType, INTEGER_TYPE)) {
                        diagnostics.push(
                            createTypeMismatchDiagnostic(INTEGER_TYPE, lhsType, context.source, node.left.position)
                        );
                    }
                    if (!isAssignableTo(rhsType, INTEGER_TYPE)) {
                        diagnostics.push(
                            createTypeMismatchDiagnostic(INTEGER_TYPE, rhsType, context.source, node.right.position)
                        );
                    }
                    break;
                }
                default:
                    assertNever(node.operator, `Unknown operator type ${node.operator}`);
            }

            return diagnostics;
        });

        function checkValidTypeAssignment(
            context: VisitorContext,
            value: ast.AnyAstNode,
            target: ast.AnyAstNode,
            diagnostics: Diagnostic[]
        ): void {
            const targetType = context.typeChecker.typeOfNode(target);

            //if (targetType === ERROR_TYPE) return;

            // Can always assign dollars to extern types
            if (isDollarsLiteral(value)) {
                if (targetType.declaration && isExtern(targetType.declaration)) return;
                else diagnostics.push(createNotAllowedDollarAssignmentDiagnostic(targetType, value, context.source));
                return;
            }

            // Look up type
            const type = context.typeChecker.typeOfNode(value);

            //if (type === ERROR_TYPE) return;

            if (!isAssignableTo(type, targetType)) {
                diagnostics.push(createTypeMismatchDiagnostic(targetType, type, context.source, value.position));
            }
        }
    }
};

function isAssignableTo(type: Type, target: Type): boolean {
    if (type === target) return true;

    if (type.declaration && target.declaration && isExtern(type.declaration) && isExtern(target.declaration))
        return true;

    if (
        (target.kind === TypeKind.Integer || target.kind === TypeKind.IntegerRange) &&
        (type.kind === TypeKind.Integer || type.kind === TypeKind.IntegerRange)
    )
        return true;

    return false;
}

export default type_check;
