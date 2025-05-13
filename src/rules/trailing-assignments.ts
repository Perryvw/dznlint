// Trailing assignments can lead to unexpected state behavior when using shared state

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory, Diagnostic } from "../diagnostic";
import { RuleFactory } from "../linting-rule";
import { isAssignment, isCompound, isExpressionStatement, isIdentifier, isOnStatement, isReply } from "../util";

export const trailingAssignment = createDiagnosticsFactory();

export const trailing_assignments: RuleFactory = factoryContext => {
    const config = getRuleConfig("trailing_assignments", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<ast.InterfaceDefinition>(ast.SyntaxKind.InterfaceDefinition, (node, context) => {
            if (!node.behavior) {
                return [];
            }

            const diagnostics: Diagnostic[] = [];

            // Check all on-statements in the interface behavior
            context.visit(node.behavior, subNode => {
                if (isOnStatement(subNode) && isCompound(subNode.body)) {
                    let assignmentsAllowed = true;
                    for (const statement of subNode.body.statements) {
                        // After seeing a reply or expression statement, assignments are no longer allowed
                        if (
                            isExpressionStatement(statement) &&
                            (isIdentifier(statement.expression) || isReply(statement.expression))
                        ) {
                            assignmentsAllowed = false;
                            continue;
                        }

                        if (isAssignment(statement)) {
                            // When encountering an assignment, check if it is allowed at this point
                            if (!assignmentsAllowed) {
                                // If not, add diagnostic
                                diagnostics.push(
                                    trailingAssignment(
                                        config.severity,
                                        `Trailing assignments can lead to unexpected state behavior when using shared state`,
                                        context.source,
                                        statement.position
                                    )
                                );
                            }
                        }
                    }
                }
            });

            return diagnostics;
        });
    }
};

export default trailing_assignments;
