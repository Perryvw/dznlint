import { ASTKinds, enum_definition } from "../grammar/parser";
import { ASTNode } from "../linting-rule";
import {
    findFirstParent,
    headTailToList,
    isCompoundBindingExpression,
    isCompoundName,
    isScopedBlock as isScopedBlock,
    isIdentifier,
    nameToString,
    ScopedBlock,
} from "../util";

// class Program {

// }

// enum Kind {

// }

// class Component {

// }

// class Interface {

// }

// class SourceFile {
//     public imports: SourceFile[] = [];
// }

export class SemanticSymbol {
    public constructor(public declaration: ASTNode) {}

    static ErrorSymbol(): SemanticSymbol {
        return new SemanticSymbol({ kind: ASTKinds.$EOF });
    }
}

export enum TypeKind {
    Invalid,
    External,
    EnumMember,
    Interface,
    Component,
    Function,
}

export interface Type {
    kind: TypeKind;
    name: string;
}

// interface FunctionParameter {
//     direction: "in" | "out" | "inout";
//     name: string;
//     type: Type;
// }

// interface FunctionType extends Type
// {
//     kind: TypeKind.Function;
//     parameters: FunctionParameter;
//     returnType: Type;
// }

export class TypeChecker {
    public typeOfNode(node: ASTNode): Type {
        void node;
        //const symbol = this.symbolOfNode(node);

        return { kind: TypeKind.Invalid, name: "unknown" };
    }

    private symbols = new Map<ASTNode, SemanticSymbol>();

    public symbolOfNode(node: ASTNode): SemanticSymbol | undefined {
        if (this.symbols.has(node)) return this.symbols.get(node);

        if (isIdentifier(node)) {
            let scope = findFirstParent(node, isScopedBlock);
            while (scope) {
                const declaredVariables = findVariablesDeclaredInScope(scope);
                const variableDeclaration = declaredVariables.get(node.text);
                if (variableDeclaration) {
                    const existingSymbol = this.symbols.get(variableDeclaration);
                    if (existingSymbol) {
                        return existingSymbol;
                    } else {
                        const newSymbol = new SemanticSymbol(variableDeclaration);
                        this.symbols.set(variableDeclaration, newSymbol);
                        return newSymbol;
                    }
                }
                scope = findFirstParent(scope, isScopedBlock);
            }
            return undefined;
        } else if (isCompoundName(node) && node.compound !== null) {
            const ownerSymbol = this.symbolOfNode(node.compound);
            if (ownerSymbol === undefined) return undefined;
            const ownerMembers = this.getMembersOfSymbol(ownerSymbol);
            return ownerMembers.get(node.name.text) ?? SemanticSymbol.ErrorSymbol();
        } else if (isCompoundBindingExpression(node)) {
            const ownerSymbol = this.symbolOfNode(node.compound);
            if (ownerSymbol === undefined) return undefined;
            const ownerMembers = this.getMembersOfSymbol(ownerSymbol);
            if (node.name.kind === ASTKinds.asterisk_binding) {
                // TODO: What to return here?
                return SemanticSymbol.ErrorSymbol();
            } else {
                return ownerMembers.get(node.name.text) ?? SemanticSymbol.ErrorSymbol();
            }
        } else {
            throw `I don't know how to find the symbol for node type ${ASTKinds[node.kind]}`;
        }
    }

    // public getDeclaration(type: Type): AstNode {

    // }

    // public isFunctionType(type: Type): type is FunctionType
    // {
    //     return "returnType" in type;
    // }

    public getMembersOfSymbol(symbol: SemanticSymbol): Map<string, SemanticSymbol> {
        if (symbol.declaration.kind === ASTKinds.enum_definition) {
            const result = new Map();
            for (const d of headTailToList((symbol.declaration as enum_definition).fields)) {
                result.set(d.text, new SemanticSymbol(d));
            }
            return result;
        } else {
            throw `I don't know how to find members for a symbol of type ${ASTKinds[symbol.declaration.kind]}`;
        }
    }
}

function findVariablesDeclaredInScope(scope: ScopedBlock): Map<string, ASTNode> {
    const result = new Map<string, ASTNode>();

    if (scope.kind === ASTKinds.system) {
        for (const { instance_or_binding } of scope.instances_and_bindings) {
            if (instance_or_binding.kind === ASTKinds.instance) {
                result.set(instance_or_binding.name.text, instance_or_binding);
            }
        }
    } else if (scope.kind === ASTKinds.namespace) {
        for (const { statement } of scope.root.statements) {
            if (statement.kind === ASTKinds.enum_definition) {
                result.set(statement.name.text, statement);
            }
        }
    } else if (scope.kind === ASTKinds.interface_definition) {
        for (const { type_or_event } of scope.body) {
            const name = type_or_event.kind === ASTKinds.event ? type_or_event.event_name : type_or_event.name;
            result.set(nameToString(name), type_or_event);
        }
    } else if (scope.kind === ASTKinds.component) {
        for (const { port } of scope.ports) {
            result.set(port.name.text, port);
        }
    } else if (scope.kind === ASTKinds.behavior) {
        for (const { statement } of scope.block.statements) {
            if (
                statement.kind === ASTKinds.enum_definition ||
                statement.kind === ASTKinds.function_definition ||
                statement.kind === ASTKinds.variable_definition
            ) {
                result.set(statement.name.text, statement);
            }
        }
    } else if (scope.kind === ASTKinds.compound) {
        for (const { statement } of scope.statements) {
            if (statement.kind === ASTKinds.variable_definition) {
                result.set(statement.name.text, statement);
            }
        }
    } else {
        throw `I don't know how to find variables in scope of type ${ASTKinds[scope.kind]}`;
    }

    return result;
}
