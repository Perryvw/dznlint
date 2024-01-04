// no identifiers used for variables that are unknown

import { getRuleConfig } from "../config/util";
import { Diagnostic, createDiagnosticsFactory } from "../diagnostic";
import { ASTKinds, compound_name, identifier } from "../grammar/parser";
import { RuleFactory } from "../linting-rule";
import { Type, TypeKind } from "../semantics/program";
import { findFirstParent, nodeToSourceRange } from "../util";
import { VisitorContext } from "../visitor";

export const unknownVariable = createDiagnosticsFactory();

export const no_unknown_variables: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_unknown_variables", factoryContext.userConfig);

    if (config.isEnabled) {
        const createUnknownIdentifierDiagnostic = (name: identifier, context: VisitorContext) =>
            unknownVariable(
                config.severity,
                `Undefined variable ${name.text}`,
                context.source,
                nodeToSourceRange(name)
            );

        const createUnknownMemberDiagnostic = (name: identifier, ownerType: Type, context: VisitorContext) => {
            return unknownVariable(
                config.severity,
                `${ownerType.name} does not contain a member ${name}`,
                context.source,
                nodeToSourceRange(name)
            );
        };

        factoryContext.registerRule<identifier>(ASTKinds.identifier, (node, context) => {
            const diagnostics: Diagnostic[] = [];

            const symbol = context.typeChecker.symbolOfNode(node);
            const memberOwnerParent = findFirstParent(
                node,
                (n): n is compound_name => n.kind === ASTKinds.compound_name_1
            );

            if (!symbol) {
                if (memberOwnerParent) {
                    const ownerType = context.typeChecker.typeOfNode(memberOwnerParent);
                    if (ownerType.kind !== TypeKind.Invalid) {
                        // If type is invalid, some other linting rule will add a diagnostic
                        diagnostics.push(createUnknownMemberDiagnostic(node, ownerType, context));
                    }
                } else {
                    diagnostics.push(createUnknownIdentifierDiagnostic(node, context));
                }
            }

            return diagnostics;
        });
    }
};

export default no_unknown_variables;
