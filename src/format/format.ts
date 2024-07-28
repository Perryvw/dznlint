import { treeSitterParse } from "../parse";
import { InputSource } from "../semantics/program";
import * as Parser from "web-tree-sitter";

export async function format(source: InputSource): Promise<string> {
    const tree = await treeSitterParse(source);
    return formatRoot(tree);
}

// Statements

function formatStatement(node: Parser.SyntaxNode, indent: string): string {
    if (node.isError) {
        throw `Cannot format error node ${node.text}`;
    }

    switch (node.type) {
        case "root":
            return formatRoot(node);
        case "variable":
            return formatVariable(node, indent);
        case "enum":
            return formatEnum(node, indent);
        case "action":
            return formatAction(node, indent);
        case "interface_action":
            return formatInterfaceAction(node, indent);
        case "assign":
            return formatAssign(node, indent);
        case "event":
            return formatEvent(node, indent);
        case "on":
            return formatOn(node, indent);
        case "guard":
            return formatGuard(node, indent);
        case "binding":
            return formatBinding(node, indent);
        case "instance":
            return formatInstance(node, indent);
        case "return":
            return formatReturn(node, indent);
        case "function":
            return formatFunction(node, indent);
        case "behavior":
            return formatBehavior(node, indent);
        case "system":
            return formatSystem(node, indent);
        case "interface":
            return formatInterface(node, indent);
        case "component":
            return formatComponent(node, indent);
        case "import":
            return formatImport(node, indent);
        case "extern":
            return formatExtern(node, indent);
        default:
            console.log(node.toString());
            throw `Don't know how to format statements of type ${node.type}`;
    }
}

function formatRoot(root: Parser.SyntaxNode): string {
    return root.children.map(n => formatStatement(n, "")).join("\n") + "\n";
}

function formatVariable(node: Parser.SyntaxNode, indent: string): string {
    const type = node.childForFieldName("type_name")!;
    const name = node.childForFieldName("name")!;
    const expression = node.childForFieldName("expression");

    if (expression) {
        return `${indent}${formatExpression(type)} ${formatExpression(name)} = ${formatExpression(expression)};`;
    } else {
        return `${indent}${formatExpression(type)} ${formatExpression(name)};}`;
    }
}

function formatEnum(node: Parser.SyntaxNode, indent: string): string {
    const name = node.childForFieldName("name")!;
    const fields = node.childForFieldName("fields")!;
    const memberIndent = pushIndent(indent);
    const members = fields.children
        .filter(f => f.type === "name")
        .map((f, i, l) => (i < l.length - 1 ? memberIndent + f.text + "," : memberIndent + f.text));
    return formatScopedBlock(`enum ${formatExpression(name)}`, members, indent) + ";";
}

function formatAction(node: Parser.SyntaxNode, indent: string): string {
    const portName = node.childForFieldName("port_name")!;
    const actionName = node.childForFieldName("name")!;
    const actionArguments = node.childForFieldName("arguments")!.childrenForFieldName("argument");
    return `${indent}${formatExpression(portName)}.${formatExpression(actionName)}(${actionArguments.map(formatExpression).join(", ")});`;
}

function formatInterfaceAction(node: Parser.SyntaxNode, indent: string): string {
    return `${indent}${node.text};`;
}

function formatAssign(node: Parser.SyntaxNode, indent: string): string {
    const lhs = node.childForFieldName("left")!;
    const rhs = node.childForFieldName("right")!;
    return `${indent}${formatExpression(lhs)} = ${formatExpression(rhs)};`;
}

function formatEvent(node: Parser.SyntaxNode, indent: string): string {
    const direction = node.childForFieldName("direction")!;
    const typeName = node.childForFieldName("type_name")!;
    const eventName = node.childForFieldName("event_name")!;
    const formals = node.childForFieldName("formals")!.childrenForFieldName("formal");

    return `${indent}${direction.text} ${formatExpression(typeName)} ${formatExpression(eventName)}(${formals.map(formatExpression).join(", ")});`;
}

function formatOn(node: Parser.SyntaxNode, indent: string): string {
    const triggers = node.childForFieldName("triggers")!.childrenForFieldName("trigger");
    const body = node.childForFieldName("body")!;
    const childIndent = pushIndent(indent);
    return formatScopedBlock(
        `${indent}on ${triggers.map(formatExpression).join(", ")}:`,
        body.children.filter(c => c.isNamed).map(c => formatStatement(c, childIndent)),
        indent
    );
}

function formatGuard(node: Parser.SyntaxNode, indent: string): string {
    const condition = node.childForFieldName("condition")!;
    const body = node.childForFieldName("body")!;
    const childIndent = pushIndent(indent);
    return formatScopedBlock(
        `${indent}[${formatExpression(condition)}]`,
        body.children.filter(c => c.isNamed).map(n => formatStatement(n, childIndent)),
        indent
    );
}

function formatBinding(node: Parser.SyntaxNode, indent: string): string {
    const left = node.childForFieldName("left")!;
    const right = node.childForFieldName("right")!;
    return `${indent}${formatExpression(left)} <=> ${formatExpression(right)};`;
}

