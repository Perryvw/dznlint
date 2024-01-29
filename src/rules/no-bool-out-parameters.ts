// Check for disallowed bool out parameters

import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { ASTKinds, compound_name, function_definition, interface_definition } from "../grammar/parser";
import { RuleFactory } from "../linting-rule";
import { InputSource } from "../semantics/program";
import { headTailToList, nodeToSourceRange } from "../util";

export const illegalBoolOutParameter = createDiagnosticsFactory();

export const no_bool_out_parameters: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_bool_out_parameters", factoryContext.userConfig);

    if (config.isEnabled) {
        const createDiagnostic = (node: compound_name, source: InputSource) =>
            illegalBoolOutParameter(
                config.severity,
                "Type 'bool' is not allowed for out parameters",
                source,
                nodeToSourceRange(node)
            );

        factoryContext.registerRule<function_definition>(ASTKinds.function_definition, (node, context) => {
            const diagnostics = [];

            if (node.parameters.parameters) {
                for (const parameter of headTailToList(node.parameters.parameters)) {
                    if (parameter.direction?.direction === "out" && isBoolIdentifier(parameter.type_name)) {
                        diagnostics.push(createDiagnostic(parameter.type_name, context.source));
                    }
                }
            }

            return diagnostics;
        });

        factoryContext.registerRule<interface_definition>(ASTKinds.interface_definition, (node, context) => {
            const diagnostics = [];

            for (const { type_or_event } of node.body) {
                if (type_or_event.kind === ASTKinds.event && type_or_event.event_params) {
                    for (const parameter of headTailToList(type_or_event.event_params)) {
                        if (parameter.direction?.direction === "out" && isBoolIdentifier(parameter.type)) {
                            diagnostics.push(createDiagnostic(parameter.type, context.source));
                        }
                    }
                }
            }

            return diagnostics;
        });
    }
};

function isBoolIdentifier(node: compound_name): boolean {
    return node.kind === ASTKinds.identifier && node.text === "bool";
}

export default no_bool_out_parameters;
