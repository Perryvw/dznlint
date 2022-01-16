import { ASTKinds, interface_definition } from "../grammar/parser.js";
import { RuleFactory } from "../linting-rule.js";

export const naming_convention: RuleFactory = (context) => {
    context.registerRule<interface_definition>(ASTKinds.interface_definition, (node) => {
        return [];
    });
}