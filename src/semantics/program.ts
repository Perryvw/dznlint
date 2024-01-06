import * as parser from "../grammar/parser";
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
import { memoize } from "./memoize";

export class SemanticSymbol {
    public constructor(public declaration: ASTNode) {}

    static ErrorSymbol(): SemanticSymbol {
        return new SemanticSymbol({ kind: parser.ASTKinds.$EOF });
    }
}

export enum TypeKind {
    Invalid,
    External,
    EnumMember,
    Port,
    Event,
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

    private builtInSymbols = new Map<string, SemanticSymbol>([
        ["void", new SemanticSymbol(null!)],
        ["bool", new SemanticSymbol(null!)],
        ["true", new SemanticSymbol(null!)],
        ["false", new SemanticSymbol(null!)],
    ]);

    public symbolOfNode(node: ASTNode): SemanticSymbol | undefined {
        if (this.symbols.has(node)) return this.symbols.get(node);

        // First check if this is a built-in type
        if (
            node.parent &&
            node.parent.kind !== parser.ASTKinds.binding_expression_$0 &&
            node.parent.kind !== parser.ASTKinds.compound_name_$0 &&
            isIdentifier(node)
        ) {
            const builtInType = this.builtInSymbols.get(node.text);
            if (builtInType) return builtInType;
        }

        // Try to resolve type the hard way
        if (isIdentifier(node)) {
            let scope = findFirstParent(node, isScopedBlock);
            while (scope) {
                const declaredVariables = this.findVariablesDeclaredInScope(scope);
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
            if (node.name.kind === parser.ASTKinds.asterisk_binding) {
                // TODO: What to return here?
                return SemanticSymbol.ErrorSymbol();
            } else {
                return ownerMembers.get(node.name.text);
            }
        } else if (node.kind === parser.ASTKinds.port || node.kind === parser.ASTKinds.event) {
            const symbol = new SemanticSymbol(node);
            this.symbols.set(node, symbol);
            return symbol;
        } else {
            throw `I don't know how to find the symbol for node type ${parser.ASTKinds[node.kind]}`;
        }
    }

    @memoize
    public typeOfSymbol(symbol: SemanticSymbol): Type {
        const declaration = symbol.declaration;
        if (declaration.kind === parser.ASTKinds.instance) {
            const instance = declaration as parser.instance;
            const typeSymbol = this.symbolOfNode(instance.type);
            if (!typeSymbol) return ERROR_TYPE;
            return { kind: TypeKind.Component, declaration: typeSymbol.declaration, name: nameToString(instance.type) };
        } else if (symbol.declaration.kind === parser.ASTKinds.variable_definition) {
            const definition = declaration as parser.variable_definition;
            const typeSymbol = this.symbolOfNode(definition.type_name);
            if (!typeSymbol) return ERROR_TYPE;
            return { kind: TypeKind.External, declaration: typeSymbol.declaration, name: definition.name.text };
        } else if (symbol.declaration.kind === parser.ASTKinds.port) {
            const definition = declaration as parser.port;
            return { kind: TypeKind.Port, declaration: symbol.declaration, name: definition.name.text };
        } else if (symbol.declaration.kind === parser.ASTKinds.event) {
            const definition = declaration as parser.event;
            return { kind: TypeKind.Event, declaration: symbol.declaration, name: definition.event_name.text };
        } else if (symbol.declaration.kind === parser.ASTKinds.$EOF) {
            return ERROR_TYPE;
        } else {
            throw `I don't know how to find type for a symbol of kind ${parser.ASTKinds[symbol.declaration.kind]}`;
        }
    }

    @memoize
    public getMembersOfType(type: Type): Map<string, SemanticSymbol> {
        if (!type.declaration) return new Map();

        const result = new Map<string, SemanticSymbol>();

        if (type.kind === TypeKind.EnumMember) {
            for (const d of headTailToList((type.declaration as parser.enum_definition).fields)) {
                const symbol = this.symbolOfNode(d);
                if (symbol) {
                    result.set(d.text, symbol);
                }
            }
            return result;
        } else if (type.kind === TypeKind.Port) {
            const declaration = type.declaration as parser.port;
            const portType = this.symbolOfNode(declaration.type);
            if (portType?.declaration) {
                for (const [name, event] of this.findVariablesDeclaredInScope(
                    portType.declaration as parser.interface_definition
                )) {
                    const symbol = this.symbolOfNode(event);
                    if (symbol) {
                        result.set(name, symbol);
                    }
                }
            }
        } else if (isScopedBlock(type.declaration)) {
            for (const [name, declaration] of this.findVariablesDeclaredInScope(type.declaration)) {
                const symbol = this.symbolOfNode(declaration);
                if (symbol) {
                    result.set(name, symbol);
                }
            }
        } else {
            throw `I don't know how to find members for a type of kind ${
                type.declaration && parser.ASTKinds[type.declaration.kind]
            }`;
        }

        return result;
    }

    @memoize
    private findVariablesDeclaredInScope(scope: ScopedBlock): Map<string, ASTNode> {
        const result = new Map<string, ASTNode>();

        if (scope.kind === parser.ASTKinds.system) {
            for (const { instance_or_binding } of scope.instances_and_bindings) {
                if (instance_or_binding.kind === parser.ASTKinds.instance) {
                    result.set(instance_or_binding.name.text, instance_or_binding);
                }
            }
        } else if (scope.kind === parser.ASTKinds.namespace) {
            for (const { statement } of scope.root.statements) {
                if (statement.kind === parser.ASTKinds.enum_definition) {
                    result.set(statement.name.text, statement);
                }
            }
        } else if (scope.kind === parser.ASTKinds.interface_definition) {
            for (const { type_or_event } of scope.body) {
                const name =
                    type_or_event.kind === parser.ASTKinds.event ? type_or_event.event_name : type_or_event.name;
                result.set(nameToString(name), type_or_event);
            }
        } else if (scope.kind === parser.ASTKinds.component) {
            for (const { port } of scope.ports) {
                result.set(port.name.text, port);
            }
        } else if (scope.kind === parser.ASTKinds.behavior) {
            for (const { statement } of scope.block.statements) {
                if (
                    statement.kind === parser.ASTKinds.enum_definition ||
                    statement.kind === parser.ASTKinds.function_definition ||
                    statement.kind === parser.ASTKinds.variable_definition
                ) {
                    result.set(statement.name.text, statement);
                }
            }
        } else if (scope.kind === parser.ASTKinds.compound) {
            for (const { statement } of scope.statements) {
                if (statement.kind === parser.ASTKinds.variable_definition) {
                    result.set(statement.name.text, statement);
                }
            }
        } else if (scope.kind === parser.ASTKinds.function_definition) {
            if (scope.parameters.parameters) {
                for (const parameter of headTailToList(scope.parameters.parameters)) {
                    result.set(parameter.name.text, parameter);
                }
            }
        } else if (scope.kind === parser.ASTKinds.file) {
            // TODO: imports
            for (const { statement } of scope.statements) {
                if (
                    statement.kind === parser.ASTKinds.enum_definition ||
                    statement.kind === parser.ASTKinds.component ||
                    statement.kind === parser.ASTKinds.interface_definition ||
                    statement.kind === parser.ASTKinds.extern_definition
                ) {
                    result.set(statement.name.text, statement);
                }
            }
        } else {
            throw `I don't know how to find variables in scope of type ${parser.ASTKinds[scope.kind]}`;
        }

        return result;
    }
}
