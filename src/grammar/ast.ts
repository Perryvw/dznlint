// WIP: Custom AST
export enum SyntaxKind {
    Keyword,
    SingleLineComment,
    MultiLineComment,

    // Statements
    Compound,
    ComponentDeclaration,
    InterfaceDeclaration,
    ExternDeclaration,
    Event,
    VariableDeclaration,
    FunctionDefinition,

    // Expressions
    CompoundName,
    DollarLiteral,
    Identifier,
    CallExpression,

    // Misc
    FunctionParameter,
    CallArguments,
    TypeReference
}

// TODO: Duplicate definition with diagnostic.ts, unify
export interface SourcePosition {
    index: number;
    line: number;
    column: number;
}

export interface SourceRange {
    from: SourcePosition;
    to: SourcePosition;
}

export interface AstNode<TKind extends SyntaxKind | string> {
    kind: TKind;
    position: SourceRange;
    parent?: AnyAstNode;
}
export interface Keyword<TKind extends string> extends AstNode<SyntaxKind.Keyword> {
    name: TKind;
}
export type AnyAstNode = AstNode<SyntaxKind | string>;

export type DznFile = RootStatement[];
export type RootStatement = Namespace | ExternDefinition | TypeDefinition | ImportStatement
    | InterfaceDefinition | ComponentDefinition | FunctionDefinition | Statement
    | SingleLineComment | MultiLineComment;

export type Statement = DeclarativeStatement | ImperativeStatement;

export interface SingleLineComment extends AstNode<SyntaxKind.SingleLineComment> {
    text: string;
}

export interface MultiLineComment extends AstNode<SyntaxKind.MultiLineComment> {
    text: string;
}

export interface Compound extends AstNode<SyntaxKind.Compound> {
    statements: Statement[];
}

// Declarations

export interface ImportStatement extends AstNode<"import_statement"> {
    file: string;
}

export type TypeDefinition = EnumDefinition | IntDefinition | ExternDefinition;

export interface EnumDefinition extends AstNode<"enum_definition"> {
    name: Identifier;
    members: Identifier[];
}

export interface IntDefinition extends AstNode<"int_definition"> {
    name: Identifier;
    from: number;
    to: number;
}

export interface ExternDefinition extends AstNode<SyntaxKind.ExternDeclaration> {
    name: Identifier;
    value: DollarsLiteral;
}

type NamespaceStatement = TypeDefinition | Namespace | InterfaceDefinition | ComponentDefinition
    | FunctionDefinition;

export interface Namespace extends AstNode<"namespace"> {
    name: Name;
    statements: NamespaceStatement[];
}

export interface InterfaceDefinition extends AstNode<SyntaxKind.InterfaceDeclaration> {
    name: Identifier;
    body: Array<TypeDefinition | Event>;
    behavior?: Compound;
}

export type EventDirection = Keyword<"in"> | Keyword<"out">; 
export interface EventParameter extends AstNode<"event_parameter"> {
    direction?: string;
    type: Identifier;
    name: Name;
}
export interface Event extends AstNode<SyntaxKind.Event> {
    direction: EventDirection;
    type: TypeReference;
    eventName: Identifier;
    parameters: EventParameter[];
}

export interface ComponentDefinition extends AstNode<SyntaxKind.ComponentDeclaration> {
    name: Identifier;
    ports: Port[];
    body: Behavior | System;
}

export interface System extends AstNode<"system"> {
    instancesAndBindings: Array<Instance | Binding>;
}

export interface Instance extends AstNode<"instance"> {
    type: TypeReference;
    name: Identifier;
}

export interface Binding extends AstNode<"binding"> {
    left: BindingExpression;
    right: BindingExpression;
}

export interface BindingExpression extends AstNode<"binding_expression"> {
    compound: Name;
    name: Keyword<"*"> | Identifier;
}

