// no identifiers used for bindings that are unknown

import { Diagnostic } from "..";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { ASTKinds, binding, identifier } from "../grammar/parser";
import { RuleFactory } from "../linting-rule";
import { isIdentifierEndpoint, nodeToSourceRange } from "../util";
import { VisitorContext } from "../visitor";

export const unknownPortBinding = createDiagnosticsFactory();

export const no_unknown_port_binding: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_unknown_port_binding", factoryContext.userConfig);

    if (config.isEnabled) {
        const createDiagnostic = (name: identifier, context: VisitorContext) =>
            unknownPortBinding(
                config.severity,
                `Binding to unknown port '${name.text}'.`,
                context.source,
                nodeToSourceRange(name)
            );

        factoryContext.registerRule<binding>(ASTKinds.binding, (node, context) => {
            const diagnostics: Diagnostic[] = [];

            if (isIdentifierEndpoint(node.left)) {
                const scope = context.scopeStack.find(s => s.root.kind === ASTKinds.component);
                if (scope && scope.variable_declarations[node.left.name.text] === undefined) {
                    diagnostics.push(createDiagnostic(node.left.name, context));
                }
            }

            if (isIdentifierEndpoint(node.right)) {
                const scope = context.scopeStack.find(s => s.root.kind === ASTKinds.component);
                if (scope && scope.variable_declarations[node.right.name.text] === undefined) {
                    diagnostics.push(createDiagnostic(node.right.name, context));
                }
            }

            return diagnostics;
        });
    }
};

export default no_unknown_port_binding;
