// <declarations file auto-generated from node-types.json>

import type * as Parser from "web-tree-sitter";

interface UnnamedNode<T extends string> extends Parser.SyntaxNode {
    type: T;
    isNamed: false;
}
interface action_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "action";
    childForFieldName(kind: "arguments"): arguments_Node;
    childForFieldName(kind: "name"): name_Node;
    childForFieldName(kind: "port_name"): port_name_Node;
}
interface arguments_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "arguments";
    childrenForFieldName(
        kind: "expression"
    ):
        | Array<
              | action_Node
              | binary_expression_Node
              | call_Node
              | compound_name_Node
              | dollars_Node
              | group_Node
              | literal_Node
              | unary_expression_Node
          >
        | undefined;
}
interface assign_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "assign";
    childForFieldName(kind: "left"): var_Node;
    childForFieldName(
        kind: "right"
    ):
        | action_Node
        | binary_expression_Node
        | call_Node
        | compound_name_Node
        | dollars_Node
        | group_Node
        | literal_Node
        | unary_expression_Node;
}
interface behavior_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "behavior";
    childForFieldName(kind: "body"): behavior_body_Node;
    childForFieldName(kind: "name"): name_Node | undefined;
}
interface behavior_body_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "behavior_body";
    child(
        i: number
    ):
        | blocking_Node
        | compound_Node
        | enum_Node
        | extern_Node
        | function_Node
        | guard_Node
        | int_Node
        | on_Node
        | variable_Node
        | undefined;
    children: Array<
        | blocking_Node
        | compound_Node
        | enum_Node
        | extern_Node
        | function_Node
        | guard_Node
        | int_Node
        | on_Node
        | variable_Node
    >;
}
interface binary_expression_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "binary_expression";
    childForFieldName(
        kind: "left"
    ):
        | action_Node
        | binary_expression_Node
        | call_Node
        | compound_name_Node
        | dollars_Node
        | group_Node
        | literal_Node
        | unary_expression_Node;
    childForFieldName(
        kind: "operator"
    ):
        | UnnamedNode<"!=">
        | UnnamedNode<"&&">
        | UnnamedNode<"+">
        | UnnamedNode<"-">
        | UnnamedNode<"<">
        | UnnamedNode<"<=">
        | UnnamedNode<"==">
        | UnnamedNode<">">
        | UnnamedNode<">=">
        | UnnamedNode<"||">;
    childForFieldName(
        kind: "right"
    ):
        | action_Node
        | binary_expression_Node
        | call_Node
        | compound_name_Node
        | dollars_Node
        | group_Node
        | literal_Node
        | unary_expression_Node;
}
interface binding_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "binding";
    childForFieldName(kind: "left"): end_point_Node;
    childForFieldName(kind: "right"): end_point_Node;
}
interface blocking_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "blocking";
    childrenForFieldName(
        kind: "statement"
    ): Array<
        | UnnamedNode<";">
        | action_Node
        | assign_Node
        | blocking_Node
        | call_Node
        | compound_Node
        | defer_Node
        | guard_Node
        | if_statement_Node
        | illegal_Node
        | interface_action_Node
        | on_Node
        | reply_Node
        | return_Node
        | skip_statement_Node
        | variable_Node
    >;
}
interface body_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "body";
    child(i: 0): behavior_Node | system_Node;
    firstChild: behavior_Node | system_Node;
    children: [behavior_Node | system_Node];
}
interface call_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "call";
    childForFieldName(kind: "arguments"): arguments_Node;
    childForFieldName(kind: "name"): name_Node;
}
interface comment_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "comment";
}
interface component_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "component";
    childForFieldName(kind: "body"): body_Node | undefined;
    childForFieldName(kind: "name"): scoped_name_Node;
    childrenForFieldName(kind: "port"): Array<port_Node> | undefined;
}
interface compound_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "compound";
    childrenForFieldName(
        kind: "statement"
    ):
        | Array<
              | UnnamedNode<";">
              | action_Node
              | assign_Node
              | blocking_Node
              | call_Node
              | compound_Node
              | defer_Node
              | guard_Node
              | if_statement_Node
              | illegal_Node
              | interface_action_Node
              | on_Node
              | reply_Node
              | return_Node
              | skip_statement_Node
              | variable_Node
          >
        | undefined;
}
interface compound_name_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "compound_name";
    childForFieldName(kind: "global"): global_Node | undefined;
    childrenForFieldName(kind: "part"): Array<UnnamedNode<"."> | identifier_Node>;
}
interface defer_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "defer";
    childForFieldName(kind: "arguments"): arguments_Node | undefined;
    childrenForFieldName(
        kind: "statement"
    ): Array<
        | UnnamedNode<";">
        | action_Node
        | assign_Node
        | call_Node
        | compound_Node
        | defer_Node
        | if_statement_Node
        | illegal_Node
        | interface_action_Node
        | reply_Node
        | return_Node
        | skip_statement_Node
        | variable_Node
    >;
}
interface direction_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "direction";
}
interface dollars_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "dollars";
    childForFieldName(kind: "value"): dollars_content_Node;
}
interface end_point_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "end_point";
    childForFieldName(kind: "asterisk"): asterisk_Node | undefined;
    childForFieldName(kind: "name"): compound_name_Node | undefined;
}
interface enum_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "enum";
    childForFieldName(kind: "fields"): fields_Node;
    childForFieldName(kind: "name"): scoped_name_Node;
}
interface event_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "event";
    childForFieldName(kind: "direction"): direction_Node;
    childForFieldName(kind: "event_name"): event_name_Node;
    childForFieldName(kind: "formals"): formals_Node;
    childForFieldName(kind: "type_name"): type_name_Node;
}
interface event_name_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "event_name";
}
interface extern_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "extern";
    childForFieldName(kind: "name"): scoped_name_Node;
    childForFieldName(kind: "value"): dollars_content_Node;
}
interface fields_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "fields";
    childrenForFieldName(kind: "name"): Array<name_Node>;
}
interface formal_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "formal";
    childForFieldName(kind: "direction"): formal_direction_Node | undefined;
    childForFieldName(kind: "name"): var_name_Node;
    childForFieldName(kind: "type"): type_name_Node;
}
interface formal_direction_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "formal_direction";
}
interface formals_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "formals";
    childrenForFieldName(kind: "formal"): Array<formal_Node> | undefined;
}
interface function_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "function";
    childForFieldName(kind: "body"): compound_Node;
    childForFieldName(kind: "formals"): formals_Node;
    childForFieldName(kind: "name"): name_Node;
    childForFieldName(kind: "return_type"): type_name_Node;
}
interface global_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "global";
}
interface group_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "group";
    childForFieldName(
        kind: "expression"
    ):
        | action_Node
        | binary_expression_Node
        | call_Node
        | compound_name_Node
        | dollars_Node
        | group_Node
        | literal_Node
        | unary_expression_Node;
}
interface guard_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "guard";
    childrenForFieldName(
        kind: "body"
    ): Array<
        | UnnamedNode<";">
        | action_Node
        | assign_Node
        | blocking_Node
        | call_Node
        | compound_Node
        | defer_Node
        | guard_Node
        | if_statement_Node
        | illegal_Node
        | interface_action_Node
        | on_Node
        | reply_Node
        | return_Node
        | skip_statement_Node
        | variable_Node
    >;
    childForFieldName(
        kind: "condition"
    ):
        | action_Node
        | binary_expression_Node
        | call_Node
        | compound_name_Node
        | dollars_Node
        | group_Node
        | literal_Node
        | otherwise_Node
        | unary_expression_Node;
}
interface if_statement_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "if_statement";
    childrenForFieldName(
        kind: "else_statement"
    ):
        | Array<
              | UnnamedNode<";">
              | action_Node
              | assign_Node
              | call_Node
              | compound_Node
              | defer_Node
              | if_statement_Node
              | illegal_Node
              | interface_action_Node
              | reply_Node
              | return_Node
              | skip_statement_Node
              | variable_Node
          >
        | undefined;
    childForFieldName(
        kind: "expression"
    ):
        | action_Node
        | binary_expression_Node
        | call_Node
        | compound_name_Node
        | dollars_Node
        | group_Node
        | literal_Node
        | unary_expression_Node;
    childrenForFieldName(
        kind: "statement"
    ): Array<
        | UnnamedNode<";">
        | action_Node
        | assign_Node
        | call_Node
        | compound_Node
        | defer_Node
        | if_statement_Node
        | illegal_Node
        | interface_action_Node
        | reply_Node
        | return_Node
        | skip_statement_Node
        | variable_Node
    >;
}
interface illegal_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "illegal";
}
interface import_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "import";
    childForFieldName(kind: "file_name"): file_name_Node;
}
interface instance_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "instance";
    childForFieldName(kind: "name"): name_Node;
    childForFieldName(kind: "type"): compound_name_Node;
}
interface int_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "int";
    childForFieldName(kind: "from"): number_Node;
    childForFieldName(kind: "name"): scoped_name_Node;
    childForFieldName(kind: "to"): number_Node;
}

