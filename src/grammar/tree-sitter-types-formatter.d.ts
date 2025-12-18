// <declarations file auto-generated from grammar.json>

export interface BaseNode {
    isNamed: boolean;
    isError: boolean;
    text: string;
    childCount: number;
}
interface UnnamedNode<T extends string, _Id extends number> extends BaseNode {
    type: T;
    _id: _Id;
    isNamed: false;
}
interface Pattern extends BaseNode {
    type: "pattern";
}
interface ERROR_Node extends BaseNode {
    type: "ERROR";
    _id: -10;
}
interface whiteline_Node extends BaseNode {
    type: "whiteline";
    _id: -20;
}
interface TypedCursor<TNodes> {
    readonly currentNode: TNodes;
    readonly nodeType: AllNodes["type"];
    readonly nodeText: string;
    gotoFirstChild(): boolean;
    gotoNextSibling(): boolean;
    gotoParent(): boolean;
}
type WalkerNodes<TNode> = TNode extends { walk(): TypedCursor<infer TNodes> } ? TNodes : { _id: -1 };
type NamedNodes<TNodes> = Extract<TNodes, { isNamed: true }>;
type NodeOfId<T> = Extract<AllNodes, { _id: T }>;

type CursorRecord<TNode extends { _id: number }> = { [K in TNode["_id"]]: TreeCursorOfType<NodeOfId<K>> };

interface TreeCursorOfType<T extends AllNodes> {
    nodeType: T["type"];
    currentNode: T;
    nodeText: string;
    gotoFirstChild(): boolean;
    gotoNextSibling(): boolean;
    gotoParent(): boolean;
    pos(): CursorPosition<T>;
}

export type CursorPosition<TNode extends BaseNode> = CursorRecord<WalkerNodes<TNode>>[keyof CursorRecord<
    WalkerNodes<TNode>
>];

