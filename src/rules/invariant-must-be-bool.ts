// Type var = bla();
// if (var) {
//
// can be replaced with if (bla()) {

import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { ASTKinds, invariant_statement, variable_definition } from "../grammar/parser";
import { RuleFactory } from "../linting-rule";
import { TypeKind } from "../semantics/type-checker";
import { nodeToSourceRange } from "../util";

export const invariantNotABool = createDiagnosticsFactory();

export const invariant_must_be_bool: RuleFactory = factoryContext => {
    const config = getRuleConfig("invariant_must_be_bool", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<invariant_statement>(ASTKinds.invariant_statement, (node, context) => {
            const expressionType = context.typeChecker.typeOfNode(node.expression);
            if (expressionType.kind !== TypeKind.Bool) {
                return [
                    invariantNotABool(
                        config.severity,
                        "Invariant expressions must be of type bool",
                        context.source,
                        nodeToSourceRange(node)
                    ),
                ];
            }

            return [];
        });
    }
};

export default invariant_must_be_bool;
