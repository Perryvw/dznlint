// Interface events that are never legal in the interface behavior

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory, Diagnostic } from "../diagnostic";
import { RuleFactory } from "../linting-rule";
import { isCallExpression, isIdentifier, nodeToSourceRange } from "../util";

export const neverFiredEvent = createDiagnosticsFactory();

export const never_fired_event: RuleFactory = factoryContext => {
    const config = getRuleConfig("never_fired_event", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<ast.InterfaceDefinition>(ast.SyntaxKind.InterfaceDefinition, (node, context) => {
            if (!node.behavior) {
                return [];
            }

            const diagnostics: Diagnostic[] = [];

            // Look up all out events to check
            const outEvents = node.body.filter(isOutEvent);
            const unSeenEvents = new Map(outEvents.map(e => [e.eventName.text, e]));

            context.visit(node.behavior, subNode => {
                // Look for identifier for events that have no parameters
                if (isIdentifier(subNode)) {
                    unSeenEvents.delete(subNode.text);
                }

                // Look for call expression for events that have parameters
                if (isCallExpression(subNode) && isIdentifier(subNode.expression)) {
                    unSeenEvents.delete(subNode.expression.text);
                }
            });

            // All events left in the unseen events set result in a diagnostic
            for (const event of unSeenEvents.values()) {
                diagnostics.push(
                    neverFiredEvent(
                        config.severity,
                        "This event is never fired in the interface behavior",
                        context.source,
                        event.eventName.position
                    )
                );
            }

            return diagnostics;
        });
    }
};

function isOutEvent(node: ast.Event | ast.TypeDefinition): node is ast.Event {
    return node.kind === ast.SyntaxKind.Event && node.direction.text === "out";
}
