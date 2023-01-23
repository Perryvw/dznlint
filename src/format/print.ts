import { DznLintConfiguration, DznLintUserConfiguration } from "../config/dznlint-configuration";
import { getRuleConfig } from "../config/util";
import * as parser from "../grammar/parser";

type Indent = string;
const NO_INDENT = "";

type FormatConfig = DznLintConfiguration["format"][1];

export function printFile(file: parser.file, userConfig: DznLintUserConfiguration): string {

    const config = getRuleConfig("format", userConfig);
    if (!config.isEnabled) throw "Formatting is explicitly disabled in user config!";

    return [
        ...file.statements.map(s => printRootStatement(s.statement, config.config)),
        ...file.trailing_comments.map(c => printCommentOrWhitespace(c.comment, NO_INDENT)),
    ].join("\n");
}

type Printer<T> = (t: T, indent: Indent, config: FormatConfig) => string;

interface WithComments<T> {
    leading_comments: parser.leading_comments;
    v: T;
    trailing_comment: parser.sl_comment | null;
}

function printWithComments<T>(
    statement: WithComments<T>,
    printer: Printer<T>,
    indent: Indent,
    config: FormatConfig
): string {
    let result = statement.leading_comments.comments.map(c => printCommentOrWhitespace(c.comment, indent)).join("\n");

    if (statement.leading_comments.comments.length > 0)
    {
        result += "\n";
    }

    result += printer(statement.v, indent, config);

    if (statement.trailing_comment !== null) {
        result += " " + printCommentOrWhitespace(statement.trailing_comment, indent);
    }

    return result;
}

function printRootStatement(statement: parser.root_statement, config: FormatConfig): string {
    if (statement.kind === parser.ASTKinds.root_statement_4) {
        return printWithComments(statement, printImportStatement, NO_INDENT, config);
    } else if (statement.kind === parser.ASTKinds.root_statement_5) {
        return printWithComments(statement, printInterfaceDefinition, NO_INDENT, config);
    }

    return "<unk>";
}

function printImportStatement(statement: parser.import_statement, indent: Indent): string {
    return indent + `import ${statement.file_name};`;
}

function printInterfaceDefinition(statement: parser.interface_definition, indent: Indent, config: FormatConfig): string {
    const innerIndent = pushIndent(indent, config);
    return indent + `interface ${statement.name.text} {}`;
}

function printCommentOrWhitespace(comment: parser.comment_or_whiteline, indent: Indent): string {
    if (typeof comment === "string") {
        // newline
        return "\n";
    } else {
        if (comment.kind == parser.ASTKinds.sl_comment) {
            return indent + comment.text;
        } else if (comment.kind == parser.ASTKinds.ml_comment) {
            return indent + comment.text.join("");
        }
    }

    throw "unknown kind";
}

function pushIndent(indent: Indent, config: FormatConfig): Indent {
    if (config.indent === "tabs")
    {
        return indent + "\t";
    }
    else
    {
        return indent + " ".repeat(config.indentWidth);
    }
}

function popIndent(indent: Indent, config: FormatConfig): Indent {
    if (config.indent === "tabs")
    {
        return indent.substring(1);
    }
    else
    {
        return indent.substring(config.indentWidth);
    }
}
