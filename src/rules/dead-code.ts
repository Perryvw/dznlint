// No code after returns

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory, Diagnostic } from "../diagnostic";
import { RuleFactory } from "../linting-rule";

export const deadCode = createDiagnosticsFactory();

export const dead_code: RuleFactory = factoryContext => {
    const config = getRuleConfig("dead_code", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<ast.ReturnStatement>(ast.SyntaxKind.ReturnStatement, (node, context) => {
            const diagnostics = [] as Diagnostic[];

            const scopeRoot = context.currentScope().root;
            if (scopeRoot.kind === ast.SyntaxKind.Compound) {
                const scopeStatements = scopeRoot.statements;
                const returnIndex = scopeStatements.indexOf(node);

                // Check if current node is last statement in compound
                if (returnIndex < scopeStatements.length - 1) {
                    // If not, add diagnostics to all trailing nodes
                    for (const trailingStatement of scopeStatements.splice(returnIndex + 1)) {
                        diagnostics.push(
                            deadCode(
                                config.severity,
                                "Code after return statements will never be executed.",
                                context.source,
                                trailingStatement.position
                            )
                        );
                    }
                }
            }

            return diagnostics;
        });
    }
};

export default dead_code;
