import { DznLintUserConfiguration } from "./config/dznlint-configuration";
import { Diagnostic } from "./diagnostic";
import { VisitorContext } from "./visitor";
import * as parser from "./grammar/parser";

export type ASTNode = { kind: parser.ASTKinds; parent?: ASTNode };
export type Linter<T extends ASTNode> = (node: T, context: VisitorContext) => Diagnostic[];

export type RuleFactory = (context: RuleFactoryContext) => void;

export interface RuleFactoryContext {
    userConfig: DznLintUserConfiguration;
    registerRule<TNode extends ASTNode>(kind: TNode["kind"], rule: Linter<TNode>): void;
}

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
import no_unknown_variables from "./rules/no-unknown-variables";
import no_unused_parameters from "./rules/no-unused-parameter";
import no_unused_variables from "./rules/no-unused-variables";
import no_unused_ports from "./rules/no-unused-ports";
import parameter_direction from "./rules/parameter-direction";
import no_unused_instances from "./rules/no-unused-instances";
import { port_missing_redundant_blocking } from "./rules/port-missing-redundant-blocking";

export function loadLinters(config: DznLintUserConfiguration) {
    const factories = [
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
        no_unknown_variables,
        no_unused_instances,
        no_unused_parameters,
        no_unused_ports,
        no_unused_variables,
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

            linters.get(kind)?.push(rule as Linter<ASTNode>);
        },
    };

    for (const f of factories) {
        f(ruleFactoryContext);
    }

    return linters;
}
