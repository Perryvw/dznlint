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
    On,
    Compound,
    OneLineCompound,
}

enum Token {
    Name,
    Keyword,
    Literal,
    SingleLineComment,
    MultiLineComment,
    LeadingComment,
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
    NamespaceBrace,
    Indent,
}

export enum RequireNewLine {
    Always,
    NotInOneLineCompound,
}

export class Formatter {
    private output: string[] = [];
    private indent: string = "";
    private currentType: PrintingType[] = [PrintingType.File];
    private previousToken: Token = Token.NewLine;
    private indentStep: string;
    private column = 0;

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
        this.closeScopedBlock();
        this.popCurrentType(PrintingType.Component);
    }

    // Interface

    public startInterface() {
        this.requirePrecedingNewLine();
        this.keyword("interface");
        this.currentType.push(PrintingType.Interface);
    }
    public endInterface() {
        this.closeScopedBlock();
        this.popCurrentType(PrintingType.Interface);
    }

    public startEvent(direction: string) {
        this.requirePrecedingNewLine();
        this.keyword(direction);
        this.currentType.push(PrintingType.Event);
    }

    public endEvent() {
        this.semicolon();
        this.popCurrentType(PrintingType.Event);
    }

    // Behavior

    public startBehavior() {
        this.requirePrecedingNewLine();
        this.currentType.push(PrintingType.Behavior);
        this.keyword("behavior");
    }

    public endBehavior() {
        this.closeScopedBlock();
        this.popCurrentType(PrintingType.Behavior);
    }

    public startVariable() {
        this.requirePrecedingNewLine();
    }

    public endVariable() {
        this.semicolon();
    }

    public startAssignment() {
        if (this.peekCurrentType() === PrintingType.OneLineCompound) {
            this.requirePrecedingSpace();
        } else {
            this.requirePrecedingNewLine();
        }
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
        this.closeScopedBlock();
        this.popCurrentType(PrintingType.System);
    }

    public startPort(direction: string) {
        this.requirePrecedingNewLine();
        this.currentType.push(PrintingType.Port);
        this.keyword(direction);
    }

    public endPort() {
        this.popCurrentType(PrintingType.Port);
    }

    public startInstance() {
        this.requirePrecedingNewLine();
        this.currentType.push(PrintingType.Instance);
    }

    public endInstance() {
        this.semicolon();
        this.popCurrentType(PrintingType.Instance);
    }

    public startBinding() {
        this.requirePrecedingNewLine();
        this.currentType.push(PrintingType.Binding);
    }

    public endBinding() {
        this.semicolon();
        this.popCurrentType(PrintingType.Binding);
    }

    // On

    public startOn() {
        this.requirePrecedingSpace();
        this.output.push("on");
        this.previousToken = Token.Keyword;
        this.currentType.push(PrintingType.On);
    }

    public endOn() {
        this.popCurrentType(PrintingType.On);
    }

    public startTriggers() {
        // push indent by 3
        this.indent += "   ";
    }

    public endTriggers() {
        // pop indent by 3
        this.indent = this.indent.substring(0, this.indent.length - 3);
    }

    public startTrigger() {
        if (this.column < this.config.target_width) {
            this.requirePrecedingSpace();
        } else {
            this.requirePrecedingNewLine();
        }
    }

    // Function

    public startFunction(returnType: string) {
        this.requirePrecedingNewLine();
        this.currentType.push(PrintingType.Function);
        this.requirePrecedingNewLine();
        this.type(returnType);
    }

    public endFunction() {
        this.popCurrentType(PrintingType.Function);
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
        this.requirePrecedingSpace();
        this.keyword("return");
    }

    // Enum

    public startEnum() {
        this.requirePrecedingNewLine();
        this.keyword("enum");
        this.currentType.push(PrintingType.Enum);
    }
    public endEnum() {
        this.output.push(";");
        this.popCurrentType(PrintingType.Enum);
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
        this.previousToken = Token.SingleLineComment;
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
            this.output.push(this.indent, lines[i]);
        }
        this.previousToken = Token.MultiLineComment;
    }

    public leadingComment(comment: string) {
        this.multiLineComment(comment);
        this.previousToken = Token.LeadingComment;
    }

    // Compound

    public openCompound(containsGuards: boolean) {
        if (this.inInterfaceOn() && !containsGuards) {
            this.currentType.push(PrintingType.OneLineCompound);
        } else {
            this.currentType.push(PrintingType.Compound);
        }
        this.openScopedBlock();
    }

    public closeCompound() {
        this.closeScopedBlock();
        if (this.peekCurrentType() === PrintingType.OneLineCompound) {
            this.popCurrentType(PrintingType.OneLineCompound);
        } else {
            this.popCurrentType(PrintingType.Compound);
        }
    }

    // Namespace

    public openNamespaceBrace() {
        this.requirePrecedingSpace();
        this.openBrace();
        this.previousToken = Token.NamespaceBrace;
    }

    public closeNamespaceBrace() {
        if (this.previousToken !== Token.NamespaceBrace) {
            this.requirePrecedingNewLine();
        }
        this.closeBrace();
        this.previousToken = Token.NamespaceBrace;
    }

    // Misc

    public openScopedBlock() {
        if (this.config.braces === "next-line") {
            this.requirePrecedingNewLine();
        } else {
            this.requirePrecedingSpace();
        }
        this.openBrace();
        if (this.shouldIndent()) {
            this.pushIndent();
        }
    }
    public closeScopedBlock() {
        if (this.shouldIndent()) {
            this.popIndent();
        }
        this.requirePrecedingNewLine();
        this.closeBrace();
    }

    public name(name: string) {
        this.requirePrecedingSpace();
        this.output.push(name);
        this.column += name.length;
        this.previousToken = Token.Name;
    }

    public type(name: string) {
        this.requirePrecedingSpace();
        this.output.push(name);
        this.column += name.length;
        this.previousToken = Token.Name;
    }

    public keyword(keyword: string) {
        this.requirePrecedingSpace();
        this.output.push(keyword);
        this.column += keyword.length;
        this.previousToken = Token.Keyword;
    }

    public literal(literal: string) {
        this.requirePrecedingSpace();
        this.output.push(literal);
        this.column += literal.length;
        this.previousToken = Token.Literal;
    }

    public binaryOperator(operator: string) {
        this.requirePrecedingSpace();
        this.output.push(operator);
        this.column += operator.length;
        this.previousToken = Token.BinaryOperator;
    }

    public unaryOperator(operator: string) {
        this.requirePrecedingSpace();
        this.output.push(operator);
        this.column += operator.length;
        this.previousToken = Token.UnaryOperator;
    }

    public else() {
        if (this.config.braces === "next-line") {
            this.requirePrecedingNewLine();
        }
        this.keyword("else");
    }

    public comma() {
        this.output.push(",");
        this.column++;
        this.previousToken = Token.Comma;
    }

    public dot() {
        this.output.push(".");
        this.column++;
        this.previousToken = Token.Dot;
    }

    public colon() {
        this.output.push(":");
        this.column++;
    }

    public semicolon() {
        this.output.push(";");
        this.column++;
        this.previousToken = Token.Semicolon;
    }

    public dollar() {
        this.output.push("$");
        this.column++;
        this.previousToken = Token.Literal;
    }

    public verbatim(str: string) {
        this.output.push(str);
        this.column += str.length;
    }

    public openParen() {
        this.output.push("(");
        this.column++;
        this.previousToken = Token.ParenOpen;
    }

    public closeParen() {
        this.output.push(")");
        this.column++;
        this.previousToken = Token.ParenClose;
    }

    public openBracket() {
        this.output.push("[");
        this.column++;
        this.previousToken = Token.BracketOpen;
    }

    public closeBracket() {
        this.output.push("]");
        this.column++;
        this.previousToken = Token.BracketClose;
    }

    public openBrace() {
        this.output.push("{");
        this.column++;
        this.previousToken = Token.BraceOpen;
    }

    public closeBrace() {
        this.output.push("}");
        this.column++;
        this.previousToken = Token.BraceClose;
    }

    public space() {
        this.output.push(" ");
        this.column++;
        this.previousToken = Token.Space;
    }

    public newLine() {
        this.output.push("\n");
        this.column = 0;
        this.previousToken = Token.NewLine;
    }

    public whiteline() {
        if (this.previousToken === Token.BraceOpen) {
            // Don't print whitelines directly after opening braces
            return;
        }
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
        if (this.peekCurrentType() === PrintingType.OneLineCompound) {
            // When printing a one-line compound, require a preceding space instead of preceding newline
            this.requirePrecedingSpace();
            return;
        }
        if (this.previousToken === Token.LeadingComment) {
            return;
        }
        if (this.previousToken !== Token.NewLine && this.previousToken !== Token.Indent) {
            this.newLine();
        }
        if (this.previousToken !== Token.Indent) {
            this.output.push(this.indent);
            this.column += this.indent.length;
            this.previousToken = Token.Indent;
        }
    }
    public requirePrecedingSpace() {
        if (this.previousToken === Token.SingleLineComment) {
            // If previous token was a single line comment, require a new line instead
            return this.requirePrecedingNewLine();
        }
        if (
            this.previousToken !== Token.NewLine &&
            this.previousToken !== Token.Space &&
            this.previousToken !== Token.Indent &&
            this.previousToken !== Token.ParenOpen &&
            this.previousToken !== Token.BracketOpen &&
            this.previousToken !== Token.Dot &&
            this.previousToken !== Token.UnaryOperator
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

    private popCurrentType(expectedType: PrintingType) {
        const popped = this.currentType.pop();
        if (popped !== expectedType) {
            throw `Popped type ${PrintingType[popped!]} does not match expected type ${PrintingType[expectedType]}!`;
        }
    }

    private inInterfaceOn(): boolean {
        let inOn = false;
        for (let i = this.currentType.length - 1; i >= 0; i--) {
            if (this.currentType[i] === PrintingType.On) {
                inOn = true;
            } else if (this.currentType[i] === PrintingType.Interface) {
                return inOn;
            }
        }

        return false;
    }

    private shouldIndent(): boolean {
        if (this.config.indent_components_interfaces) {
            return true;
        }

        const currentType = this.peekCurrentType();
        const isComponentOrInterface = currentType === PrintingType.Component || currentType === PrintingType.Interface;

        return !isComponentOrInterface;
    }
}
