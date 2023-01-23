// always: do NOT explicitly mention on with illegal
// never: always explicitly mention illegal triggers

import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { ASTKinds, on } from "../grammar/parser";
import { RuleFactory } from "../linting-rule";
import { nodeToSourceRange } from "../util";

export const implicitIllegal = createDiagnosticsFactory();

export const implicit_illegal: RuleFactory = factoryContext => {
    const config = getRuleConfig("implicit_illegal", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<on>(ASTKinds.on, (node, context) => {
            if (
                node.statement.v.kind === ASTKinds.expression_statement &&
                node.statement.v.expression.kind === ASTKinds.ILLEGAL
            ) {
                return [
                    implicitIllegal(
                        config.severity,
                        "Illegal definitions should be implicit, remove this statement.",
                        context.source,
                        nodeToSourceRange(node)
                    ),
                ];
            }

            return [];
        });
    }
};

export default implicit_illegal;
