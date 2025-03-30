// When importing a file we must be able to resolve it

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { RuleFactory } from "../linting-rule";

export const couldNotResolveFile = createDiagnosticsFactory();

export const no_unknown_imports: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_unknown_imports", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<ast.ImportStatement>(ast.SyntaxKind.ImportStatement, (node, context) => {
            if (
                context.program.host.resolveImport(node.file, context.source.fileName ?? "?", context.program) ===
                undefined
            ) {
                let message = `Could not find file ${node.file} imported from ${context.source.fileName ?? "?"}`;
                if (context.program.host.includePaths?.length > 0) {
                    message += ` or any of the include paths: ${context.program.host.includePaths.join(", ")}`;
                } else {
                    message += `. Did you forget to set your include paths?`;
                }

                return [couldNotResolveFile(config.severity, message, context.source, node.position)];
            }

            return [];
        });
    }
};

export default no_unknown_imports;
