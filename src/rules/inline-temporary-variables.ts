// Type var = bla();
// if (var) {
//
// can be replaced with if (bla()) {

import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { ASTKinds, variable_definition } from "../grammar/parser";
import { RuleFactory } from "../linting-rule";
import { isIdentifier, nodeToSourceRange } from "../util";
import { VisitResult } from "../visitor";

export const variableCanBeInlined = createDiagnosticsFactory();

export const inline_temporary_variables: RuleFactory = factoryContext => {
    const config = getRuleConfig("inline_temporary_variables", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<variable_definition>(ASTKinds.variable_definition, (node, context) => {
            const name = node.name.text;
            let count = 0;
            context.visit(context.currentScope().root, subNode => {
                if (isIdentifier(subNode) && subNode !== node.name && subNode.text === name) {
                    count++;
                    if (count > 1) {
                        return VisitResult.StopVisiting;
                    }
                }
            });

            if (count === 1) {
                return [
                    variableCanBeInlined(
                        config.severity,
                        "This variable is only used once and can be inlined.",
                        context.source,
                        nodeToSourceRange(node)
                    ),
                ];
            }

            return [];
        });
    }
};

export default inline_temporary_variables;
