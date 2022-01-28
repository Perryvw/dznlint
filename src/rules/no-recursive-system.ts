// Systems cannot contain instances of itself

import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { ASTKinds, component, system } from "../grammar/parser";
import { RuleFactory } from "../linting-rule";
import { nodeToSourceRange } from "../util";

export const recursiveSystem = createDiagnosticsFactory();

export const no_recursive_system: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_recursive_system", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<system>(ASTKinds.system, (node, context) => {
            const diagnostics = [];

            const component = context.scopeStack.find(s => s.root.kind === ASTKinds.component)!.root as component;
            const componentName = component.name.text;

            for (const { instance_or_binding } of node.instances_and_bindings) {
                if (instance_or_binding.kind === ASTKinds.instance) {
                    const instanceType = instance_or_binding.type;
                    if (instanceType.kind === ASTKinds.identifier && instanceType.text === componentName) {
                        diagnostics.push(
                            recursiveSystem(
                                config.severity,
                                "Systems cannot contain instances of themself.",
                                context.source,
                                nodeToSourceRange(instance_or_binding.name)
                            )
                        );
                    }
                }
            }

            return diagnostics;
        });
    }
};

export default no_recursive_system;
