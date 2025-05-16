// always: Always explicitly mention the direction of parameters

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory, Diagnostic, DiagnosticSeverity } from "../diagnostic";
import { RuleFactory } from "../linting-rule";
import { isCompound, isIdentifier, isKeyword, isOnStatement } from "../util";

export const portMissingBlocking = createDiagnosticsFactory();
export const portRedundantBlocking = createDiagnosticsFactory();

export const port_missing_redundant_blocking: RuleFactory = factoryContext => {
    const config = getRuleConfig("port_missing_redundant_blocking", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<ast.ComponentDefinition>(ast.SyntaxKind.ComponentDefinition, (node, context) => {
            if (!node.body || node.body.kind === ast.SyntaxKind.System) {
                return [];
            }

            const diagnostics: Diagnostic[] = [];

            const hasBlockingRequiresPorts = node.ports.some(p => p.direction.text === "requires" && isPortBlocking(p));

            // If requires ports are present, all provided ports should be blocking
            if (hasBlockingRequiresPorts) {
                for (const port of node.ports.filter(p => p.direction.text === "provides")) {
                    if (!isPortBlocking(port)) {
                        diagnostics.push(
                            portMissingBlocking(
                                config.severity,
                                "Port needs to be blocking because component has blocking requires ports.",
                                context.source,
                                port.name.position
                            )
                        );
                    }
                }

                return diagnostics;
            }

            // Otherwise, check for blocking keywords in the component behavior
            const ports = new Map(
                node.ports
                    .filter(p => p.direction.text === "provides")
                    .map(p => [p.name.text, { port: p, blockingOns: [] as ast.CompoundName[] }])
            );

            context.visit(node.body, subNode => {
                // Look for 'blocking on X: Y' or 'on X: blocking Y'
                if (isOnStatement(subNode)) {
                    if (subNode.blocking || isBlockingCompound(subNode.body)) {
                        // Mark all ports as needing blocking
                        for (const trigger of subNode.triggers) {
                            if (
                                !isKeyword(trigger) &&
                                !isIdentifier(trigger.name) &&
                                trigger.name.compound &&
                                isIdentifier(trigger.name.compound)
                            ) {
                                ports.get(trigger.name.compound.text)?.blockingOns.push(trigger.name);
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
                            port.name.position
                        )
                    );

                    // Also put diagnostics on blocking ons
                    for (const on of blockingOns) {
                        diagnostics.push(
                            portMissingBlocking(
                                DiagnosticSeverity.Hint,
                                `Blocking on for port ${port.name.text} here.`,
                                context.source,
                                on.position
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
                            port.name.position
                        )
                    );
                }
            }

            return diagnostics;
        });
    }
};

function isPortBlocking(port: ast.Port) {
    return port.qualifiers?.some(q => q.text === "blocking") ?? false;
}

function isBlockingCompound(node: ast.AnyAstNode): node is ast.Compound {
    return isCompound(node) && node.blocking !== undefined;
}
