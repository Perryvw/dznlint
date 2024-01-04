// System ports can only be bound once

import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { ASTKinds, binding_expression, component } from "../grammar/parser";
import { RuleFactory } from "../linting-rule";
import { SemanticSymbol } from "../semantics/program";
import { nodeToSourceRange, systemBindings } from "../util";

export const duplicatePortBinding = createDiagnosticsFactory();

export const no_duplicate_port_binding: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_duplicate_port_binding", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<component>(ASTKinds.component, (node, context) => {
            if (node.body?.kind === ASTKinds.system) {
                const system = node.body;

                const seenPorts = new Map<SemanticSymbol, binding_expression[]>();

                for (const binding of systemBindings(system)) {
                    const symbolLeft = context.typeChecker.symbolOfNode(binding.left);
                    const symbolRight = context.typeChecker.symbolOfNode(binding.right);

                    if (symbolLeft === undefined || symbolRight === undefined) {
                        // Could not succesfully resolve one of the operands' symbols, no-unknown-variables will take care of this
                        return [];
                    }

                    if (seenPorts.has(symbolLeft)) {
                        seenPorts.get(symbolLeft)?.push(binding.left);
                    } else {
                        seenPorts.set(symbolLeft, [binding.left]);
                    }

                    if (seenPorts.has(symbolRight)) {
                        seenPorts.get(symbolRight)?.push(binding.right);
                    } else {
                        seenPorts.set(symbolRight, [binding.right]);
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