interface SpecificTypedCursor<N extends AllNodes> {
    nodeType: N["type"];
    currentNode: N;
}

type PickType<Node extends AllNodes, T extends string> = Node extends { type: T } ? Node : never;

type CursorRecord = { [K in AllNodes["type"]]: SpecificTypedCursor<PickType<AllNodes, K>> };
type TypedCursor = CursorRecord[keyof CursorRecord];

interface interface_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "interface";
    childForFieldName(kind: "body"): interface_body_Node;
    childForFieldName(kind: "name"): scoped_name_Node;
    //walk(): TypedCursor<interface_body_Node | scoped_name_Node>;
}
interface interface_action_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "interface_action";
}
interface interface_body_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "interface_body";
    childForFieldName(kind: "behavior"): behavior_Node | undefined;
    child(i: number): enum_Node | event_Node | extern_Node | int_Node | undefined;
    children: Array<enum_Node | event_Node | extern_Node | int_Node>;
}
interface literal_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "literal";
    child(i: 0): number_Node | undefined;
    firstChild: number_Node | undefined;
    children: [number_Node | undefined];
}
interface name_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "name";
}
interface namespace_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "namespace";
    childForFieldName(kind: "name"): compound_name_Node;
    child(i: number): component_Node | enum_Node | extern_Node | int_Node | interface_Node | namespace_Node | undefined;
    children: Array<component_Node | enum_Node | extern_Node | int_Node | interface_Node | namespace_Node>;
}
interface on_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "on";
    childrenForFieldName(
        kind: "body"
    ): Array<
        | UnnamedNode<";">
        | action_Node
        | assign_Node
        | blocking_Node
        | call_Node
        | compound_Node
        | defer_Node
        | guard_Node
        | if_statement_Node
        | illegal_Node
        | interface_action_Node
        | on_Node
        | reply_Node
        | return_Node
        | skip_statement_Node
        | variable_Node
    >;
    childForFieldName(kind: "triggers"): triggers_Node;
}
interface port_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "port";
    childForFieldName(kind: "direction"): port_direction_Node;
    childForFieldName(kind: "formals"): formals_Node | undefined;
    childForFieldName(kind: "name"): port_name_Node;
    childForFieldName(kind: "qualifiers"): port_qualifiers_Node | undefined;
    childForFieldName(kind: "type"): compound_name_Node;
}
interface port_direction_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "port_direction";
}
interface port_event_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "port_event";
    childForFieldName(kind: "formals"): trigger_formals_Node;
    childForFieldName(kind: "name"): name_Node;
    childForFieldName(kind: "port"): port_name_Node;
}
interface port_name_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "port_name";
}
interface port_qualifier_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "port_qualifier";
}
interface port_qualifiers_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "port_qualifiers";
    childrenForFieldName(kind: "qualifier"): Array<port_qualifier_Node>;
}
interface reply_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "reply";
    childForFieldName(
        kind: "expression"
    ):
        | action_Node
        | binary_expression_Node
        | call_Node
        | compound_name_Node
        | dollars_Node
        | group_Node
        | literal_Node
        | unary_expression_Node;
    childForFieldName(kind: "port"): port_name_Node | undefined;
}
interface return_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "return";
    childForFieldName(
        kind: "expression"
    ):
        | action_Node
        | binary_expression_Node
        | call_Node
        | compound_name_Node
        | dollars_Node
        | group_Node
        | literal_Node
        | unary_expression_Node
        | undefined;
}
interface root_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "root";
    child(
        i: number
    ):
        | component_Node
        | dollars_Node
        | enum_Node
        | extern_Node
        | import_Node
        | int_Node
        | interface_Node
        | namespace_Node
        | undefined;
    children: Array<
        | component_Node
        | dollars_Node
        | enum_Node
        | extern_Node
        | import_Node
        | int_Node
        | interface_Node
        | namespace_Node
    >;
}
interface scoped_name_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "scoped_name";
}
interface skip_statement_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "skip_statement";
}
interface system_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "system";
    childForFieldName(kind: "body"): system_body_Node;
}
interface system_body_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "system_body";
    child(i: number): binding_Node | instance_Node | undefined;
    children: Array<binding_Node | instance_Node>;
}
interface trigger_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "trigger";
    child(i: 0): event_name_Node | inevitable_Node | optional_Node | port_event_Node;
    firstChild: event_name_Node | inevitable_Node | optional_Node | port_event_Node;
    children: [event_name_Node | inevitable_Node | optional_Node | port_event_Node];
}
interface trigger_formal_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "trigger_formal";
    child(i: number): var_Node | undefined;
    children: Array<var_Node>;
}
interface trigger_formals_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "trigger_formals";
    child(i: number): trigger_formal_Node | undefined;
    children: Array<trigger_formal_Node>;
}
interface triggers_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "triggers";
    childrenForFieldName(kind: "trigger"): Array<trigger_Node>;
}
interface type_name_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "type_name";
    child(i: 0): compound_name_Node | undefined;
    firstChild: compound_name_Node | undefined;
    children: [compound_name_Node | undefined];
}
interface unary_expression_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "unary_expression";
    childForFieldName(
        kind: "expression"
    ):
        | action_Node
        | binary_expression_Node
        | call_Node
        | compound_name_Node
        | dollars_Node
        | group_Node
        | literal_Node
        | unary_expression_Node;
    childForFieldName(kind: "operator"): UnnamedNode<"!"> | UnnamedNode<"-">;
}
interface var_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "var";
}
interface var_name_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "var_name";
}
interface variable_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "variable";
    childForFieldName(
        kind: "expression"
    ):
        | action_Node
        | binary_expression_Node
        | call_Node
        | compound_name_Node
        | dollars_Node
        | group_Node
        | literal_Node
        | unary_expression_Node
        | undefined;
    childForFieldName(kind: "name"): var_name_Node;
    childForFieldName(kind: "type_name"): type_name_Node;
}
interface asterisk_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "asterisk";
}
interface dollars_content_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "dollars_content";
}
interface file_name_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "file_name";
}
interface identifier_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "identifier";
}
interface inevitable_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "inevitable";
}
interface number_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "number";
}
interface optional_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "optional";
}
interface otherwise_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "children" | "firstChild"
    > {
    type: "otherwise";
}
type AllNodes =
    | action_Node
    | arguments_Node
    | assign_Node
    | behavior_Node
    | behavior_body_Node
    | binary_expression_Node
    | binding_Node
    | blocking_Node
    | body_Node
    | call_Node
    | comment_Node
    | component_Node
    | compound_Node
    | compound_name_Node
    | defer_Node
    | direction_Node
    | dollars_Node
    | end_point_Node
    | enum_Node
    | event_Node
    | event_name_Node
    | extern_Node
    | fields_Node
    | formal_Node
    | formal_direction_Node
    | formals_Node
    | function_Node
    | global_Node
    | group_Node
    | guard_Node
    | if_statement_Node
    | illegal_Node
    | import_Node
    | instance_Node
    | int_Node
    | interface_Node
    | interface_action_Node
    | interface_body_Node
    | literal_Node
    | name_Node
    | namespace_Node
    | on_Node
    | port_Node
    | port_direction_Node
    | port_event_Node
    | port_name_Node
    | port_qualifier_Node
    | port_qualifiers_Node
    | reply_Node
    | return_Node
    | root_Node
    | scoped_name_Node
    | skip_statement_Node
    | system_Node
    | system_body_Node
    | trigger_Node
    | trigger_formal_Node
    | trigger_formals_Node
    | triggers_Node
    | type_name_Node
    | unary_expression_Node
    | var_Node
    | var_name_Node
    | variable_Node
    | asterisk_Node
    | dollars_content_Node
    | file_name_Node
    | identifier_Node
    | inevitable_Node
    | number_Node
    | optional_Node
    | otherwise_Node;
