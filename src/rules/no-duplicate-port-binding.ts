// System ports can only be bound once

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { RuleFactory } from "../linting-rule";
import { isAsterisk, systemBindings } from "../util";

export const duplicatePortBinding = createDiagnosticsFactory();

export const no_duplicate_port_binding: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_duplicate_port_binding", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<ast.ComponentDefinition>(ast.SyntaxKind.ComponentDefinition, (node, context) => {
            if (node.body?.kind === ast.SyntaxKind.System) {
                const system = node.body;

                const seenPorts = new Map<string, ast.BindingExpression[]>();

                const bindingToString = (binding: ast.BindingExpression): string => {
                    if (binding.kind === ast.SyntaxKind.Identifier) {
                        return binding.text;
                    } else if (binding.kind === ast.SyntaxKind.BindingCompoundName) {
                        const name = isAsterisk(binding.name) ? "*" : binding.name.text;
                        return `${bindingToString(binding.compound)}.${name}`;
                    } else if (isAsterisk(binding)) {
                        return "*";
                    }

                    return "";
                };

                for (const binding of systemBindings(system)) {
                    if (!isAsterisk(binding.left)) {
                        const stringLeft = bindingToString(binding.left);
                        if (seenPorts.has(stringLeft)) {
                            seenPorts.get(stringLeft)?.push(binding.left);
                        } else {
                            seenPorts.set(stringLeft, [binding.left]);
                        }
                    }

                    if (!isAsterisk(binding.right)) {
                        const stringRight = bindingToString(binding.right);
                        if (seenPorts.has(stringRight)) {
                            seenPorts.get(stringRight)?.push(binding.right);
                        } else {
                            seenPorts.set(stringRight, [binding.right]);
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
                                    occurrence.position
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