function formatInstance(node: Parser.SyntaxNode, indent: string): string {
    const type = node.childForFieldName("type")!;
    const name = node.childForFieldName("name")!;
    return `${indent}${formatExpression(type)} ${formatExpression(name)};`;
}

function formatReturn(node: Parser.SyntaxNode, indent: string): string {
    const expression = node.childForFieldName("expression")!;
    return `${indent}return ${formatExpression(expression)};`;
}

function formatFunction(node: Parser.SyntaxNode, indent: string): string {
    const type = node.childForFieldName("return_type")!;
    const name = node.childForFieldName("name")!;
    const formals = node.childForFieldName("formals");
    const body = node.childForFieldName("body")!;
    const childIndent = pushIndent(indent);
    return formatScopedBlock(`${formatExpression(type)} ${formatExpression(name)}()`, body.children.filter(c => c.isNamed).map(n => formatStatement(n, childIndent)), indent);
}

function formatInterface(node: Parser.SyntaxNode, indent: string): string {
    const name = node.childForFieldName("name")!;
    const body = node.childForFieldName("body")!;
    const childIndent = pushIndent(indent);
    return formatScopedBlock(
        `interface ${formatExpression(name)}`,
        body.children.filter(c => c.isNamed).map(n => formatStatement(n, childIndent)),
        indent
    );
}

function formatComponent(node: Parser.SyntaxNode, indent: string): string {
    const name = node.childForFieldName("name")!;
    const body = node.childForFieldName("body")!;
    const childIndent = pushIndent(indent);
    return formatScopedBlock(
        `component ${formatExpression(name)}`,
        body.children.filter(c => c.isNamed).map(n => formatStatement(n, childIndent)),
        indent
    );
}

function formatBehavior(node: Parser.SyntaxNode, indent: string): string {
    const body = node.childForFieldName("body")!;
    const childIndent = pushIndent(indent);
    return formatScopedBlock(
        `behavior`,
        body.children.filter(c => c.isNamed).map(n => formatStatement(n, childIndent)),
        indent
    );
}

function formatSystem(node: Parser.SyntaxNode, indent: string): string {
    const body = node.childForFieldName("body")!;
    const childIndent = pushIndent(indent);
    return formatScopedBlock(
        `system`,
        body.children.filter(c => c.isNamed).map(n => formatStatement(n, childIndent)),
        indent
    );
}

function formatImport(node: Parser.SyntaxNode, indent: string): string {
    const fileName = node.childForFieldName("file_name")!;
    return `${indent}import ${fileName.text};`;
}

function formatExtern(node: Parser.SyntaxNode, indent: string): string {
    const name = node.childForFieldName("name")!;
    const value = node.childForFieldName("value")!;
    return `${indent}extern ${formatExpression(name)} ${formatExpression(value)}`;
}

// Expressions

function formatExpression(node: Parser.SyntaxNode): string {
    if (node.isError) {
        throw `Cannot format error node ${node.text}`;
    }

    switch (node.type) {
        case "compound_name":
        case "end_point":
        case "event_name":
        case "name":
        case "scoped_name":
        case "port_name":
        case "type_name":
        case "var":
        case "var_name":
            return formatScopedName(node);
        case "call":
            return formatCall(node);
        case "literal":
            return formatLiteral(node);
        case "trigger":
            return formatTrigger(node);
        case "dollars_content":
            return formatDollars(node);
        default:
            console.log(node.toString());
            throw `Don't know how to format expressions of type ${node.type}`;
    }
}

function formatScopedName(node: Parser.SyntaxNode): string {
    return node.text.replace(/\s/g, "");
}

function formatCall(node: Parser.SyntaxNode): string {
    const name = node.childForFieldName("name")!;
    const callArgs = node.childForFieldName("arguments")!.childrenForFieldName("argument");
    return `${formatExpression(name)}(${callArgs.map(formatExpression).join(", ")})`;
}

function formatLiteral(node: Parser.SyntaxNode): string {
    return node.text;
}

function formatTrigger(node: Parser.SyntaxNode): string {
    const portEvent = node.child(0)!;
    const name = portEvent.childForFieldName("port") ?? portEvent;
    const formals = portEvent.childForFieldName("formals")?.children.filter(c => c.isNamed) ?? [];

    return `${formatExpression(name)}(${formals.map(formatExpression).join(", ")})`;
}

function formatDollars(node: Parser.SyntaxNode): string {
    return node.text;
}

// Helpers

function formatScopedBlock(header: string, content: string[], indent: string): string {
    const bracesOnNewLines = true;

    if (content.length === 0) {
        return `${indent}${header} {}`;
    } else {
        const tail = content.join("\n") + `\n${indent}}`;
        if (bracesOnNewLines) {
            return `${indent}${header}\n${indent}{\n` + tail;
        } else {
            return `${indent}${header} {\n` + tail;
        }
    }
}

function pushIndent(indent: string): string {
    return indent + "    ";
}
