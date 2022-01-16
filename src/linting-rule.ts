import { Diagnostic } from "./diagnostic.js";
import * as parser from "./grammar/parser.js";

export type ASTNode = { kind: parser.ASTKinds };
export type Linter<T extends ASTNode> = (node: T) => Diagnostic[];

export type RuleFactory = (context: RuleFactoryContext) => void;

export interface RuleFactoryContext {
    registerRule<TNode extends ASTNode>(kind: TNode["kind"], rule: Linter<TNode>): void;
}

import { naming_convention } from "./rules/naming-convention.js";

export function loadLinters() {
    const factories = [
        naming_convention
    ];

    const linters = new Map<parser.ASTKinds, Linter<ASTNode>[]>();

    const ruleFactoryContext: RuleFactoryContext = {
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


