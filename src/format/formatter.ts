import { DznLintFormatConfiguration } from "../config/dznlint-configuration";

enum PrintingType {
    File,
    Enum,
    Component,
    Interface,
    Event,
    Behavior,
    System,
    Port,
    Instance,
    Binding,
    Function,
}

enum Token {
    Name,
    Keyword,
    Literal,
    SingleLineComment,
    MultiLineComment,
    Comma,
    Semicolon,
    NewLine,
    Space,
    Dot,
    BraceOpen,
    BraceClose,
    ParenOpen,
    ParenClose,
    BracketOpen,
    BracketClose,
    BinaryOperator,
    UnaryOperator,
}

export class Formatter {
    private output: string[] = [];
    private indent: string = "";
    private currentType: PrintingType[] = [PrintingType.File];
    private previousToken: Token = Token.NewLine;
    private indentStep: string;

    constructor(private config: DznLintFormatConfiguration) {
        const [indentType, indentCount] = config.indent;
        if (indentType === "spaces") {
            this.indentStep = " ".repeat(indentCount ?? 4);
        } else {
            this.indentStep = "\t".repeat(indentCount ?? 1);
        }
    }

    // Component

    public startComponent() {
        this.requirePrecedingNewLine();
        this.keyword("component");
        this.currentType.push(PrintingType.Component);
    }

    public endComponent() {
        this.currentType.pop();
        this.closeScopedBlock();
    }

    // Interface

    public startInterface() {
        this.requirePrecedingNewLine();
        this.keyword("interface");
        this.currentType.push(PrintingType.Interface);
    }
    public endInterface() {
        this.currentType.pop();
        this.closeScopedBlock();
        this.newLine();
    }

    public startEvent(direction: string) {
        this.requirePrecedingNewLine();
        this.keyword(direction);
        this.currentType.push(PrintingType.Event);
    }

    public endEvent() {
        this.semicolon();
        this.currentType.pop();
    }

    // Behavior

    public startBehavior() {
        this.requirePrecedingNewLine();
        this.currentType.push(PrintingType.Behavior);
        this.keyword("behavior");
    }

    public endBehavior() {
        this.currentType.pop();
        this.closeScopedBlock();
    }

    public startVariable() {
        this.requirePrecedingNewLine();
    }

    public endVariable() {
        this.semicolon();
    }

    public startAssignment() {
        this.requirePrecedingNewLine();
    }

    public endAssignment() {
        this.semicolon();
    }

    public startGuard() {
        this.requirePrecedingSpace();
        this.openBracket();
    }

    public endGuard() {
        this.closeBracket();
    }

    public nextTrigger() {
        this.comma();
    }

    // System

    public startSystem() {
        this.requirePrecedingNewLine();
        this.currentType.push(PrintingType.System);
        this.keyword("system");
    }

    public endSystem() {
        this.currentType.pop();
        this.closeScopedBlock();
    }

    public startPort(direction: string) {
        this.requirePrecedingNewLine();
        this.currentType.push(PrintingType.Port);
        this.keyword(direction);
    }

    public endPort() {
        this.currentType.pop();
    }

    public startInstance() {
        this.requirePrecedingNewLine();
        this.currentType.push(PrintingType.Instance);
    }

    public endInstance() {
        this.semicolon();
        this.currentType.pop();
    }

    public startBinding() {
        this.requirePrecedingNewLine();
        this.currentType.push(PrintingType.Binding);
    }

    public endBinding() {
        this.semicolon();
        this.currentType.pop();
    }

    // On

    public startOn() {
        this.requirePrecedingSpace();
        this.output.push("on");
        this.previousToken = Token.Keyword;
    }

    // Function

    public startFunction(returnType: string) {
        this.requirePrecedingNewLine();
        this.currentType.push(PrintingType.Function);
        this.requirePrecedingNewLine();
        this.type(returnType);
    }

    public endFunction() {
        this.currentType.push();
    }

    public startFormals() {
        this.openParen();
    }

    public endFormals() {
        this.closeParen();
    }

    public nextFormal() {
        this.comma();
    }

    public return() {
        this.requirePrecedingNewLine();
        this.keyword("return");
    }

    // Enum

    public startEnum() {
        this.requirePrecedingNewLine();
        this.keyword("enum");
        this.currentType.push(PrintingType.Enum);
    }
    public endEnum() {
        this.currentType.pop();
        this.output.push(";");
        this.newLine();
    }

