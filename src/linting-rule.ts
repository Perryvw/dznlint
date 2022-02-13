import { DznLintUserConfiguration } from "./config/dznlint-configuration";
import { Diagnostic } from "./diagnostic";
import { VisitorContext } from "./visitor";
import * as parser from "./grammar/parser";

export type ASTNode = { kind: parser.ASTKinds };
export type Linter<T extends ASTNode> = (node: T, context: VisitorContext) => Diagnostic[];

export type RuleFactory = (context: RuleFactoryContext) => void;

export interface RuleFactoryContext {
    userConfig: DznLintUserConfiguration;
    registerRule<TNode extends ASTNode>(kind: TNode["kind"], rule: Linter<TNode>): void;
}

import dead_code from "./rules/dead-code";
import implicit_illegal from "./rules/implicit-illegal";
import naming_convention from "./rules/naming-convention";
import no_recursive_system from "./rules/no-recursive-system";
import no_shadowing from "./rules/no-shadowing";
import no_unknown_port_binding from "./rules/no-unknown-port-binding";
import no_unused_parameters from "./rules/no-unused-parameter";
import parameter_direction from "./rules/parameter-direction";

export function loadLinters(config: DznLintUserConfiguration) {
    const factories = [
        dead_code,
        implicit_illegal,
        naming_convention,
        no_recursive_system,
        no_shadowing,
        no_unknown_port_binding,
        no_unused_parameters,
        parameter_direction,
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
