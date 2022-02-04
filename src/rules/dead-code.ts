// No code after returns

import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory, Diagnostic } from "../diagnostic";
import { ASTKinds, return_statement } from "../grammar/parser";
import { RuleFactory } from "../linting-rule";
import { nodeToSourceRange } from "../util";

export const deadCode = createDiagnosticsFactory();

export const dead_code: RuleFactory = factoryContext => {
    const config = getRuleConfig("dead_code", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<return_statement>(ASTKinds.return_statement, (node, context) => {
            const diagnostics = [] as Diagnostic[];

            const scopeRoot = context.currentScope().root;
            if (scopeRoot.kind === ASTKinds.compound) {
                const scopeStatements = scopeRoot.statements.map(s => s.statement);
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
                                nodeToSourceRange(trailingStatement)
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
