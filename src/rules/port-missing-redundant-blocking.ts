// always: Always explicitly mention the direction of parameters

import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory, Diagnostic, DiagnosticSeverity } from "../diagnostic";
import { ASTKinds, component, compound, compound_name, port } from "../grammar/parser";
import { ASTNode, RuleFactory } from "../linting-rule";
import { headTailToList, isCompound, isIdentifier, isOnEvent, nodeToSourceRange } from "../util";

export const portMissingBlocking = createDiagnosticsFactory();
export const portRedundantBlocking = createDiagnosticsFactory();

export const port_missing_redundant_blocking: RuleFactory = factoryContext => {
    const config = getRuleConfig("port_missing_redundant_blocking", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<component>(ASTKinds.component, (node, context) => {
            if (!node.body || node.body.kind === ASTKinds.system) {
                return [];
            }

            const diagnostics: Diagnostic[] = [];

            const hasBlockingRequiresPorts = node.ports.some(
                p => p.port.direction === "requires" && isPortBlocking(p.port)
            );

            // If requires ports are present, all provided ports should be blocking
            if (hasBlockingRequiresPorts) {
                for (const port of node.ports.filter(p => p.port.direction === "provides")) {
                    if (!isPortBlocking(port.port)) {
                        diagnostics.push(
                            portMissingBlocking(
                                config.severity,
                                "Port needs to be blocking because component has blocking requires ports.",
                                context.source,
                                nodeToSourceRange(port.port.name)
                            )
                        );
                    }
                }

                return diagnostics;
            }

            // Otherwise, check for blocking keywords in the component behavior
            const ports = new Map(
                node.ports
                    .filter(p => p.port.direction === "provides")
                    .map(p => [p.port.name.text, { port: p.port, blockingOns: [] as compound_name[] }])
            );

            context.visit(node.body, subNode => {
                // Look for 'blocking on X: Y' or 'on X: blocking Y'
                if (isOnEvent(subNode)) {
                    if (subNode.blocking || isBlockingCompound(subNode.statement)) {
                        // Mark all ports as needing blocking
                        for (const { name } of headTailToList(subNode.on_trigger_list)) {
                            if (!isIdentifier(name) && name.compound && isIdentifier(name.compound)) {
                                ports.get(name.compound.text)?.blockingOns.push(name);
                            }
                        }
                    }
                }
            });

            for (const { port, blockingOns } of ports.values()) {
                const isBlocking = isPortBlocking(port);
                const shouldBlock = blockingOns.length > 0;

                if (!isBlocking && shouldBlock) {
                    // Main diagnostic
                    diagnostics.push(
                        portMissingBlocking(
                            config.severity,
                            "Port needs to be blocking because it is used in blocking 'on's.",
                            context.source,
                            nodeToSourceRange(port.name)
                        )
                    );

                    // Also put diagnostics on blocking ons
                    for (const on of blockingOns) {
                        diagnostics.push(
                            portMissingBlocking(
                                DiagnosticSeverity.Hint,
                                `Blocking on for port ${port.name.text} here.`,
                                context.source,
                                nodeToSourceRange(on)
                            )
                        );
                    }
                }

                if (isBlocking && !shouldBlock) {
                    diagnostics.push(
                        portRedundantBlocking(
                            config.severity,
                            "Port is marked blocking but is never used in a blocking way.",
                            context.source,
                            nodeToSourceRange(port.name)
                        )
                    );
                }
            }

            return diagnostics;
        });
    }
};

function isPortBlocking(port: port) {
    return port.qualifiers?.some(q => q.qualifier === "blocking") ?? false;
}

function isBlockingCompound(node: ASTNode): node is compound {
    return isCompound(node) && node.blocking !== null;
}
