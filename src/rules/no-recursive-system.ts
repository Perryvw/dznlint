// Systems cannot contain instances of itself

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { RuleFactory } from "../linting-rule";
import { isIdentifier, systemInstances } from "../util";

export const recursiveSystem = createDiagnosticsFactory();

export const no_recursive_system: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_recursive_system", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<ast.System>(ast.SyntaxKind.System, (node, context) => {
            const diagnostics = [];

            const component = context.scopeStack.find(s => s.root.kind === ast.SyntaxKind.ComponentDefinition)!
                .root as ast.ComponentDefinition;
            const componentName = component.name.text;

            // Check if the type of any of the instances of the system is the same system
            for (const instance of systemInstances(node)) {
                const instanceType = instance.type.typeName;
                if (isIdentifier(instanceType) && instanceType.text === componentName) {
                    diagnostics.push(
                        recursiveSystem(
                            config.severity,
                            "Systems cannot contain instances of itself.",
                            context.source,
                            instance.name.position
                        )
                    );
                }
            }

            return diagnostics;
        });
    }
};

export default no_recursive_system;
