import * as util from "util";

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
    isNamespace,
    isFunctionDefinition,
} from "../util";
import { memoize } from "./memoize";
import { Program } from "./program";

export class SemanticSymbol {
    public constructor(
        public declaration: ASTNode,
        public name?: parser.compound_name
    ) {}

    static ErrorSymbol(): SemanticSymbol {
        return new SemanticSymbol({ kind: parser.ASTKinds.$EOF });
    }
}

export enum TypeKind {
    Invalid,
    External,
    Enum,
    Port,
    PortCollection,
    Event,
    Interface,
    Component,
    Namespace,
    Function,
    IntegerRange,
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
    public constructor(private program: Program) {}

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
        ["reply", new SemanticSymbol(null!)],
        ["optional", new SemanticSymbol(null!)],
        ["inevitable", new SemanticSymbol(null!)],
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

        if (node.parent && isCompoundName(node.parent) && node.parent.name === node) {
            if (!node.parent.compound) return undefined;

            const parentType = this.typeOfNode(node.parent);
            return this.getMembersOfType(parentType).get(node.parent.name.text);
        }

        // Try to resolve type the hard way
        if (isIdentifier(node)) {
            let scope = findFirstParent(node, isScopedBlock);
            const scopeNamespaces = [];
            while (scope) {
                const symbol = this.findVariableInScope(node.text, scope, scopeNamespaces);
                if (symbol) return symbol;

                if (isNamespace(scope)) {
                    scopeNamespaces.push(nameToString(scope.name));
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
        } else if (
            node.kind === parser.ASTKinds.port ||
            node.kind === parser.ASTKinds.event ||
            node.kind === parser.ASTKinds.extern_definition ||
            node.kind === parser.ASTKinds.namespace ||
            node.kind === parser.ASTKinds.instance ||
            node.kind === parser.ASTKinds.variable_definition ||
            node.kind === parser.ASTKinds.asterisk_binding
        ) {
            return this.getOrCreateSymbol(node);
        } else {
            throw `I don't know how to find the symbol for node type ${parser.ASTKinds[node.kind]} ${util.inspect(
                node
            )}`;
        }
    }

    private findVariableInScope(
        name: string,
        scope: ScopedBlock,
        scopeNamespaces: string[]
    ): SemanticSymbol | undefined {
        const declaredVariables = this.findVariablesDeclaredInScope(scope);
        const variableDeclaration = declaredVariables.get(name);
        if (variableDeclaration) {
            const existingSymbol = this.symbols.get(variableDeclaration);
            if (existingSymbol) {
                return existingSymbol;
            } else {
                return this.getOrCreateSymbol(variableDeclaration);
            }
        }
        if (scopeNamespaces.length > 0) {
            const ns = declaredVariables.get(scopeNamespaces[scopeNamespaces.length - 1]);
            if (ns && isNamespace(ns)) {
                const symbol = this.findVariableInScope(name, ns, scopeNamespaces.slice(0, -1));
                if (symbol) return symbol;
            }
        }
    }

    public typeOfSymbol = memoize(this, (symbol: SemanticSymbol): Type => {
        const declaration = symbol.declaration;

        if (declaration.kind === parser.ASTKinds.instance) {
            const instance = declaration as parser.instance;
            const typeSymbol = this.symbolOfNode(instance.type);
            if (!typeSymbol) return ERROR_TYPE;
            return this.typeOfSymbol(typeSymbol);
        } else if (symbol.declaration.kind === parser.ASTKinds.variable_definition) {
            const definition = declaration as parser.variable_definition;
            const typeSymbol = this.symbolOfNode(definition.type_name);
            if (!typeSymbol) return ERROR_TYPE;
            return this.typeOfSymbol(typeSymbol);
        } else if (declaration.kind === parser.ASTKinds.enum_definition) {
            const definition = declaration as parser.enum_definition;
            return { kind: TypeKind.Enum, declaration: definition, name: definition.name.text };
        } else if (symbol.declaration.kind === parser.ASTKinds.port) {
            const definition = declaration as parser.port;
            const typeSymbol = this.symbolOfNode(definition.type);
            if (!typeSymbol) return ERROR_TYPE;
            return this.typeOfSymbol(typeSymbol);
        } else if (symbol.declaration.kind === parser.ASTKinds.event) {
            const definition = declaration as parser.event;
            const typeSymbol = this.symbolOfNode(definition.type_name);
            if (!typeSymbol) return ERROR_TYPE;
            return this.typeOfSymbol(typeSymbol);
        } else if (symbol.declaration.kind === parser.ASTKinds.component) {
            const definition = declaration as parser.component;
            return { kind: TypeKind.Component, name: definition.name.text, declaration: definition };
        } else if (symbol.declaration.kind === parser.ASTKinds.interface_definition) {
            const definition = declaration as parser.interface_definition;
            return { kind: TypeKind.Interface, name: definition.name.text, declaration: definition };
        } else if (symbol.declaration.kind === parser.ASTKinds.namespace) {
            const definition = declaration as parser.namespace;
            if (definition.name.kind === parser.ASTKinds.identifier) {
                return { kind: TypeKind.Namespace, declaration: symbol.declaration, name: definition.name.text };
            } else {
                return { kind: TypeKind.Namespace, declaration: symbol.declaration, name: definition.name.name.text };
            }
        } else if (symbol.declaration.kind === parser.ASTKinds.int) {
            const definition = declaration as parser.int;
            return { kind: TypeKind.IntegerRange, declaration: symbol.declaration, name: definition.name.text };
        } else if (symbol.declaration.kind === parser.ASTKinds.asterisk_binding) {
            return { kind: TypeKind.PortCollection, declaration: symbol.declaration, name: "*" };
        } else if (symbol.declaration.kind === parser.ASTKinds.$EOF) {
            return ERROR_TYPE;
        } else {
            throw `I don't know how to find type for a symbol of kind ${
                parser.ASTKinds[symbol.declaration.kind]
            } ${util.inspect(symbol.declaration)}`;
        }
    });

    public getMembersOfType = memoize(this, (type: Type): Map<string, SemanticSymbol> => {
        if (!type.declaration) return new Map();

        const result = new Map<string, SemanticSymbol>();

        if (type.kind === TypeKind.Enum) {
            for (const d of headTailToList((type.declaration as parser.enum_definition).fields)) {
                result.set(d.text, this.getOrCreateSymbol(d));
            }
            return result;
        } else if (isScopedBlock(type.declaration)) {
            for (const [name, declaration] of this.findVariablesDeclaredInScope(type.declaration)) {
                result.set(name, this.getOrCreateSymbol(declaration));
            }

            if (type.declaration.kind === parser.ASTKinds.interface_definition) {
                // Also add reply as a member of the interface
                result.set("reply", this.builtInSymbols.get("reply")!);

                // Also add variables delcared in the behavior as members for 2.18 shared state
                if (type.declaration.behavior) {
                    for (const { statement } of type.declaration.behavior.block.statements) {
                        if (statement.kind === parser.ASTKinds.variable_definition) {
                            const symbol = this.symbolOfNode(statement);
                            if (symbol) result.set(statement.name.text, symbol);
                        }
                    }
                }
            }
        } else {
            throw `I don't know how to find members for a type of kind ${
                type.declaration && parser.ASTKinds[type.declaration.kind]
            } ${util.inspect(type)}`;
        }

        return result;
    });

    private getOrCreateSymbol(node: ASTNode): SemanticSymbol {
        if (this.symbols.has(node)) {
            return this.symbols.get(node)!;
        } else {
            const newSymbol = new SemanticSymbol(node);
            this.symbols.set(node, newSymbol);
            return newSymbol;
        }
    }

    private findVariablesDeclaredInScope = memoize(this, (scope: ScopedBlock): Map<string, ASTNode> => {
        const result = new Map<string, ASTNode>();

        if (scope.kind === parser.ASTKinds.system) {
            for (const { instance_or_binding } of scope.instances_and_bindings) {
                if (instance_or_binding.kind === parser.ASTKinds.instance) {
                    result.set(instance_or_binding.name.text, instance_or_binding);
                }
            }
        } else if (scope.kind === parser.ASTKinds.namespace) {
            for (const { statement } of scope.root.statements) {
                if (
                    statement.kind === parser.ASTKinds.enum_definition ||
                    statement.kind === parser.ASTKinds.component ||
                    statement.kind === parser.ASTKinds.interface_definition ||
                    statement.kind === parser.ASTKinds.extern_definition ||
                    statement.kind === parser.ASTKinds.int
                ) {
                    result.set(statement.name.text, statement);
                } else if (statement.kind === parser.ASTKinds.namespace) {
                    const name = nameToString(statement.name);
                    const currentValue = result.get(name);
                    if (currentValue !== undefined && isNamespace(currentValue)) {
                        result.set(name, this.mergeNamespaces(currentValue, statement));
                    } else {
                        result.set(name, statement);
                    }
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
                    statement.kind === parser.ASTKinds.variable_definition ||
                    statement.kind === parser.ASTKinds.int
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
        } else if (scope.kind === parser.ASTKinds.function_body) {
            const functionDefinition = scope.parent as parser.function_definition;
            if (functionDefinition.parameters.parameters) {
                for (const parameter of headTailToList(functionDefinition.parameters.parameters)) {
                    result.set(parameter.name.text, parameter);
                }
            }
        } else if (scope.kind === parser.ASTKinds.file) {
            for (const { statement } of scope.statements) {
                if (
                    statement.kind === parser.ASTKinds.enum_definition ||
                    statement.kind === parser.ASTKinds.component ||
                    statement.kind === parser.ASTKinds.interface_definition ||
                    statement.kind === parser.ASTKinds.extern_definition ||
                    statement.kind === parser.ASTKinds.int
                ) {
                    result.set(statement.name.text, statement);
                } else if (statement.kind === parser.ASTKinds.namespace) {
                    const name = nameToString(statement.name);
                    const currentValue = result.get(name);
                    if (currentValue !== undefined && isNamespace(currentValue)) {
                        result.set(name, this.mergeNamespaces(currentValue, statement));
                    } else {
                        result.set(name, statement);
                    }
                } else if (statement.kind === parser.ASTKinds.import_statement) {
                    const currentFile = this.program.getFilePath(scope);
                    if (!currentFile) continue;
                    const resolvedFile = this.program.host.resolveImport(
                        statement.file_name,
                        currentFile,
                        this.program
                    );
                    const sourceFile = this.program.getSourceFile(resolvedFile ?? statement.file_name);
                    if (!sourceFile?.ast) continue;

                    for (const [name, node] of this.findVariablesDeclaredInScope(sourceFile.ast)) {
                        if (isNamespace(node)) {
                            const currentValue = result.get(name);
                            if (currentValue !== undefined && isNamespace(currentValue)) {
                                result.set(name, this.mergeNamespaces(currentValue, node));
                            } else {
                                result.set(name, node);
                            }
                        } else {
                            result.set(name, node);
                        }
                    }
                }
            }
        } else if (scope.kind === parser.ASTKinds.on_body) {
            const on = scope.parent as parser.on;
            for (const trigger of headTailToList(on.on_trigger_list)) {
                if (trigger.parameters?.parameters) {
                    for (const parameter of headTailToList(trigger.parameters.parameters)) {
                        result.set(parameter.name.text, parameter);
                    }
                }
            }
        } else {
            throw `I don't know how to find variables in scope of type ${parser.ASTKinds[scope.kind]} ${util.inspect(
                scope
            )}`;
        }

        return result;
    });

    private mergeNamespaces(ns1: parser.namespace, ns2: parser.namespace): parser.namespace {
        return {
            kind: parser.ASTKinds.namespace,
            name: ns1.name,
            root: {
                kind: parser.ASTKinds.namespace_root,
                statements: [...ns1.root.statements, ...ns2.root.statements],
            },
        };
    }
}
