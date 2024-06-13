// No variables that are never used

import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { ASTKinds, variable_definition } from "../grammar/parser";
import { RuleFactory } from "../linting-rule";
import { isIdentifier, nodeToSourceRange } from "../util";
import { VisitResult } from "../visitor";

export const unusedVariable = createDiagnosticsFactory();

export const no_unused_variables: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_unused_variables", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<variable_definition>(ASTKinds.variable_definition, (node, context) => {
            const name = node.name.text;

            if (name[0] === "_") {
                // Skip if name is escaped with _
                return [];
            }

            let found = false;
            context.visit(context.currentScope().root, subNode => {
                if (isIdentifier(subNode) && subNode !== node.name && subNode.text === name) {
                    found = true;
                    return VisitResult.StopVisiting;
                }
            });

            if (!found) {
                return [
                    unusedVariable(
                        config.severity,
                        `This variable is never used. You can discard it by renaming to _${name}.`,
                        context.source,
                        nodeToSourceRange(node.name)
                    ),
                ];
            }

            return [];
        });
    }
};

export default no_unused_variables;
