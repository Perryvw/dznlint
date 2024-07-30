import { treeSitterParse } from "../parse";
import { InputSource } from "../semantics/program";
import * as Grammar from "./tree-sitter-types";

export async function format(source: InputSource): Promise<string> {
    const tree = await treeSitterParse(source);
    return formatRoot(tree as unknown as Grammar.root_Node);
}

// Statements

function formatStatement(node: Grammar.AllNodes, indent: string): string {
    if (node.isError) {
        throw `Cannot format error node ${node.text}`;
    }

    switch (node.type) {
        case "comment":
            return formatComment(node, indent);
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
        case "compound":
            return formatCompound(node, indent);
        case "behavior":
            return formatBehavior(node, indent);
        case "illegal":
            return "illegal";
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
        case "root":
            return formatRoot(node);
        default:
            console.log(node.toString());
            throw `Don't know how to format statements of type ${node.type}`;
    }
}

function formatComment(node: Grammar.comment_Node, indent: string): string {
    const isMultiline = node.text.startsWith("//");
    return `${indent}${node.text}`;
}

function formatRoot(root: Grammar.root_Node): string {
    return root.children.map(n => formatStatement(n as Grammar.AllNodes, "")).join("\n") + "\n";
}

function formatVariable(node: Grammar.variable_Node, indent: string): string {
    const type = node.childForFieldName("type_name");
    const name = node.childForFieldName("name");
    const expression = node.childForFieldName("expression");

    if (expression) {
        return `${indent}${formatExpression(type)} ${formatExpression(name)} = ${formatExpression(expression)};`;
    } else {
        return `${indent}${formatExpression(type)} ${formatExpression(name)};}`;
    }
}

function formatEnum(node: Grammar.enum_Node, indent: string): string {
    const name = node.childForFieldName("name");
    const fields = node.childForFieldName("fields");
    const memberIndent = pushIndent(indent);
    const members = fields
        .childrenForFieldName("name")
        .map((f, i, l) => (i < l.length - 1 ? memberIndent + f.text + "," : memberIndent + f.text));
    return formatScopedBlock(`enum ${formatExpression(name)}`, members, indent) + ";";
}

function formatAction(node: Grammar.action_Node, indent: string): string {
    const portName = node.childForFieldName("port_name");
    const actionName = node.childForFieldName("name");
    const actionArguments = node.childForFieldName("arguments").childrenForFieldName("expression") ?? [];
    return `${indent}${formatExpression(portName)}.${formatExpression(actionName)}(${actionArguments
        .map(formatExpression)
        .join(", ")});`;
}

function formatInterfaceAction(node: Grammar.interface_action_Node, indent: string): string {
    return `${indent}${node.text};`;
}

function formatAssign(node: Grammar.assign_Node, indent: string): string {
    const lhs = node.childForFieldName("left");
    const rhs = node.childForFieldName("right");
    return `${indent}${formatExpression(lhs)} = ${formatExpression(rhs)};`;
}

function formatEvent(node: Grammar.event_Node, indent: string): string {
    const direction = node.childForFieldName("direction");
    const typeName = node.childForFieldName("type_name");
    const eventName = node.childForFieldName("event_name");
    const formals = node.childForFieldName("formals").childrenForFieldName("formal") ?? [];

    return `${indent}${direction.text} ${formatExpression(typeName)} ${formatExpression(eventName)}(${formals
        .map(formatExpression)
        .join(", ")});`;
}

function formatOn(node: Grammar.on_Node, indent: string): string {
    const triggers = node.childForFieldName("triggers").childrenForFieldName("trigger");
    const body = node.childrenForFieldName("body");
    return `${indent}on ${triggers.map(formatExpression).join(", ")}: ${body.map(s =>
        formatStatement(s as Grammar.AllNodes, indent)
    )}`;
}

function formatGuard(node: Grammar.guard_Node, indent: string): string {
    const condition = node.childForFieldName("condition");
    const body = node.childrenForFieldName("body");
    const childIndent = pushIndent(indent);
    return formatScopedBlock(
        `${indent}[${formatExpression(condition)}]`,
        body.filter(c => c.isNamed).map(n => formatStatement(n as Grammar.AllNodes, childIndent)),
        indent
    );
}

function formatBinding(node: Grammar.binding_Node, indent: string): string {
    const left = node.childForFieldName("left");
    const right = node.childForFieldName("right");
    return `${indent}${formatExpression(left)} <=> ${formatExpression(right)};`;
}

function formatInstance(node: Grammar.instance_Node, indent: string): string {
    const type = node.childForFieldName("type");
    const name = node.childForFieldName("name");
    return `${indent}${formatExpression(type)} ${formatExpression(name)};`;
}

