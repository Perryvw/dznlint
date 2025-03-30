// No ports that are never used

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory, Diagnostic } from "../diagnostic";
import { RuleFactory } from "../linting-rule";
import { isIdentifier } from "../util";

export const unusedPort = createDiagnosticsFactory();

export const no_unused_ports: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_unused_ports", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<ast.ComponentDefinition>(ast.SyntaxKind.ComponentDefinition, (node, context) => {
            if (!node.body) return [];

            const seenPorts: Record<string, [ast.Identifier, number]> = {};
            for (const port of node.ports) {
                seenPorts[port.name.text] = [port.name, 0];
            }

            // Count references to the ports in body
            context.visit(node.body, subNode => {
                if (isIdentifier(subNode) && subNode.text in seenPorts) {
                    seenPorts[subNode.text][1]++;
                }
            });

            // Diagnostics for all ports that were not seen in the body
            const diagnostics: Diagnostic[] = [];
            for (const [identifier, count] of Object.values(seenPorts)) {
                if (count === 0) {
                    diagnostics.push(
                        unusedPort(
                            config.severity,
                            `This port is never used, consider removing it.`,
                            context.source,
                            identifier.position
                        )
                    );
                }
            }

            return diagnostics;
        });
    }
};

export default no_unused_ports;
