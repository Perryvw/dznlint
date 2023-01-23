// No required/provided ports that are not referenced

import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { ASTKinds, component, port } from "../grammar/parser";
import { RuleFactory } from "../linting-rule";
import { isIdentifier, nodeToSourceRange, systemBindings } from "../util";

export const unusedPort = createDiagnosticsFactory();

export const no_unused_ports: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_unused_ports", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<component>(ASTKinds.component, (node, context) => {
            if (node.body?.kind === ASTKinds.system) {
                const system = node.body;

                const seenPorts = new Map<string, { port: port; seen: boolean }>();
                for (const { v: port } of node.ports) {
                    seenPorts.set(port.name.text, { port, seen: false });
                }

                for (const binding of systemBindings(system)) {
                    context.visit(binding, node => {
                        if (isIdentifier(node) && seenPorts.has(node.text)) {
                            seenPorts.get(node.text)!.seen = true;
                        }
                    });
                }

                const diagnostics = [];

                for (const { port, seen } of seenPorts.values()) {
                    if (!seen) {
                        diagnostics.push(
                            unusedPort(
                                config.severity,
                                "This port is not bound to anything.",
                                context.source,
                                nodeToSourceRange(port.name)
                            )
                        );
                    }
                }

                return diagnostics;
            }

            return [];
        });
    }
};

export default no_unused_ports;
