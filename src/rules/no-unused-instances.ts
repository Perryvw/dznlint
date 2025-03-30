// No instances that are not connected

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { RuleFactory } from "../linting-rule";
import { isIdentifier, systemBindings, systemInstances } from "../util";

export const unusedInstance = createDiagnosticsFactory();

export const no_unused_instances: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_unused_instances", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<ast.System>(ast.SyntaxKind.System, (node, context) => {
            const seenInstances = new Map<string, { instance: ast.Instance; seen: boolean }>();
            for (const instance of systemInstances(node)) {
                seenInstances.set(instance.name.text, { instance, seen: false });
            }

            for (const binding of systemBindings(node)) {
                context.visit(binding, node => {
                    if (isIdentifier(node) && seenInstances.has(node.text)) {
                        seenInstances.get(node.text)!.seen = true;
                    }
                });
            }

            const diagnostics = [];

            for (const { instance, seen } of seenInstances.values()) {
                if (!seen) {
                    diagnostics.push(
                        unusedInstance(
                            config.severity,
                            "This instance is not bound to anything.",
                            context.source,
                            instance.name.position
                        )
                    );
                }
            }

            return diagnostics;
        });
    }
};

export default no_unused_instances;