function formatReturn(node: Grammar.return_Node, indent: string): string {
    const expression = node.childForFieldName("expression");
    if (expression) {
        return `${indent}return ${formatExpression(expression)};`;
    } else {
        return `${indent}return;`;
    }
}

function formatFunction(node: Grammar.function_Node, indent: string): string {
    const type = node.childForFieldName("return_type");
    const name = node.childForFieldName("name");
    const formals = node.childForFieldName("formals");
    const body = node.childForFieldName("body").childrenForFieldName("statement");
    const childIndent = pushIndent(indent);
    return formatScopedBlock(
        `${formatExpression(type)} ${formatExpression(name)}()`,
        (body ?? []).filter(c => c.isNamed).map(n => formatStatement(n as Grammar.AllNodes, childIndent)),
        indent
    );
}

function formatCompound(node: Grammar.compound_Node, indent: string): string {
    const statements = node.childrenForFieldName("statement") ?? [];
    return formatScopedBlock(
        "",
        statements.filter(s => s.isNamed).map(s => formatStatement(s as Grammar.AllNodes, indent)),
        indent
    );
}

function formatInterface(node: Grammar.interface_Node, indent: string): string {
    const name = node.childForFieldName("name");
    const body = node.childForFieldName("body");
    const childIndent = pushIndent(indent);
    return formatScopedBlock(
        `interface ${formatExpression(name)}`,
        body.children.filter(c => c.isNamed).map(n => formatStatement(n as Grammar.AllNodes, childIndent)),
        indent
    );
}

function formatComponent(node: Grammar.component_Node, indent: string): string {
    const name = node.childForFieldName("name");
    const behaviorOrSystem = node.childForFieldName("body")?.child(0);
    const childIndent = pushIndent(indent);
    return formatScopedBlock(
        `component ${formatExpression(name)}`,
        behaviorOrSystem ? [formatStatement(behaviorOrSystem, childIndent)] : [],
        indent
    );
}

function formatBehavior(node: Grammar.behavior_Node, indent: string): string {
    const body = node.childForFieldName("body");
    const childIndent = pushIndent(indent);
    return formatScopedBlock(
        `behavior`,
        body.children.filter(c => c.isNamed).map(n => formatStatement(n as Grammar.AllNodes, childIndent)),
        indent
    );
}

function formatSystem(node: Grammar.system_Node, indent: string): string {
    const body = node.childForFieldName("body");
    const childIndent = pushIndent(indent);
    return formatScopedBlock(
        `system`,
        body.children.filter(c => c.isNamed).map(n => formatStatement(n as Grammar.AllNodes, childIndent)),
        indent
    );
}

function formatImport(node: Grammar.import_Node, indent: string): string {
    const fileName = node.childForFieldName("file_name");
    return `${indent}import ${fileName.text};`;
}

function formatExtern(node: Grammar.extern_Node, indent: string): string {
    const name = node.childForFieldName("name");
    const value = node.childForFieldName("value");
    return `${indent}extern ${formatExpression(name)} ${formatExpression(value)}`;
}

// Expressions

function formatExpression(node: Grammar.AllNodes): string {
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
        case "port_event":
            return formatPortEvent(node);
        case "literal":
            return formatLiteral(node);
        case "trigger":
            return formatExpression(node.child(0));
        case "dollars_content":
            return formatDollars(node);
        default:
            console.log(node.toString());
            throw `Don't know how to format expressions of type ${node.type}`;
    }
}

function formatScopedName(
    node:
        | Grammar.compound_name_Node
        | Grammar.end_point_Node
        | Grammar.event_name_Node
        | Grammar.name_Node
        | Grammar.scoped_name_Node
        | Grammar.port_name_Node
        | Grammar.type_name_Node
        | Grammar.var_Node
        | Grammar.var_name_Node
): string {
    return node.text.replace(/\s/g, "");
}

function formatCall(node: Grammar.call_Node): string {
    const name = node.childForFieldName("name");
    const callArgs = node.childForFieldName("arguments").childrenForFieldName("expression") ?? [];
    return `${formatExpression(name)}(${callArgs.map(formatExpression).join(", ")})`;
}

function formatLiteral(node: Grammar.literal_Node): string {
    return node.text;
}

function formatPortEvent(node: Grammar.port_event_Node): string {
    const port = node.childForFieldName("port");
    const name = node.childForFieldName("name");
    const formals = node.childForFieldName("formals");

    return `${formatExpression(name)}(${formals.children
        .filter(c => c.isNamed)
        .map(n => formatExpression(n as Grammar.AllNodes))
        .join(", ")})`;
}

function formatDollars(node: Grammar.dollars_content_Node): string {
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
