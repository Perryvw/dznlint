// System ports can only be bound once

import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory, DiagnosticSeverity } from "../diagnostic";
import { ASTKinds, function_definition, identifier, on } from "../grammar/parser";
import { RuleFactory } from "../linting-rule";
import { InputSource } from "../semantics/program";
import { headTailToList, nodeToSourceRange } from "../util";

export const duplicateParameter = createDiagnosticsFactory();

export const no_duplicate_parameters: RuleFactory = factoryContext => {
    const config = getRuleConfig("no_duplicate_parameters", factoryContext.userConfig);

    if (config.isEnabled) {
        const createDiagnostics = (newVariable: identifier, originalDefinition: identifier, source: InputSource) => [
            // Create error diagnostic at re-definition node
            duplicateParameter(
                config.severity,
                `Re-declaring already defined parameter '${newVariable.text}'.`,
                source,
                nodeToSourceRange(newVariable)
            ),
            // Create hint diagnostic pointing back at original definition
            duplicateParameter(
                DiagnosticSeverity.Hint,
                `Original declaration of '${newVariable.text}' here.`,
                source,
                nodeToSourceRange(originalDefinition)
            ),
        ];

        factoryContext.registerRule<function_definition>(ASTKinds.function_definition, (node, context) => {
            const diagnostics = [];

            const seenNames = new Map<string, identifier>();

            if (node.parameters.parameters) {
                for (const param of headTailToList(node.parameters.parameters)) {
                    if (seenNames.has(param.name.text)) {
                        diagnostics.push(
                            ...createDiagnostics(param.name, seenNames.get(param.name.text)!, context.source)
                        );
                    }

                    seenNames.set(param.name.text, param.name);
                }
            }

            return diagnostics;
        });

        factoryContext.registerRule<on>(ASTKinds.on, (node, context) => {
            const diagnostics = [];

            for (const on of headTailToList(node.on_trigger_list)) {
                const seenNames = new Map<string, identifier>();

                if (on.parameters && on.parameters.parameters) {
                    for (const param of headTailToList(on.parameters.parameters)) {
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
