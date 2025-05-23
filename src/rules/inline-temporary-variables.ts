// Type var = bla();
// if (var) {
//
// can be replaced with if (bla()) {

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { RuleFactory } from "../linting-rule";
import { findFirstParent, isIdentifier, isScopedBlock } from "../util";
import { VisitResult } from "../visitor";

export const variableCanBeInlined = createDiagnosticsFactory();

export const inline_temporary_variables: RuleFactory = factoryContext => {
    const config = getRuleConfig("inline_temporary_variables", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<ast.VariableDefinition>(ast.SyntaxKind.VariableDefinition, (node, context) => {
            if (!node.initializer) {
                // Don't hint to inline variables without value initializer
                return [];
            }

            const scope = findFirstParent(node, isScopedBlock)!;

            if (scope.kind === ast.SyntaxKind.Behavior) {
                // Don't hint to inline variables in behavior root
                return [];
            }

            // Count number of references to this variable
            const name = node.name.text;
            let count = 0;

            let singleUsage: ast.AnyAstNode | undefined;

            context.visit(scope, subNode => {
                if (isIdentifier(subNode) && subNode !== node.name && subNode.text === name) {
                    count++;
                    singleUsage = subNode;
                    if (count > 1) {
                        return VisitResult.StopVisiting;
                    }
                }
            });

            if (count === 1 && singleUsage && canInlineAtLocation(singleUsage)) {
                // If exactly one reference, add diagnostic
                return [
                    variableCanBeInlined(
                        config.severity,
                        "This variable is only used once and can be inlined.",
                        context.source,
                        node.name.position
                    ),
                ];
            }

            return [];
        });
    }
};

function canInlineAtLocation(node: ast.AnyAstNode): boolean {
    if (!node.parent) return true;

    return node.parent.kind !== ast.SyntaxKind.ReturnStatement && node.parent.kind !== ast.SyntaxKind.CallExpression;
}

export default inline_temporary_variables;
