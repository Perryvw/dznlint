// always: do NOT explicitly mention on with illegal
// never: always explicitly mention illegal triggers

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { RuleFactory } from "../linting-rule";
import { isIllegalKeyword } from "../util";

export const implicitIllegal = createDiagnosticsFactory();

export const implicit_illegal: RuleFactory = factoryContext => {
    const config = getRuleConfig("implicit_illegal", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<ast.OnStatement>(ast.SyntaxKind.OnStatement, (node, context) => {
            if (
                node.body.kind === ast.SyntaxKind.ExpressionStatement &&
                isIllegalKeyword(node.body.expression)
            ) {
                return [
                    implicitIllegal(
                        config.severity,
                        "Illegal definitions should be implicit, remove this statement.",
                        context.source,
                        node.position
                    ),
                ];
            }

            return [];
        });
    }
};

export default implicit_illegal;
