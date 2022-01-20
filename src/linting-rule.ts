import { DznLintConfiguration, DznLintUserConfiguration } from "./config/dznlint-configuration";
import { Diagnostic } from "./diagnostic";
import { InputSource } from "./dznlint";
import * as parser from "./grammar/parser";

interface LintContext {
    config: DznLintConfiguration;
    source: InputSource;
}

export type ASTNode = { kind: parser.ASTKinds };
export type Linter<T extends ASTNode> = (node: T, context: LintContext) => Diagnostic[];

export type RuleFactory = (context: RuleFactoryContext) => void;

export interface RuleFactoryContext {
    userConfig: DznLintUserConfiguration
    registerRule<TNode extends ASTNode>(kind: TNode["kind"], rule: Linter<TNode>): void;
}

import { naming_convention } from "./rules/naming-convention";

export function loadLinters(config: DznLintConfiguration) {
    const factories = [
        naming_convention
    ];

    const linters = new Map<parser.ASTKinds, Linter<ASTNode>[]>();

    const ruleFactoryContext: RuleFactoryContext = {
        userConfig: config,
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


