// No ports that are never used

import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory, Diagnostic } from "../diagnostic";
import * as parser from "../grammar/parser";
import { RuleFactory } from "../linting-rule";
import { isIdentifier, nodeToSourceRange } from "../util";

export const unusedPort = createDiagnosticsFactory();

export const no_unused_ports: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_unused_ports", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<parser.component>(parser.ASTKinds.component, (node, context) => {
            if (!node.body) return [];

            const seenPorts: Record<string, [parser.identifier, number]> = {};
            for (const port of node.ports) {
                seenPorts[port.port.name.text] = [port.port.name, 0];
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
                            nodeToSourceRange(identifier)
                        )
                    );
                }
            }

            return diagnostics;
        });
    }
};

export default no_unused_ports;
