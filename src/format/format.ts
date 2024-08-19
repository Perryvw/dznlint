import { DEFAULT_DZNLINT_FORMAT_CONFIG } from "../config/default-config";
import { DznLintFormatConfiguration, DznLintFormatUserConfiguration } from "../config/dznlint-configuration";
import { treeSitterParse } from "../parse";
import { InputSource } from "../semantics/program";
import { Formatter } from "./formatter";
import * as Grammar from "../grammar/tree-sitter-types-formatter";
import { WhitespaceSensitiveCursor } from "./whitespace-sensitive-cursor";

export async function format(source: InputSource, config?: DznLintFormatUserConfiguration): Promise<string> {
    const fullConfig: DznLintFormatConfiguration = {
        indent: config?.indent ?? DEFAULT_DZNLINT_FORMAT_CONFIG.indent,
        braces: config?.braces ?? DEFAULT_DZNLINT_FORMAT_CONFIG.braces,
        indent_components_interfaces:
            config?.indent_components_interfaces ?? DEFAULT_DZNLINT_FORMAT_CONFIG.indent_components_interfaces,
        target_width: config?.target_width ?? DEFAULT_DZNLINT_FORMAT_CONFIG.target_width,
    };
    const formatter = new Formatter(fullConfig);
    const tree = (await treeSitterParse(source)) as Grammar.BaseNode as Grammar.root_Node;
    formatRoot(new WhitespaceSensitiveCursor(tree) as Grammar.CursorPosition<Grammar.root_Node>, formatter);
    const formatted = formatter.toString();
    return formatted.endsWith("\n") ? formatted : formatted + "\n";
}

// Sanity check to help verify we handled all possible cases in the if statement
function assertNever(x: never): void {
    console.log("never", x);
}

// Statements

function formatRoot(cursor: Grammar.CursorPosition<Grammar.root_Node>, formatter: Formatter) {
    if (cursor.gotoFirstChild()) {
        do {
            switch (cursor.nodeType) {
                case "import":
                    formatter.requirePrecedingNewLine();
                    formatImport(cursor.pos(), formatter);
                    break;
                case "interface":
                    formatter.requirePrecedingNewLine();
                    formatInterface(cursor.pos(), formatter);
                    break;
                case "component":
                    formatter.requirePrecedingNewLine();
                    formatComponent(cursor.pos(), formatter);
                    break;
                case "extern":
                    formatter.requirePrecedingNewLine();
                    formatExtern(cursor.pos(), formatter);
                    break;
                case "dollars":
                    formatter.requirePrecedingNewLine();
                    formatDollars(cursor.pos(), formatter);
                    break;
                case "enum":
                    formatter.requirePrecedingNewLine();
                    formatEnum(cursor.pos(), formatter);
                    break;
                case "int":
                    formatter.requirePrecedingNewLine();
                    formatInt(cursor.pos(), formatter);
                    break;
                case "namespace":
                    formatter.requirePrecedingNewLine();
                    formatNamespace(cursor, formatter);
                    break;
                // generics
                case "comment":
                    formatComment(cursor.currentNode, formatter);
                    break;
                case "ERROR":
                    formatter.verbatim(cursor.nodeText);
                    break;
                case "whiteline":
                    formatter.whiteline();
                    break;
                default:
                    assertNever(cursor);
                    throw `cannot format root child ${cursor}`;
            }
        } while (cursor.gotoNextSibling());
    }
}

function formatComment(node: Grammar.comment_Node, formatter: Formatter) {
    if (!node.trailing) {
        formatter.requirePrecedingNewLine();
    } else {
        for (let i = 0; i < node.trailingSpaces; ++i) {
            // Preserve spaces before comment
            formatter.space();
        }
    }
    const isSingleLine = node.text.startsWith("//");
    if (isSingleLine) {
        formatter.singleLineComment(node.text);
    } else if (node.leading) {
        formatter.leadingComment(node.text);
    } else {
        formatter.multiLineComment(node.text);
    }
}

