// always: Always explicitly mention the direction of parameters

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { RuleFactory } from "../linting-rule";

export const expectedParameterDirection = createDiagnosticsFactory();

export const parameter_direction: RuleFactory = factoryContext => {
    const config = getRuleConfig("parameter_direction", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<ast.FunctionDefinition>(ast.SyntaxKind.FunctionDefinition, (node, context) => {
            const diagnostics = [];

            for (const param of node.parameters) {
                if (!param.direction) {
                    diagnostics.push(
                        expectedParameterDirection(
                            config.severity,
                            "Parameter direction should be specified",
                            context.source,
                            param.position
                        )
                    );
                }
            }

            return diagnostics;
        });

        factoryContext.registerRule<ast.Event>(ast.SyntaxKind.Event, (node, context) => {
            const diagnostics = [];

            const parameters = node.parameters;
            for (const param of parameters) {
                if (!param.direction) {
                    diagnostics.push(
                        expectedParameterDirection(
                            config.severity,
                            "Parameter direction should be specified",
                            context.source,
                            param.position
                        )
                    );
                }
            }

            return diagnostics;
        });
    }
};

export default parameter_direction;
