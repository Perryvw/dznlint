import * as util from "util";

import * as ast from "../grammar/ast";
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
    isKeyword,
    isChildOf,
    isFunctionDefinition,
    isErrorNode,
    isEvent,
    isUnaryOperatorExpression,
    isBinaryExpression,
    isParenthesizedExpression,
    isVoidKeyword,
    isSourceFile,
} from "../util";
import { memoize } from "./memoize";
import { Program } from "./program";
import { SourceRange } from "../grammar/source-position";

export class SemanticSymbol {
    public constructor(
        public declaration: ast.AnyAstNode,
        public name?: ast.Name
    ) {}

    static ErrorSymbol(): SemanticSymbol {
        return new SemanticSymbol({ kind: ast.SyntaxKind.ERROR, position: EMPTY_POSITION });
    }
}

const EMPTY_POSITION: SourceRange = {
    from: { index: 0, column: 0, line: 1 },
    to: { index: 0, column: 0, line: 1 },
};

export enum TypeKind {
    Invalid,
    Void,
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
    Integer,
}

export interface Type {
    kind: TypeKind;
    name: string;
    declaration?: ast.AnyAstNode;
}

export const ERROR_TYPE = {
    kind: TypeKind.Invalid,
    name: "invalid type",
    declaration: null!,
} satisfies Type;

export const VOID_TYPE = {
    kind: TypeKind.Void,
    name: "void",
} satisfies Type;

export const BOOL_TYPE = {
    kind: TypeKind.Bool,
    name: "bool",
} satisfies Type;

export const INTEGER_TYPE = {
    kind: TypeKind.Integer,
    name: "integer",
} satisfies Type;

const VOID_DECLARATION: ast.Keyword<"void"> = { kind: ast.SyntaxKind.Keyword, position: EMPTY_POSITION, text: "void" };
const BOOL_DECLARATION: ast.Keyword<"bool"> = { kind: ast.SyntaxKind.Keyword, position: EMPTY_POSITION, text: "bool" };
const TRUE_DECLARATION: ast.BooleanLiteral = {
    kind: ast.SyntaxKind.BooleanLiteral,
    position: EMPTY_POSITION,
    value: true,
};
const FALSE_DECLARATION: ast.BooleanLiteral = {
    kind: ast.SyntaxKind.BooleanLiteral,
    position: EMPTY_POSITION,
    value: false,
};
const REPLY_DECLARATION: ast.Keyword<"reply"> = {
    kind: ast.SyntaxKind.Keyword,
    position: EMPTY_POSITION,
    text: "reply",
};
const OPTIONAL_DECLARATION: ast.Keyword<"optional"> = {
    kind: ast.SyntaxKind.Keyword,
    position: EMPTY_POSITION,
    text: "optional",
};
const INEVITABLE_DECLARATION: ast.Keyword<"inevitable"> = {
    kind: ast.SyntaxKind.Keyword,
    position: EMPTY_POSITION,
    text: "inevitable",
};

const VOID_SYMBOL = new SemanticSymbol(VOID_DECLARATION);
const BOOL_SYMBOL = new SemanticSymbol(BOOL_DECLARATION);
const TRUE_SYMBOL = new SemanticSymbol(TRUE_DECLARATION);
const FALSE_SYMBOL = new SemanticSymbol(FALSE_DECLARATION);

export class TypeChecker {
    public constructor(private program: Program) {}

    public typeOfNode(node: ast.AnyAstNode, typeReference = false): Type {
        if (isParenthesizedExpression(node)) return this.typeOfNode(node.expression);

        if (isBinaryExpression(node)) {
            switch (node.operator.text) {
                case "==":
                case "!=":
                case "&&":
                case "||":
                case "=>":
                case "<":
                case "<=":
                case ">":
                case ">=":
                    return BOOL_TYPE;
                case "+":
                case "-":
                    return INTEGER_TYPE;
                default:
                    assertNever(node.operator, `Unknown operator type ${node.operator}`);
            }
        } else if (isUnaryOperatorExpression(node)) {
            // Assume the unary expression results in the same type as the type of the operand
            return this.typeOfNode(node.expression);
        } else if (isCallExpression(node)) {
            const calledSymbol = this.symbolOfNode(node.expression);
            if (!calledSymbol) return ERROR_TYPE;

            if (isFunctionDefinition(calledSymbol.declaration)) {
                return this.typeOfNode(calledSymbol.declaration.returnType);
            } else if (isEvent(calledSymbol.declaration)) {
                return this.typeOfNode(calledSymbol.declaration.type);
            }
            return ERROR_TYPE;
        } else if (isVoidKeyword(node)) {
            return VOID_TYPE;
        } else if (node.kind === ast.SyntaxKind.NumericLiteral) {
            return INTEGER_TYPE;
        }
        const symbol = this.symbolOfNode(node, typeReference);
        if (!symbol) return ERROR_TYPE;
        return this.typeOfSymbol(symbol);
    }

    private symbols = new Map<ast.AnyAstNode, SemanticSymbol>();

