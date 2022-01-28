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

import naming_convention from "./rules/naming-convention";
import no_recursive_system from "./rules/no-recursive-system";
import no_shadowing from "./rules/no-shadowing";
import parameter_direction from "./rules/parameter-direction";

export function loadLinters(config: DznLintUserConfiguration) {
    const factories = [naming_convention, no_recursive_system, no_shadowing, parameter_direction];

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
