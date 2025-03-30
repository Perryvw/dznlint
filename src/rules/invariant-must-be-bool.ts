// invariant X <- X must be of boolean type

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { RuleFactory } from "../linting-rule";
import { TypeKind } from "../semantics/type-checker";

export const invariantNotABool = createDiagnosticsFactory();

export const invariant_must_be_bool: RuleFactory = factoryContext => {
    const config = getRuleConfig("invariant_must_be_bool", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<ast.InvariantStatement>(ast.SyntaxKind.InvariantStatement, (node, context) => {
            const expressionType = context.typeChecker.typeOfNode(node.expression);
            if (expressionType.kind !== TypeKind.Bool) {
                return [
                    invariantNotABool(
                        config.severity,
                        "Invariant expressions must be of type bool",
                        context.source,
                        node.position
                    ),
                ];
            }

            return [];
        });
    }
};

export default invariant_must_be_bool;
