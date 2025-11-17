// no identifiers used for bindings that are unknown

import * as ast from "../grammar/ast";
import { Diagnostic } from "..";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { RuleFactory } from "../linting-rule";
import { isOutEvent, isOutKeyword } from "../util";

export const outParamInOutEvent = createDiagnosticsFactory();

export const no_out_params_in_out_events: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_out_params_in_out_events", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<ast.Event>(ast.SyntaxKind.Event, (node, context) => {
            const diagnostics: Diagnostic[] = [];

            if (isOutEvent(node)) {
                for (const param of node.parameters) {
                    if (param.direction && isOutKeyword(param.direction)) {
                        diagnostics.push(
                            outParamInOutEvent(
                                config.severity,
                                "Not allowed to use 'out' parameters in out events, use 'in' instead",
                                context.source,
                                param.direction.position
                            )
                        );
                    }
                }
            }

            return diagnostics;
        });
    }
};

export default no_out_params_in_out_events;
