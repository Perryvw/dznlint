/* eslint-disable @typescript-eslint/no-empty-object-type */

import { SourceRange } from "./source-position";
export { SourceRange } from "./source-position";

export enum SyntaxKind {
    File,
    Keyword,
    Namespace,

    // Statements
    AssignmentStatement,
    Behavior,
    Binding,
    Compound,
    ComponentDefinition,
    DeferStatement,
    EmptyStatement,
    EnumDefinition,
    Event,
    ExpressionStatement,
    ExternDeclaration,
    FunctionDefinition,
    GuardStatement,
    IfStatement,
    ImportStatement,
    Instance,
    IntDefinition,
    InterfaceDefinition,
    InvariantStatement,
    OnStatement,
    Port,
    ReturnStatement,
    System,
    VariableDefinition,

    // Expressions
    BinaryExpression,
    BindingCompoundName,
    BooleanLiteral,
    CallExpression,
    CompoundName,
    DollarLiteral,
    Identifier,
    NumericLiteral,
    ParenthesizedExpression,
    Reply,
    UnaryOperatorExpression,

    // Misc
    CallArguments,
    DeferArguments,
    EventParameter,
    FunctionParameter,
    OnParameter,
    OnTrigger,
    OnTriggerParameters,
    TypeReference,

    ERROR,
}

export interface AstNode<TKind extends SyntaxKind> {
    kind: TKind;
    position: SourceRange;
    parent?: AnyAstNode;
    errors?: Error[];
}

export interface Error extends AstNode<SyntaxKind.ERROR> {
    text: string;
}

export interface Keyword<TKind extends string> extends AstNode<SyntaxKind.Keyword> {
    text: TKind;
}
export type AnyAstNode = AstNode<SyntaxKind>;

export interface File extends AstNode<SyntaxKind.File> {
    fileName?: string;
    statements: RootStatement[];
}

export type RootStatement =
    | Namespace
    | ExternDeclaration
    | TypeDefinition
    | ImportStatement
    | InterfaceDefinition
    | ComponentDefinition
    | FunctionDefinition
    | Statement;

export type Statement = DeclarativeStatement | ImperativeStatement;

export interface Compound extends AstNode<SyntaxKind.Compound> {
    blocking?: Keyword<"blocking">;
    statements: Statement[];
}

// Declarations

export interface ImportStatement extends AstNode<SyntaxKind.ImportStatement> {
    fileName: string;
}

export type TypeDefinition = EnumDefinition | IntDefinition | ExternDeclaration;

export interface ExternDeclaration extends AstNode<SyntaxKind.ExternDeclaration> {
    name: Identifier;
    value: DollarsLiteral;
}

export interface EnumDefinition extends AstNode<SyntaxKind.EnumDefinition> {
    name: Identifier;
    members: Identifier[];
}

export interface IntDefinition extends AstNode<SyntaxKind.IntDefinition> {
    name: Identifier;
    from: number;
    to: number;
}

export type NamespaceStatement =
    | TypeDefinition
    | Namespace
    | InterfaceDefinition
    | ComponentDefinition
    | FunctionDefinition;

export interface Namespace extends AstNode<SyntaxKind.Namespace> {
    name: Name;
    statements: NamespaceStatement[];
}

export interface InterfaceDefinition extends AstNode<SyntaxKind.InterfaceDefinition> {
    name: Identifier;
    body: Array<TypeDefinition | Event>;
    behavior?: Behavior;
}

export type EventDirection = Keyword<"in"> | Keyword<"out">;
export interface EventParameter extends AstNode<SyntaxKind.EventParameter> {
    direction?: ParameterDirection;
    type: TypeReference;
    name: Name;
}
export interface Event extends AstNode<SyntaxKind.Event> {
    direction: EventDirection;
    type: TypeReference;
    name: Identifier;
    parameters: EventParameter[];
}

export interface ComponentDefinition extends AstNode<SyntaxKind.ComponentDefinition> {
    name: Identifier;
    ports: Port[];
    body?: Behavior | System;
}

export interface System extends AstNode<SyntaxKind.System> {
    instancesAndBindings: Array<Instance | Binding>;
}

export interface Instance extends AstNode<SyntaxKind.Instance> {
    type: TypeReference;
    name: Identifier;
}

export interface Binding extends AstNode<SyntaxKind.Binding> {
    left: BindingExpression;
    right: BindingExpression;
}

export type BindingExpression = Identifier | BindingCompoundName | Keyword<"*">;
export interface BindingCompoundName extends AstNode<SyntaxKind.BindingCompoundName> {
    compound: BindingExpression;
    name: Keyword<"*"> | Identifier;
}

export type PortDirection = Keyword<"provides"> | Keyword<"requires">;
export interface Port extends AstNode<SyntaxKind.Port> {
    direction: PortDirection;
    qualifiers: Array<Keyword<"external"> | Keyword<"injected"> | Keyword<"blocking">>;
    type: TypeReference;
    name: Identifier;
}

export type BehaviorStatement =
    | Port
    | FunctionDefinition
    | InvariantStatement
    | VariableDefinition
    | DeclarativeStatement
    | TypeDefinition;

export interface Behavior extends AstNode<SyntaxKind.Behavior> {
    name?: Identifier;
    statements: BehaviorStatement[];
}

