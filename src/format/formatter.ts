enum PrintingType {
    Enum,
    Interface,
}

export class Formatter {
    private output: string[] = [];
    private indent: string = "";
    private currentType: PrintingType[] = [];

    public pushIndent(): void {
        this.indent += "    ";
    }
    public popIndent(): void {
        this.indent = this.indent.substring(0, this.indent.length - 4);
    }

    public singleLineComment(comment: string) {
        this.output.push(comment);
        this.newLine();
    }
    public multiLineComment(commentLines: string[]) {
        this.output.push(commentLines.join("\n"));
    }

    public openScopedBlock() {
        this.newLine();
        this.output.push("{");
        this.pushIndent();
        this.newLine();
    }
    public closeScopedBlock() {
        this.popIndent();
        this.newLine();
        this.output.push("}");
    }

    public startInterface() {
        this.output.push("interface");
        this.currentType.push(PrintingType.Interface);
    }
    public endInterface() {
        this.currentType.pop();
    }

    public startEnum() {
        this.output.push("enum");
        this.currentType.push(PrintingType.Enum);
    }
    public endEnum() {
        this.currentType.pop();
        this.output.push(";");
    }

    public pushName(name: string) {
        this.output.push(" ", name);
    }

    public comma() {
        this.output.push(",");
    }
    public semicolon() {
        this.output.push(";");
    }
    public newLine() {
        this.output.push("\n", this.indent);
    }

    public toString() {
        return this.output.join("");
    }
}
