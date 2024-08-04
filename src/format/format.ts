import { treeSitterParse } from "../parse";
import { InputSource } from "../semantics/program";
import { Formatter } from "./formatter";
import * as Grammar from "./tree-sitter-types-formatter";

export async function format(source: InputSource): Promise<string> {
    const formatter = new Formatter();
    const tree = await treeSitterParse(source);
    formatRoot(tree as unknown as Grammar.root_Node, formatter);
    const formatted = formatter.toString();
    return formatted.endsWith("\n") ? formatted : formatted + "\n";
}

// Sanity check to help verify we handled all possible cases in the if statement
function assertNever(x: never): void {}

// Statements

function formatRoot(root: Grammar.root_Node, formatter: Formatter) {
    const cursor = root.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof root>;
    do {
        switch (c.nodeType) {
            case "import":
                formatImport(c.currentNode, formatter);
                break;
            case "interface":
                formatInterface(c.currentNode, formatter);
                break;
            case "component":
                formatComponent(c.currentNode, formatter);
                break;
            case "extern":
                formatExtern(c.currentNode, formatter);
                break;
            case "dollars":
                formatDollars(c.currentNode, formatter);
                break;
            case "enum":
                formatEnum(c.currentNode, formatter);
                break;
            case "int":
                formatInt(c.currentNode, formatter);
                break;
            case "namespace":
                formatNamespace(c.currentNode, formatter);
                break;
            // generics
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format root child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatComment(node: Grammar.comment_Node, formatter: Formatter) {
    const isSingleLine = node.text.startsWith("//");
    if (isSingleLine) {
        formatter.singleLineComment(node.text);
    } else {
        formatter.multiLineComment(node.text);
    }
}

function formatNamespace(node: Grammar.namespace_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;
    do {
        switch (c.nodeType) {
            case "namespace":
                formatter.keyword("namespace");
                break;
            case "compound_name":
                formatCompoundName(c.currentNode, formatter);
                break;
            case "{":
                formatter.openScopedBlock();
                break;
            case "}":
                formatter.closeScopedBlock();
                break;
            case "interface":
                formatInterface(c.currentNode, formatter);
                break;
            case "component":
                formatComponent(c.currentNode, formatter);
                break;
            case "enum":
                formatEnum(c.currentNode, formatter);
                break;
            case "extern":
                formatExtern(c.currentNode, formatter);
                break;
            case "int":
                formatInt(c.currentNode, formatter);
                break;
            // generics
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format interface member ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatInterface(node: Grammar.interface_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;
    do {
        switch (c.nodeType) {
            case "interface":
                formatter.startInterface();
                break;
            case "scoped_name":
                formatter.name(cursor.nodeText);
                break;
            case "interface_body":
                formatInterfaceBody(c.currentNode, formatter);
                break;
            // generics
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format interface member ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatInterfaceBody(node: Grammar.interface_body_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;
    do {
        switch (c.nodeType) {
            case "{":
                formatter.openScopedBlock();
                break;
            case "enum":
                formatEnum(c.currentNode, formatter);
                break;
            case "}":
                formatter.endInterface();
                break;
            case "behavior":
                formatBehavior(c.currentNode, formatter);
                break;
            case "event":
                formatEvent(c.currentNode, formatter);
                break;
            case "int":
                formatInt(c.currentNode, formatter);
                break;
            case "extern":
                formatExtern(c.currentNode, formatter);
                break;
            // generics
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format interface body child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatEvent(node: Grammar.event_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;
    do {
        switch (c.nodeType) {
            case "direction":
                formatter.startEvent(c.nodeText);
                break;
            case "type_name":
                formatCompoundName(c.currentNode, formatter);
                break;
            case "event_name":
                formatter.name(c.nodeText);
                break;
            case "formals":
                formatFormals(c.currentNode, formatter);
                break;
            case ";":
                formatter.endEvent();
                break;
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format event child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatEnum(node: Grammar.enum_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;
    do {
        switch (c.nodeType) {
            case "enum":
                formatter.startEnum();
                break;
            case "scoped_name":
                formatter.name(c.nodeText);
                break;
            case ";":
                formatter.endEnum();
                break;
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            case "fields":
                cursor.gotoFirstChild();
                const c2 = cursor as Grammar.CursorPosition<typeof c.currentNode>;
                do {
                    switch (c2.nodeType) {
                        case "{":
                            formatter.openScopedBlock();
                            break;
                        case "name":
                            formatter.enumMember(c2.nodeText);
                            break;
                        case ",":
                            formatter.nextEnumMember();
                            break;
                        case "}":
                            formatter.closeScopedBlock();
                            break;
                        case "comment":
                            formatComment(c2.currentNode, formatter);
                            break;
                        default:
                            assertNever(c2);
                            throw `cannot format enum field ${cursor.nodeType}`;
                    }
                } while (cursor.gotoNextSibling());

                // back up to parent
                cursor.gotoParent();
                break;
            default:
                assertNever(c);
                throw `cannot format enum member ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatComponent(node: Grammar.component_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;
    do {
        switch (c.nodeType) {
            case "component":
                formatter.startComponent();
                break;
            case "{":
                formatter.openScopedBlock();
                break;
            case "}":
                formatter.endComponent();
                break;
            case "port":
                formatPort(c.currentNode, formatter);
                break;
            case "scoped_name":
                formatter.name(c.nodeText);
                break;
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            case "body":
                const c2 = cursor as Grammar.CursorPosition<typeof c.currentNode>;
                cursor.gotoFirstChild();
                do {
                    switch (c2.nodeType) {
                        case "behavior":
                            formatBehavior(c2.currentNode, formatter);
                            break;
                        case "system":
                            formatSystem(c2.currentNode, formatter);
                            break;
                        case "comment":
                            formatComment(c2.currentNode, formatter);
                            break;
                        default:
                            assertNever(c2);
                            throw `cannot format component child ${cursor.nodeType}`;
                    }
                } while (cursor.gotoNextSibling());

                cursor.gotoParent();
                break;
            default:
                assertNever(c);
                throw `cannot format component child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatPort(node: Grammar.port_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;
    do {
        switch (c.nodeType) {
            case "port_direction":
                formatter.startPort(c.nodeText);
                break;
            case "port_qualifiers":
                formatter.keyword(c.nodeText);
                break;
            case "compound_name":
                formatter.type(c.nodeText);
                break;
            case "port_name":
                formatter.name(c.nodeText);
                break;
            case "formals":
                formatFormals(c.currentNode, formatter);
                break;
            case ";":
                formatter.semicolon();
                formatter.endPort();
                break;
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format interface body child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatSystem(node: Grammar.system_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;
    do {
        switch (c.nodeType) {
            case "system":
                formatter.startSystem();
                break;
            case "system_body":
                const c2 = cursor as Grammar.CursorPosition<typeof c.currentNode>;
                cursor.gotoFirstChild();
                do {
                    switch (c2.nodeType) {
                        case "{":
                            formatter.openScopedBlock();
                            break;
                        case "}":
                            formatter.endSystem();
                            break;
                        case "binding":
                            formatBinding(c2.currentNode, formatter);
                            break;
                        case "instance":
                            formatInstance(c2.currentNode, formatter);
                            break;
                        case "comment":
                            formatComment(c2.currentNode, formatter);
                            break;
                        default:
                            assertNever(c2);
                            throw `cannot format component child ${cursor.nodeType}`;
                    }
                } while (cursor.gotoNextSibling());

                cursor.gotoParent();
                break;
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format system child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatBinding(node: Grammar.binding_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;

    formatter.startBinding();

    do {
        switch (c.nodeType) {
            case "end_point":
                formatCompoundName(c.currentNode, formatter);
                break;
            case "<=>":
                formatter.binaryOperator(c.nodeText);
                break;
            case ";":
                formatter.endBinding();
                break;
            // generics
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format binding child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatInstance(node: Grammar.instance_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;

    formatter.startInstance();

    do {
        switch (c.nodeType) {
            case "compound_name":
                formatter.type(c.nodeText);
                break;
            case "name":
                formatter.name(c.nodeText);
                break;
            case ";":
                formatter.endInstance();
                break;
            // generics
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format instance child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatBehavior(node: Grammar.behavior_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;
    do {
        switch (c.nodeType) {
            case "behavior":
            case "behaviour":
                formatter.startBehavior();
                break;
            case "name":
                formatter.name(c.nodeText);
                break;
            case "behavior_body":
                cursor.gotoFirstChild();
                const c2 = cursor as Grammar.CursorPosition<typeof c.currentNode>;
                do {
                    switch (c2.nodeType) {
                        case "{":
                            formatter.openScopedBlock();
                            break;
                        case "}":
                            formatter.endBehavior();
                            break;
                        case "function":
                            formatFunction(c2.currentNode, formatter);
                            break;
                        case "enum":
                            formatEnum(c2.currentNode, formatter);
                            break;
                        case "variable":
                            formatVariable(c2.currentNode, formatter);
                            break;
                        case "guard":
                            formatGuard(c2.currentNode, formatter);
                            break;
                        case "int":
                            formatInt(c2.currentNode, formatter);
                            break;
                        case "compound":
                            formatCompound(c2.currentNode, formatter);
                            break;
                        case "extern":
                            formatExtern(c2.currentNode, formatter);
                            break;
                        case "on":
                            formatOn(c2.currentNode, formatter);
                            break;
                        case "blocking":
                            formatBlocking(c2.currentNode, formatter);
                            break;
                        // generics
                        case "comment":
                            formatComment(c2.currentNode, formatter);
                            break;
                        default:
                            assertNever(c2);
                            throw `cannot format behavior body child ${cursor.nodeType}`;
                    }
                } while (cursor.gotoNextSibling());

                // back up to parent
                cursor.gotoParent();
                break;
            // generics
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format behavior child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatGuard(node: Grammar.guard_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;
    do {
        switch (c.nodeType) {
            case "[":
                formatter.startGuard();
                break;
            case "]":
                formatter.endGuard();
                break;
            case "compound_name":
                formatCompoundName(c.currentNode, formatter);
                break;
            case "compound":
                formatCompound(c.currentNode, formatter);
                break;
            case "action":
                formatter.requirePrecedingNewLine();
                formatAction(c.currentNode, formatter);
                break;
            case "assign":
                formatter.requirePrecedingNewLine();
                formatAssign(c.currentNode, formatter);
                break;
            case "binary_expression":
                formatBinaryExpression(c.currentNode, formatter);
                break;
            case "blocking":
                formatBlocking(c.currentNode, formatter);
                break;
            case "call":
                formatCall(c.currentNode, formatter);
                break;
            case "defer":
                formatDefer(c.currentNode, formatter);
                break;
            case "dollars":
                formatDollars(c.currentNode, formatter);
                break;
            case "group":
                formatGroup(c.currentNode, formatter);
                break;
            case "guard":
                formatGuard(c.currentNode, formatter);
                break;
            case "if_statement":
                formatIfStatement(c.currentNode, formatter);
                break;
            case "illegal":
                formatter.keyword("illegal");
                break;
            case "literal":
                formatter.literal(c.nodeText);
                break;
            case "skip_statement":
                formatter.semicolon();
                break;
            case "on":
                formatter.requirePrecedingNewLine();
                formatOn(c.currentNode, formatter);
                break;
            case "otherwise":
                formatter.keyword("otherwise");
                break;
            case "reply":
                formatReply(c.currentNode, formatter);
                break;
            case "interface_action":
                formatter.requirePrecedingNewLine();
                formatCompoundName(c.currentNode, formatter);
                break;
            case ";":
                formatter.semicolon();
                break;
            case "variable":
                formatter.requirePrecedingNewLine();
                formatVariable(c.currentNode, formatter);
                break;
            case "unary_expression":
                formatUnaryExpression(c.currentNode, formatter);
                break;
            case "return":
                formatter.requirePrecedingNewLine();
                formatReturn(c.currentNode, formatter);
                break;
            // generics
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format guard child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatVariable(node: Grammar.variable_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;

    formatter.startVariable();

    do {
        switch (c.nodeType) {
            case "type_name":
                formatCompoundName(c.currentNode, formatter);
                break;
            case "var_name":
                formatCompoundName(c.currentNode, formatter);
                break;
            case "=":
                formatter.binaryOperator("=");
                break;
            case "unary_expression":
                formatUnaryExpression(c.currentNode, formatter);
                break;
            case "compound_name":
                formatCompoundName(c.currentNode, formatter);
                break;
            case "call":
                formatCall(c.currentNode, formatter);
                break;
            case "action":
                formatAction(c.currentNode, formatter);
                break;
            case "binary_expression":
                formatBinaryExpression(c.currentNode, formatter);
                break;
            case "dollars":
                formatDollars(c.currentNode, formatter);
                break;
            case "group":
                formatGroup(c.currentNode, formatter);
                break;
            case "literal":
                formatter.literal(c.nodeText);
                break;
            case ";":
                formatter.endVariable();
                break;
            // generics
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format variable child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatFunction(node: Grammar.function_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;
    do {
        switch (c.nodeType) {
            case "type_name":
                formatter.startFunction(c.nodeText);
                break;
            case "name":
                formatter.name(c.nodeText);
                break;
            case "formals":
                formatFormals(c.currentNode, formatter);
                break;
            case "compound":
                formatCompound(c.currentNode, formatter);
                formatter.endFunction();
                break;
            // generics
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format function child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatFormals(node: Grammar.formals_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;
    do {
        switch (c.nodeType) {
            case "(":
                formatter.startFormals();
                break;
            case ")":
                formatter.endFormals();
                break;
            case ",":
                formatter.nextFormal();
                break;
            case "formal":
                formatFormal(c.currentNode, formatter);
                break;
            // generics
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format formals child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatFormal(node: Grammar.formal_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;
    do {
        switch (c.nodeType) {
            case "formal_direction":
                formatter.keyword(c.nodeText);
                break;
            case "type_name":
                formatter.name(c.nodeText);
                break;
            case "var_name":
                formatter.name(c.nodeText);
                break;
            // generics
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format formal child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatCompound(node: Grammar.compound_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;
    do {
        switch (c.nodeType) {
            case "{":
                formatter.openScopedBlock();
                break;
            case "}":
                formatter.closeScopedBlock();
                break;
            case "assign":
                formatter.requirePrecedingNewLine();
                formatAssign(c.currentNode, formatter);
                break;
            case "blocking":
                formatBlocking(c.currentNode, formatter);
                break;
            case "call":
                formatCall(c.currentNode, formatter);
                break;
            case "defer":
                formatDefer(c.currentNode, formatter);
                break;
            case "guard":
                formatGuard(c.currentNode, formatter);
                break;
            case "if_statement":
                formatIfStatement(c.currentNode, formatter);
                break;
            case "illegal":
                formatter.keyword("illegal");
                break;
            case "skip_statement":
                formatter.semicolon();
                break;
            case "on":
                formatter.requirePrecedingNewLine();
                formatOn(c.currentNode, formatter);
                break;
            case "reply":
                formatReply(c.currentNode, formatter);
                break;
            case "interface_action":
                formatter.requirePrecedingNewLine();
                formatCompoundName(c.currentNode, formatter);
                break;
            case ";":
                formatter.semicolon();
                break;
            case "compound":
                formatCompound(c.currentNode, formatter);
                break;
            case "variable":
                formatter.requirePrecedingNewLine();
                formatVariable(c.currentNode, formatter);
                break;
            case "action":
                formatter.requirePrecedingNewLine();
                formatAction(c.currentNode, formatter);
                break;
            case "return":
                formatter.requirePrecedingNewLine();
                formatReturn(c.currentNode, formatter);
                break;
            // generics
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format compound child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatReturn(node: Grammar.return_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;
    do {
        switch (c.nodeType) {
            case "return":
                formatter.return();
                break;
            case ";":
                formatter.semicolon();
                break;
            case "action":
                formatAction(c.currentNode, formatter);
                break;
            case "binary_expression":
                formatBinaryExpression(c.currentNode, formatter);
                break;
            case "call":
                formatCall(c.currentNode, formatter);
                break;
            case "compound_name":
                formatCompoundName(c.currentNode, formatter);
                break;
            case "dollars":
                formatDollars(c.currentNode, formatter);
                break;
            case "group":
                formatGroup(c.currentNode, formatter);
                break;
            case "literal":
                formatter.literal(c.nodeText);
                break;
            case "unary_expression":
                formatUnaryExpression(c.currentNode, formatter);
                break;
            // generics
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format return child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatOn(node: Grammar.on_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;
    do {
        switch (c.nodeType) {
            case "on":
                formatter.startOn();
                break;
            case "triggers":
                formatTriggers(c.currentNode, formatter);
                break;
            case ":":
                formatter.colon();
                break;
            case ";":
                formatter.semicolon();
                break;
            case "compound":
                formatCompound(c.currentNode, formatter);
                break;
            case "action":
                formatAction(c.currentNode, formatter);
                break;
            case "assign":
                formatAssign(c.currentNode, formatter);
                break;
            case "blocking":
                formatBlocking(c.currentNode, formatter);
                break;
            case "call":
                formatCall(c.currentNode, formatter);
                break;
            case "defer":
                formatDefer(c.currentNode, formatter);
                break;
            case "guard":
                formatGuard(c.currentNode, formatter);
                break;
            case "if_statement":
                formatIfStatement(c.currentNode, formatter);
                break;
            case "illegal":
                formatter.keyword("illegal");
                formatter.semicolon();
                break;
            case "interface_action":
                formatCompoundName(c.currentNode, formatter);
                break;
            case "reply":
                formatReply(c.currentNode, formatter);
                break;
            case "return":
                formatReturn(c.currentNode, formatter);
                break;
            case "skip_statement":
                formatter.semicolon();
                break;
            case "variable":
                formatVariable(c.currentNode, formatter);
                break;
            // generics
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format on child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatBlocking(node: Grammar.blocking_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;
    do {
        switch (c.nodeType) {
            case "blocking":
                formatter.keyword("blocking");
                break;
            case "on":
                formatOn(c.currentNode, formatter);
                break;
            case ";":
                formatter.semicolon();
                break;
            case "action":
                formatter.requirePrecedingNewLine();
                formatAction(c.currentNode, formatter);
                break;
            case "assign":
                formatter.requirePrecedingNewLine();
                formatAssign(c.currentNode, formatter);
                break;
            case "call":
                formatCall(c.currentNode, formatter);
                break;
            case "compound":
                formatCompound(c.currentNode, formatter);
                break;
            case "defer":
                formatDefer(c.currentNode, formatter);
                break;
            case "guard":
                formatGuard(c.currentNode, formatter);
                break;
            case "if_statement":
                formatIfStatement(c.currentNode, formatter);
                break;
            case "illegal":
                formatter.keyword("illegal");
                break;
            case "interface_action":
                formatter.requirePrecedingNewLine();
                formatCompoundName(c.currentNode, formatter);
                break;
            case "on":
                formatter.requirePrecedingNewLine();
                formatOn(c.currentNode, formatter);
                break;
            case "reply":
                formatReply(c.currentNode, formatter);
                break;
            case "return":
                formatReturn(c.currentNode, formatter);
                break;
            case "skip_statement":
                formatter.semicolon();
                break;
            case "variable":
                formatter.requirePrecedingNewLine();
                formatVariable(c.currentNode, formatter);
                break;
            // generics
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format blocking child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatTriggers(node: Grammar.triggers_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;
    do {
        switch (c.nodeType) {
            case "trigger":
                cursor.gotoFirstChild();
                const c2 = cursor as Grammar.CursorPosition<typeof c.currentNode>;
                do {
                    switch (c2.nodeType) {
                        case "optional":
                            formatter.keyword("optional");
                            break;
                        case "inevitable":
                            formatter.keyword("inevitable");
                            break;
                        case "event_name":
                            formatCompoundName(c2.currentNode, formatter);
                            break;
                        case "port_event":
                            formatCompoundName(c2.currentNode, formatter);
                            break;
                        // generics
                        case "comment":
                            formatComment(c2.currentNode, formatter);
                            break;
                        default:
                            assertNever(c2);
                            throw `cannot format trigger child ${cursor.nodeType}`;
                    }
                } while (cursor.gotoNextSibling());

                cursor.gotoParent();
                break;
            case ",":
                formatter.nextTrigger();
                break;
            // generics
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format triggers child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatAssign(node: Grammar.assign_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;

    formatter.startVariable();

    do {
        switch (c.nodeType) {
            case "var":
                formatCompoundName(c.currentNode, formatter);
                break;
            case "compound_name":
                formatCompoundName(c.currentNode, formatter);
                break;
            case "=":
                formatter.binaryOperator("=");
                break;
            case ";":
                formatter.endVariable();
                break;
            case "action":
                formatAction(c.currentNode, formatter);
                break;
            case "binary_expression":
                formatBinaryExpression(c.currentNode, formatter);
                break;
            case "call":
                formatCall(c.currentNode, formatter);
                break;
            case "dollars":
                formatDollars(c.currentNode, formatter);
                break;
            case "group":
                formatGroup(c.currentNode, formatter);
                break;
            case "literal":
                formatter.literal(c.nodeText);
                break;
            case "unary_expression":
                formatUnaryExpression(c.currentNode, formatter);
                break;
            // generics
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format assign child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatDefer(node: Grammar.defer_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;
    do {
        switch (c.nodeType) {
            case "defer":
                formatter.keyword("defer");
                break;
            case "arguments":
                formatArguments(c.currentNode, formatter);
                break;
            case ";":
                formatter.semicolon();
                break;
            case "action":
                formatAction(c.currentNode, formatter);
                break;
            case "call":
                formatCall(c.currentNode, formatter);
                break;
            case "variable":
                formatVariable(c.currentNode, formatter);
                break;
            case "assign":
                formatAssign(c.currentNode, formatter);
                break;
            case "compound":
                formatCompound(c.currentNode, formatter);
                break;
            case "if_statement":
                formatIfStatement(c.currentNode, formatter);
                break;
            case "illegal":
                formatter.keyword("illegal");
                break;
            case "interface_action":
                formatter.name(c.nodeText);
                break;
            case "reply":
                formatReply(c.currentNode, formatter);
                break;
            case "return":
                formatReturn(c.currentNode, formatter);
                break;
            case "skip_statement":
                formatter.semicolon();
                break;
            // generics
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format defer child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatIfStatement(node: Grammar.if_statement_Node, formatter: Formatter) {
    throw "TODO if statement";
}

function formatImport(node: Grammar.import_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;
    do {
        switch (c.nodeType) {
            case "import":
                formatter.keyword(c.nodeText);
                break;
            case "file_name":
                formatter.name(c.nodeText);
                break;
            case ";":
                formatter.semicolon();
                break;
            // generics
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format import child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatExtern(node: Grammar.extern_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;
    do {
        switch (c.nodeType) {
            case "extern":
                formatter.keyword("extern");
                break;
            case "scoped_name":
                formatter.name(c.nodeText);
                break;
            case "dollars_content":
                formatter.verbatim(c.nodeText);
                break;
            case "$":
                formatter.dollar();
                break;
            case ";":
                formatter.semicolon();
                break;
            // generics
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format extern child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatInt(node: Grammar.int_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;
    do {
        switch (c.nodeType) {
            case "subint":
                formatter.requirePrecedingNewLine();
                formatter.keyword("subint");
                break;
            case "scoped_name":
                formatCompoundName(c.currentNode, formatter);
                break;
            case "{":
                formatter.verbatim("{");
                break;
            case "number":
                formatter.literal(node.text);
                break;
            case "..":
                formatter.binaryOperator("..");
                break;
            case "}":
                formatter.verbatim("}");
                break;
            case ";":
                formatter.semicolon();
                break;
            // generics
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format int child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatReply(node: Grammar.reply_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;
    do {
        switch (c.nodeType) {
            case "reply":
                formatter.keyword("reply");
                break;
            case "(":
                formatter.openParen();
                break;
            case ")":
                formatter.closeParen();
                break;
            case ".":
                formatter.dot();
                break;
            case ";":
                formatter.semicolon();
                break;
            case "action":
                formatAction(c.currentNode, formatter);
                break;
            case "binary_expression":
                formatBinaryExpression(c.currentNode, formatter);
                break;
            case "call":
                formatCall(c.currentNode, formatter);
                break;
            case "compound_name":
                formatCompoundName(c.currentNode, formatter);
                break;
            case "dollars":
                formatDollars(c.currentNode, formatter);
                break;
            case "group":
                formatGroup(c.currentNode, formatter);
                break;
            case "literal":
                formatter.literal(c.nodeText);
                break;
            case "port_name":
                formatCompoundName(c.currentNode, formatter);
                break;
            case "unary_expression":
                formatUnaryExpression(c.currentNode, formatter);
                break;
            // generics
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format reply child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

// Expressions

function formatUnaryExpression(node: Grammar.unary_expression_Node, formatter: Formatter) {
    throw "TODO unary expression";
}

function formatBinaryExpression(node: Grammar.binary_expression_Node, formatter: Formatter) {
    throw "TODO binary expression";
}

function formatCall(node: Grammar.call_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;
    do {
        switch (c.nodeType) {
            case "name":
                formatter.name(c.nodeText);
                break;
            case "arguments":
                formatArguments(c.currentNode, formatter);
                break;
            // generics
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format call child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatArguments(node: Grammar.arguments_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;
    do {
        switch (c.nodeType) {
            case "(":
                formatter.openParen();
                break;
            case ")":
                formatter.closeParen();
                break;
            case ",":
                formatter.comma();
                break;
            case "action":
                formatAction(c.currentNode, formatter);
                break;
            case "binary_expression":
                formatBinaryExpression(c.currentNode, formatter);
                break;
            case "call":
                formatCall(c.currentNode, formatter);
                break;
            case "compound_name":
                formatCompoundName(c.currentNode, formatter);
                break;
            case "dollars":
                formatDollars(c.currentNode, formatter);
                break;
            case "group":
                formatGroup(c.currentNode, formatter);
                break;
            case "literal":
                formatter.literal(c.nodeText);
                break;
            case "unary_expression":
                formatUnaryExpression(c.currentNode, formatter);
                break;
            // generics
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format arguments child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatAction(node: Grammar.action_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;
    do {
        switch (c.nodeType) {
            case "port_name":
                formatter.name(c.nodeText);
                break;
            case ".":
                formatter.dot();
                break;
            case "name":
                formatter.name(c.nodeText);
                break;
            case "arguments":
                formatArguments(c.currentNode, formatter);
                break;
            // generics
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format action child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatDollars(node: Grammar.dollars_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;
    do {
        switch (c.nodeType) {
            case "dollars_content":
                formatter.verbatim(c.nodeText);
                break;
            case "$":
                formatter.dollar();
                break;
            // generics
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format dollars child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatGroup(node: Grammar.group_Node, formatter: Formatter) {
    const cursor = node.walk();
    cursor.gotoFirstChild();
    const c = cursor as Grammar.CursorPosition<typeof node>;
    do {
        switch (c.nodeType) {
            case "(":
                formatter.openParen();
                break;
            case ")":
                formatter.closeParen();
                break;
            case "action":
                formatAction(c.currentNode, formatter);
                break;
            case "binary_expression":
                formatBinaryExpression(c.currentNode, formatter);
                break;
            case "call":
                formatCall(c.currentNode, formatter);
                break;
            case "compound_name":
                formatCompoundName(c.currentNode, formatter);
                break;
            case "dollars":
                formatDollars(c.currentNode, formatter);
                break;
            case "group":
                formatGroup(c.currentNode, formatter);
                break;
            case "literal":
                formatter.literal(c.nodeText);
                break;
            case "unary_expression":
                formatUnaryExpression(c.currentNode, formatter);
                break;
            // generics
            case "comment":
                formatComment(c.currentNode, formatter);
                break;
            default:
                assertNever(c);
                throw `cannot format group child ${cursor.nodeType}`;
        }
    } while (cursor.gotoNextSibling());
}

function formatCompoundName(
    name:
        | Grammar.end_point_Node
        | Grammar.event_name_Node
        | Grammar.port_event_Node
        | Grammar.type_name_Node
        | Grammar.var_name_Node
        | Grammar.compound_name_Node
        | Grammar.var_Node
        | Grammar.interface_action_Node
        | Grammar.port_name_Node
        | Grammar.scoped_name_Node,
    formatter: Formatter
) {
    formatter.name(name.text.replace(/\s/g, ""));
}
