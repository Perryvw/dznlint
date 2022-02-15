import { InputSource } from "../api";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import {
    ASTKinds,
    component,
    enum_definition,
    identifier,
    interface_definition,
    member_identifier,
    variable_definition,
} from "../grammar/parser";
import { RuleFactory } from "../linting-rule";
import { headTailToList, nodeToSourceRange } from "../util";

export const nameDoesNotMatchConvention = createDiagnosticsFactory();

export const naming_convention: RuleFactory = factoryContext => {
    const config = getRuleConfig("naming_convention", factoryContext.userConfig);

    if (config.isEnabled) {
        const convention = config.config;
        const fail = (
            identifier: identifier | member_identifier,
            type: string,
            convention: string,
            source: InputSource
        ) =>
            nameDoesNotMatchConvention(
                config.severity,
                `${type} ${identifier.text} does not match naming convention: ${convention}.`,
                source,
                nodeToSourceRange(identifier)
            );

        factoryContext.registerRule<component>(ASTKinds.component, (node, context) => {
            if (!identifierMatches(node.name, convention.component)) {
                return [fail(node.name, "Component", convention.component, context.source)];
            }
            return [];
        });

        factoryContext.registerRule<enum_definition>(ASTKinds.enum_definition, (node, context) => {
            const diagnostics = [];
            if (!identifierMatches(node.name, convention.enum)) {
                diagnostics.push(fail(node.name, "Enum", convention.enum, context.source));
            }

            for (const name of headTailToList(node.fields)) {
                if (name && !identifierMatches(name, convention.enum_member)) {
                    diagnostics.push(fail(name, "Enum member", convention.enum_member, context.source));
                }
            }

            return diagnostics;
        });

        factoryContext.registerRule<interface_definition>(ASTKinds.interface_definition, (node, context) => {
            if (!identifierMatches(node.name, convention.interface)) {
                return [fail(node.name, "Interface", convention.interface, context.source)];
            }
            return [];
        });

        factoryContext.registerRule<variable_definition>(ASTKinds.variable_definition, (node, context) => {
            if (!identifierMatches(node.name, convention.local)) {
                return [fail(node.name, "Variable", convention.local, context.source)];
            }
            return [];
        });
    }
};

export default naming_convention;

function identifierMatches(identifier: identifier | member_identifier, pattern: string): boolean {
    return new RegExp(pattern).test(identifier.text);
}
