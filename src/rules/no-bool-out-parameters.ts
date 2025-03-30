// Check for disallowed bool out parameters

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { RuleFactory } from "../linting-rule";
import { InputSource } from "../semantics/program";
import { isEvent, isIdentifier } from "../util";

export const illegalBoolOutParameter = createDiagnosticsFactory();

export const no_bool_out_parameters: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_bool_out_parameters", factoryContext.userConfig);

    if (config.isEnabled) {
        const boolNotAllowedForOutParameter = (node: ast.TypeReference, source: InputSource) =>
            illegalBoolOutParameter(
                config.severity,
                "Type 'bool' is not allowed for out parameters",
                source,
                node.position
            );

        factoryContext.registerRule<ast.FunctionDefinition>(ast.SyntaxKind.FunctionDefinition, (node, context) => {
            const diagnostics = [];

            for (const parameter of node.parameters) {
                if (parameter.direction?.text === "out" && isBoolIdentifier(parameter.type.typeName)) {
                    diagnostics.push(boolNotAllowedForOutParameter(parameter.type, context.source));
                }
            }

            return diagnostics;
        });

        factoryContext.registerRule<ast.InterfaceDefinition>(ast.SyntaxKind.InterfaceDefinition, (node, context) => {
            const diagnostics = [];

            for (const typeOrEvent of node.body) {
                if (isEvent(typeOrEvent)) {
                    for (const parameter of typeOrEvent.parameters) {
                        if (parameter.direction?.text === "out" && isBoolIdentifier(parameter.type.typeName)) {
                            diagnostics.push(boolNotAllowedForOutParameter(parameter.type, context.source));
                        }
                    }
                }
            }

            return diagnostics;
        });
    }
};

function isBoolIdentifier(node: ast.Name): boolean {
    return isIdentifier(node) && node.text === "bool";
}

export default no_bool_out_parameters;
