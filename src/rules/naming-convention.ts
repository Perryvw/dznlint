import { Diagnostic, DiagnosticLevel } from "../diagnostic.js";
import { ASTKinds, component, enum_definition, identifier, interface_definition, variable_definition } from "../grammar/parser.js";
import { RuleFactory } from "../linting-rule.js";
import { nodeToSourceRange } from "../util.js";

const nameDoesNotMatchConvention = (node: identifier, type: string, convention: string): Diagnostic =>
    ({
        level: DiagnosticLevel.Warning,
        message: `${type} ${node.text} does not match naming convention: ${convention}.`,
        range: nodeToSourceRange(node)
    });

export const naming_convention: RuleFactory = (factoryContext) => {

    const convention = factoryContext.config.naming_convention;

    if (convention) {

        factoryContext.registerRule<component>(ASTKinds.component, (node, context) => {
            if (!identifierMatches(node.name, convention.component)) {
                return [nameDoesNotMatchConvention(node.name, "Component", convention.component)];
            }
            return [];
        });

        factoryContext.registerRule<enum_definition>(ASTKinds.enum_definition, (node, context) => {
            const diagnostics = [];
            if (!identifierMatches(node.name, convention.enum)) {
                diagnostics.push(nameDoesNotMatchConvention(node.name, "Enum", convention.enum));
            }

            for (const { name } of node.fields) {
                if (!identifierMatches(node.name, convention.enum_member)) {
                    diagnostics.push(nameDoesNotMatchConvention(node.name, "Enum member", convention.enum_member));
                }
            }

            return diagnostics;
        });

        factoryContext.registerRule<interface_definition>(ASTKinds.interface_definition, (node, context) => {
            if (!identifierMatches(node.name, convention.interface)) {
                return [nameDoesNotMatchConvention(node.name, "Interface", convention.local)];
            }
            return [];
        });

        factoryContext.registerRule<variable_definition>(ASTKinds.variable_definition, (node, context) => {
            if (!identifierMatches(node.name, convention.local)) {
                return [nameDoesNotMatchConvention(node.name, "Variable", convention.local)];
            }
            return [];
        });
    }
}

function identifierMatches(identifier: identifier, pattern: string): boolean {
    return new RegExp(pattern).test(identifier.text);
}