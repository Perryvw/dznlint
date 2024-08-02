enum PrintingType {
    File,
    Enum,
    Interface,
    Behavior,
    Function
}

enum Token {
    Enum,
    Interface,
    Behavior,
    Name,
    Keyword,
    SingleLineComment,
    MultiLineComment,
    Comma,
    Semicolon,
    NewLine,
    BraceOpen,
    BraceClose
}

export class Formatter {
    private output: string[] = [];
    private indent: string = "";
    private currentType: PrintingType[] = [PrintingType.File];
    private previousToken: Token = Token.NewLine;

    // Component

    // Interface

    public startInterface() {
        this.requirePrecedingNewLine();
        this.keyword("interface");
        this.currentType.push(PrintingType.Interface);
        this.previousToken = Token.Interface;
    }
    public endInterface() {
        this.currentType.pop();
    }

    // Behavior

    public startBehavior() {
        this.currentType.push(PrintingType.Behavior);
        this.keyword("behavior")
    }

    public endBehavior()
    {
        this.currentType.pop();
    }

    // Function

    public startFunction(returnType: string)
    {
        this.currentType.push(PrintingType.Function);
        this.requirePrecedingNewLine();
        this.name(returnType);
    }

    public endFunction()
    {
        this.currentType.push();
    }

    public startFormals()
    {
        this.output.push("(");
    }

    public endFormals()
    {
        this.output.push(")");
    }

    // Enum

    public startEnum() {
        this.requirePrecedingNewLine();
        this.keyword("enum");
        this.currentType.push(PrintingType.Enum);
        this.previousToken = Token.Enum;
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

    // Comments

    public singleLineComment(comment: string) {
        this.requirePrecedingSpace();
        this.output.push(comment);
        this.newLine();
    }

    public multiLineComment(comment: string) {
        const lines = comment.split("\n").map(l => l.trim());
        if (lines.length > 0) {
            for (let i = 1; i < lines.length; i++)
            {
                lines[i] = lines[i].startsWith("*")
                    ? ` ${lines[i]}`
                    : ` * ${lines[i]}`;
            }
        }

        this.requirePrecedingSpace();
        this.output.push(lines[0]);
        for (let i = 1; i < lines.length; i++)
        {
            this.newLine();
            this.output.push(lines[i]);
        }
        this.previousToken = Token.MultiLineComment;
    }

    // Misc

    public openScopedBlock() {
        this.requirePrecedingNewLine();
        this.output.push("{");
        this.pushIndent();
        this.newLine();
    }
    public closeScopedBlock() {
        this.popIndent();
        this.newLine();
        this.output.push("}");
        this.previousToken = Token.BraceClose;
    }
    
    public name(name: string) {
        this.requirePrecedingSpace();
        this.output.push(name);
        this.previousToken = Token.Name;
    }

    public keyword(keyword: string) {
        this.requirePrecedingSpace();
        this.output.push(keyword);
        this.previousToken = Token.Keyword;
    }

    public comma() {
        this.output.push(",");
        this.previousToken = Token.Comma;
        if (this.peekCurrentType() === PrintingType.Enum)
        {
            this.newLine();
        }
    }
    public semicolon() {
        this.output.push(";");
        this.previousToken = Token.Semicolon;
    }
    public newLine() {
        this.output.push("\n", this.indent);
        this.previousToken = Token.NewLine;
    }

    // Output

    public toString() {
        return this.output.join("");
    }

    // Helpers

    private requirePrecedingNewLine()
    {
        if (this.previousToken !== Token.NewLine)
        {
            this.newLine();
        }
    }
    private requirePrecedingSpace()
    {
        if (this.previousToken !== Token.NewLine) {
            this.output.push(" ");
        }
    }

    private pushIndent(): void {
        this.indent += "    ";
    }
    private popIndent(): void {
        this.indent = this.indent.substring(0, this.indent.length - 4);
    }

    private peekCurrentType(): PrintingType {
        return this.currentType[this.currentType.length - 1];
    }

}
