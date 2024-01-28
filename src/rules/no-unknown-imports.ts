// When importing a file we must be able to resolve it

import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { ASTKinds, import_statement } from "../grammar/parser";
import { RuleFactory } from "../linting-rule";
import { nodeToSourceRange } from "../util";

export const couldNotResolveFile = createDiagnosticsFactory();

export const no_unknown_imports: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_unknown_imports", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<import_statement>(ASTKinds.import_statement, (node, context) => {
            if (
                context.program.host.resolveImport(node.file_name, context.source.fileName ?? "?", context.program) ===
                undefined
            ) {
                let message = `Could not find file ${node.file_name} imported from ${context.source.fileName ?? "?"}`;
                if (context.program.host.includePaths?.length > 0) {
                    message += ` or any of the include paths: ${context.program.host.includePaths.join(", ")}`;
                } else {
                    message += `. Did you forget to set your include paths?`;
                }

                return [couldNotResolveFile(config.severity, message, context.source, nodeToSourceRange(node))];
            }

            return [];
        });
    }
};

export default no_unknown_imports;
