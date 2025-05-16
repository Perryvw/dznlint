// no identifiers used for bindings that are unknown

import * as ast from "../grammar/ast";
import { Diagnostic } from "..";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { RuleFactory } from "../linting-rule";
import { Type, TypeKind } from "../semantics/type-checker";
import { isAsterisk } from "../util";
import { VisitorContext } from "../visitor";

export const portBindingMismatch = createDiagnosticsFactory();

export const no_mismatching_binding_types: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_mismatching_binding_types", factoryContext.userConfig);

    if (config.isEnabled) {
        const createDiagnostic = (typeLeft: Type, typeRight: Type, node: ast.Binding, context: VisitorContext) =>
            portBindingMismatch(
                config.severity,
                `Cannot bind port of type ${typeRight.name} to a port of type ${typeLeft.name}.`,
                context.source,
                node.position
            );

        factoryContext.registerRule<ast.Binding>(ast.SyntaxKind.Binding, (node, context) => {
            const diagnostics: Diagnostic[] = [];

            if (isAsterisk(node.left) || isAsterisk(node.right)) {
                // No need to check binding to the locator
                return [];
            }

            const typeLeft = context.typeChecker.typeOfNode(node.left);
            const typeRight = context.typeChecker.typeOfNode(node.right);

            if (typeLeft.kind === TypeKind.Invalid || typeRight.kind === TypeKind.Invalid) {
                // Invalid types on one of the operands, some other rule will add a diagnostic
                return [];
            }

            if (typeLeft !== typeRight) {
                diagnostics.push(createDiagnostic(typeLeft, typeRight, node, context));
            }

            return diagnostics;
        });
    }
};

export default no_mismatching_binding_types;
