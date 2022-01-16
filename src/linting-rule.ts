import { DznLintConfiguration } from "./config/dznlint-configuration.js";
import { Diagnostic } from "./diagnostic.js";
import * as parser from "./grammar/parser.js";

interface LintContext {
    config: DznLintConfiguration
}

export type ASTNode = { kind: parser.ASTKinds };
export type Linter<T extends ASTNode> = (node: T, context: LintContext) => Diagnostic[];

export type RuleFactory = (context: RuleFactoryContext) => void;

export interface RuleFactoryContext {
    config: DznLintConfiguration
    registerRule<TNode extends ASTNode>(kind: TNode["kind"], rule: Linter<TNode>): void;
}

import { naming_convention } from "./rules/naming-convention.js";

export function loadLinters(config: DznLintConfiguration) {
    const factories = [
        naming_convention
    ];

    const linters = new Map<parser.ASTKinds, Linter<ASTNode>[]>();

    const ruleFactoryContext: RuleFactoryContext = {
        config,
        registerRule<TNode extends ASTNode>(kind: TNode["kind"], rule: Linter<TNode>) {
            if (!linters.has(kind)) {
                linters.set(kind, []);
            }

            linters.get(kind)?.push(rule as Linter<ASTNode>);
        }
    }

    for (const f of factories) {
        f(ruleFactoryContext);
    }

    return linters;
}


