import { DznLintUserConfiguration } from "./config/dznlint-configuration";
import { createDiagnosticsFactory, Diagnostic, DiagnosticSeverity, SourceRange } from "./diagnostic";
import { VisitorContext } from "./visitor";
import * as parser from "./grammar/parser";

export type ASTNode = { kind: parser.ASTKinds; parent?: ASTNode };
export type Linter<T extends ASTNode> = (node: T, context: VisitorContext) => Diagnostic[];

export type RuleFactory = (context: RuleFactoryContext) => void;

export interface RuleFactoryContext {
    userConfig: DznLintUserConfiguration;
    registerRule<TNode extends ASTNode>(kind: TNode["kind"], rule: Linter<TNode>): void;
}

import call_arguments_must_match from "./rules/call-arguments-must-match";
import dead_code from "./rules/dead-code";
import implicit_illegal from "./rules/implicit-illegal";
import inline_temporary_variables from "./rules/inline-temporary-variables";
import naming_convention from "./rules/naming-convention";
import { never_fired_event } from "./rules/never-fired-event";
import { never_legal_event } from "./rules/never-legal-event";
import no_recursive_system from "./rules/no-recursive-system";
import no_shadowing from "./rules/no-shadowing";
import no_bool_out_parameters from "./rules/no-bool-out-parameters";
import no_duplicate_parameters from "./rules/no-duplicate-parameters";
import no_duplicate_port_binding from "./rules/no-duplicate-port-binding";
import no_empty_defer_capture from "./rules/no-empty-defer-capture";
import no_mismatching_binding_types from "./rules/no-mismatching-binding-types";
import no_unconnected_ports from "./rules/no-unconnected-ports";
import no_unknown_imports from "./rules/no-unknown-imports";
import no_unknown_variables from "./rules/no-unknown-variables";
import no_unused_parameters from "./rules/no-unused-parameter";
import no_unused_ports from "./rules/no-unused-ports";
import no_unused_variables from "./rules/no-unused-variables";
import on_parameters_must_match from "./rules/on-parameters-must-match";
import parameter_direction from "./rules/parameter-direction";
import no_unused_instances from "./rules/no-unused-instances";
import { port_missing_redundant_blocking } from "./rules/port-missing-redundant-blocking";
import { nodeToSourceRange } from "./util";

export function loadLinters(config: DznLintUserConfiguration) {
    const factories = [
        call_arguments_must_match,
        dead_code,
        implicit_illegal,
        inline_temporary_variables,
        naming_convention,
        never_fired_event,
        never_legal_event,
        no_bool_out_parameters,
        no_duplicate_parameters,
        no_duplicate_port_binding,
        no_empty_defer_capture,
        no_mismatching_binding_types,
        no_recursive_system,
        no_shadowing,
        no_unconnected_ports,
        no_unknown_imports,
        no_unknown_variables,
        no_unused_instances,
        no_unused_parameters,
        no_unused_ports,
        no_unused_variables,
        on_parameters_must_match,
        parameter_direction,
        port_missing_redundant_blocking,
    ];

    const linters = new Map<parser.ASTKinds, Linter<ASTNode>[]>();

    const ruleFactoryContext: RuleFactoryContext = {
        userConfig: config,
        registerRule<TNode extends ASTNode>(kind: TNode["kind"], rule: Linter<TNode>) {
            if (!linters.has(kind)) {
                linters.set(kind, []);
            }

            linters.get(kind)?.push(wrapErrorHandling(rule as Linter<ASTNode>));
        },
    };

    for (const f of factories) {
        f(ruleFactoryContext);
    }

    return linters;
}

export const dznLintExceptionThrown = createDiagnosticsFactory();

function wrapErrorHandling(linter: Linter<ASTNode>): Linter<ASTNode> {
    return (node, context) => {
        try {
            return linter(node, context);
        } catch (exception) {
            const range: SourceRange =
                "start" in node && "end" in node
                    ? nodeToSourceRange(node as { start: parser.PosInfo; end: parser.PosInfo })
                    : {
                          from: { index: 0, line: 0, column: 0 },
                          to: {
                              index: context.source.fileContent.indexOf("\n"), // fall back to first line of file
                              line: 0,
                              column: context.source.fileContent.indexOf("\n"),
                          },
                      };
            return [
                dznLintExceptionThrown(
                    DiagnosticSeverity.Error,
                    `Exception occurred in dznlint: ${exception}`,
                    context.source,
                    range
                ),
            ];
        }
    };
}
