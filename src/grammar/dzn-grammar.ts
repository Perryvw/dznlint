import { identifier } from "./parser";

export enum SyntaxKind {
    SingleLineComment,
    MultiLineComment,

    Block,
    ComponentDeclaration,
    InterfaceDeclaration,
    ExternDeclaration,

    DollarLiteral,
    Identifier,
}

interface AstNode<TKind extends SyntaxKind> {
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



type Declaration = ComponentDeclaration | InterfaceDeclaration | ExternDeclaration;

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

interface Block extends AstNode<SyntaxKind.Block> {
    statements: Statement[];
}



type Expression = DollarLiteral | identifier;

interface DollarLiteral extends AstNode<SyntaxKind.DollarLiteral> {
    text: string;
}

interface Identifier extends AstNode<SyntaxKind.Identifier> {
    text: string;
}
