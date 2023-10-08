// Interface events that are never legal in the interface behavior

import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory, Diagnostic } from "../diagnostic";
import { ASTKinds, event, interface_definition, statement, type_definition } from "../grammar/parser";
import { RuleFactory } from "../linting-rule";
import { headTailToList, isExpressionStatement, isIdentifier, isOnEvent, nodeToSourceRange } from "../util";
import { VisitResult } from "../visitor";

export const neverLegalEvent = createDiagnosticsFactory();

export const never_legal_event: RuleFactory = factoryContext => {
    const config = getRuleConfig("never_legal_event", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<interface_definition>(ASTKinds.interface_definition, (node, context) => {
            const diagnostics: Diagnostic[] = [];

            if (node.behavior) {
                // Find all in-events to check
                const inEvents = node.body.map(e => e.type_or_event).filter(isInEvent);
                const unSeenEvents = new Map(inEvents.map(e => [e.event_name.text, e]));

                context.visit(node.behavior, subNode => {
                    // Look for 'on X,Y,Z: S' where S is not illegal
                    if (isOnEvent(subNode) && !isIllegal(subNode.statement)) {
                        // Remove all events from list of unseen events
                        for (const trigger of headTailToList(subNode.on_trigger_list)) {
                            if (isIdentifier(trigger.name) && unSeenEvents.has(trigger.name.text)) {
                                unSeenEvents.delete(trigger.name.text);
                            }

                            // If all events were seen, stop visiting
                            if (unSeenEvents.size == 0) {
                                return VisitResult.StopVisiting;
                            }
                        }
                    }
                });

                // All events left in the unseen events set result in a diagnostic
                for (const [, event] of unSeenEvents) {
                    diagnostics.push(
                        neverLegalEvent(
                            config.severity,
                            "This event is never legal in the interface behavior",
                            context.source,
                            nodeToSourceRange(event.event_name)
                        )
                    );
                }
            }

            return diagnostics;
        });
    }
};

export function isIllegal(node: statement): boolean {
    return isExpressionStatement(node) && node.expression.kind === ASTKinds.ILLEGAL;
}

function isInEvent(node: event | type_definition): node is event {
    return node.kind === ASTKinds.event && node.direction === "in";
}
