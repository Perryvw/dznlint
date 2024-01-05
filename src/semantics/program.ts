import { ASTKinds, component, enum_definition, instance, port, variable_definition } from "../grammar/parser";
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
    isPort,
} from "../util";

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
    declaration?: ASTNode;
}

const ERROR_TYPE = {
    kind: TypeKind.Invalid,
    name: "invalid type",
    declaration: null!,
} satisfies Type;

export class TypeChecker {
    public typeOfNode(node: ASTNode): Type {
        const symbol = this.symbolOfNode(node);
        if (!symbol) return ERROR_TYPE;
        return this.typeOfSymbol(symbol);
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
            const ownerType = this.typeOfNode(node.compound);
            if (ownerType.kind === TypeKind.Invalid) return undefined;
            const ownerMembers = this.getMembersOfType(ownerType);
            return ownerMembers.get(node.name.text);
        } else if (isCompoundBindingExpression(node)) {
            const ownerType = this.typeOfNode(node.compound);
            if (ownerType.kind === TypeKind.Invalid) return undefined;
            const ownerMembers = this.getMembersOfType(ownerType);
            if (node.name.kind === ASTKinds.asterisk_binding) {
                // TODO: What to return here?
                return SemanticSymbol.ErrorSymbol();
            } else {
                return ownerMembers.get(node.name.text);
            }
        } else if (isPort(node)) {
            const symbol = new SemanticSymbol(node);
            this.symbols.set(node, symbol);
            return symbol;
        } else {
            throw `I don't know how to find the symbol for node type ${ASTKinds[node.kind]}`;
        }
    }

    public typeOfSymbol(symbol: SemanticSymbol): Type {
        const declaration = symbol.declaration;
        if (declaration.kind === ASTKinds.instance) {
            const instance = declaration as instance;
            const typeSymbol = this.symbolOfNode(instance.type);
            if (!typeSymbol) return ERROR_TYPE;
            return { kind: TypeKind.Component, declaration: typeSymbol.declaration, name: nameToString(instance.type) };
        } else if (symbol.declaration.kind === ASTKinds.variable_definition) {
            const definition = declaration as variable_definition;
            const typeSymbol = this.symbolOfNode(definition.type_name);
            if (!typeSymbol) return ERROR_TYPE;
            return { kind: TypeKind.External, declaration: typeSymbol.declaration, name: definition.name.text };
        } else if (symbol.declaration.kind === ASTKinds.port) {
            const definition = declaration as port;
            const typeSymbol = this.symbolOfNode(definition.type);
            if (!typeSymbol) return ERROR_TYPE;
            return { kind: TypeKind.External, declaration: typeSymbol.declaration, name: definition.name.text };
        } else if (symbol.declaration.kind === ASTKinds.$EOF) {
            return ERROR_TYPE;
        } else {
            throw `I don't know how to find type for a symbol of kind ${ASTKinds[symbol.declaration.kind]}`;
        }
    }

    public getMembersOfType(type: Type): Map<string, SemanticSymbol> {
        if (!type.declaration) return new Map();

        const result = new Map<string, SemanticSymbol>();

        if (type.declaration.kind === ASTKinds.enum_definition) {
            for (const d of headTailToList((type.declaration as enum_definition).fields)) {
                const symbol = this.symbolOfNode(d);
                if (symbol) {
                    result.set(d.text, symbol);
                }
            }
            return result;
        } else if (type.declaration?.kind === ASTKinds.component) {
            for (const [name, declaration] of findVariablesDeclaredInScope(type.declaration as component)) {
                const symbol = this.symbolOfNode(declaration);
                if (symbol) {
                    result.set(name, symbol);
                }
            }
        } else {
            throw `I don't know how to find members for a type of kind ${
                type.declaration && ASTKinds[type.declaration.kind]
            }`;
        }

        return result;
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
    } else if (scope.kind === ASTKinds.file) {
        // TODO: imports
        for (const { statement } of scope.statements) {
            if (
                statement.kind === ASTKinds.enum_definition ||
                statement.kind === ASTKinds.component ||
                statement.kind === ASTKinds.interface_definition
            ) {
                result.set(statement.name.text, statement);
            }
        }
    } else {
        throw `I don't know how to find variables in scope of type ${ASTKinds[scope.kind]}`;
    }

    return result;
}
