// no identifiers used for variables that are unknown

import { getRuleConfig } from "../config/util";
import { Diagnostic, createDiagnosticsFactory } from "../diagnostic";
import { ASTKinds, binding_expression_$0, compound_name_$0, identifier, member_identifier } from "../grammar/parser";
import { ASTNode, RuleFactory } from "../linting-rule";
import { Type, TypeKind } from "../semantics/program";
import { nodeToSourceRange } from "../util";
import { VisitorContext } from "../visitor";

export const unknownVariable = createDiagnosticsFactory();

export const no_unknown_variables: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_unknown_variables", factoryContext.userConfig);

    if (config.isEnabled) {
        const createUnknownIdentifierDiagnostic = (
            name: identifier | member_identifier,
            typeForMessage: string,
            context: VisitorContext
        ) =>
            unknownVariable(
                config.severity,
                `Undefined ${typeForMessage} ${name.text}`,
                context.source,
                nodeToSourceRange(name)
            );

        const createUnknownMemberDiagnostic = (
            name: identifier | member_identifier,
            ownerType: Type,
            context: VisitorContext
        ) => {
            return unknownVariable(
                config.severity,
                `${ownerType.name} does not contain a member ${name.text}`,
                context.source,
                nodeToSourceRange(name)
            );
        };

        factoryContext.registerRule<identifier>(ASTKinds.identifier, (node: identifier & ASTNode, context) => {
            const diagnostics: Diagnostic[] = [];

            const symbol = context.typeChecker.symbolOfNode(node);
            if (symbol === undefined) {
                const owner = node.parent;
                if (owner && owner.kind === ASTKinds.call_expression) {
                    diagnostics.push(createUnknownIdentifierDiagnostic(node, "function", context));
                } else if (owner && owner.kind === ASTKinds.instance) {
                    diagnostics.push(createUnknownIdentifierDiagnostic(node, "type", context));
                } else {
                    diagnostics.push(createUnknownIdentifierDiagnostic(node, "variable", context));
                }
            }

            return diagnostics;
        });

        const checkCompoundName = (
            node: (binding_expression_$0 | compound_name_$0) & ASTNode,
            context: VisitorContext
        ) => {
            const diagnostics: Diagnostic[] = [];

            if (node.name.kind === ASTKinds.asterisk_binding) return []; // TODO: Figure out if we need to do something in this case

            const type = context.typeChecker.typeOfNode(node);
            if (type.kind === TypeKind.Invalid) {
                if (node.compound) {
                    const ownerType = context.typeChecker.typeOfNode(node.compound);
                    if (ownerType.kind === TypeKind.Invalid) {
                        // Will be handled by a rule triggered on a deeper node
                    } else {
                        diagnostics.push(createUnknownMemberDiagnostic(node.name, ownerType, context));
                    }
                } else {
                    diagnostics.push(createUnknownIdentifierDiagnostic(node.name, "variable", context));
                }
            }

            return diagnostics;
        };

        factoryContext.registerRule<compound_name_$0>(ASTKinds.compound_name_$0, checkCompoundName);
        factoryContext.registerRule<binding_expression_$0>(ASTKinds.binding_expression_$0, checkCompoundName);
    }
};

export default no_unknown_variables;
