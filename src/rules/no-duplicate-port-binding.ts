// System ports can only be bound once

import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { ASTKinds, binding_expression, component } from "../grammar/parser";
import { RuleFactory } from "../linting-rule";
import { nodeToSourceRange, systemBindings } from "../util";

export const duplicatePortBinding = createDiagnosticsFactory();

export const no_duplicate_port_binding: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_duplicate_port_binding", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<component>(ASTKinds.component, (node, context) => {
            if (node.body?.kind === ASTKinds.system) {
                const system = node.body;

                const seenPorts = new Map<string, binding_expression[]>();

                const bindingToString = (binding: binding_expression): string => {
                    if (binding.kind === ASTKinds.identifier) {
                        return binding.text;
                    } else if (binding.kind === ASTKinds.binding_expression_$0) {
                        const name = binding.name.kind === ASTKinds.asterisk_binding ? "*" : binding.name.text;
                        return `${bindingToString(binding.compound)}.${name}`;
                    } else if (binding.kind === ASTKinds.asterisk_binding) {
                        return "*";
                    }

                    return "";
                };

                for (const binding of systemBindings(system)) {
                    const stringLeft = bindingToString(binding.left);
                    const stringRight = bindingToString(binding.right);

                    if (seenPorts.has(stringLeft)) {
                        seenPorts.get(stringLeft)?.push(binding.left);
                    } else {
                        seenPorts.set(stringLeft, [binding.left]);
                    }

                    if (seenPorts.has(stringRight)) {
                        seenPorts.get(stringRight)?.push(binding.right);
                    } else {
                        seenPorts.set(stringRight, [binding.right]);
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
