// System ports can only be bound once

import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { ASTKinds, component, identifier } from "../grammar/parser";
import { RuleFactory } from "../linting-rule";
import { isIdentifierEndpoint, nodeToSourceRange, systemBindings } from "../util";

export const duplicatePortBinding = createDiagnosticsFactory();

export const no_duplicate_port_binding: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_duplicate_port_binding", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<component>(ASTKinds.component, (node, context) => {
            if (node.body?.kind === ASTKinds.system) {
                const system = node.body;

                const seenPorts = new Map<string, identifier[]>();

                for (const binding of systemBindings(system)) {
                    // If left-hand-side is a port, record it in the map
                    if (isIdentifierEndpoint(binding.left)) {
                        if (!seenPorts.has(binding.left.name.text)) {
                            seenPorts.set(binding.left.name.text, [binding.left.name]);
                        } else {
                            seenPorts.get(binding.left.name.text)?.push(binding.left.name);
                        }
                    }

                    // If right-hand-side is a port, record it in the map
                    if (isIdentifierEndpoint(binding.right)) {
                        if (!seenPorts.has(binding.right.name.text)) {
                            seenPorts.set(binding.right.name.text, [binding.right.name]);
                        } else {
                            seenPorts.get(binding.right.name.text)?.push(binding.right.name);
                        }
                    }
                }

                const diagnostics = [];

                for (const [portName, occurrences] of seenPorts.entries()) {
                    if (occurrences.length > 1) {
                        for (const occurrence of occurrences) {
                            diagnostics.push(
                                duplicatePortBinding(
                                    config.severity,
                                    `Duplicate binding of port '${portName}'.`,
                                    context.source,
                                    nodeToSourceRange(occurrence)
                                )
                            );
                        }
                    }
                }

                return diagnostics;
            }

            return [];
        });
    }
};

export default no_duplicate_port_binding;
