// Systems cannot contain instances of itself

import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { ASTKinds, component, system } from "../grammar/parser";
import { RuleFactory } from "../linting-rule";
import { nodeToSourceRange, systemInstances } from "../util";

export const recursiveSystem = createDiagnosticsFactory();

export const no_recursive_system: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_recursive_system", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<system>(ASTKinds.system, (node, context) => {
            const diagnostics = [];

            const component = context.scopeStack.find(s => s.root.kind === ASTKinds.component)!.root as component;
            const componentName = component.name.text;

            // Check if the type of any of the instances of the system is the same system
            for (const instance of systemInstances(node)) {
                const instanceType = instance.type;
                if (instanceType.kind === ASTKinds.identifier && instanceType.text === componentName) {
                    diagnostics.push(
                        recursiveSystem(
                            config.severity,
                            "Systems cannot contain instances of itself.",
                            context.source,
                            nodeToSourceRange(instance.name)
                        )
                    );
                }
            }

            return diagnostics;
        });
    }
};

export default no_recursive_system;
