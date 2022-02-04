
// WIP: Custom AST
export enum SyntaxKind {
    SingleLineComment,
    MultiLineComment,

    Block,
    ComponentDeclaration,
    InterfaceDeclaration,
    ExternDeclaration,
    VariableDeclaration,

    CompoundName,
    DollarLiteral,
    Identifier,
}

export interface AstNode<TKind extends SyntaxKind> {
    kind: TKind;
    precedingComments: CommentNode[];
}

export type DznFile = Statement[];


export type Statement = CommentNode | Declaration;



export type CommentNode = SingleLineComment | MultiLineComment;

export interface SingleLineComment extends AstNode<SyntaxKind.SingleLineComment> {
    text: string;
}

export interface MultiLineComment extends AstNode<SyntaxKind.MultiLineComment> {
    text: string;
}



type Declaration = ComponentDeclaration | InterfaceDeclaration | ExternDeclaration | VariableDeclaration;

interface ComponentDeclaration extends AstNode<SyntaxKind.ComponentDeclaration> {
    behavior?: Block;
    system?: Block;
}

interface InterfaceDeclaration extends AstNode<SyntaxKind.InterfaceDeclaration> {
    behavior?: Block;
}

interface ExternDeclaration extends AstNode<SyntaxKind.ExternDeclaration> {
    name: Identifier;
    value: DollarLiteral;
}

interface VariableDeclaration extends AstNode<SyntaxKind.VariableDeclaration> {
    type: Identifier | CompoundName;
    name: Identifier;
    initializer?: Expression;
}

interface Block extends AstNode<SyntaxKind.Block> {
    statements: Statement[];
}



type Expression = DollarLiteral | Identifier;

interface DollarLiteral extends AstNode<SyntaxKind.DollarLiteral> {
    text: string;
}

interface Identifier extends AstNode<SyntaxKind.Identifier> {
    text: string;
}

interface CompoundName extends AstNode<SyntaxKind.CompoundName> {
    head?: CompoundName | Identifier;
    tail: string;
}