interface root_Node extends BaseNode {
    type: "root";
    _id: 1;
    isNamed: true;
    walk(): TypedCursor<
        | import_Node
        | dollars_Node
        | enum_Node
        | int_Node
        | extern_Node
        | namespace_Node
        | interface_Node
        | component_Node
        | function_Node
        | foreign_function_Node
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface _root_statement_Node extends BaseNode {
    type: "_root_statement";
    _id: 2;
    isNamed: true;
    walk(): TypedCursor<
        | import_Node
        | dollars_Node
        | enum_Node
        | int_Node
        | extern_Node
        | namespace_Node
        | interface_Node
        | component_Node
        | function_Node
        | foreign_function_Node
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface import_Node extends BaseNode {
    type: "import";
    _id: 3;
    isNamed: true;
    walk(): TypedCursor<
        UnnamedNode<"import", 4> | file_name_Node | UnnamedNode<";", 5> | comment_Node | whiteline_Node | ERROR_Node
    >;
}
interface file_name_Node extends BaseNode {
    type: "file_name";
    _id: 6;
    isNamed: true;
}
interface dollars_Node extends BaseNode {
    type: "dollars";
    _id: 7;
    isNamed: true;
    walk(): TypedCursor<
        UnnamedNode<"$", 8> | dollars_content_Node | UnnamedNode<"$", 9> | comment_Node | whiteline_Node | ERROR_Node
    >;
}
interface dollars_content_Node extends BaseNode {
    type: "dollars_content";
    _id: 10;
    isNamed: true;
}
interface _type_Node extends BaseNode {
    type: "_type";
    _id: 11;
    isNamed: true;
    walk(): TypedCursor<enum_Node | int_Node | extern_Node | comment_Node | whiteline_Node | ERROR_Node>;
}
interface enum_Node extends BaseNode {
    type: "enum";
    _id: 12;
    isNamed: true;
    walk(): TypedCursor<
        | UnnamedNode<"enum", 13>
        | scoped_name_Node
        | fields_Node
        | UnnamedNode<";", 14>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface fields_Node extends BaseNode {
    type: "fields";
    _id: 15;
    isNamed: true;
    walk(): TypedCursor<
        | UnnamedNode<"{", 16>
        | member_name_Node
        | UnnamedNode<",", 17>
        | UnnamedNode<",", 18>
        | UnnamedNode<"}", 19>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface int_Node extends BaseNode {
    type: "int";
    _id: 20;
    isNamed: true;
    walk(): TypedCursor<
        | UnnamedNode<"subint", 21>
        | scoped_name_Node
        | UnnamedNode<"{", 22>
        | number_Node
        | UnnamedNode<"..", 23>
        | UnnamedNode<"}", 24>
        | UnnamedNode<";", 25>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface _range_Node extends BaseNode {
    type: "_range";
    _id: 26;
    isNamed: true;
    walk(): TypedCursor<number_Node | UnnamedNode<"..", 27> | comment_Node | whiteline_Node | ERROR_Node>;
}
interface extern_Node extends BaseNode {
    type: "extern";
    _id: 28;
    isNamed: true;
    walk(): TypedCursor<
        | UnnamedNode<"extern", 29>
        | scoped_name_Node
        | UnnamedNode<"$", 30>
        | dollars_content_Node
        | UnnamedNode<"$", 31>
        | UnnamedNode<";", 32>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface namespace_Node extends BaseNode {
    type: "namespace";
    _id: 33;
    isNamed: true;
    walk(): TypedCursor<
        | UnnamedNode<"namespace", 34>
        | compound_name_Node
        | UnnamedNode<"{", 35>
        | enum_Node
        | int_Node
        | extern_Node
        | namespace_Node
        | interface_Node
        | component_Node
        | function_Node
        | foreign_function_Node
        | UnnamedNode<"}", 36>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface _namespace_statement_Node extends BaseNode {
    type: "_namespace_statement";
    _id: 37;
    isNamed: true;
    walk(): TypedCursor<
        | enum_Node
        | int_Node
        | extern_Node
        | namespace_Node
        | interface_Node
        | component_Node
        | function_Node
        | foreign_function_Node
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface interface_Node extends BaseNode {
    type: "interface";
    _id: 38;
    isNamed: true;
    walk(): TypedCursor<
        | UnnamedNode<"interface", 39>
        | scoped_name_Node
        | interface_body_Node
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface interface_body_Node extends BaseNode {
    type: "interface_body";
    _id: 40;
    isNamed: true;
    walk(): TypedCursor<
        | UnnamedNode<"{", 41>
        | enum_Node
        | int_Node
        | extern_Node
        | event_Node
        | behavior_Node
        | UnnamedNode<"}", 42>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface _interface_statement_Node extends BaseNode {
    type: "_interface_statement";
    _id: 43;
    isNamed: true;
    walk(): TypedCursor<enum_Node | int_Node | extern_Node | event_Node | comment_Node | whiteline_Node | ERROR_Node>;
}
interface event_Node extends BaseNode {
    type: "event";
    _id: 44;
    isNamed: true;
    walk(): TypedCursor<
        | direction_Node
        | type_name_Node
        | event_name_Node
        | formals_Node
        | UnnamedNode<";", 45>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface direction_Node extends BaseNode {
    type: "direction";
    _id: 46;
    isNamed: true;
    walk(): TypedCursor<UnnamedNode<"in", 47> | UnnamedNode<"out", 48> | comment_Node | whiteline_Node | ERROR_Node>;
}
interface component_Node extends BaseNode {
    type: "component";
    _id: 49;
    isNamed: true;
    walk(): TypedCursor<
        | UnnamedNode<"component", 50>
        | scoped_name_Node
        | UnnamedNode<"{", 51>
        | port_Node
        | behavior_Node
        | system_Node
        | UnnamedNode<"}", 52>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface _body_Node extends BaseNode {
    type: "_body";
    _id: 53;
    isNamed: true;
    walk(): TypedCursor<behavior_Node | system_Node | comment_Node | whiteline_Node | ERROR_Node>;
}
interface system_Node extends BaseNode {
    type: "system";
    _id: 54;
    isNamed: true;
    walk(): TypedCursor<UnnamedNode<"system", 55> | system_body_Node | comment_Node | whiteline_Node | ERROR_Node>;
}
interface system_body_Node extends BaseNode {
    type: "system_body";
    _id: 56;
    isNamed: true;
    walk(): TypedCursor<
        | UnnamedNode<"{", 57>
        | instance_Node
        | binding_Node
        | UnnamedNode<"}", 58>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface _instance_or_binding_Node extends BaseNode {
    type: "_instance_or_binding";
    _id: 59;
    isNamed: true;
    walk(): TypedCursor<instance_Node | binding_Node | comment_Node | whiteline_Node | ERROR_Node>;
}
interface instance_Node extends BaseNode {
    type: "instance";
    _id: 60;
    isNamed: true;
    walk(): TypedCursor<
        compound_name_Node | name_Node | UnnamedNode<";", 61> | comment_Node | whiteline_Node | ERROR_Node
    >;
}
interface binding_Node extends BaseNode {
    type: "binding";
    _id: 62;
    isNamed: true;
    walk(): TypedCursor<
        end_point_Node | UnnamedNode<"<=>", 63> | UnnamedNode<";", 64> | comment_Node | whiteline_Node | ERROR_Node
    >;
}
interface end_point_Node extends BaseNode {
    type: "end_point";
    _id: 65;
    isNamed: true;
    walk(): TypedCursor<
        compound_name_Node | UnnamedNode<".", 66> | asterisk_Node | comment_Node | whiteline_Node | ERROR_Node
    >;
}
interface asterisk_Node extends BaseNode {
    type: "asterisk";
    _id: 67;
    isNamed: true;
}
interface port_Node extends BaseNode {
    type: "port";
    _id: 68;
    isNamed: true;
    walk(): TypedCursor<
        | port_direction_Node
        | port_qualifiers_Node
        | compound_name_Node
        | formals_Node
        | name_Node
        | UnnamedNode<";", 69>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface port_direction_Node extends BaseNode {
    type: "port_direction";
    _id: 70;
    isNamed: true;
    walk(): TypedCursor<
        UnnamedNode<"provides", 71> | UnnamedNode<"requires", 72> | comment_Node | whiteline_Node | ERROR_Node
    >;
}
interface port_qualifiers_Node extends BaseNode {
    type: "port_qualifiers";
    _id: 73;
    isNamed: true;
}
interface port_qualifier_Node extends BaseNode {
    type: "port_qualifier";
    _id: 74;
    isNamed: true;
    walk(): TypedCursor<
        | UnnamedNode<"blocking", 75>
        | UnnamedNode<"external", 76>
        | UnnamedNode<"injected", 77>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface formals_Node extends BaseNode {
    type: "formals";
    _id: 78;
    isNamed: true;
    walk(): TypedCursor<
        | UnnamedNode<"(", 79>
        | formal_Node
        | UnnamedNode<",", 80>
        | UnnamedNode<")", 81>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface formal_Node extends BaseNode {
    type: "formal";
    _id: 82;
    isNamed: true;
    walk(): TypedCursor<
        formal_direction_Node | type_name_Node | var_name_Node | comment_Node | whiteline_Node | ERROR_Node
    >;
}
interface formal_direction_Node extends BaseNode {
    type: "formal_direction";
    _id: 83;
    isNamed: true;
    walk(): TypedCursor<
        | UnnamedNode<"in", 84>
        | UnnamedNode<"out", 85>
        | UnnamedNode<"inout", 86>
        | UnnamedNode<"provides", 87>
        | UnnamedNode<"requires", 88>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface type_name_Node extends BaseNode {
    type: "type_name";
    _id: 89;
    isNamed: true;
    walk(): TypedCursor<
        | compound_name_Node
        | UnnamedNode<"bool", 90>
        | UnnamedNode<"void", 91>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface behavior_Node extends BaseNode {
    type: "behavior";
    _id: 92;
    isNamed: true;
    walk(): TypedCursor<
        | UnnamedNode<"behavior", 93>
        | UnnamedNode<"behaviour", 94>
        | name_Node
        | behavior_body_Node
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface behavior_body_Node extends BaseNode {
    type: "behavior_body";
    _id: 95;
    isNamed: true;
    walk(): TypedCursor<
        | UnnamedNode<"{", 96>
        | function_Node
        | variable_Node
        | on_Node
        | blocking_Node
        | guard_Node
        | invariant_Node
        | compound_Node
        | enum_Node
        | int_Node
        | extern_Node
        | UnnamedNode<"}", 97>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface _behavior_statement_Node extends BaseNode {
    type: "_behavior_statement";
    _id: 98;
    isNamed: true;
    walk(): TypedCursor<
        | function_Node
        | variable_Node
        | on_Node
        | blocking_Node
        | guard_Node
        | invariant_Node
        | compound_Node
        | enum_Node
        | int_Node
        | extern_Node
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface function_Node extends BaseNode {
    type: "function";
    _id: 99;
    isNamed: true;
    walk(): TypedCursor<
        | type_name_Node
        | name_Node
        | formals_Node
        | compound_Node
        | function_body_one_line_Node
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface foreign_function_Node extends BaseNode {
    type: "foreign_function";
    _id: 100;
    isNamed: true;
    walk(): TypedCursor<
        type_name_Node | name_Node | formals_Node | UnnamedNode<";", 101> | comment_Node | whiteline_Node | ERROR_Node
    >;
}
interface function_body_one_line_Node extends BaseNode {
    type: "function_body_one_line";
    _id: 102;
    isNamed: true;
    walk(): TypedCursor<
        | UnnamedNode<"=", 103>
        | unary_expression_Node
        | group_Node
        | dollars_Node
        | literal_Node
        | compound_name_Node
        | call_Node
        | binary_expression_Node
        | UnnamedNode<";", 104>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface _declarative_statement_Node extends BaseNode {
    type: "_declarative_statement";
    _id: 105;
    isNamed: true;
    walk(): TypedCursor<
        | on_Node
        | blocking_Node
        | guard_Node
        | invariant_Node
        | compound_Node
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface invariant_Node extends BaseNode {
    type: "invariant";
    _id: 106;
    isNamed: true;
    walk(): TypedCursor<
        | UnnamedNode<"invariant", 107>
        | unary_expression_Node
        | group_Node
        | dollars_Node
        | literal_Node
        | compound_name_Node
        | call_Node
        | binary_expression_Node
        | UnnamedNode<";", 108>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface on_Node extends BaseNode {
    type: "on";
    _id: 109;
    isNamed: true;
    walk(): TypedCursor<
        | UnnamedNode<"on", 110>
        | triggers_Node
        | UnnamedNode<":", 111>
        | on_Node
        | blocking_Node
        | guard_Node
        | invariant_Node
        | compound_Node
        | call_statement_Node
        | variable_Node
        | assign_Node
        | if_statement_Node
        | illegal_Node
        | interface_action_statement_Node
        | return_Node
        | skip_statement_Node
        | compound_Node
        | reply_Node
        | defer_Node
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface triggers_Node extends BaseNode {
    type: "triggers";
    _id: 112;
    isNamed: true;
    walk(): TypedCursor<trigger_Node | UnnamedNode<",", 113> | comment_Node | whiteline_Node | ERROR_Node>;
}
interface trigger_Node extends BaseNode {
    type: "trigger";
    _id: 114;
    isNamed: true;
    walk(): TypedCursor<
        | optional_Node
        | inevitable_Node
        | compound_name_Node
        | trigger_formals_Node
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface optional_Node extends BaseNode {
    type: "optional";
    _id: 115;
    isNamed: true;
}
interface inevitable_Node extends BaseNode {
    type: "inevitable";
    _id: 116;
    isNamed: true;
}
interface trigger_formals_Node extends BaseNode {
    type: "trigger_formals";
    _id: 117;
    isNamed: true;
    walk(): TypedCursor<
        | UnnamedNode<"(", 118>
        | trigger_formal_Node
        | UnnamedNode<",", 119>
        | UnnamedNode<")", 120>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface trigger_formal_Node extends BaseNode {
    type: "trigger_formal";
    _id: 121;
    isNamed: true;
    walk(): TypedCursor<name_Node | UnnamedNode<"<-", 122> | comment_Node | whiteline_Node | ERROR_Node>;
}
interface guard_Node extends BaseNode {
    type: "guard";
    _id: 123;
    isNamed: true;
    walk(): TypedCursor<
        | guard_condition_Node
        | on_Node
        | blocking_Node
        | guard_Node
        | invariant_Node
        | compound_Node
        | call_statement_Node
        | variable_Node
        | assign_Node
        | if_statement_Node
        | illegal_Node
        | interface_action_statement_Node
        | return_Node
        | skip_statement_Node
        | compound_Node
        | reply_Node
        | defer_Node
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface guard_condition_Node extends BaseNode {
    type: "guard_condition";
    _id: 124;
    isNamed: true;
    walk(): TypedCursor<
        | UnnamedNode<"[", 125>
        | otherwise_Node
        | unary_expression_Node
        | group_Node
        | dollars_Node
        | literal_Node
        | compound_name_Node
        | call_Node
        | binary_expression_Node
        | UnnamedNode<"]", 126>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface _otherwise_or_expression_Node extends BaseNode {
    type: "_otherwise_or_expression";
    _id: 127;
    isNamed: true;
    walk(): TypedCursor<
        | otherwise_Node
        | unary_expression_Node
        | group_Node
        | dollars_Node
        | literal_Node
        | compound_name_Node
        | call_Node
        | binary_expression_Node
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface otherwise_Node extends BaseNode {
    type: "otherwise";
    _id: 128;
    isNamed: true;
}
interface compound_Node extends BaseNode {
    type: "compound";
    _id: 129;
    isNamed: true;
    walk(): TypedCursor<
        | UnnamedNode<"{", 130>
        | on_Node
        | blocking_Node
        | guard_Node
        | invariant_Node
        | compound_Node
        | call_statement_Node
        | variable_Node
        | assign_Node
        | if_statement_Node
        | illegal_Node
        | interface_action_statement_Node
        | return_Node
        | skip_statement_Node
        | compound_Node
        | reply_Node
        | defer_Node
        | UnnamedNode<"}", 131>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface variable_Node extends BaseNode {
    type: "variable";
    _id: 132;
    isNamed: true;
    walk(): TypedCursor<
        | type_name_Node
        | var_name_Node
        | UnnamedNode<"=", 133>
        | unary_expression_Node
        | group_Node
        | dollars_Node
        | literal_Node
        | compound_name_Node
        | call_Node
        | binary_expression_Node
        | UnnamedNode<";", 134>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface event_name_Node extends BaseNode {
    type: "event_name";
    _id: 135;
    isNamed: true;
}
interface var_name_Node extends BaseNode {
    type: "var_name";
    _id: 136;
    isNamed: true;
}
interface _statement_Node extends BaseNode {
    type: "_statement";
    _id: 137;
    isNamed: true;
    walk(): TypedCursor<
        | on_Node
        | blocking_Node
        | guard_Node
        | invariant_Node
        | compound_Node
        | call_statement_Node
        | variable_Node
        | assign_Node
        | if_statement_Node
        | illegal_Node
        | interface_action_statement_Node
        | return_Node
        | skip_statement_Node
        | reply_Node
        | defer_Node
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface _imperative_statement_Node extends BaseNode {
    type: "_imperative_statement";
    _id: 138;
    isNamed: true;
    walk(): TypedCursor<
        | call_statement_Node
        | variable_Node
        | assign_Node
        | if_statement_Node
        | illegal_Node
        | interface_action_statement_Node
        | return_Node
        | skip_statement_Node
        | compound_Node
        | reply_Node
        | defer_Node
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface defer_Node extends BaseNode {
    type: "defer";
    _id: 139;
    isNamed: true;
    walk(): TypedCursor<
        | UnnamedNode<"defer", 140>
        | arguments_Node
        | call_statement_Node
        | variable_Node
        | assign_Node
        | if_statement_Node
        | illegal_Node
        | interface_action_statement_Node
        | return_Node
        | skip_statement_Node
        | compound_Node
        | reply_Node
        | defer_Node
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface interface_action_statement_Node extends BaseNode {
    type: "interface_action_statement";
    _id: 141;
    isNamed: true;
    walk(): TypedCursor<interface_action_Node | UnnamedNode<";", 142> | comment_Node | whiteline_Node | ERROR_Node>;
}
interface interface_action_Node extends BaseNode {
    type: "interface_action";
    _id: 143;
    isNamed: true;
}
interface call_statement_Node extends BaseNode {
    type: "call_statement";
    _id: 144;
    isNamed: true;
    walk(): TypedCursor<call_Node | UnnamedNode<";", 145> | comment_Node | whiteline_Node | ERROR_Node>;
}
interface call_Node extends BaseNode {
    type: "call";
    _id: 146;
    isNamed: true;
    walk(): TypedCursor<compound_name_Node | arguments_Node | comment_Node | whiteline_Node | ERROR_Node>;
}
interface arguments_Node extends BaseNode {
    type: "arguments";
    _id: 147;
    isNamed: true;
    walk(): TypedCursor<
        | UnnamedNode<"(", 148>
        | unary_expression_Node
        | group_Node
        | dollars_Node
        | literal_Node
        | compound_name_Node
        | call_Node
        | binary_expression_Node
        | UnnamedNode<",", 149>
        | UnnamedNode<")", 150>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface skip_statement_Node extends BaseNode {
    type: "skip_statement";
    _id: 151;
    isNamed: true;
}
interface blocking_Node extends BaseNode {
    type: "blocking";
    _id: 152;
    isNamed: true;
    walk(): TypedCursor<
        | UnnamedNode<"blocking", 153>
        | on_Node
        | blocking_Node
        | guard_Node
        | invariant_Node
        | compound_Node
        | call_statement_Node
        | variable_Node
        | assign_Node
        | if_statement_Node
        | illegal_Node
        | interface_action_statement_Node
        | return_Node
        | skip_statement_Node
        | compound_Node
        | reply_Node
        | defer_Node
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface illegal_Node extends BaseNode {
    type: "illegal";
    _id: 154;
    isNamed: true;
    walk(): TypedCursor<
        UnnamedNode<"illegal", 155> | UnnamedNode<";", 156> | comment_Node | whiteline_Node | ERROR_Node
    >;
}
interface assign_Node extends BaseNode {
    type: "assign";
    _id: 157;
    isNamed: true;
    walk(): TypedCursor<
        | name_Node
        | UnnamedNode<"=", 158>
        | unary_expression_Node
        | group_Node
        | dollars_Node
        | literal_Node
        | compound_name_Node
        | call_Node
        | binary_expression_Node
        | UnnamedNode<";", 159>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface if_statement_Node extends BaseNode {
    type: "if_statement";
    _id: 160;
    isNamed: true;
    walk(): TypedCursor<
        | UnnamedNode<"if", 161>
        | UnnamedNode<"(", 162>
        | unary_expression_Node
        | group_Node
        | dollars_Node
        | literal_Node
        | compound_name_Node
        | call_Node
        | binary_expression_Node
        | UnnamedNode<")", 163>
        | call_statement_Node
        | variable_Node
        | assign_Node
        | if_statement_Node
        | illegal_Node
        | interface_action_statement_Node
        | return_Node
        | skip_statement_Node
        | compound_Node
        | reply_Node
        | defer_Node
        | UnnamedNode<"else", 164>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface reply_Node extends BaseNode {
    type: "reply";
    _id: 165;
    isNamed: true;
    walk(): TypedCursor<
        | name_Node
        | UnnamedNode<".", 166>
        | UnnamedNode<"reply", 167>
        | UnnamedNode<"(", 168>
        | unary_expression_Node
        | group_Node
        | dollars_Node
        | literal_Node
        | compound_name_Node
        | call_Node
        | binary_expression_Node
        | UnnamedNode<")", 169>
        | UnnamedNode<";", 170>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface return_Node extends BaseNode {
    type: "return";
    _id: 171;
    isNamed: true;
    walk(): TypedCursor<
        | UnnamedNode<"return", 172>
        | unary_expression_Node
        | group_Node
        | dollars_Node
        | literal_Node
        | compound_name_Node
        | call_Node
        | binary_expression_Node
        | UnnamedNode<";", 173>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface _expression_Node extends BaseNode {
    type: "_expression";
    _id: 174;
    isNamed: true;
    walk(): TypedCursor<
        | unary_expression_Node
        | group_Node
        | dollars_Node
        | literal_Node
        | compound_name_Node
        | call_Node
        | binary_expression_Node
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface group_Node extends BaseNode {
    type: "group";
    _id: 175;
    isNamed: true;
    walk(): TypedCursor<
        | UnnamedNode<"(", 176>
        | unary_expression_Node
        | group_Node
        | dollars_Node
        | literal_Node
        | compound_name_Node
        | call_Node
        | binary_expression_Node
        | UnnamedNode<")", 177>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface literal_Node extends BaseNode {
    type: "literal";
    _id: 178;
    isNamed: true;
    walk(): TypedCursor<
        number_Node | UnnamedNode<"true", 179> | UnnamedNode<"false", 180> | comment_Node | whiteline_Node | ERROR_Node
    >;
}
interface unary_expression_Node extends BaseNode {
    type: "unary_expression";
    _id: 181;
    isNamed: true;
    walk(): TypedCursor<
        | UnnamedNode<"!", 182>
        | unary_expression_Node
        | group_Node
        | dollars_Node
        | literal_Node
        | compound_name_Node
        | call_Node
        | binary_expression_Node
        | UnnamedNode<"-", 183>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface binary_expression_Node extends BaseNode {
    type: "binary_expression";
    _id: 184;
    isNamed: true;
    walk(): TypedCursor<
        | unary_expression_Node
        | group_Node
        | dollars_Node
        | literal_Node
        | compound_name_Node
        | call_Node
        | binary_expression_Node
        | UnnamedNode<"=>", 185>
        | UnnamedNode<"||", 186>
        | UnnamedNode<"&&", 187>
        | UnnamedNode<"==", 188>
        | UnnamedNode<"!=", 189>
        | UnnamedNode<"<", 190>
        | UnnamedNode<"<=", 191>
        | UnnamedNode<">=", 192>
        | UnnamedNode<">", 193>
        | UnnamedNode<"+", 194>
        | UnnamedNode<"-", 195>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface compound_name_Node extends BaseNode {
    type: "compound_name";
    _id: 196;
    isNamed: true;
    walk(): TypedCursor<
        | UnnamedNode<".", 197>
        | name_Node
        | UnnamedNode<".", 198>
        | member_name_Node
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
interface name_Node extends BaseNode {
    type: "name";
    _id: 199;
    isNamed: true;
}
interface member_name_Node extends BaseNode {
    type: "member_name";
    _id: 200;
    isNamed: true;
}
interface scoped_name_Node extends BaseNode {
    type: "scoped_name";
    _id: 201;
    isNamed: true;
}
interface _identifier_Node extends BaseNode {
    type: "_identifier";
    _id: 202;
    isNamed: true;
}
interface number_Node extends BaseNode {
    type: "number";
    _id: 203;
    isNamed: true;
}
interface comment_Node extends BaseNode {
    type: "comment";
    _id: 204;
    isNamed: true;
    walk(): TypedCursor<
        | UnnamedNode<"//", 205>
        | Pattern
        | UnnamedNode<"/*", 206>
        | UnnamedNode<"/", 207>
        | comment_Node
        | whiteline_Node
        | ERROR_Node
    >;
}
export type AllNodes =
    | root_Node
    | comment_Node
    | import_Node
    | dollars_Node
    | enum_Node
    | int_Node
    | extern_Node
    | namespace_Node
    | interface_Node
    | component_Node
    | function_Node
    | foreign_function_Node
    | import_Node
    | dollars_Node
    | enum_Node
    | int_Node
    | extern_Node
    | namespace_Node
    | interface_Node
    | component_Node
    | function_Node
    | foreign_function_Node
    | UnnamedNode<"import", 4>
    | file_name_Node
    | UnnamedNode<";", 5>
    | UnnamedNode<"$", 8>
    | dollars_content_Node
    | UnnamedNode<"$", 9>
    | UnnamedNode<"enum", 13>
    | scoped_name_Node
    | fields_Node
    | UnnamedNode<";", 14>
    | UnnamedNode<"{", 16>
    | member_name_Node
    | UnnamedNode<",", 17>
    | UnnamedNode<",", 18>
    | UnnamedNode<"}", 19>
    | UnnamedNode<"subint", 21>
    | UnnamedNode<"{", 22>
    | number_Node
    | UnnamedNode<"..", 23>
    | UnnamedNode<"}", 24>
    | UnnamedNode<";", 25>
    | UnnamedNode<"..", 27>
    | UnnamedNode<"extern", 29>
    | UnnamedNode<"$", 30>
    | UnnamedNode<"$", 31>
    | UnnamedNode<";", 32>
    | UnnamedNode<"namespace", 34>
    | compound_name_Node
    | UnnamedNode<"{", 35>
    | enum_Node
    | int_Node
    | extern_Node
    | namespace_Node
    | interface_Node
    | component_Node
    | function_Node
    | foreign_function_Node
    | UnnamedNode<"}", 36>
    | UnnamedNode<"interface", 39>
    | interface_body_Node
    | UnnamedNode<"{", 41>
    | enum_Node
    | int_Node
    | extern_Node
    | event_Node
    | behavior_Node
    | UnnamedNode<"}", 42>
    | event_Node
    | direction_Node
    | type_name_Node
    | event_name_Node
    | formals_Node
    | UnnamedNode<";", 45>
    | UnnamedNode<"in", 47>
    | UnnamedNode<"out", 48>
    | UnnamedNode<"component", 50>
    | UnnamedNode<"{", 51>
    | port_Node
    | behavior_Node
    | system_Node
    | UnnamedNode<"}", 52>
    | system_Node
    | UnnamedNode<"system", 55>
    | system_body_Node
    | UnnamedNode<"{", 57>
    | instance_Node
    | binding_Node
    | UnnamedNode<"}", 58>
    | instance_Node
    | binding_Node
    | name_Node
    | UnnamedNode<";", 61>
    | end_point_Node
    | UnnamedNode<"<=>", 63>
    | UnnamedNode<";", 64>
    | UnnamedNode<".", 66>
    | asterisk_Node
    | port_direction_Node
    | port_qualifiers_Node
    | UnnamedNode<";", 69>
    | UnnamedNode<"provides", 71>
    | UnnamedNode<"requires", 72>
    | UnnamedNode<"blocking", 75>
    | UnnamedNode<"external", 76>
    | UnnamedNode<"injected", 77>
    | UnnamedNode<"(", 79>
    | formal_Node
    | UnnamedNode<",", 80>
    | UnnamedNode<")", 81>
    | formal_direction_Node
    | var_name_Node
    | UnnamedNode<"in", 84>
    | UnnamedNode<"out", 85>
    | UnnamedNode<"inout", 86>
    | UnnamedNode<"provides", 87>
    | UnnamedNode<"requires", 88>
    | UnnamedNode<"bool", 90>
    | UnnamedNode<"void", 91>
    | UnnamedNode<"behavior", 93>
    | UnnamedNode<"behaviour", 94>
    | behavior_body_Node
    | UnnamedNode<"{", 96>
    | function_Node
    | variable_Node
    | on_Node
    | blocking_Node
    | guard_Node
    | invariant_Node
    | compound_Node
    | enum_Node
    | int_Node
    | extern_Node
    | UnnamedNode<"}", 97>
    | variable_Node
    | on_Node
    | blocking_Node
    | guard_Node
    | invariant_Node
    | compound_Node
    | compound_Node
    | function_body_one_line_Node
    | UnnamedNode<";", 101>
    | UnnamedNode<"=", 103>
    | unary_expression_Node
    | group_Node
    | dollars_Node
    | literal_Node
    | compound_name_Node
    | call_Node
    | binary_expression_Node
    | UnnamedNode<";", 104>
    | UnnamedNode<"invariant", 107>
    | UnnamedNode<";", 108>
    | UnnamedNode<"on", 110>
    | triggers_Node
    | UnnamedNode<":", 111>
    | on_Node
    | blocking_Node
    | guard_Node
    | invariant_Node
    | compound_Node
    | call_statement_Node
    | variable_Node
    | assign_Node
    | if_statement_Node
    | illegal_Node
    | interface_action_statement_Node
    | return_Node
    | skip_statement_Node
    | compound_Node
    | reply_Node
    | defer_Node
    | trigger_Node
    | UnnamedNode<",", 113>
    | optional_Node
    | inevitable_Node
    | trigger_formals_Node
    | UnnamedNode<"(", 118>
    | trigger_formal_Node
    | UnnamedNode<",", 119>
    | UnnamedNode<")", 120>
    | UnnamedNode<"<-", 122>
    | guard_condition_Node
    | UnnamedNode<"[", 125>
    | otherwise_Node
    | unary_expression_Node
    | group_Node
    | dollars_Node
    | literal_Node
    | compound_name_Node
    | call_Node
    | binary_expression_Node
    | UnnamedNode<"]", 126>
    | otherwise_Node
    | unary_expression_Node
    | group_Node
    | literal_Node
    | call_Node
    | binary_expression_Node
    | UnnamedNode<"{", 130>
    | UnnamedNode<"}", 131>
    | UnnamedNode<"=", 133>
    | UnnamedNode<";", 134>
    | call_statement_Node
    | assign_Node
    | if_statement_Node
    | illegal_Node
    | interface_action_statement_Node
    | return_Node
    | skip_statement_Node
    | reply_Node
    | defer_Node
    | UnnamedNode<"defer", 140>
    | arguments_Node
    | call_statement_Node
    | variable_Node
    | assign_Node
    | if_statement_Node
    | illegal_Node
    | interface_action_statement_Node
    | return_Node
    | skip_statement_Node
    | compound_Node
    | reply_Node
    | defer_Node
    | interface_action_Node
    | UnnamedNode<";", 142>
    | UnnamedNode<";", 145>
    | UnnamedNode<"(", 148>
    | UnnamedNode<",", 149>
    | UnnamedNode<")", 150>
    | UnnamedNode<"blocking", 153>
    | UnnamedNode<"illegal", 155>
    | UnnamedNode<";", 156>
    | UnnamedNode<"=", 158>
    | UnnamedNode<";", 159>
    | UnnamedNode<"if", 161>
    | UnnamedNode<"(", 162>
    | UnnamedNode<")", 163>
    | UnnamedNode<"else", 164>
    | UnnamedNode<".", 166>
    | UnnamedNode<"reply", 167>
    | UnnamedNode<"(", 168>
    | UnnamedNode<")", 169>
    | UnnamedNode<";", 170>
    | UnnamedNode<"return", 172>
    | UnnamedNode<";", 173>
    | UnnamedNode<"(", 176>
    | UnnamedNode<")", 177>
    | UnnamedNode<"true", 179>
    | UnnamedNode<"false", 180>
    | UnnamedNode<"!", 182>
    | UnnamedNode<"-", 183>
    | UnnamedNode<"=>", 185>
    | UnnamedNode<"||", 186>
    | UnnamedNode<"&&", 187>
    | UnnamedNode<"==", 188>
    | UnnamedNode<"!=", 189>
    | UnnamedNode<"<", 190>
    | UnnamedNode<"<=", 191>
    | UnnamedNode<">=", 192>
    | UnnamedNode<">", 193>
    | UnnamedNode<"+", 194>
    | UnnamedNode<"-", 195>
    | UnnamedNode<".", 197>
    | UnnamedNode<".", 198>
    | UnnamedNode<"//", 205>
    | Pattern
    | UnnamedNode<"/*", 206>
    | UnnamedNode<"/", 207>
    | Pattern
    | whiteline_Node
    | ERROR_Node;
