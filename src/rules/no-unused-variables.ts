// No variables that are never used

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { RuleFactory } from "../linting-rule";
import { findFirstParent, isIdentifier, isScopedBlock } from "../util";
import { VisitResult } from "../visitor";

export const unusedVariable = createDiagnosticsFactory();

export const no_unused_variables: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_unused_variables", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<ast.VariableDefinition>(ast.SyntaxKind.VariableDefinition, (node, context) => {
            const name = node.name.text;

            if (name[0] === "_") {
                // Skip if name is escaped with _
                return [];
            }

            const scope = findFirstParent(node, isScopedBlock)!;

            let found = false;
            context.visit(scope, subNode => {
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
                        node.name.position
                    ),
                ];
            }

            return [];
        });
    }
};

export default no_unused_variables;
