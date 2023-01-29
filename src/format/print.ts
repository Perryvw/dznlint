import { DznLintConfiguration, DznLintUserConfiguration } from "../config/dznlint-configuration";
import { getRuleConfig } from "../config/util";
import * as parser from "../grammar/parser";
import { headTailToList } from "../util";

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

    if (statement.leading_comments.comments.length > 0) {
        result += "\n";
    }

    result += printer(statement.v, indent, config);

    if (statement.trailing_comment !== null) {
        result += printCommentOrWhitespace(statement.trailing_comment, " ");
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

function printInterfaceDefinition(
    statement: parser.interface_definition,
    indent: Indent,
    config: FormatConfig
): string {

    let result = indent + `interface ${statement.name.text}`;

    result += printOpenBrace(indent, config);

    const innerIndent = pushIndent(indent, config);
    result += statement.body.map(e => printWithComments(e, printTypeOrEvent, innerIndent, config)).join("\n");

    if (statement.behavior)
    {
        result += "\n\n";
        result += printBehavior(statement.behavior, innerIndent, config);
    }

    result += printClosingBrace(indent);

    return result;
}

function printBehavior(statement: parser.behavior, indent: Indent, config: FormatConfig): string {
    let result = `${indent}behavior`;

    result += printOpenBrace(indent, config);

    const innerIndent = pushIndent(indent, config);
    result += statement.block.statements.statements.map(s => printWithComments(s, printBehaviorStatement, innerIndent, config));

    result += printClosingBrace(indent);

    return result;
}

function printBehaviorStatement(statement: parser.behavior_statement, indent: Indent, config: FormatConfig): string {
    return indent + "behavior_statement;"
}

function printTypeOrEvent(statement: parser.interface_definition_$0_$0, indent: Indent, config: FormatConfig): string {
    switch (statement.kind) {
        case parser.ASTKinds.extern_definition:
            return printExternDefinition(statement, indent);
        case parser.ASTKinds.enum_definition:
            return printEnumDefinition(statement, indent, config);
        case parser.ASTKinds.int:
            return printIntDefinition(statement, indent);
        case parser.ASTKinds.event:
            return printEvent(statement, indent);
    }
}

function printExternDefinition(statement: parser.extern_definition, indent: Indent): string {
    return indent + `extern ${statement.type} = ${statement.literal}`;
}

function printEnumDefinition(statement: parser.enum_definition, indent: Indent, config: FormatConfig): string {
    let result = indent + `enum ${statement.name.text}`;

    result += printOpenBrace(indent, config);

    const innerIndent = pushIndent(indent, config);
    result += headTailToList(statement.fields)
        .map(e => `${innerIndent}${e.text}`)
        .join(",\n");

    result += printClosingBrace(indent);

    return result;
}

function printIntDefinition(statement: parser.int, indent: Indent): string {
    return `${indent}subint ${_printCompoundName(statement.name)} = {${statement.range.from}..${statement.range.to}};`;
}

function printEvent(statement: parser.event, indent: Indent): string {
    const type = _printCompoundName(statement.type_name);
    const name = _printCompoundName(statement.event_name);
    const parameters = "";
    return `${indent}${statement.direction} ${type} ${name}(${parameters});`;
}

function _printCompoundName(expression: parser.compound_name): string {
    if (expression.kind === parser.ASTKinds.identifier) {
        return expression.text;
    } else {
        return expression.compound
            ? `${_printCompoundName(expression.compound)}.${expression.name.text}`
            : expression.name.text;
    }
}

function printCommentOrWhitespace(comment: parser.comment_or_whiteline, indent: Indent): string {
    if (typeof comment === "string") {
        // newline
        return "\n";
    } else {
        if (comment.kind == parser.ASTKinds.sl_comment) {
            return indent + comment.text.trim();
        } else if (comment.kind == parser.ASTKinds.ml_comment) {
            return indent + "/*" + comment.text.map(p => p.c).join("") + "*/";
        }
    }

    throw "unknown kind";
}

function printOpenBrace(indent: Indent, config: FormatConfig): string {
    return config.braces === "same-line" ? " {\n" : `\n${indent}{\n`;
}

function printClosingBrace(indent: Indent): string {
    return `\n${indent}}`;
}

function pushIndent(indent: Indent, config: FormatConfig): Indent {
    if (config.indent === "tabs") {
        return indent + "\t";
    } else {
        return indent + " ".repeat(config.indentWidth);
    }
}

function popIndent(indent: Indent, config: FormatConfig): Indent {
    if (config.indent === "tabs") {
        return indent.substring(1);
    } else {
        return indent.substring(config.indentWidth);
    }
}
