// Type var = bla();
// if (var) {
//
// can be replaced with if (bla()) {

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { ASTNode, RuleFactory } from "../linting-rule";
import { isIdentifier, nodeToSourceRange } from "../util";
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

            if (context.currentScope().root.kind === ASTKinds.behavior) {
                // Don't hint to inline variables in behavior root
                return [];
            }

            // Count number of references to this variable
            const name = node.name.text;
            let count = 0;

            let singleUsage: ASTNode | undefined;

            context.visit(context.currentScope().root, subNode => {
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
                        nodeToSourceRange(node.name)
                    ),
                ];
            }

            return [];
        });
    }
};

function canInlineAtLocation(node: ASTNode): boolean {
    if (!node.parent) return true;

    return node.parent.kind !== ASTKinds.return_statement && node.parent.kind !== ASTKinds.call_expression;
}

export default inline_temporary_variables;
