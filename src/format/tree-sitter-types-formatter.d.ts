import type * as Parser from "web-tree-sitter";
interface BaseNode extends Omit<Parser.SyntaxNode, "walk"> {
    isNamed: boolean;
    isError: boolean;
    text: string;
}
interface UnnamedNode<T extends string> extends BaseNode {
    type: T;
}
interface Pattern extends BaseNode { type: "pattern"; }
interface TypedCursor<TNodes> {
    currentNode: TNodes;
    nodeType: TNodes extends { type: infer T } ? T : never;
    nodeText: string;
    gotoFirstChild(): boolean;
    gotoNextSibling(): boolean;
    gotoParent(): boolean;
}
type CursorPosition<TCursor> = TCursor extends TypedCursor<infer TNodes>
    ? {
        currentNode: TNodes;
        nodeType: TNodes extends { type: infer T } ? T : never;
        nodeText: string;
    }
    : never;

interface root_Node extends BaseNode {
    type: "root";
    walk(): TypedCursor<import_Node | dollars_Node | enum_Node | int_Node | extern_Node | namespace_Node | interface_Node | component_Node | comment_Node>
}
interface _root_statement_Node extends BaseNode {
    type: "_root_statement";
    walk(): TypedCursor<import_Node | dollars_Node | enum_Node | int_Node | extern_Node | namespace_Node | interface_Node | component_Node | comment_Node>
}
interface import_Node extends BaseNode {
    type: "import";
    walk(): TypedCursor<UnnamedNode<"import"> | file_name_Node | UnnamedNode<";"> | comment_Node>
}
interface file_name_Node extends BaseNode {
    type: "file_name";
}
interface dollars_Node extends BaseNode {
    type: "dollars";
    walk(): TypedCursor<UnnamedNode<"$"> | dollars_content_Node | comment_Node>
}
interface dollars_content_Node extends BaseNode {
    type: "dollars_content";
}
interface _type_Node extends BaseNode {
    type: "_type";
    walk(): TypedCursor<enum_Node | int_Node | extern_Node | comment_Node>
}
interface enum_Node extends BaseNode {
    type: "enum";
    walk(): TypedCursor<UnnamedNode<"enum"> | scoped_name_Node | fields_Node | UnnamedNode<";"> | comment_Node>
}
interface fields_Node extends BaseNode {
    type: "fields";
    walk(): TypedCursor<UnnamedNode<"{"> | name_Node | UnnamedNode<","> | UnnamedNode<"}"> | comment_Node>
}
interface int_Node extends BaseNode {
    type: "int";
    walk(): TypedCursor<UnnamedNode<"subint"> | scoped_name_Node | UnnamedNode<"{"> | number_Node | UnnamedNode<".."> | UnnamedNode<"}"> | UnnamedNode<";"> | comment_Node>
}
interface _range_Node extends BaseNode {
    type: "_range";
    walk(): TypedCursor<number_Node | UnnamedNode<".."> | comment_Node>
}
interface extern_Node extends BaseNode {
    type: "extern";
    walk(): TypedCursor<UnnamedNode<"extern"> | scoped_name_Node | UnnamedNode<"$"> | dollars_content_Node | UnnamedNode<";"> | comment_Node>
}
interface namespace_Node extends BaseNode {
    type: "namespace";
    walk(): TypedCursor<UnnamedNode<"namespace"> | compound_name_Node | UnnamedNode<"{"> | enum_Node | int_Node | extern_Node | namespace_Node | interface_Node | component_Node | UnnamedNode<"}"> | comment_Node>
}
interface _namespace_statement_Node extends BaseNode {
    type: "_namespace_statement";
    walk(): TypedCursor<enum_Node | int_Node | extern_Node | namespace_Node | interface_Node | component_Node | comment_Node>
}
interface interface_Node extends BaseNode {
    type: "interface";
    walk(): TypedCursor<UnnamedNode<"interface"> | scoped_name_Node | interface_body_Node | comment_Node>
}
interface interface_body_Node extends BaseNode {
    type: "interface_body";
    walk(): TypedCursor<UnnamedNode<"{"> | enum_Node | int_Node | extern_Node | event_Node | behavior_Node | UnnamedNode<"}"> | comment_Node>
}
interface _interface_statement_Node extends BaseNode {
    type: "_interface_statement";
    walk(): TypedCursor<enum_Node | int_Node | extern_Node | event_Node | comment_Node>
}
interface event_Node extends BaseNode {
    type: "event";
    walk(): TypedCursor<direction_Node | type_name_Node | event_name_Node | formals_Node | UnnamedNode<";"> | comment_Node>
}
interface direction_Node extends BaseNode {
    type: "direction";
    walk(): TypedCursor<UnnamedNode<"in"> | UnnamedNode<"out"> | comment_Node>
}
interface component_Node extends BaseNode {
    type: "component";
    walk(): TypedCursor<UnnamedNode<"component"> | scoped_name_Node | UnnamedNode<"{"> | port_Node | body_Node | UnnamedNode<"}"> | comment_Node>
}
interface body_Node extends BaseNode {
    type: "body";
    walk(): TypedCursor<behavior_Node | system_Node | comment_Node>
}
interface system_Node extends BaseNode {
    type: "system";
    walk(): TypedCursor<UnnamedNode<"system"> | system_body_Node | comment_Node>
}
interface system_body_Node extends BaseNode {
    type: "system_body";
    walk(): TypedCursor<UnnamedNode<"{"> | instance_Node | binding_Node | UnnamedNode<"}"> | comment_Node>
}
interface _instance_or_binding_Node extends BaseNode {
    type: "_instance_or_binding";
    walk(): TypedCursor<instance_Node | binding_Node | comment_Node>
}
interface instance_Node extends BaseNode {
    type: "instance";
    walk(): TypedCursor<compound_name_Node | name_Node | UnnamedNode<";"> | comment_Node>
}
interface binding_Node extends BaseNode {
    type: "binding";
    walk(): TypedCursor<end_point_Node | UnnamedNode<"<=>"> | UnnamedNode<";"> | comment_Node>
}
interface end_point_Node extends BaseNode {
    type: "end_point";
    walk(): TypedCursor<compound_name_Node | UnnamedNode<"."> | asterisk_Node | comment_Node>
}
interface asterisk_Node extends BaseNode {
    type: "asterisk";
}
interface port_Node extends BaseNode {
    type: "port";
    walk(): TypedCursor<port_direction_Node | port_qualifiers_Node | compound_name_Node | formals_Node | port_name_Node | UnnamedNode<";"> | comment_Node>
}
interface port_direction_Node extends BaseNode {
    type: "port_direction";
    walk(): TypedCursor<UnnamedNode<"provides"> | UnnamedNode<"requires"> | comment_Node>
}
interface port_qualifiers_Node extends BaseNode {
    type: "port_qualifiers";
}
interface port_qualifier_Node extends BaseNode {
    type: "port_qualifier";
    walk(): TypedCursor<UnnamedNode<"blocking"> | UnnamedNode<"external"> | UnnamedNode<"injected"> | comment_Node>
}
interface formals_Node extends BaseNode {
    type: "formals";
    walk(): TypedCursor<UnnamedNode<"("> | formal_Node | UnnamedNode<","> | UnnamedNode<")"> | comment_Node>
}
interface formal_Node extends BaseNode {
    type: "formal";
    walk(): TypedCursor<formal_direction_Node | type_name_Node | var_name_Node | comment_Node>
}
interface formal_direction_Node extends BaseNode {
    type: "formal_direction";
    walk(): TypedCursor<UnnamedNode<"in"> | UnnamedNode<"out"> | UnnamedNode<"inout"> | comment_Node>
}
interface type_name_Node extends BaseNode {
    type: "type_name";
    walk(): TypedCursor<compound_name_Node | UnnamedNode<"bool"> | UnnamedNode<"void"> | comment_Node>
}
interface behavior_Node extends BaseNode {
    type: "behavior";
    walk(): TypedCursor<UnnamedNode<"behavior"> | UnnamedNode<"behaviour"> | name_Node | behavior_body_Node | comment_Node>
}
interface behavior_body_Node extends BaseNode {
    type: "behavior_body";
    walk(): TypedCursor<UnnamedNode<"{"> | function_Node | variable_Node | on_Node | blocking_Node | guard_Node | compound_Node | enum_Node | int_Node | extern_Node | UnnamedNode<"}"> | comment_Node>
}
interface _behavior_statement_Node extends BaseNode {
    type: "_behavior_statement";
    walk(): TypedCursor<function_Node | variable_Node | on_Node | blocking_Node | guard_Node | compound_Node | enum_Node | int_Node | extern_Node | comment_Node>
}
interface function_Node extends BaseNode {
    type: "function";
    walk(): TypedCursor<type_name_Node | name_Node | formals_Node | compound_Node | comment_Node>
}
interface _declarative_statement_Node extends BaseNode {
    type: "_declarative_statement";
    walk(): TypedCursor<on_Node | blocking_Node | guard_Node | compound_Node | comment_Node>
}
interface on_Node extends BaseNode {
    type: "on";
    walk(): TypedCursor<UnnamedNode<"on"> | triggers_Node | UnnamedNode<":"> | on_Node | comment_Node>
}
interface triggers_Node extends BaseNode {
    type: "triggers";
    walk(): TypedCursor<trigger_Node | UnnamedNode<","> | comment_Node>
}
interface trigger_Node extends BaseNode {
    type: "trigger";
    walk(): TypedCursor<port_event_Node | optional_Node | inevitable_Node | event_name_Node | comment_Node>
}
interface port_event_Node extends BaseNode {
    type: "port_event";
    walk(): TypedCursor<port_name_Node | UnnamedNode<"."> | name_Node | trigger_formals_Node | comment_Node>
}
interface optional_Node extends BaseNode {
    type: "optional";
}
interface inevitable_Node extends BaseNode {
    type: "inevitable";
}
interface trigger_formals_Node extends BaseNode {
    type: "trigger_formals";
    walk(): TypedCursor<UnnamedNode<"("> | trigger_formal_Node | UnnamedNode<","> | UnnamedNode<")"> | comment_Node>
}
interface trigger_formal_Node extends BaseNode {
    type: "trigger_formal";
    walk(): TypedCursor<var_Node | UnnamedNode<"<-"> | comment_Node>
}
interface guard_Node extends BaseNode {
    type: "guard";
    walk(): TypedCursor<UnnamedNode<"["> | otherwise_Node | unary_expression_Node | UnnamedNode<"]"> | on_Node | comment_Node>
}
interface _otherwise_or_expression_Node extends BaseNode {
    type: "_otherwise_or_expression";
    walk(): TypedCursor<otherwise_Node | unary_expression_Node | comment_Node>
}
interface otherwise_Node extends BaseNode {
    type: "otherwise";
}
interface compound_Node extends BaseNode {
    type: "compound";
    walk(): TypedCursor<UnnamedNode<"{"> | on_Node | UnnamedNode<"}"> | comment_Node>
}
interface variable_Node extends BaseNode {
    type: "variable";
    walk(): TypedCursor<type_name_Node | var_name_Node | UnnamedNode<"="> | unary_expression_Node | UnnamedNode<";"> | comment_Node>
}
interface event_name_Node extends BaseNode {
    type: "event_name";
}
interface var_name_Node extends BaseNode {
    type: "var_name";
}
interface _statement_Node extends BaseNode {
    type: "_statement";
    walk(): TypedCursor<on_Node | blocking_Node | guard_Node | compound_Node | variable_Node | assign_Node | if_statement_Node | illegal_Node | return_Node | skip_statement_Node | reply_Node | defer_Node | action_Node | call_Node | UnnamedNode<";"> | interface_action_Node | comment_Node>
}
interface _imperative_statement_Node extends BaseNode {
    type: "_imperative_statement";
    walk(): TypedCursor<variable_Node | assign_Node | if_statement_Node | illegal_Node | return_Node | skip_statement_Node | compound_Node | reply_Node | defer_Node | action_Node | call_Node | UnnamedNode<";"> | interface_action_Node | comment_Node>
}
interface defer_Node extends BaseNode {
    type: "defer";
    walk(): TypedCursor<UnnamedNode<"defer"> | arguments_Node | variable_Node | comment_Node>
}
interface interface_action_Node extends BaseNode {
    type: "interface_action";
}
interface _action_or_call_Node extends BaseNode {
    type: "_action_or_call";
    walk(): TypedCursor<action_Node | call_Node | UnnamedNode<";"> | comment_Node>
}
interface action_Node extends BaseNode {
    type: "action";
    walk(): TypedCursor<port_name_Node | UnnamedNode<"."> | name_Node | arguments_Node | comment_Node>
}
interface call_Node extends BaseNode {
    type: "call";
    walk(): TypedCursor<name_Node | arguments_Node | comment_Node>
}
interface arguments_Node extends BaseNode {
    type: "arguments";
    walk(): TypedCursor<UnnamedNode<"("> | unary_expression_Node | UnnamedNode<","> | UnnamedNode<")"> | comment_Node>
}
interface skip_statement_Node extends BaseNode {
    type: "skip_statement";
}
interface blocking_Node extends BaseNode {
    type: "blocking";
    walk(): TypedCursor<UnnamedNode<"blocking"> | on_Node | comment_Node>
}
interface illegal_Node extends BaseNode {
    type: "illegal";
    walk(): TypedCursor<UnnamedNode<"illegal"> | UnnamedNode<";"> | comment_Node>
}
interface assign_Node extends BaseNode {
    type: "assign";
    walk(): TypedCursor<var_Node | UnnamedNode<"="> | unary_expression_Node | UnnamedNode<";"> | comment_Node>
}
interface if_statement_Node extends BaseNode {
    type: "if_statement";
}
interface reply_Node extends BaseNode {
    type: "reply";
    walk(): TypedCursor<port_name_Node | UnnamedNode<"."> | UnnamedNode<"reply"> | UnnamedNode<"("> | unary_expression_Node | UnnamedNode<")"> | UnnamedNode<";"> | comment_Node>
}
interface return_Node extends BaseNode {
    type: "return";
    walk(): TypedCursor<UnnamedNode<"return"> | unary_expression_Node | UnnamedNode<";"> | comment_Node>
}
interface _expression_Node extends BaseNode {
    type: "_expression";
    walk(): TypedCursor<unary_expression_Node | group_Node | dollars_Node | literal_Node | compound_name_Node | call_Node | action_Node | binary_expression_Node | comment_Node>
}
interface group_Node extends BaseNode {
    type: "group";
    walk(): TypedCursor<UnnamedNode<"("> | unary_expression_Node | UnnamedNode<")"> | comment_Node>
}
interface literal_Node extends BaseNode {
    type: "literal";
    walk(): TypedCursor<number_Node | UnnamedNode<"true"> | UnnamedNode<"false"> | comment_Node>
}
interface unary_expression_Node extends BaseNode {
    type: "unary_expression";
}
interface binary_expression_Node extends BaseNode {
    type: "binary_expression";
    walk(): TypedCursor<unary_expression_Node | UnnamedNode<"||"> | UnnamedNode<"&&"> | UnnamedNode<"<"> | UnnamedNode<"<="> | UnnamedNode<"=="> | UnnamedNode<"!="> | UnnamedNode<">="> | UnnamedNode<">"> | UnnamedNode<"+"> | UnnamedNode<"-"> | comment_Node>
}
interface compound_name_Node extends BaseNode {
    type: "compound_name";
    walk(): TypedCursor<global_Node | Pattern | UnnamedNode<"."> | comment_Node>
}
interface global_Node extends BaseNode {
    type: "global";
}
interface name_Node extends BaseNode {
    type: "name";
}
interface var_Node extends BaseNode {
    type: "var";
}
interface port_name_Node extends BaseNode {
    type: "port_name";
}
interface scoped_name_Node extends BaseNode {
    type: "scoped_name";
}
interface _identifier_Node extends BaseNode {
    type: "_identifier";
}
interface number_Node extends BaseNode {
    type: "number";
}
interface comment_Node extends BaseNode {
    type: "comment";
    walk(): TypedCursor<UnnamedNode<"//"> | Pattern | UnnamedNode<"/*"> | UnnamedNode<"/"> | comment_Node>
}
type AllNodes = root_Node | _root_statement_Node | import_Node | file_name_Node | dollars_Node | dollars_content_Node | _type_Node | enum_Node | fields_Node | int_Node | _range_Node | extern_Node | namespace_Node | _namespace_statement_Node | interface_Node | interface_body_Node | _interface_statement_Node | event_Node | direction_Node | component_Node | body_Node | system_Node | system_body_Node | _instance_or_binding_Node | instance_Node | binding_Node | end_point_Node | asterisk_Node | port_Node | port_direction_Node | port_qualifiers_Node | port_qualifier_Node | formals_Node | formal_Node | formal_direction_Node | type_name_Node | behavior_Node | behavior_body_Node | _behavior_statement_Node | function_Node | _declarative_statement_Node | on_Node | triggers_Node | trigger_Node | port_event_Node | optional_Node | inevitable_Node | trigger_formals_Node | trigger_formal_Node | guard_Node | _otherwise_or_expression_Node | otherwise_Node | compound_Node | variable_Node | event_name_Node | var_name_Node | _statement_Node | _imperative_statement_Node | defer_Node | interface_action_Node | _action_or_call_Node | action_Node | call_Node | arguments_Node | skip_statement_Node | blocking_Node | illegal_Node | assign_Node | if_statement_Node | reply_Node | return_Node | _expression_Node | group_Node | literal_Node | unary_expression_Node | binary_expression_Node | compound_name_Node | global_Node | name_Node | var_Node | port_name_Node | scoped_name_Node | _identifier_Node | number_Node | comment_Node | Pattern;