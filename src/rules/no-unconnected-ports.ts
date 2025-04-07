// No required/provided ports that are not referenced
// No ports on system instances not bound

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { RuleFactory } from "../linting-rule";
import { SemanticSymbol } from "../semantics/type-checker";
import {
    isAsterisk,
    isIdentifier,
    isInjected,
    isPort,
    systemBindings,
    systemInstances,
} from "../util";

export const unconnectedPort = createDiagnosticsFactory();

export const no_unconnected_ports: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_unconnected_ports", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<ast.ComponentDefinition>(ast.SyntaxKind.ComponentDefinition, (node, context) => {
            if (node.body?.kind === ast.SyntaxKind.System) {
                const system = node.body;

                // Create map to keep track of the ports of the component
                const seenPorts = new Map<string, { port: ast.Port; seen: boolean }>();
                for (const port of node.ports) {
                    seenPorts.set(port.name.text, { port, seen: false });
                }

                // Create a map to keep track of the ports of instances in the system
                const instancePortBindings = new Map<SemanticSymbol, Record<string, boolean>>();
                for (const instance of systemInstances(system)) {
                    const bindings: Record<string, boolean> = {};
                    const instanceSymbol = context.typeChecker.symbolOfNode(instance);
                    const instanceType = context.typeChecker.typeOfNode(instance);
                    if (instanceSymbol && instanceType.declaration) {
                        for (const [portName, portSymbol] of context.typeChecker.getMembersOfType(instanceType)) {
                            if (isPort(portSymbol.declaration) && !isInjected(portSymbol.declaration)) {
                                bindings[portName] = false;
                            }
                        }

                        instancePortBindings.set(instanceSymbol, bindings);
                    }
                }

                // Check all port bindings and keep track of what we see
                const registerBindingExpression = (binding: ast.BindingExpression) => {
                    if (isIdentifier(binding) && seenPorts.has(binding.text)) {
                        // Register binding of component port
                        seenPorts.get(binding.text)!.seen = true;
                    } else if (binding.kind === ast.SyntaxKind.BindingCompoundName) {
                        // Register binding of instance port
                        const symbol = context.typeChecker.symbolOfNode(binding.compound);
                        if (symbol) {
                            if (binding.name.kind === ast.SyntaxKind.Identifier) {
                                // See specific port by name
                                const ports = instancePortBindings.get(symbol) ?? {};
                                ports[binding.name.text] = true;
                            } else if (isAsterisk(binding.name)) {
                                // See all ports for asterisk binding
                                const ports = instancePortBindings.get(symbol) ?? {};
                                for (const k of Object.keys(ports)) {
                                    ports[k] = true;
                                }
                            }
                        }
                    }
                };

                for (const binding of systemBindings(system)) {
                    registerBindingExpression(binding.left);
                    registerBindingExpression(binding.right);
                }

                const diagnostics = [];

                // Add diagnostics for component ports
                for (const { port, seen } of seenPorts.values()) {
                    if (!seen) {
                        diagnostics.push(
                            unconnectedPort(
                                config.severity,
                                "This port is not bound to anything.",
                                context.source,
                                port.name.position
                            )
                        );
                    }
                }

                // Add diagnostics for partially bound instances
                for (const [instanceSymbol, bindings] of instancePortBindings.entries()) {
                    const unboundPorts = Object.keys(bindings).filter(portName => bindings[portName] === false);
                    if (unboundPorts.length > 0) {
                        const instanceName = (instanceSymbol.declaration as ast.Instance).name;
                        if (instanceName) {
                            diagnostics.push(
                                unconnectedPort(
                                    config.severity,
                                    "Not all ports of this instance are bound. Unbound ports: " +
                                        unboundPorts.join(", "),
                                    context.source,
                                    instanceName.position
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

export default no_unconnected_ports;
