// System ports can only be bound once

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory, DiagnosticSeverity } from "../diagnostic";
import { RuleFactory } from "../linting-rule";
import { InputSource } from "../semantics/program";

export const duplicateParameter = createDiagnosticsFactory();

export const no_duplicate_parameters: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_duplicate_parameters", factoryContext.userConfig);

    if (config.isEnabled) {
        const createDiagnostics = (newVariable: ast.Identifier, originalDefinition: ast.Identifier, source: InputSource) => [
            // Create error diagnostic at re-definition node
            duplicateParameter(
                config.severity,
                `Re-declaring already defined parameter '${newVariable.text}'.`,
                source,
                newVariable.position
            ),
            // Create hint diagnostic pointing back at original definition
            duplicateParameter(
                DiagnosticSeverity.Hint,
                `Original declaration of '${newVariable.text}' here.`,
                source,
                originalDefinition.position
            ),
        ];

        factoryContext.registerRule<ast.FunctionDefinition>(ast.SyntaxKind.FunctionDefinition, (node, context) => {
            const diagnostics = [];

            const seenNames = new Map<string, ast.Identifier>();

            for (const param of node.parameters) {
                if (seenNames.has(param.name.text)) {
                    diagnostics.push(
                        ...createDiagnostics(param.name, seenNames.get(param.name.text)!, context.source)
                    );
                }

                seenNames.set(param.name.text, param.name);
            }

            return diagnostics;
        });

        factoryContext.registerRule<ast.OnStatement>(ast.SyntaxKind.OnStatement, (node, context) => {
            const diagnostics = [];

            for (const on of node.triggers) {
                const seenNames = new Map<string, ast.Identifier>();

                if (on.parameterList) {
                    for (const param of on.parameterList.parameters) {
                        if (seenNames.has(param.name.text)) {
                            diagnostics.push(
                                ...createDiagnostics(param.name, seenNames.get(param.name.text)!, context.source)
                            );
                        }

                        seenNames.set(param.name.text, param.name);
                    }
                }
            }

            return diagnostics;
        });
    }
};

export default no_duplicate_parameters;
