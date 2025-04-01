import * as util from "util";

import * as ast from "../grammar/ast";
import { ASTNode } from "../linting-rule";
import {
    findFirstParent,
    isCompoundBindingExpression,
    isCompoundName,
    isScopedBlock as isScopedBlock,
    isIdentifier,
    nameToString,
    ScopedBlock,
    isNamespace,
    isTypeReference,
    isInterfaceDefinition,
    isCallExpression,
    isAsterisk,
    assertNever,
} from "../util";
import { memoize } from "./memoize";
import { Program } from "./program";

export class SemanticSymbol {
    public constructor(
        public declaration: ASTNode,
        public name?: ast.Name
    ) {}

    static ErrorSymbol(): SemanticSymbol {
        return new SemanticSymbol({ kind: ast.SyntaxKind.ERROR, position: EMPTY_POSITION });
    }
}

const EMPTY_POSITION: ast.SourceRange = {
    from: { index: 0, column: 0, line: 1 },
    to: { index: 0, column: 0, line: 1 },
};

export enum TypeKind {
    Invalid,
    Bool,
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

const BOOL_TYPE = {
    kind: TypeKind.Bool,
    name: "bool",
} satisfies Type;

const BOOL_SYMBOL = new SemanticSymbol(null!);

const TRUE_DECLARATION: ASTNode = { kind: ast.SyntaxKind.Keyword, position: EMPTY_POSITION };
const FALSE_DECLARATION: ASTNode = { kind: ast.SyntaxKind.Keyword, position: EMPTY_POSITION };

export class TypeChecker {
    public constructor(private program: Program) {}

    public typeOfNode(node: ASTNode, typeReference = false): Type {
        if (node.kind === ast.SyntaxKind.BinaryExpression || node.kind === ast.SyntaxKind.UnaryOperatorExpression) {
            // Okay so this is definitely not true, but then again, we don't have to worry about everything else for now
            return BOOL_TYPE;
        } else if (isCallExpression(node)) {
            const functionSymbol = this.symbolOfNode(node.expression);
            if (!functionSymbol) return ERROR_TYPE;
            const functionDefinition = functionSymbol.declaration as ast.FunctionDefinition;
            return this.typeOfNode(functionDefinition.returnType);
        }
        const symbol = this.symbolOfNode(node, typeReference);
        if (!symbol) return ERROR_TYPE;
        return this.typeOfSymbol(symbol);
    }

    private symbols = new Map<ASTNode, SemanticSymbol>();

    private builtInSymbols = new Map<string, SemanticSymbol>([
        ["void", new SemanticSymbol(null!)],
        ["bool", BOOL_SYMBOL],
        ["true", new SemanticSymbol(TRUE_DECLARATION)],
        ["false", new SemanticSymbol(FALSE_DECLARATION)],
        ["reply", new SemanticSymbol(null!)],
        ["optional", new SemanticSymbol(null!)],
        ["inevitable", new SemanticSymbol(null!)],
    ]);

    public symbolOfNode(node: ASTNode, typeReference = false): SemanticSymbol | undefined {
        if (this.symbols.has(node)) return this.symbols.get(node);
        if (isTypeReference(node)) {
            typeReference = true;
            node = node.typeName;
        }

        // First check if this is a built-in type
        if (
            node.parent &&
            node.parent.kind !== ast.SyntaxKind.BindingCompoundName &&
            node.parent.kind !== ast.SyntaxKind.CompoundName &&
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
                if (symbol && (!typeReference || this.isTypeSymbol(symbol))) return symbol;

                if (isNamespace(scope)) {
                    scopeNamespaces.push(nameToString(scope.name));
                }
                scope = findFirstParent(scope, isScopedBlock);
            }
            return undefined;
        } else if (isCompoundName(node) && node.compound !== undefined) {
            const ownerType = this.typeOfNode(node.compound, typeReference);
            if (ownerType.kind === TypeKind.Invalid) return undefined;
            const ownerMembers = this.getMembersOfType(ownerType);
            return ownerMembers.get(node.name.text);
        } else if (isCompoundBindingExpression(node)) {
            const ownerType = this.typeOfNode(node.compound);
            if (ownerType.kind === TypeKind.Invalid) return undefined;
            const ownerMembers = this.getMembersOfType(ownerType);
            if (isAsterisk(node.name)) {
                // TODO: What to return here?
                return SemanticSymbol.ErrorSymbol();
            } else {
                return ownerMembers.get(node.name.text);
            }
        } else if (
            node.kind === ast.SyntaxKind.Port ||
            node.kind === ast.SyntaxKind.Event ||
            node.kind === ast.SyntaxKind.ExternDeclaration ||
            node.kind === ast.SyntaxKind.EnumDefinition ||
            node.kind === ast.SyntaxKind.Namespace ||
            node.kind === ast.SyntaxKind.Instance ||
            node.kind === ast.SyntaxKind.VariableDefinition ||
            isAsterisk(node)
        ) {
            return this.getOrCreateSymbol(node);
        } else if (node.kind === ast.SyntaxKind.OnTrigger) {
            const onTrigger = node as ast.OnTrigger;
            return this.symbolOfNode(onTrigger.name);
        } else {
            throw `I don't know how to find the symbol for node type ${ast.SyntaxKind[node.kind]} ${util.inspect(
                node
            )}`;
        }
    }

