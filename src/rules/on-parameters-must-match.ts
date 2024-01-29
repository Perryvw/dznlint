// The number of call parameters in an on statement must match the parameters specified by the event definition

import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { ASTKinds, on } from "../grammar/parser";
import { RuleFactory } from "../linting-rule";
import { TypeKind } from "../semantics/type-checker";
import { headTailToList, isEvent, nameToString, nodeToSourceRange } from "../util";

export const incorrectOnParameterCount = createDiagnosticsFactory();

export const on_parameters_must_match: RuleFactory = factoryContext => {
    const config = getRuleConfig("on_parameters_must_match", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<on>(ASTKinds.on, (node, context) => {
            const diagnostics = [];

            for (const trigger of headTailToList(node.on_trigger_list)) {
                if (trigger.parameters === null) continue; // Don't check this on triggers without parameter specified

                const triggerType = context.typeChecker.typeOfNode(trigger.name);

                if (
                    triggerType.kind === TypeKind.Function &&
                    triggerType.declaration &&
                    isEvent(triggerType.declaration)
                ) {
                    const triggerParameters = trigger.parameters.parameters
                        ? headTailToList(trigger.parameters.parameters)
                        : [];
                    const eventParameters = triggerType.declaration.event_params
                        ? headTailToList(triggerType.declaration.event_params)
                        : [];

                    const parameterCount = triggerParameters.length;
                    const expectedParameterCount = eventParameters.length;

                    if (parameterCount !== expectedParameterCount) {
                        let errorMessage = `Incorrect parameter count. Expected ${expectedParameterCount} parameter(s) but got ${parameterCount}.`;
                        if (expectedParameterCount > 0) {
                            errorMessage +=
                                "\nExpected event parameters: " +
                                eventParameters.map(p => `${nameToString(p.type)} ${nameToString(p.name)}`).join(", ");
                        }
                        diagnostics.push(
                            incorrectOnParameterCount(
                                config.severity,
                                errorMessage,
                                context.source,
                                trigger.parameters
                                    ? nodeToSourceRange(trigger.parameters)
                                    : nodeToSourceRange(trigger.name)
                            )
                        );
                    }
                }
            }

            return diagnostics;
        });
    }
};

export default on_parameters_must_match;