    private builtInSymbols = new Map<string, SemanticSymbol>([
        ["void", VOID_SYMBOL],
        ["bool", BOOL_SYMBOL],
        ["reply", new SemanticSymbol(REPLY_DECLARATION)],
        ["optional", new SemanticSymbol(OPTIONAL_DECLARATION)],
        ["inevitable", new SemanticSymbol(INEVITABLE_DECLARATION)],
    ]);

    private resolveNameInScopeTree(
        name: string,
        leafScope: ScopedBlock,
        typeReference: boolean
    ): SemanticSymbol | undefined {
        let scope: ScopedBlock | undefined = leafScope;
        const scopeNamespaces = [];
        while (scope) {
            const symbol = this.findVariableInScope(name, scope, scopeNamespaces);
            if (symbol && (!typeReference || this.isTypeSymbol(symbol))) return symbol;

            if (isNamespace(scope)) {
                scopeNamespaces.push(nameToString(scope.name));
            }
            scope = findFirstParent(scope, isScopedBlock);
        }
        return undefined;
    }

    public symbolOfNode(node: ast.AnyAstNode, typeReference = false): SemanticSymbol | undefined {
        if (this.symbols.has(node)) return this.symbols.get(node);
        if (isTypeReference(node)) {
            typeReference = true;
            node = node.typeName;
        }
        if (isErrorNode(node)) return undefined;

        // First check if this is a built-in type
        if (
            (node.parent &&
                node.parent.kind !== ast.SyntaxKind.BindingCompoundName &&
                node.parent.kind !== ast.SyntaxKind.CompoundName &&
                isIdentifier(node)) ||
            isKeyword(node)
        ) {
            const builtInType = this.builtInSymbols.get(node.text);
            if (builtInType) return builtInType;
        }

        if (
            node.parent &&
            (isCompoundName(node.parent) || isCompoundBindingExpression(node.parent)) &&
            node.parent.name === node
        ) {
            if (!node.parent.compound) return undefined;

            const parentType = this.typeOfNode(node.parent.compound);
            return this.getMembersOfType(parentType).get(node.parent.name.text);
        }

        // Try to resolve type the hard way
        if (isIdentifier(node)) {
            let scope = findFirstParent(node, isScopedBlock);
            if (!scope) return undefined;
            // To avoid resolving variables in on expressions to the parameters in the on triggers,
            // check if node is part of the body of the on statement, if not, move on to the next scope
            if (scope.kind === ast.SyntaxKind.OnStatement && !isChildOf(node, scope.body)) {
                scope = findFirstParent(scope, isScopedBlock);
            }
            if (!scope) return undefined;
            return this.resolveNameInScopeTree(node.text, scope, typeReference);
        } else if (isCompoundName(node)) {
            if (node.compound !== undefined) {
                const ownerSymbol = this.symbolOfNode(node.compound);
                const ownerType = this.typeOfNode(node.compound, typeReference);
                if (ownerType.kind === TypeKind.Invalid) return undefined;
                const ownerMembers = this.getMembersOfType(ownerType);
                const memberSymbol = ownerMembers.get(node.name.text);
                if (!memberSymbol) return undefined;
                if (ownerSymbol?.declaration.kind === ast.SyntaxKind.EnumDefinition) return ownerSymbol;
                else if (ownerType.kind === TypeKind.Enum) return BOOL_SYMBOL; // enum to bool coersion
                return memberSymbol;
            } else {
                // .<name>, look up name in global scope
                const sourceFile = findFirstParent(node, isSourceFile);
                if (!sourceFile) throw `Unexpectedly found a node without SourceFile parent`;
                return this.resolveNameInScopeTree(node.name.text, sourceFile, typeReference);
            }
        } else if (isParenthesizedExpression(node)) {
            return this.symbolOfNode(node.expression);
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
        } else if (node.kind === ast.SyntaxKind.BooleanLiteral) {
            const bool = node as ast.BooleanLiteral;
            return bool.value ? TRUE_SYMBOL : FALSE_SYMBOL;
        } else if (
            node.kind === ast.SyntaxKind.Port ||
            node.kind === ast.SyntaxKind.Event ||
            node.kind === ast.SyntaxKind.EventParameter ||
            node.kind === ast.SyntaxKind.ExternDeclaration ||
            node.kind === ast.SyntaxKind.EnumDefinition ||
            node.kind === ast.SyntaxKind.FunctionParameter ||
            node.kind === ast.SyntaxKind.Namespace ||
            node.kind === ast.SyntaxKind.Instance ||
            node.kind === ast.SyntaxKind.VariableDefinition ||
            node.kind === ast.SyntaxKind.NumericLiteral ||
            isAsterisk(node)
        ) {
            return this.getOrCreateSymbol(node);
        } else if (node.kind === ast.SyntaxKind.OnTrigger) {
            const onTrigger = node as ast.OnTrigger;
            if (isKeyword(onTrigger) || isErrorNode(onTrigger)) return SemanticSymbol.ErrorSymbol(); // Optional and inevitable don't have symbols
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

    public resolveNameInScope(name: string, scope: ScopedBlock): SemanticSymbol | undefined {
        const parts = name.split(".");
        let symbol = this.resolveNameInScopeTree(parts[0], scope, false);
        let i = 1;
        while (symbol && i < parts.length) {
            const ownerType = this.typeOfSymbol(symbol);
            if (ownerType.kind === TypeKind.Invalid) return undefined;
            const ownerMembers = this.getMembersOfType(ownerType);
            symbol = ownerMembers.get(parts[i]);
            i++;
        }
        return symbol;
    }

    public typeOfSymbol = memoize(this, (symbol: SemanticSymbol): Type => {
        if (symbol === BOOL_SYMBOL) return BOOL_TYPE;
        if (symbol === VOID_SYMBOL) return VOID_TYPE;
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
        } else if (declaration.kind === ast.SyntaxKind.EventParameter) {
            const definition = declaration as ast.EventParameter;
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
            return { kind: TypeKind.Event, declaration: symbol.declaration, name: definition.name.text };
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
        } else if (symbol.declaration.kind === ast.SyntaxKind.BooleanLiteral) {
            return BOOL_TYPE;
        } else if (symbol.declaration.kind === ast.SyntaxKind.IntDefinition) {
            const definition = declaration as ast.IntDefinition;
            return { kind: TypeKind.IntegerRange, declaration: symbol.declaration, name: definition.name.text };
        } else if (symbol.declaration.kind === ast.SyntaxKind.OnParameter) {
            const definition = symbol.declaration as ast.OnParameter;
            const parentDeclaration = symbol.declaration.parent as ast.OnTrigger;
            if (isKeyword(parentDeclaration) || isErrorNode(parentDeclaration)) return ERROR_TYPE; // optional or inevitable don't have a type
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
        if (type === ERROR_TYPE) return new Map();

        const result = new Map<string, SemanticSymbol>();

        if (type.kind === TypeKind.Enum) {
            for (const d of (type.declaration as ast.EnumDefinition).members) {
                result.set(d.text, this.getOrCreateSymbol(d));
            }
            return result;
        } else if (type.kind === TypeKind.External) {
            // empty, external types have no members (for now)
            return result;
        } else if (type.kind === TypeKind.Event) {
            // empty, events have no members
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

    private getOrCreateSymbol(node: ast.AnyAstNode): SemanticSymbol {
        if (this.symbols.has(node)) {
            return this.symbols.get(node)!;
        } else {
            const newSymbol = new SemanticSymbol(node);
            this.symbols.set(node, newSymbol);
            return newSymbol;
        }
    }

    public findVariablesDeclaredInScope = memoize(this, (scope: ScopedBlock): Map<string, ast.AnyAstNode> => {
        const result = new Map<string, ast.AnyAstNode>();

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
                const name = type_or_event.kind === ast.SyntaxKind.Event ? type_or_event.name : type_or_event.name;
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
            // Also add reply as a variable defined inside the on
            result.set("reply", this.builtInSymbols.get("reply")!.declaration);

            const on = scope as ast.OnStatement;
            for (const trigger of on.triggers) {
                if (!isKeyword(trigger) && !isErrorNode(trigger) && trigger.parameterList?.parameters) {
                    for (const parameter of trigger.parameterList.parameters) {
                        result.set(parameter.name.text, parameter);
                    }
                }
            }
        } else if (scope.kind === ast.SyntaxKind.IfStatement || scope.kind === ast.SyntaxKind.GuardStatement) {
            return new Map();
        } else {
            assertNever(scope, "Should be able to handle all possible kinds finding variables in scope");
        }

        return result;
    });

    public findAllVariablesKnownInScope = memoize(this, (scope: ScopedBlock): Map<string, ast.AnyAstNode> => {
        const result = new Map<string, ast.AnyAstNode>();

        const collectVariablesInScope = (scope: ScopedBlock, namespaceStack: string[]) => {
            const declaredVariables = this.findVariablesDeclaredInScope(scope);
            for (const [name, declaration] of declaredVariables) {
                result.set(name, declaration);
            }

            if (namespaceStack.length > 0) {
                const nestedNamespace = declaredVariables.get(namespaceStack[0]);
                if (nestedNamespace && isNamespace(nestedNamespace)) {
                    collectVariablesInScope(nestedNamespace, namespaceStack.slice(1));
                }
            }
        };

        let currentScope: ast.AnyAstNode | undefined = scope;
        const namespaceStack: string[] = [];
        while (currentScope) {
            if (isScopedBlock(currentScope)) {
                // Collect variables from current scope and nested known namespaces
                collectVariablesInScope(currentScope, namespaceStack);

                // If current scope is a namespace, add it to the known scope stack (at the beginning)
                if (isNamespace(currentScope)) {
                    if (!isIdentifier(currentScope.name)) {
                        throw `This namespace node has not corretly been desugared! Namespaces with compound names should be desugared into multiple nested namespaces with identifier names`;
                    }

                    namespaceStack.unshift(currentScope.name.text);
                }
            }
            currentScope = currentScope.parent;
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