    private isTypeSymbol(symbol: SemanticSymbol) {
        return (
            symbol.declaration.kind === ast.SyntaxKind.ComponentDefinition ||
            symbol.declaration.kind === ast.SyntaxKind.EnumDefinition ||
            symbol.declaration.kind === ast.SyntaxKind.ExternDeclaration ||
            symbol.declaration.kind === ast.SyntaxKind.InterfaceDefinition ||
            symbol.declaration.kind === ast.SyntaxKind.IntDefinition ||
            symbol.declaration.kind === ast.SyntaxKind.Namespace
        );
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
        if (symbol === BOOL_SYMBOL) return BOOL_TYPE;
        if (symbol.declaration === null) return ERROR_TYPE;

        const declaration = symbol.declaration;

        if (declaration.kind === ast.SyntaxKind.ExternDeclaration) {
            const definition = declaration as ast.ExternDeclaration;
            return { kind: TypeKind.External, declaration: definition, name: definition.name.text };
        } else if (declaration.kind === ast.SyntaxKind.Instance) {
            const instance = declaration as ast.Instance;
            const typeSymbol = this.symbolOfNode(instance.type);
            if (!typeSymbol) return ERROR_TYPE;
            return this.typeOfSymbol(typeSymbol);
        } else if (symbol.declaration.kind === ast.SyntaxKind.VariableDefinition) {
            const definition = declaration as ast.VariableDefinition;
            const typeSymbol = this.symbolOfNode(definition.type);
            if (!typeSymbol) return ERROR_TYPE;
            return this.typeOfSymbol(typeSymbol);
        } else if (declaration.kind === ast.SyntaxKind.FunctionParameter) {
            const definition = declaration as ast.FunctionParameter;
            const typeSymbol = this.symbolOfNode(definition.type);
            if (!typeSymbol) return ERROR_TYPE;
            return this.typeOfSymbol(typeSymbol);
        } else if (declaration.kind === ast.SyntaxKind.EnumDefinition) {
            const definition = declaration as ast.EnumDefinition;
            return { kind: TypeKind.Enum, declaration: definition, name: definition.name.text };
        } else if (symbol.declaration.kind === ast.SyntaxKind.Port) {
            const definition = declaration as ast.Port;
            const typeSymbol = this.symbolOfNode(definition.type);
            if (!typeSymbol) return ERROR_TYPE;
            return this.typeOfSymbol(typeSymbol);
        } else if (symbol.declaration.kind === ast.SyntaxKind.Event) {
            const definition = declaration as ast.Event;
            return { kind: TypeKind.Function, declaration: symbol.declaration, name: definition.eventName.text };
        } else if (symbol.declaration.kind === ast.SyntaxKind.ComponentDefinition) {
            const definition = declaration as ast.ComponentDefinition;
            return { kind: TypeKind.Component, name: definition.name.text, declaration: definition };
        } else if (symbol.declaration.kind === ast.SyntaxKind.InterfaceDefinition) {
            const definition = declaration as ast.InterfaceDefinition;
            return { kind: TypeKind.Interface, name: definition.name.text, declaration: definition };
        } else if (symbol.declaration.kind === ast.SyntaxKind.Namespace) {
            const definition = declaration as ast.Namespace;
            if (definition.name.kind === ast.SyntaxKind.Identifier) {
                return { kind: TypeKind.Namespace, declaration: symbol.declaration, name: definition.name.text };
            } else {
                return { kind: TypeKind.Namespace, declaration: symbol.declaration, name: definition.name.name.text };
            }
        } else if (symbol.declaration.kind === ast.SyntaxKind.FunctionDefinition) {
            const definition = declaration as ast.FunctionDefinition;
            return { kind: TypeKind.Function, declaration: symbol.declaration, name: definition.name.text };
            // } else if (symbol.declaration.kind === ast.SyntaxKind.member_identifier) {
            //     if (!symbol.declaration.parent) return ERROR_TYPE;
            //     const parentType = this.typeOfNode(symbol.declaration.parent);
            //     if (parentType === ERROR_TYPE) return ERROR_TYPE;
            //     if (parentType.kind === TypeKind.Enum) return BOOL_TYPE;
            //     return ERROR_TYPE;
        } else if (symbol.declaration.kind === ast.SyntaxKind.BooleanLiteral) {
            return BOOL_TYPE;
        } else if (symbol.declaration.kind === ast.SyntaxKind.IntDefinition) {
            const definition = declaration as ast.IntDefinition;
            return { kind: TypeKind.IntegerRange, declaration: symbol.declaration, name: definition.name.text };
        } else if (symbol.declaration.kind === ast.SyntaxKind.OnParameter) {
            const definition = symbol.declaration as ast.OnParameter;
            const parentDeclaration = symbol.declaration.parent as ast.OnTrigger;
            const parentSymbol = this.symbolOfNode(parentDeclaration);
            if (!parentSymbol) return ERROR_TYPE;

            const triggerParams = parentDeclaration.parameterList?.parameters ?? [];
            const paramIndex = triggerParams.indexOf(definition);

            const event = parentSymbol.declaration as ast.Event;
            const formal = event.parameters[paramIndex];
            if (!formal) return ERROR_TYPE;

            return this.typeOfNode(formal.type);
        } else if (isAsterisk(symbol.declaration)) {
            return { kind: TypeKind.PortCollection, declaration: symbol.declaration, name: "*" };
        } else if (symbol.declaration.kind === ast.SyntaxKind.ParenthesizedExpression) {
            const parenthesizedExpression = symbol.declaration as ast.ParenthesizedExpression;
            return this.typeOfNode(parenthesizedExpression.expression);
        } else if (symbol.declaration.kind === ast.SyntaxKind.ERROR) {
            return ERROR_TYPE;
        } else {
            throw `I don't know how to find type for a symbol of kind ${
                ast.SyntaxKind[symbol.declaration.kind]
            } ${util.inspect(symbol.declaration)}`;
        }
    });

    public getMembersOfType = memoize(this, (type: Type): Map<string, SemanticSymbol> => {
        if (!type.declaration) return new Map();

        const result = new Map<string, SemanticSymbol>();

        if (type.kind === TypeKind.Enum) {
            for (const d of (type.declaration as ast.EnumDefinition).members) {
                result.set(d.text, this.getOrCreateSymbol(d));
            }
            return result;
        } else if (type.kind === TypeKind.External) {
            // empty, external types have no members (for now)
            return result;
        } else if (isScopedBlock(type.declaration)) {
            for (const [name, declaration] of this.findVariablesDeclaredInScope(type.declaration)) {
                result.set(name, this.getOrCreateSymbol(declaration));
            }

            if (isInterfaceDefinition(type.declaration)) {
                // Also add reply as a member of the interface
                result.set("reply", this.builtInSymbols.get("reply")!);

                // Also add variables delcared in the behavior as members for 2.18 shared state
                if (type.declaration.behavior) {
                    for (const statement of type.declaration.behavior.statements) {
                        if (
                            statement.kind === ast.SyntaxKind.VariableDefinition ||
                            statement.kind === ast.SyntaxKind.EnumDefinition
                        ) {
                            const symbol = this.symbolOfNode(statement);
                            if (symbol) result.set(statement.name.text, symbol);
                        }
                    }
                }
            }
        } else {
            throw `I don't know how to find members for a type of kind ${
                type.declaration && ast.SyntaxKind[type.declaration.kind]
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

        if (scope.kind === ast.SyntaxKind.System) {
            for (const instance_or_binding of scope.instancesAndBindings) {
                if (instance_or_binding.kind === ast.SyntaxKind.Instance) {
                    result.set(instance_or_binding.name.text, instance_or_binding);
                }
            }
        } else if (scope.kind === ast.SyntaxKind.Namespace) {
            for (const statement of scope.statements) {
                if (
                    statement.kind === ast.SyntaxKind.EnumDefinition ||
                    statement.kind === ast.SyntaxKind.ComponentDefinition ||
                    statement.kind === ast.SyntaxKind.InterfaceDefinition ||
                    statement.kind === ast.SyntaxKind.ExternDeclaration ||
                    statement.kind === ast.SyntaxKind.IntDefinition ||
                    statement.kind === ast.SyntaxKind.FunctionDefinition
                ) {
                    result.set(statement.name.text, statement);
                } else if (statement.kind === ast.SyntaxKind.Namespace) {
                    const name = nameToString(statement.name);
                    const currentValue = result.get(name);
                    if (currentValue !== undefined && isNamespace(currentValue)) {
                        result.set(name, this.mergeNamespaces(currentValue, statement));
                    } else {
                        result.set(name, statement);
                    }
                }
            }
        } else if (scope.kind === ast.SyntaxKind.InterfaceDefinition) {
            for (const type_or_event of scope.body) {
                const name = type_or_event.kind === ast.SyntaxKind.Event ? type_or_event.eventName : type_or_event.name;
                result.set(nameToString(name), type_or_event);
            }
        } else if (scope.kind === ast.SyntaxKind.ComponentDefinition) {
            for (const port of scope.ports) {
                result.set(port.name.text, port);
            }
        } else if (scope.kind === ast.SyntaxKind.Behavior) {
            for (const statement of scope.statements) {
                if (
                    statement.kind === ast.SyntaxKind.EnumDefinition ||
                    statement.kind === ast.SyntaxKind.FunctionDefinition ||
                    statement.kind === ast.SyntaxKind.VariableDefinition ||
                    statement.kind === ast.SyntaxKind.IntDefinition
                ) {
                    result.set(statement.name.text, statement);
                }
            }
        } else if (scope.kind === ast.SyntaxKind.Compound) {
            for (const statement of scope.statements) {
                if (statement.kind === ast.SyntaxKind.VariableDefinition) {
                    result.set(statement.name.text, statement);
                }
            }
        } else if (scope.kind === ast.SyntaxKind.FunctionDefinition) {
            for (const parameter of scope.parameters) {
                result.set(parameter.name.text, parameter);
            }
        } else if (scope.kind === ast.SyntaxKind.File) {
            for (const statement of scope.statements) {
                if (
                    statement.kind === ast.SyntaxKind.EnumDefinition ||
                    statement.kind === ast.SyntaxKind.ComponentDefinition ||
                    statement.kind === ast.SyntaxKind.InterfaceDefinition ||
                    statement.kind === ast.SyntaxKind.ExternDeclaration ||
                    statement.kind === ast.SyntaxKind.IntDefinition ||
                    statement.kind === ast.SyntaxKind.FunctionDefinition
                ) {
                    result.set(statement.name.text, statement);
                } else if (statement.kind === ast.SyntaxKind.Namespace) {
                    const name = nameToString(statement.name);
                    const currentValue = result.get(name);
                    if (currentValue !== undefined && isNamespace(currentValue)) {
                        result.set(name, this.mergeNamespaces(currentValue, statement));
                    } else {
                        result.set(name, statement);
                    }
                } else if (statement.kind === ast.SyntaxKind.ImportStatement) {
                    const currentFile = this.program.getFilePath(scope);
                    if (!currentFile) continue;
                    const resolvedFile = this.program.host.resolveImport(statement.fileName, currentFile, this.program);
                    const sourceFile = this.program.getSourceFile(resolvedFile ?? statement.fileName);
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
        } else if (scope.kind === ast.SyntaxKind.OnStatement) {
            const on = scope as ast.OnStatement;
            for (const trigger of on.triggers) {
                if (trigger.parameterList?.parameters) {
                    for (const parameter of trigger.parameterList.parameters) {
                        result.set(parameter.name.text, parameter);
                    }
                }
            }
        } else {
            assertNever(scope, "Should be able to handle all possible kinds");
        }

        return result;
    });

    private mergeNamespaces(ns1: ast.Namespace, ns2: ast.Namespace): ast.Namespace {
        return {
            kind: ast.SyntaxKind.Namespace,
            name: ns1.name,
            statements: [...ns1.statements, ...ns2.statements],
            position: ns1.position,
        };
    }
}