export type PortDirection = Keyword<"provides"> | Keyword<"requires">;
export interface Port extends AstNode<"port"> {
    direction: PortDirection;
    qualifiers: Array<Keyword<"external"> | Keyword<"injected"> | Keyword<"blocking">>;
    name: Identifier;
}

type BehaviorStatement = Port | FunctionDefinition | InvariantStatement | VariableDefinition | DeclarativeStatement | TypeDefinition | SingleLineComment | MultiLineComment

export interface Behavior extends AstNode<"behavior"> {
    name?: Identifier;
    statements: BehaviorStatement[];
}

export interface FunctionDefinition extends AstNode<SyntaxKind.FunctionDefinition> {
    name: Identifier;
    parameters: FunctionParameter[];
    body?: Compound;
}

export interface FunctionParameter extends AstNode<SyntaxKind.FunctionParameter> {
    type: Name;
    name: Identifier;
}

// Declarative statements

type DeclarativeStatement = OnStatement | GuardStatement | InvariantStatement | Compound;

export interface OnParameter extends AstNode<"on_parameter"> {
    name: Identifier;
    assignment?: Identifier; // port.event(parameter <- assignment)
}

export interface OnTrigger extends AstNode<"on_trigger"> {
    trigger: CompoundName;
    parameters: Identifier;
}

export interface OnStatement extends AstNode<"on"> {
    blocking?: Keyword<"blocking">;
    triggers: OnTrigger[];
    body: Statement;
}

export interface GuardStatement extends AstNode<"guard"> {
    blocking?: Keyword<"blocking">;
    condition?: Keyword<"otherwise"> | Expression;
    statement: Statement;
}

export interface InvariantStatement extends AstNode<"invariant"> {
    invariant: Keyword<"invariant">;
    expression: Expression;
}

// Statements

export type ImperativeStatement = IfStatement | ReturnStatement | VariableDefinition 
    | AssignmentStatement | DeferStatement | ExpressionStatement | Compound;

export interface AssignmentStatement extends AstNode<"assignment_statement">{
    left: Identifier;
    right: Expression;
}

export interface DeferStatement extends AstNode<"defer_statement"> {
    arguments: Expression[];
    statement: ImperativeStatement;
}

export interface ExpressionStatement extends AstNode<"expression_statement"> {
    expression: Expression;
}

export interface IfStatement extends AstNode<"if_statement"> {
    condition: Expression;
    statement: ImperativeStatement;
    else?: ImperativeStatement;
}

export interface ReturnStatement extends AstNode<"return_statement"> {
    returnValue?: Expression;
}

export interface VariableDefinition extends AstNode<SyntaxKind.VariableDeclaration> {
    type: TypeReference;
    name: Identifier;
    initializer?: Expression;
}

// Expressions

export type Expression = UnaryExpression | BinaryExpression;
export type UnaryExpression = ParenthesizedExpression | CallExpression | DollarsLiteral 
    | Keyword<"illegal"> | Name | NumericLiteral | UnaryOperatorExpression;

type BinaryOperator = Keyword<"&&"> | Keyword<"||"> | Keyword<"=="> | Keyword<"!="> | Keyword<"<=">
    | Keyword<"<"> | Keyword<">="> | Keyword<">"> | Keyword<"+"> | Keyword<"-"> | Keyword<"=>">;

export interface BinaryExpression extends AstNode<"binary_expression"> {
    left: UnaryExpression;
    operator: BinaryOperator;
    right: Expression;
}

export interface ParenthesizedExpression extends AstNode<"parenthesized_expression"> {
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
    head?: CompoundName | Identifier;
    tail: string;
}

export interface NumericLiteral extends AstNode<"numeric_literal"> {
    value: number;
}

type UnaryOperator = Keyword<"!">;

export interface UnaryOperatorExpression extends AstNode<"unary_expression_operator"> {
    operator: UnaryOperator;
    expression: Expression;
}

// Misc

export type Name = Identifier | CompoundName;

export interface TypeReference extends AstNode<SyntaxKind.TypeReference> {
    type: Name;
} 