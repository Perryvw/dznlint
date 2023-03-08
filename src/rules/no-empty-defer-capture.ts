// defer() { without any captured state variables can cause the defer queue to unexpectedly grow, leading
// to explosion of verification time. Most of the time this is not the desired way of using defer, so
// it is considered a code smell.

import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { ASTKinds, defer_statement } from "../grammar/parser";
import { RuleFactory } from "../linting-rule";
import { nodeToSourceRange } from "../util";

export const emptyDeferCapture = createDiagnosticsFactory();

export const no_empty_defer_capture: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_empty_defer_capture", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<defer_statement>(ASTKinds.defer_statement, (node, context) => {
            if (node.header.arguments === null || node.header.arguments?.arguments.length == 0) {
                return [
                    emptyDeferCapture(
                        config.severity,
                        "Defer without capturing any variables can lead to unexpected queuing of defer statements, resulting in verification time explosion.",
                        context.source,
                        nodeToSourceRange(node.header)
                    ),
                ];
            }

            return [];
        });
    }
};

export default no_empty_defer_capture;