export interface FunctionDefinition extends AstNode<SyntaxKind.FunctionDefinition> {
    returnType: TypeReference;
    name: Identifier;
    parameters: FunctionParameter[];
    body: Compound | Expression;
}

export type ParameterDirection = Keyword<"in"> | Keyword<"out">;
export interface FunctionParameter extends AstNode<SyntaxKind.FunctionParameter> {
    direction?: ParameterDirection;
    type: TypeReference;
    name: Identifier;
}

// Declarative statements

export type DeclarativeStatement = OnStatement | GuardStatement | InvariantStatement | Compound;

export interface OnParameter extends AstNode<SyntaxKind.OnParameter> {
    name: Identifier;
    assignment?: Identifier; // port.event(parameter <- assignment)
}

export interface OnTriggerParameters extends AstNode<SyntaxKind.OnTriggerParameters> {
    parameters: OnParameter[];
}

export type OnTrigger = Keyword<"optional"> | Keyword<"inevitable"> | OnPortTrigger;
export interface OnPortTrigger extends AstNode<SyntaxKind.OnTrigger> {
    name: Name;
    parameterList?: OnTriggerParameters;
}

export interface OnStatement extends AstNode<SyntaxKind.OnStatement> {
    blocking?: Keyword<"blocking">;
    triggers: OnTrigger[];
    body: Statement;
}

export interface GuardStatement extends AstNode<SyntaxKind.GuardStatement> {
    blocking?: Keyword<"blocking">;
    condition: Keyword<"otherwise"> | Expression | Error;
    statement: Statement;
}

export interface InvariantStatement extends AstNode<SyntaxKind.InvariantStatement> {
    expression: Expression;
}

// Statements

export type ImperativeStatement =
    | IfStatement
    | ReturnStatement
    | VariableDefinition
    | AssignmentStatement
    | DeferStatement
    | EmptyStatement
    | ExpressionStatement
    | Compound;

export interface AssignmentStatement extends AstNode<SyntaxKind.AssignmentStatement> {
    left: Name;
    right: Expression;
}

export interface DeferArguments extends AstNode<SyntaxKind.DeferArguments> {
    arguments: Expression[];
}

export interface DeferStatement extends AstNode<SyntaxKind.DeferStatement> {
    arguments?: DeferArguments;
    statement: ImperativeStatement;
}

export interface EmptyStatement extends AstNode<SyntaxKind.EmptyStatement> {}

export interface ExpressionStatement extends AstNode<SyntaxKind.ExpressionStatement> {
    expression: Expression;
}

export interface IfStatement extends AstNode<SyntaxKind.IfStatement> {
    condition: Expression;
    statement: ImperativeStatement;
    else?: ImperativeStatement;
}

export interface ReturnStatement extends AstNode<SyntaxKind.ReturnStatement> {
    returnValue?: Expression;
}

export interface VariableDefinition extends AstNode<SyntaxKind.VariableDefinition> {
    type: TypeReference;
    name: Identifier;
    initializer?: Expression;
}

// Expressions

export type Expression = UnaryExpression | BinaryExpression | Error;
export type UnaryExpression =
    | ParenthesizedExpression
    | CallExpression
    | DollarsLiteral
    | Name
    | BooleanLiteral
    | NumericLiteral
    | Reply
    | UnaryOperatorExpression
    | Keyword<"illegal">
    | Keyword<"otherwise">;

export type BinaryOperator =
    | Keyword<"&&">
    | Keyword<"||">
    | Keyword<"==">
    | Keyword<"!=">
    | Keyword<"<=">
    | Keyword<"<">
    | Keyword<">=">
    | Keyword<">">
    | Keyword<"+">
    | Keyword<"-">
    | Keyword<"=>">;

export interface BinaryExpression extends AstNode<SyntaxKind.BinaryExpression> {
    left: Expression;
    operator: BinaryOperator;
    right: Expression;
}

export interface ParenthesizedExpression extends AstNode<SyntaxKind.ParenthesizedExpression> {
    expression: Expression;
}

export interface DollarsLiteral extends AstNode<SyntaxKind.DollarLiteral> {
    text: string;
}

export interface Identifier extends AstNode<SyntaxKind.Identifier> {
    text: string;
}

export interface CallArguments extends AstNode<SyntaxKind.CallArguments> {
    arguments: Expression[];
}

export interface CallExpression extends AstNode<SyntaxKind.CallExpression> {
    expression: Expression;
    arguments: CallArguments;
}

export interface CompoundName extends AstNode<SyntaxKind.CompoundName> {
    compound?: CompoundName | Identifier;
    name: Identifier;
}

export interface BooleanLiteral extends AstNode<SyntaxKind.BooleanLiteral> {
    value: boolean;
}

export interface NumericLiteral extends AstNode<SyntaxKind.NumericLiteral> {
    value: number;
}

export interface Reply extends AstNode<SyntaxKind.Reply> {
    port?: Identifier;
    value?: Expression;
}

export type UnaryOperator = Keyword<"!"> | Keyword<"-">;

export interface UnaryOperatorExpression extends AstNode<SyntaxKind.UnaryOperatorExpression> {
    operator: UnaryOperator;
    expression: Expression;
}

// Misc

export type Name = Identifier | CompoundName;

export interface TypeReference extends AstNode<SyntaxKind.TypeReference> {
    typeName: Name;
}
