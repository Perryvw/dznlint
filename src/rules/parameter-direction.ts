// always: Always explicitly mention the direction of parameters

import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { ASTKinds, function_definition } from "../grammar/parser";
import { RuleFactory } from "../linting-rule";
import { headTailToList, nodeToSourceRange } from "../util";

export const expectedParameterDirection = createDiagnosticsFactory();

export const parameter_direction: RuleFactory = factoryContext => {
    const config = getRuleConfig("parameter_direction", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<function_definition>(ASTKinds.function_definition, (node, context) => {
            const diagnostics = [];

            const parameters = node.parameters.formals ? headTailToList(node.parameters.formals) : [];
            for (const param of parameters) {
                if (!param.direction) {
                    diagnostics.push(
                        expectedParameterDirection(
                            config.severity,
                            "Parameter direction should be specified",
                            context.source,
                            nodeToSourceRange(param)
                        )
                    );
                }
            }

            return diagnostics;
        });
    }
};

export default parameter_direction;
