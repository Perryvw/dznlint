import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { RuleFactory } from "../linting-rule";
import { InputSource } from "../semantics/program";

export const nameDoesNotMatchConvention = createDiagnosticsFactory();

export const naming_convention: RuleFactory = factoryContext => {
    const config = getRuleConfig("naming_convention", factoryContext.userConfig);

    if (config.isEnabled) {
        const convention = config.config;
        const fail = (identifier: ast.Identifier, type: string, convention: string, source: InputSource) =>
            nameDoesNotMatchConvention(
                config.severity,
                `${type} ${identifier.text} does not match naming convention: ${convention}.`,
                source,
                identifier.position
            );

        factoryContext.registerRule<ast.ComponentDefinition>(ast.SyntaxKind.ComponentDefinition, (node, context) => {
            if (!identifierMatches(node.name, convention.component)) {
                return [fail(node.name, "Component", convention.component, context.source)];
            }
            return [];
        });

        factoryContext.registerRule<ast.EnumDefinition>(ast.SyntaxKind.EnumDefinition, (node, context) => {
            const diagnostics = [];
            if (!identifierMatches(node.name, convention.enum)) {
                diagnostics.push(fail(node.name, "Enum", convention.enum, context.source));
            }

            for (const name of node.members) {
                if (name && !identifierMatches(name, convention.enum_member)) {
                    diagnostics.push(fail(name, "Enum member", convention.enum_member, context.source));
                }
            }

            return diagnostics;
        });

        factoryContext.registerRule<ast.InterfaceDefinition>(ast.SyntaxKind.InterfaceDefinition, (node, context) => {
            if (!identifierMatches(node.name, convention.interface)) {
                return [fail(node.name, "Interface", convention.interface, context.source)];
            }
            return [];
        });

        factoryContext.registerRule<ast.VariableDefinition>(ast.SyntaxKind.VariableDefinition, (node, context) => {
            if (!identifierMatches(node.name, convention.local)) {
                return [fail(node.name, "Variable", convention.local, context.source)];
            }
            return [];
        });
    }
};

export default naming_convention;

function identifierMatches(identifier: ast.Identifier, pattern: string): boolean {
    return new RegExp(pattern).test(identifier.text);
}