    public enumMember(name: string) {
        this.requirePrecedingNewLine();
        this.output.push(name);
        this.previousToken = Token.Name;
    }

    public nextEnumMember() {
        this.comma();
    }

    // Comments

    public singleLineComment(comment: string) {
        this.requirePrecedingSpace();
        this.output.push(comment);
        this.newLine();
    }

    public multiLineComment(comment: string) {
        const lines = comment.split("\n").map(l => l.trim());
        if (lines.length > 0) {
            for (let i = 1; i < lines.length; i++) {
                lines[i] = lines[i].startsWith("*") ? ` ${lines[i]}` : ` * ${lines[i]}`;
            }
        }

        this.requirePrecedingSpace();
        this.output.push(lines[0]);
        for (let i = 1; i < lines.length; i++) {
            this.newLine();
            this.output.push(lines[i]);
        }
        this.previousToken = Token.MultiLineComment;
    }

    // Misc

    public openScopedBlock() {
        if (this.config.braces === "next-line") {
            this.requirePrecedingNewLine();
        } else {
            this.requirePrecedingSpace();
        }
        this.openBrace();
        this.pushIndent();
        this.newLine();
    }
    public closeScopedBlock() {
        this.popIndent();
        this.newLine();
        this.closeBrace();
    }

    public name(name: string) {
        this.requirePrecedingSpace();
        this.output.push(name);
        this.previousToken = Token.Name;
    }

    public type(name: string) {
        this.requirePrecedingSpace();
        this.output.push(name);
        this.previousToken = Token.Name;
    }

    public keyword(keyword: string) {
        this.requirePrecedingSpace();
        this.output.push(keyword);
        this.previousToken = Token.Keyword;
    }

    public literal(literal: string) {
        this.requirePrecedingSpace();
        this.output.push(literal);
        this.previousToken = Token.Literal;
    }

    public binaryOperator(operator: string) {
        this.requirePrecedingSpace();
        this.output.push(operator);
        this.previousToken = Token.BinaryOperator;
    }

    public unaryOperator(operator: string) {
        this.requirePrecedingSpace();
        this.output.push(operator);
        this.previousToken = Token.UnaryOperator;
    }

    public comma() {
        this.output.push(",");
        this.previousToken = Token.Comma;
    }

    public dot() {
        this.output.push(".");
        this.previousToken = Token.Dot;
    }

    public colon() {
        this.output.push(":");
    }

    public semicolon() {
        this.output.push(";");
        this.previousToken = Token.Semicolon;
    }

    public dollar() {
        this.output.push("$");
        this.previousToken = Token.Literal;
    }

    public verbatim(str: string) {
        this.output.push(str);
    }

    public openParen() {
        this.output.push("(");
        this.previousToken = Token.ParenOpen;
    }

    public closeParen() {
        this.output.push(")");
        this.previousToken = Token.ParenClose;
    }

    public openBracket() {
        this.output.push("[");
        this.previousToken = Token.BracketOpen;
    }

    public closeBracket() {
        this.output.push("]");
        this.previousToken = Token.BracketClose;
    }

    public openBrace() {
        this.output.push("{");
        this.previousToken = Token.BraceOpen;
    }

    public closeBrace() {
        this.output.push("}");
        this.previousToken = Token.BraceClose;
    }

    public space() {
        this.output.push(" ");
        this.previousToken = Token.Space;
    }

    public newLine() {
        this.output.push("\n", this.indent);
        this.previousToken = Token.NewLine;
    }

    public whiteline() {
        if (this.previousToken !== Token.NewLine) {
            this.output.push("\n"); // no indent!
        }
        this.newLine();
    }

    // Output

    public toString() {
        return this.output.join("");
    }

    // Helpers

    public requirePrecedingNewLine() {
        if (this.previousToken !== Token.NewLine) {
            this.newLine();
        }
    }
    public requirePrecedingSpace() {
        if (
            this.previousToken !== Token.NewLine &&
            this.previousToken !== Token.Space &&
            this.previousToken !== Token.ParenOpen &&
            this.previousToken !== Token.BracketOpen &&
            this.previousToken !== Token.BraceOpen &&
            this.previousToken !== Token.Dot
        ) {
            this.space();
        }
    }

    private pushIndent(): void {
        this.indent += this.indentStep;
    }
    private popIndent(): void {
        this.indent = this.indent.substring(0, this.indent.length - this.indentStep.length);
    }

    private peekCurrentType(): PrintingType {
        return this.currentType[this.currentType.length - 1];
    }
}
