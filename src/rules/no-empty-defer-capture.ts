// defer() { without any captured state variables can cause the defer queue to unexpectedly grow, leading
// to explosion of verification time. Most of the time this is not the desired way of using defer, so
// it is considered a code smell.

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { RuleFactory } from "../linting-rule";

export const emptyDeferCapture = createDiagnosticsFactory();

export const no_empty_defer_capture: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_empty_defer_capture", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<ast.DeferStatement>(ast.SyntaxKind.DeferStatement, (node, context) => {
            if (node.arguments?.arguments.length === 0) {
                return [
                    emptyDeferCapture(
                        config.severity,
                        "Defer without capturing any variables can lead to unexpected queuing of defer statements, resulting in verification time explosion.",
                        context.source,
                        node.arguments.position
                    ),
                ];
            }

            return [];
        });
    }
};

export default no_empty_defer_capture;
