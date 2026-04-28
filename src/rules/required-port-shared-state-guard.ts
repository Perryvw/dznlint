// Using shared state of required ports will lead to unexpected behavior, and is better avoided

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { RuleFactory } from "../linting-rule";
import { isCompoundName, isEvent, isInterfaceDefinition, isPort } from "../util";

export const requiredPortSharedStateInGuard = createDiagnosticsFactory();

export const required_port_shared_state_guard: RuleFactory = factoryContext => {
    const config = getRuleConfig("required_port_shared_state_guard", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<ast.GuardStatement>(ast.SyntaxKind.GuardStatement, (node, context) => {
            const diagnostics = [];

            if (isCompoundName(node.condition)) {
                const base = compoundNameBase(node.condition);
                const baseSymbol = base && context.typeChecker.symbolOfNode(base);

                if (
                    baseSymbol &&
                    isPort(baseSymbol.declaration) &&
                    baseSymbol.declaration.direction.text === "requires"
                ) {
                    // We have a guard that is using state from a required port. Check if that port has out events:
                    const interfaceDefinition = context.typeChecker.symbolOfNode(
                        baseSymbol.declaration.type
                    )?.declaration;

                    if (interfaceDefinition && isInterfaceDefinition(interfaceDefinition)) {
                        const hasOutEvents = interfaceDefinition.body.some(
                            node => isEvent(node) && node.direction.text === "out"
                        );
                        if (hasOutEvents) {
                            diagnostics.push(
                                requiredPortSharedStateInGuard(
                                    config.severity,
                                    "Using required port shared state in guard statements leads to unexpected component behavior with the port's out events and is better avoided",
                                    context.source,
                                    node.condition.position
                                )
                            );
                        }
                    }
                }
            }

            return diagnostics;
        });
    }
};

function compoundNameBase(name: ast.CompoundName): ast.Identifier | undefined {
    let base: ast.Identifier | ast.CompoundName | undefined = name;
    while (base && isCompoundName(base)) {
        base = base.compound;
    }
    return base;
}

export default required_port_shared_state_guard;