function formatNamespace(cursor: Grammar.CursorPosition<Grammar.namespace_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
            case "namespace":
                if (cursor.currentNode.isNamed) {
                    formatNamespace(cursor, formatter);
                } else {
                    formatter.keyword("namespace");
                }
                break;
            case "compound_name":
                formatCompoundName(cursor.currentNode, formatter);
                break;
            case "{":
                formatter.openNamespaceBrace();
                break;
            case "}":
                formatter.closeNamespaceBrace();
                break;
            case "interface":
                formatInterface(cursor.pos(), formatter);
                break;
            case "component":
                formatComponent(cursor.pos(), formatter);
                break;
            case "enum":
                formatEnum(cursor.pos(), formatter);
                break;
            case "extern":
                formatExtern(cursor.pos(), formatter);
                break;
            case "int":
                formatInt(cursor.pos(), formatter);
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format namespace member ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatInterface(cursor: Grammar.CursorPosition<Grammar.interface_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
            case "interface":
                formatter.startInterface();
                break;
            case "scoped_name":
                formatter.name(cursor.nodeText);
                break;
            case "interface_body":
                formatInterfaceBody(cursor.pos(), formatter);
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format interface member ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatInterfaceBody(cursor: Grammar.CursorPosition<Grammar.interface_body_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
            case "{":
                formatter.openScopedBlock();
                break;
            case "enum":
                formatEnum(cursor.pos(), formatter);
                break;
            case "}":
                formatter.endInterface();
                break;
            case "behavior":
                formatBehavior(cursor.pos(), formatter);
                break;
            case "event":
                formatEvent(cursor.pos(), formatter);
                break;
            case "int":
                formatInt(cursor.pos(), formatter);
                break;
            case "extern":
                formatExtern(cursor.pos(), formatter);
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format interface body child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatEvent(cursor: Grammar.CursorPosition<Grammar.event_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
            case "direction":
                formatter.startEvent(cursor.nodeText);
                break;
            case "type_name":
                formatCompoundName(cursor.currentNode, formatter);
                break;
            case "event_name":
                formatter.name(cursor.nodeText);
                break;
            case "formals":
                formatFormals(cursor.pos(), formatter);
                break;
            case ";":
                formatter.endEvent();
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format event child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatEnum(cursor: Grammar.CursorPosition<Grammar.enum_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
            case "enum":
                formatter.startEnum();
                break;
            case "scoped_name":
                formatter.name(cursor.nodeText);
                break;
            case ";":
                formatter.endEnum();
                break;
            case "fields": {
                cursor.gotoFirstChild();
                const c2 = cursor.pos();
                do {
                    switch (c2.nodeType) {
                        case "{":
                            formatter.openScopedBlock();
                            break;
                        case "name":
                            formatter.requirePrecedingNewLine();
                            formatter.enumMember(c2.nodeText);
                            break;
                        case ",":
                            formatter.nextEnumMember();
                            break;
                        case "}":
                            formatter.closeScopedBlock();
                            break;
                        // generics
                        case "comment":
                            formatComment(c2.currentNode, formatter);
                            break;
                        case "ERROR":
                            formatter.verbatim(cursor.nodeText);
                            break;
                        case "whiteline":
                            formatter.whiteline();
                            break;
                        default:
                            assertNever(c2);
                            throw `cannot format enum field ${cursor.nodeType}`;
                    }
                } while (cursor.gotoNextSibling());

                // back up to parent
                cursor.gotoParent();
                break;
            }
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format enum member ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatComponent(cursor: Grammar.CursorPosition<Grammar.component_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
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
                formatPort(cursor.pos(), formatter);
                break;
            case "scoped_name":
                formatter.name(cursor.nodeText);
                break;
            case "body": {
                const c2 = cursor as unknown as Grammar.CursorPosition<typeof cursor.currentNode>;
                cursor.gotoFirstChild();
                do {
                    switch (c2.nodeType) {
                        case "behavior":
                            formatBehavior(c2.pos(), formatter);
                            break;
                        case "system":
                            formatSystem(c2.pos(), formatter);
                            break;
                        // generics
                        case "comment":
                            formatComment(c2.currentNode, formatter);
                            break;
                        case "ERROR":
                            formatter.verbatim(cursor.nodeText);
                            break;
                        case "whiteline":
                            formatter.whiteline();
                            break;
                        default:
                            assertNever(c2);
                            throw `cannot format component child ${cursor.nodeType}`;
                    }
                } while (cursor.gotoNextSibling());

                cursor.gotoParent();
                break;
            }
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format component child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatPort(cursor: Grammar.CursorPosition<Grammar.port_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
            case "port_direction":
                formatter.startPort(cursor.nodeText);
                break;
            case "port_qualifiers":
                formatter.keyword(cursor.nodeText);
                break;
            case "compound_name":
                formatter.type(cursor.nodeText);
                break;
            case "port_name":
                formatter.name(cursor.nodeText);
                break;
            case "formals":
                formatFormals(cursor.pos(), formatter);
                break;
            case ";":
                formatter.semicolon();
                formatter.endPort();
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format interface body child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatSystem(cursor: Grammar.CursorPosition<Grammar.system_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
            case "system":
                formatter.startSystem();
                break;
            case "system_body": {
                const c2 = cursor.pos();
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
                            formatBinding(c2.pos(), formatter);
                            break;
                        case "instance":
                            formatInstance(c2.pos(), formatter);
                            break;
                        // generics
                        case "comment":
                            formatComment(c2.currentNode, formatter);
                            break;
                        case "ERROR":
                            formatter.verbatim(cursor.nodeText);
                            break;
                        case "whiteline":
                            formatter.whiteline();
                            break;
                        default:
                            assertNever(c2);
                            throw `cannot format component child ${cursor.nodeType}`;
                    }
                } while (cursor.gotoNextSibling());

                cursor.gotoParent();
                break;
            }
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format system child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatBinding(cursor: Grammar.CursorPosition<Grammar.binding_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();

    formatter.startBinding();

    do {
        switch (cursor.nodeType) {
            case "end_point":
                formatCompoundName(cursor.currentNode, formatter);
                break;
            case "<=>":
                formatter.binaryOperator(cursor.nodeText);
                break;
            case ";":
                formatter.endBinding();
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format binding child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatInstance(cursor: Grammar.CursorPosition<Grammar.instance_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();

    formatter.startInstance();

    do {
        switch (cursor.nodeType) {
            case "compound_name":
                formatter.type(cursor.nodeText);
                break;
            case "name":
                formatter.name(cursor.nodeText);
                break;
            case ";":
                formatter.endInstance();
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format instance child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatBehavior(cursor: Grammar.CursorPosition<Grammar.behavior_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
            case "behavior":
            case "behaviour":
                formatter.startBehavior();
                break;
            case "name":
                formatter.name(cursor.nodeText);
                break;
            case "behavior_body": {
                cursor.gotoFirstChild();
                const c2 = cursor.pos();
                do {
                    switch (c2.nodeType) {
                        case "{":
                            formatter.openScopedBlock();
                            break;
                        case "}":
                            formatter.endBehavior();
                            break;
                        case "function":
                            formatter.requirePrecedingNewLine();
                            formatFunction(c2.pos(), formatter);
                            break;
                        case "enum":
                            formatter.requirePrecedingNewLine();
                            formatEnum(c2.pos(), formatter);
                            break;
                        case "variable":
                            formatter.requirePrecedingNewLine();
                            formatVariable(c2.pos(), formatter);
                            break;
                        case "guard":
                            formatter.requirePrecedingNewLine();
                            formatGuard(c2, formatter);
                            break;
                        case "int":
                            formatter.requirePrecedingNewLine();
                            formatInt(c2.pos(), formatter);
                            break;
                        case "compound":
                            formatter.requirePrecedingNewLine();
                            formatCompound(c2, formatter);
                            break;
                        case "extern":
                            formatter.requirePrecedingNewLine();
                            formatExtern(c2.pos(), formatter);
                            break;
                        case "on":
                            formatter.requirePrecedingNewLine();
                            formatOn(c2, formatter);
                            break;
                        case "blocking":
                            formatter.requirePrecedingNewLine();
                            formatBlocking(c2, formatter);
                            break;
                        // generics
                        case "comment":
                            formatComment(c2.currentNode, formatter);
                            break;
                        case "ERROR":
                            formatter.verbatim(cursor.nodeText);
                            break;
                        case "whiteline":
                            formatter.whiteline();
                            break;
                        default:
                            assertNever(c2);
                            throw `cannot format behavior body child ${cursor.nodeType}`;
                    }
                } while (cursor.gotoNextSibling());

                // back up to parent
                cursor.gotoParent();
                break;
            }
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format behavior child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatGuard(cursor: Grammar.CursorPosition<Grammar.guard_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
            case "[":
                formatter.startGuard();
                break;
            case "]":
                formatter.endGuard();
                break;
            case "compound_name":
                formatCompoundName(cursor.currentNode, formatter);
                break;
            case "compound":
                formatCompound(cursor, formatter);
                break;
            case "action":
                formatAction(cursor.pos(), formatter);
                break;
            case "assign":
                formatAssign(cursor.pos(), formatter);
                break;
            case "binary_expression":
                formatBinaryExpression(cursor, formatter);
                break;
            case "blocking":
                formatBlocking(cursor, formatter);
                break;
            case "call":
                formatCall(cursor.pos(), formatter);
                break;
            case "defer":
                formatDefer(cursor, formatter);
                break;
            case "dollars":
                formatDollars(cursor.pos(), formatter);
                break;
            case "group":
                formatGroup(cursor, formatter);
                break;
            case "guard":
                formatGuard(cursor, formatter);
                break;
            case "if_statement":
                formatIfStatement(cursor, formatter);
                break;
            case "illegal":
                formatter.keyword("illegal");
                break;
            case "literal":
                formatter.literal(cursor.nodeText);
                break;
            case "skip_statement":
                formatter.semicolon();
                break;
            case "on":
                formatOn(cursor, formatter);
                break;
            case "otherwise":
                formatter.keyword("otherwise");
                break;
            case "reply":
                formatReply(cursor.pos(), formatter);
                break;
            case "interface_action":
                formatCompoundName(cursor.currentNode, formatter);
                break;
            case ";":
                formatter.semicolon();
                break;
            case "variable":
                formatVariable(cursor.pos(), formatter);
                break;
            case "unary_expression":
                formatUnaryExpression(cursor, formatter);
                break;
            case "return":
                formatReturn(cursor.pos(), formatter);
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format guard child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatVariable(cursor: Grammar.CursorPosition<Grammar.variable_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();

    formatter.startVariable();

    do {
        switch (cursor.nodeType) {
            case "type_name":
                formatCompoundName(cursor.currentNode, formatter);
                break;
            case "var_name":
                formatCompoundName(cursor.currentNode, formatter);
                break;
            case "=":
                formatter.binaryOperator("=");
                break;
            case "unary_expression":
                formatUnaryExpression(cursor, formatter);
                break;
            case "compound_name":
                formatCompoundName(cursor.currentNode, formatter);
                break;
            case "call":
                formatCall(cursor.pos(), formatter);
                break;
            case "action":
                formatAction(cursor.pos(), formatter);
                break;
            case "binary_expression":
                formatBinaryExpression(cursor, formatter);
                break;
            case "dollars":
                formatDollars(cursor.pos(), formatter);
                break;
            case "group":
                formatGroup(cursor, formatter);
                break;
            case "literal":
                formatter.literal(cursor.nodeText);
                break;
            case ";":
                formatter.endVariable();
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format variable child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatFunction(cursor: Grammar.CursorPosition<Grammar.function_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
            case "type_name":
                formatter.startFunction(cursor.nodeText);
                break;
            case "name":
                formatter.name(cursor.nodeText);
                break;
            case "formals":
                formatFormals(cursor.pos(), formatter);
                break;
            case "compound":
                formatCompound(cursor, formatter);
                formatter.endFunction();
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format function child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatFormals(cursor: Grammar.CursorPosition<Grammar.formals_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
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
                formatFormal(cursor.pos(), formatter);
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format formals child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatFormal(cursor: Grammar.CursorPosition<Grammar.formal_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
            case "formal_direction":
                formatter.keyword(cursor.nodeText);
                break;
            case "type_name":
                formatter.name(cursor.nodeText);
                break;
            case "var_name":
                formatter.name(cursor.nodeText);
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format formal child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatCompound(cursor: Grammar.CursorPosition<Grammar.compound_Node>, formatter: Formatter) {
    if (cursor.currentNode.childCount === 2) {
        formatter.requirePrecedingSpace();
        formatter.openBrace();
        formatter.closeBrace();
        return;
    }

    const containsGuards = compoundContainsGuards(cursor);

    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
            case "{":
                formatter.openCompound(containsGuards);
                break;
            case "}":
                formatter.closeCompound();
                break;
            case "assign":
                formatter.requirePrecedingNewLine();
                formatAssign(cursor.pos(), formatter);
                break;
            case "blocking":
                formatter.requirePrecedingNewLine();
                formatBlocking(cursor, formatter);
                break;
            case "call":
                formatter.requirePrecedingNewLine();
                formatCall(cursor.pos(), formatter);
                break;
            case "defer":
                formatter.requirePrecedingNewLine();
                formatDefer(cursor, formatter);
                break;
            case "guard":
                formatter.requirePrecedingNewLine();
                formatGuard(cursor, formatter);
                break;
            case "if_statement":
                formatter.requirePrecedingNewLine();
                formatIfStatement(cursor, formatter);
                break;
            case "illegal":
                formatter.requirePrecedingNewLine();
                formatter.keyword("illegal");
                break;
            case "skip_statement":
                formatter.semicolon();
                break;
            case "on":
                formatter.requirePrecedingNewLine();
                formatOn(cursor, formatter);
                break;
            case "reply":
                formatter.requirePrecedingNewLine();
                formatReply(cursor.pos(), formatter);
                break;
            case "interface_action":
                formatter.requirePrecedingNewLine();
                formatCompoundName(cursor.currentNode, formatter);
                break;
            case ";":
                formatter.semicolon();
                break;
            case "compound":
                formatCompound(cursor, formatter);
                break;
            case "variable":
                formatter.requirePrecedingNewLine();
                formatVariable(cursor.pos(), formatter);
                break;
            case "action":
                formatter.requirePrecedingNewLine();
                formatAction(cursor.pos(), formatter);
                break;
            case "return":
                formatter.requirePrecedingNewLine();
                formatReturn(cursor.pos(), formatter);
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format compound child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatReturn(cursor: Grammar.CursorPosition<Grammar.return_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
            case "return":
                formatter.return();
                break;
            case ";":
                formatter.semicolon();
                break;
            case "action":
                formatAction(cursor.pos(), formatter);
                break;
            case "binary_expression":
                formatBinaryExpression(cursor, formatter);
                break;
            case "call":
                formatCall(cursor.pos(), formatter);
                break;
            case "compound_name":
                formatCompoundName(cursor.currentNode, formatter);
                break;
            case "dollars":
                formatDollars(cursor.pos(), formatter);
                break;
            case "group":
                formatGroup(cursor, formatter);
                break;
            case "literal":
                formatter.literal(cursor.nodeText);
                break;
            case "unary_expression":
                formatUnaryExpression(cursor, formatter);
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format return child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatOn(cursor: Grammar.CursorPosition<Grammar.on_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
            case "on":
                formatter.startOn();
                break;
            case "triggers":
                formatTriggers(cursor.pos(), formatter);
                break;
            case ":":
                formatter.colon();
                break;
            case ";":
                formatter.semicolon();
                break;
            case "compound":
                formatCompound(cursor, formatter);
                break;
            case "action":
                formatAction(cursor.pos(), formatter);
                break;
            case "assign":
                formatAssign(cursor.pos(), formatter);
                break;
            case "blocking":
                formatBlocking(cursor, formatter);
                break;
            case "call":
                formatCall(cursor.pos(), formatter);
                break;
            case "defer":
                formatDefer(cursor, formatter);
                break;
            case "guard":
                formatGuard(cursor, formatter);
                break;
            case "if_statement":
                formatIfStatement(cursor, formatter);
                break;
            case "illegal":
                formatter.keyword("illegal");
                formatter.semicolon();
                break;
            case "interface_action":
                formatCompoundName(cursor.currentNode, formatter);
                break;
            case "reply":
                formatReply(cursor.pos(), formatter);
                break;
            case "return":
                formatReturn(cursor.pos(), formatter);
                break;
            case "skip_statement":
                formatter.semicolon();
                break;
            case "variable":
                formatVariable(cursor.pos(), formatter);
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format on child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    formatter.endOn();
    cursor.gotoParent();
}

function formatBlocking(cursor: Grammar.CursorPosition<Grammar.blocking_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
            case "blocking":
                formatter.keyword("blocking");
                break;
            case "on":
                formatOn(cursor, formatter);
                break;
            case ";":
                formatter.semicolon();
                break;
            case "action":
                formatAction(cursor.pos(), formatter);
                break;
            case "assign":
                formatAssign(cursor.pos(), formatter);
                break;
            case "call":
                formatCall(cursor.pos(), formatter);
                break;
            case "compound":
                formatCompound(cursor, formatter);
                break;
            case "defer":
                formatDefer(cursor, formatter);
                break;
            case "guard":
                formatGuard(cursor, formatter);
                break;
            case "if_statement":
                formatIfStatement(cursor, formatter);
                break;
            case "illegal":
                formatter.keyword("illegal");
                break;
            case "interface_action":
                formatCompoundName(cursor.currentNode, formatter);
                break;
            case "reply":
                formatReply(cursor.pos(), formatter);
                break;
            case "return":
                formatReturn(cursor.pos(), formatter);
                break;
            case "skip_statement":
                formatter.semicolon();
                break;
            case "variable":
                formatVariable(cursor.pos(), formatter);
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format blocking child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatTriggers(cursor: Grammar.CursorPosition<Grammar.triggers_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    formatter.startTriggers();
    do {
        switch (cursor.nodeType) {
            case "trigger": {
                cursor.gotoFirstChild();
                formatter.startTrigger();
                const c2 = cursor.pos();
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
                            formatPortEvent(c2.pos(), formatter);
                            break;
                        // generics
                        case "comment":
                            formatComment(c2.currentNode, formatter);
                            break;
                        case "ERROR":
                            formatter.verbatim(cursor.nodeText);
                            break;
                        case "whiteline":
                            formatter.whiteline();
                            break;
                        default:
                            assertNever(c2);
                            throw `cannot format trigger child ${cursor.nodeType}`;
                    }
                } while (cursor.gotoNextSibling());

                cursor.gotoParent();
                break;
            }
            case ",":
                formatter.nextTrigger();
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format triggers child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    formatter.endTriggers();
    cursor.gotoParent();
}

function formatPortEvent(cursor: Grammar.CursorPosition<Grammar.port_event_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
            case "port_name":
                formatter.requirePrecedingSpace();
                formatter.name(cursor.nodeText);
                break;
            case ".":
                formatter.dot();
                break;
            case "name":
                formatter.name(cursor.nodeText);
                break;
            case "trigger_formals":
                formatTriggerFormals(cursor.pos(), formatter);
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format port event child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatTriggerFormals(cursor: Grammar.CursorPosition<Grammar.trigger_formals_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
            case "(":
                formatter.openParen();
                break;
            case ",":
                formatter.nextFormal();
                break;
            case ")":
                formatter.closeParen();
                break;
            case "trigger_formal": {
                cursor.gotoFirstChild();
                const c2 = cursor.pos();
                do {
                    switch (c2.nodeType) {
                        case "var":
                            formatCompoundName(c2.currentNode, formatter);
                            break;
                        case "<-":
                            formatter.binaryOperator("<-");
                            break;
                        // generics
                        case "comment":
                            formatComment(c2.currentNode, formatter);
                            break;
                        case "ERROR":
                            formatter.verbatim(cursor.nodeText);
                            break;
                        case "whiteline":
                            formatter.whiteline();
                            break;
                        default:
                            assertNever(c2);
                            throw `cannot format trigger formal child ${cursor.nodeType}`;
                    }
                } while (cursor.gotoNextSibling());

                cursor.gotoParent();
                break;
            }
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format trigger formals child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatAssign(cursor: Grammar.CursorPosition<Grammar.assign_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
            case "var":
                formatCompoundName(cursor.currentNode, formatter);
                break;
            case "compound_name":
                formatCompoundName(cursor.currentNode, formatter);
                break;
            case "=":
                formatter.binaryOperator("=");
                break;
            case ";":
                formatter.endVariable();
                break;
            case "action":
                formatAction(cursor.pos(), formatter);
                break;
            case "binary_expression":
                formatBinaryExpression(cursor, formatter);
                break;
            case "call":
                formatCall(cursor.pos(), formatter);
                break;
            case "dollars":
                formatDollars(cursor.pos(), formatter);
                break;
            case "group":
                formatGroup(cursor, formatter);
                break;
            case "literal":
                formatter.literal(cursor.nodeText);
                break;
            case "unary_expression":
                formatUnaryExpression(cursor, formatter);
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format assign child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatDefer(cursor: Grammar.CursorPosition<Grammar.defer_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
            case "defer":
                formatter.keyword("defer");
                break;
            case "arguments":
                formatArguments(cursor.pos(), formatter);
                break;
            case ";":
                formatter.semicolon();
                break;
            case "action":
                formatAction(cursor.pos(), formatter);
                break;
            case "call":
                formatCall(cursor.pos(), formatter);
                break;
            case "variable":
                formatVariable(cursor.pos(), formatter);
                break;
            case "assign":
                formatAssign(cursor.pos(), formatter);
                break;
            case "compound":
                formatCompound(cursor, formatter);
                break;
            case "if_statement":
                formatIfStatement(cursor, formatter);
                break;
            case "illegal":
                formatter.keyword("illegal");
                break;
            case "interface_action":
                formatter.name(cursor.nodeText);
                break;
            case "reply":
                formatReply(cursor.pos(), formatter);
                break;
            case "return":
                formatReturn(cursor.pos(), formatter);
                break;
            case "skip_statement":
                formatter.semicolon();
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format defer child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatIfStatement(cursor: Grammar.CursorPosition<Grammar.if_statement_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
            case "if":
                formatter.keyword("if");
                break;
            case "(":
                formatter.space();
                formatter.openParen();
                break;
            case ")":
                formatter.closeParen();
                break;
            case "else":
                formatter.else();
                break;
            case ";":
                formatter.semicolon();
                break;
            case "action":
                formatAction(cursor.pos(), formatter);
                break;
            case "assign":
                formatAssign(cursor.pos(), formatter);
                break;
            case "binary_expression":
                formatBinaryExpression(cursor, formatter);
                break;
            case "call":
                formatCall(cursor.pos(), formatter);
                break;
            case "compound":
                formatCompound(cursor, formatter);
                break;
            case "compound_name":
                formatCompoundName(cursor.currentNode, formatter);
                break;
            case "defer":
                formatDefer(cursor, formatter);
                break;
            case "dollars":
                formatDollars(cursor.pos(), formatter);
                break;
            case "group":
                formatGroup(cursor, formatter);
                break;
            case "if_statement":
                formatIfStatement(cursor, formatter);
                break;
            case "interface_action":
                formatter.name(cursor.nodeText);
                break;
            case "illegal":
                formatter.keyword("illegal");
                formatter.semicolon();
                break;
            case "literal":
                formatter.literal(cursor.nodeText);
                break;
            case "reply":
                formatReply(cursor.pos(), formatter);
                break;
            case "return":
                formatReturn(cursor.pos(), formatter);
                break;
            case "skip_statement":
                formatter.semicolon();
                break;
            case "unary_expression":
                formatUnaryExpression(cursor, formatter);
                break;
            case "variable":
                formatVariable(cursor.pos(), formatter);
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format ifs statement child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatImport(cursor: Grammar.CursorPosition<Grammar.import_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
            case "import":
                formatter.keyword(cursor.nodeText);
                break;
            case "file_name":
                formatter.name(cursor.nodeText);
                break;
            case ";":
                formatter.semicolon();
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format import child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatExtern(cursor: Grammar.CursorPosition<Grammar.extern_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
            case "extern":
                formatter.keyword("extern");
                break;
            case "scoped_name":
                formatter.name(cursor.nodeText);
                formatter.space();
                break;
            case "dollars_content":
                formatter.verbatim(cursor.nodeText);
                break;
            case "$":
                formatter.dollar();
                break;
            case ";":
                formatter.semicolon();
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format extern child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatInt(cursor: Grammar.CursorPosition<Grammar.int_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
            case "subint":
                formatter.requirePrecedingNewLine();
                formatter.keyword("subint");
                break;
            case "scoped_name":
                formatCompoundName(cursor.currentNode, formatter);
                break;
            case "{":
                formatter.space();
                formatter.openBrace();
                break;
            case "number":
                formatter.literal(cursor.nodeText);
                break;
            case "..":
                formatter.binaryOperator("..");
                break;
            case "}":
                formatter.closeBrace();
                break;
            case ";":
                formatter.semicolon();
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format int child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatReply(cursor: Grammar.CursorPosition<Grammar.reply_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
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
                formatAction(cursor.pos(), formatter);
                break;
            case "binary_expression":
                formatBinaryExpression(cursor, formatter);
                break;
            case "call":
                formatCall(cursor.pos(), formatter);
                break;
            case "compound_name":
                formatCompoundName(cursor.currentNode, formatter);
                break;
            case "dollars":
                formatDollars(cursor.pos(), formatter);
                break;
            case "group":
                formatGroup(cursor, formatter);
                break;
            case "literal":
                formatter.literal(cursor.nodeText);
                break;
            case "port_name":
                formatCompoundName(cursor.currentNode, formatter);
                break;
            case "unary_expression":
                formatUnaryExpression(cursor, formatter);
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format reply child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

// Expressions

function formatUnaryExpression(cursor: Grammar.CursorPosition<Grammar.unary_expression_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
            case "!":
            case "-":
                formatter.unaryOperator(cursor.nodeText);
                break;
            case "action":
                formatAction(cursor.pos(), formatter);
                break;
            case "binary_expression":
                formatBinaryExpression(cursor, formatter);
                break;
            case "call":
                formatCall(cursor.pos(), formatter);
                break;
            case "compound_name":
                formatCompoundName(cursor.currentNode, formatter);
                break;
            case "dollars":
                formatDollars(cursor.pos(), formatter);
                break;
            case "group":
                formatGroup(cursor, formatter);
                break;
            case "literal":
                formatter.literal(cursor.nodeText);
                break;
            case "unary_expression":
                formatUnaryExpression(cursor, formatter);
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format binary expression child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatBinaryExpression(cursor: Grammar.CursorPosition<Grammar.binary_expression_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
            case "!=":
            case "&&":
            case "+":
            case "-":
            case "<":
            case "<=":
            case "==":
            case ">":
            case ">=":
            case "||":
                formatter.binaryOperator(cursor.nodeText);
                break;
            case "action":
                formatAction(cursor.pos(), formatter);
                break;
            case "binary_expression":
                formatBinaryExpression(cursor, formatter);
                break;
            case "call":
                formatCall(cursor.pos(), formatter);
                break;
            case "compound_name":
                formatCompoundName(cursor.currentNode, formatter);
                break;
            case "dollars":
                formatDollars(cursor.pos(), formatter);
                break;
            case "group":
                formatGroup(cursor, formatter);
                break;
            case "literal":
                formatter.literal(cursor.nodeText);
                break;
            case "unary_expression":
                formatUnaryExpression(cursor, formatter);
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format binary expression child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatCall(cursor: Grammar.CursorPosition<Grammar.call_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
            case "name":
                formatter.name(cursor.nodeText);
                break;
            case "arguments":
                formatArguments(cursor.pos(), formatter);
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format call child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatArguments(cursor: Grammar.CursorPosition<Grammar.arguments_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
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
                formatAction(cursor.pos(), formatter);
                break;
            case "binary_expression":
                formatBinaryExpression(cursor, formatter);
                break;
            case "call":
                formatCall(cursor.pos(), formatter);
                break;
            case "compound_name":
                formatCompoundName(cursor.currentNode, formatter);
                break;
            case "dollars":
                formatDollars(cursor.pos(), formatter);
                break;
            case "group":
                formatGroup(cursor, formatter);
                break;
            case "literal":
                formatter.literal(cursor.nodeText);
                break;
            case "unary_expression":
                formatUnaryExpression(cursor, formatter);
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format arguments child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatAction(cursor: Grammar.CursorPosition<Grammar.action_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
            case "port_name":
                formatter.name(cursor.nodeText);
                break;
            case ".":
                formatter.dot();
                break;
            case "name":
                formatter.name(cursor.nodeText);
                break;
            case "arguments":
                formatArguments(cursor.pos(), formatter);
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format action child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatDollars(cursor: Grammar.CursorPosition<Grammar.dollars_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();

    formatter.requirePrecedingSpace();

    do {
        switch (cursor.nodeType) {
            case "dollars_content":
                formatter.verbatim(cursor.nodeText);
                break;
            case "$":
                formatter.dollar();
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format dollars child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatGroup(cursor: Grammar.CursorPosition<Grammar.group_Node>, formatter: Formatter) {
    cursor.gotoFirstChild();
    do {
        switch (cursor.nodeType) {
            case "(":
                formatter.openParen();
                break;
            case ")":
                formatter.closeParen();
                break;
            case "action":
                formatAction(cursor.pos(), formatter);
                break;
            case "binary_expression":
                formatBinaryExpression(cursor, formatter);
                break;
            case "call":
                formatCall(cursor.pos(), formatter);
                break;
            case "compound_name":
                formatCompoundName(cursor.currentNode, formatter);
                break;
            case "dollars":
                formatDollars(cursor.pos(), formatter);
                break;
            case "group":
                formatGroup(cursor, formatter);
                break;
            case "literal":
                formatter.literal(cursor.nodeText);
                break;
            case "unary_expression":
                formatUnaryExpression(cursor, formatter);
                break;
            // generics
            case "comment":
                formatComment(cursor.currentNode, formatter);
                break;
            case "ERROR":
                formatter.verbatim(cursor.nodeText);
                break;
            case "whiteline":
                formatter.whiteline();
                break;
            default:
                assertNever(cursor);
                throw `cannot format group child ${cursor}`;
        }
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
}

function formatCompoundName(
    name:
        | Grammar.end_point_Node
        | Grammar.event_name_Node
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

function compoundContainsGuards(compound: Grammar.CursorPosition<Grammar.compound_Node>): boolean {
    if (compound.gotoFirstChild()) {
        do {
            if (compound.currentNode.type === "guard") {
                compound.gotoParent();
                return true;
            }
        } while (compound.gotoNextSibling());
        compound.gotoParent();
    }
    return false;
}
