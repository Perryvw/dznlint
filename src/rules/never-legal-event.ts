// Interface events that are never legal in the interface behavior

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory, Diagnostic } from "../diagnostic";
import { RuleFactory } from "../linting-rule";
import { isIdentifier, isIllegalKeyword, isOnStatement } from "../util";
import { VisitResult } from "../visitor";

export const neverLegalEvent = createDiagnosticsFactory();

export const never_legal_event: RuleFactory = factoryContext => {
    const config = getRuleConfig("never_legal_event", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<ast.InterfaceDefinition>(ast.SyntaxKind.InterfaceDefinition, (node, context) => {
            const diagnostics: Diagnostic[] = [];

            if (node.behavior) {
                // Find all in-events to check
                const inEvents = node.body.filter(isInEvent);
                const unSeenEvents = new Map(inEvents.map(e => [e.eventName.text, e]));

                context.visit(node.behavior, subNode => {
                    // Look for 'on X,Y,Z: S' where S is not illegal
                    if (isOnStatement(subNode) && !isIllegalKeyword(subNode.body)) {
                        // Remove all events from list of unseen events
                        for (const trigger of subNode.triggers) {
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
                            event.eventName.position
                        )
                    );
                }
            }

            return diagnostics;
        });
    }
};

function isInEvent(node: ast.Event | ast.TypeDefinition): node is ast.Event {
    return node.kind === ast.SyntaxKind.Event && node.direction.text === "in";
}
