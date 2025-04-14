// <declarations file auto-generated from node-types.json>

import type * as Parser from "web-tree-sitter";
export type SyntaxNode = Parser.SyntaxNode;

export interface UnnamedNode<T extends string> extends Parser.SyntaxNode {
    type: T;
    isNamed: false;
}

export interface TypedCursor<TNodes extends { type: string }> extends Parser.TreeCursor {
    nodeType: TNodes["type"];
}
export interface arguments_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "arguments";
    childrenForFieldName(
        kind: "expression"
    ):
        | Array<
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
export interface assign_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "assign";
    childForFieldName(kind: "left"): name_Node;
    childForFieldName(
        kind: "right"
    ):
        | binary_expression_Node
        | call_Node
        | compound_name_Node
        | dollars_Node
        | group_Node
        | literal_Node
        | unary_expression_Node;
}
export interface behavior_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "behavior";
    childForFieldName(kind: "body"): behavior_body_Node;
    childForFieldName(kind: "name"): name_Node | undefined;
}
export interface behavior_body_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "behavior_body";
    childrenForFieldName(
        kind: "statement"
    ):
        | Array<
              | blocking_Node
              | compound_Node
              | enum_Node
              | extern_Node
              | function_Node
              | guard_Node
              | int_Node
              | invariant_Node
              | on_Node
              | variable_Node
          >
        | undefined;
}
export interface binary_expression_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "binary_expression";
    childForFieldName(
        kind: "left"
    ):
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
        | UnnamedNode<"=>">
        | UnnamedNode<">">
        | UnnamedNode<">=">
        | UnnamedNode<"||">;
    childForFieldName(
        kind: "right"
    ):
        | binary_expression_Node
        | call_Node
        | compound_name_Node
        | dollars_Node
        | group_Node
        | literal_Node
        | unary_expression_Node;
}
export interface binding_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "binding";
    childForFieldName(kind: "left"): end_point_Node;
    childForFieldName(kind: "right"): end_point_Node;
}
export interface blocking_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "blocking";
    childForFieldName(
        kind: "statement"
    ):
        | assign_Node
        | blocking_Node
        | call_statement_Node
        | compound_Node
        | defer_Node
        | guard_Node
        | if_statement_Node
        | illegal_Node
        | interface_action_statement_Node
        | invariant_Node
        | on_Node
        | reply_Node
        | return_Node
        | skip_statement_Node
        | variable_Node;
}
export interface call_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "call";
    childForFieldName(kind: "arguments"): arguments_Node;
    childForFieldName(kind: "name"): compound_name_Node;
}
export interface call_statement_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "call_statement";
    childForFieldName(kind: "call"): call_Node;
}
export interface comment_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "comment";
}
export interface component_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "component";
    childForFieldName(kind: "body"): behavior_Node | system_Node | undefined;
    childForFieldName(kind: "name"): scoped_name_Node;
    childrenForFieldName(kind: "port"): Array<port_Node> | undefined;
}
export interface compound_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "compound";
    childrenForFieldName(
        kind: "statement"
    ):
        | Array<
              | assign_Node
              | blocking_Node
              | call_statement_Node
              | compound_Node
              | defer_Node
              | guard_Node
              | if_statement_Node
              | illegal_Node
              | interface_action_statement_Node
              | invariant_Node
              | on_Node
              | reply_Node
              | return_Node
              | skip_statement_Node
              | variable_Node
          >
        | undefined;
}
export interface compound_name_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "compound_name";
    childForFieldName(kind: "global"): UnnamedNode<"."> | undefined;
    childrenForFieldName(kind: "part"): Array<identifier_Node>;
}
export interface defer_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "defer";
    childForFieldName(kind: "arguments"): arguments_Node | undefined;
    childForFieldName(
        kind: "statement"
    ):
        | assign_Node
        | call_statement_Node
        | compound_Node
        | defer_Node
        | if_statement_Node
        | illegal_Node
        | interface_action_statement_Node
        | reply_Node
        | return_Node
        | skip_statement_Node
        | variable_Node;
}
export interface direction_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "direction";
}
export interface dollars_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "dollars";
    childForFieldName(kind: "value"): dollars_content_Node;
}
export interface end_point_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "end_point";
    childForFieldName(kind: "asterisk"): asterisk_Node | undefined;
    childForFieldName(kind: "name"): compound_name_Node | undefined;
}
export interface enum_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "enum";
    childForFieldName(kind: "fields"): fields_Node;
    childForFieldName(kind: "name"): scoped_name_Node;
}
export interface event_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "event";
    childForFieldName(kind: "direction"): direction_Node;
    childForFieldName(kind: "event_name"): event_name_Node;
    childForFieldName(kind: "formals"): formals_Node;
    childForFieldName(kind: "type_name"): type_name_Node;
}
export interface event_name_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "event_name";
}
export interface extern_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "extern";
    childForFieldName(kind: "name"): scoped_name_Node;
    childForFieldName(kind: "value"): dollars_content_Node;
}
export interface fields_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "fields";
    childrenForFieldName(kind: "name"): Array<member_name_Node>;
}
export interface formal_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "formal";
    childForFieldName(kind: "direction"): formal_direction_Node | undefined;
    childForFieldName(kind: "name"): var_name_Node;
    childForFieldName(kind: "type"): type_name_Node;
}
export interface formal_direction_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "formal_direction";
}
export interface formals_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "formals";
    childrenForFieldName(kind: "formal"): Array<formal_Node> | undefined;
}
export interface function_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "function";
    childForFieldName(kind: "compound"): compound_Node | undefined;
    childForFieldName(kind: "expression"): function_body_one_line_Node | undefined;
    childForFieldName(kind: "formals"): formals_Node;
    childForFieldName(kind: "name"): name_Node;
    childForFieldName(kind: "return_type"): type_name_Node;
}
export interface function_body_one_line_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "function_body_one_line";
    childForFieldName(
        kind: "expression"
    ):
        | binary_expression_Node
        | call_Node
        | compound_name_Node
        | dollars_Node
        | group_Node
        | literal_Node
        | unary_expression_Node;
}
export interface group_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "group";
    childForFieldName(
        kind: "expression"
    ):
        | binary_expression_Node
        | call_Node
        | compound_name_Node
        | dollars_Node
        | group_Node
        | literal_Node
        | unary_expression_Node;
}
export interface guard_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "guard";
    childForFieldName(
        kind: "body"
    ):
        | assign_Node
        | blocking_Node
        | call_statement_Node
        | compound_Node
        | defer_Node
        | guard_Node
        | if_statement_Node
        | illegal_Node
        | interface_action_statement_Node
        | invariant_Node
        | on_Node
        | reply_Node
        | return_Node
        | skip_statement_Node
        | variable_Node;
    childForFieldName(
        kind: "condition"
    ):
        | binary_expression_Node
        | call_Node
        | compound_name_Node
        | dollars_Node
        | group_Node
        | literal_Node
        | otherwise_Node
        | unary_expression_Node;
}
export interface identifier_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "identifier";
}
export interface if_statement_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "if_statement";
    childForFieldName(
        kind: "else_statement"
    ):
        | assign_Node
        | call_statement_Node
        | compound_Node
        | defer_Node
        | if_statement_Node
        | illegal_Node
        | interface_action_statement_Node
        | reply_Node
        | return_Node
        | skip_statement_Node
        | variable_Node
        | undefined;
    childForFieldName(
        kind: "expression"
    ):
        | binary_expression_Node
        | call_Node
        | compound_name_Node
        | dollars_Node
        | group_Node
        | literal_Node
        | unary_expression_Node;
    childForFieldName(
        kind: "statement"
    ):
        | assign_Node
        | call_statement_Node
        | compound_Node
        | defer_Node
        | if_statement_Node
        | illegal_Node
        | interface_action_statement_Node
        | reply_Node
        | return_Node
        | skip_statement_Node
        | variable_Node;
}
export interface illegal_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "illegal";
}
export interface import_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "import";
    childForFieldName(kind: "file_name"): file_name_Node;
}
export interface instance_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "instance";
    childForFieldName(kind: "name"): name_Node;
    childForFieldName(kind: "type"): compound_name_Node;
}
export interface int_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "int";
    childForFieldName(kind: "from"): number_Node;
    childForFieldName(kind: "name"): scoped_name_Node;
    childForFieldName(kind: "to"): number_Node;
}
export interface interface_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "interface";
    childForFieldName(kind: "body"): interface_body_Node;
    childForFieldName(kind: "name"): scoped_name_Node;
}
export interface interface_action_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "interface_action";
}
export interface interface_action_statement_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "interface_action_statement";
    childForFieldName(kind: "name"): interface_action_Node;
}
export interface interface_body_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "interface_body";
    childForFieldName(kind: "behavior"): behavior_Node | undefined;
    childrenForFieldName(
        kind: "interface_statement"
    ): Array<enum_Node | event_Node | extern_Node | int_Node> | undefined;
}
export interface invariant_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "invariant";
    childForFieldName(
        kind: "expression"
    ):
        | binary_expression_Node
        | call_Node
        | compound_name_Node
        | dollars_Node
        | group_Node
        | literal_Node
        | unary_expression_Node;
}
export interface literal_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "literal";
}
export interface name_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "name";
}
export interface namespace_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "namespace";
    childrenForFieldName(
        kind: "body_statement"
    ):
        | Array<component_Node | enum_Node | extern_Node | function_Node | int_Node | interface_Node | namespace_Node>
        | undefined;
    childForFieldName(kind: "name"): compound_name_Node;
}
export interface on_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "on";
    childForFieldName(
        kind: "body"
    ):
        | assign_Node
        | blocking_Node
        | call_statement_Node
        | compound_Node
        | defer_Node
        | guard_Node
        | if_statement_Node
        | illegal_Node
        | interface_action_statement_Node
        | invariant_Node
        | on_Node
        | reply_Node
        | return_Node
        | skip_statement_Node
        | variable_Node;
    childForFieldName(kind: "triggers"): triggers_Node;
}
export interface port_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "port";
    childForFieldName(kind: "direction"): port_direction_Node;
    childForFieldName(kind: "formals"): formals_Node | undefined;
    childForFieldName(kind: "name"): name_Node;
    childForFieldName(kind: "qualifiers"): port_qualifiers_Node | undefined;
    childForFieldName(kind: "type"): compound_name_Node;
}
export interface port_direction_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "port_direction";
}
export interface port_qualifier_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "port_qualifier";
}
export interface port_qualifiers_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "port_qualifiers";
    childrenForFieldName(kind: "qualifier"): Array<port_qualifier_Node>;
}
export interface reply_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "reply";
    childForFieldName(
        kind: "expression"
    ):
        | binary_expression_Node
        | call_Node
        | compound_name_Node
        | dollars_Node
        | group_Node
        | literal_Node
        | unary_expression_Node
        | undefined;
    childForFieldName(kind: "port"): name_Node | undefined;
}
export interface return_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "return";
    childForFieldName(
        kind: "expression"
    ):
        | binary_expression_Node
        | call_Node
        | compound_name_Node
        | dollars_Node
        | group_Node
        | literal_Node
        | unary_expression_Node
        | undefined;
}
export interface root_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "root";
    childrenForFieldName(
        kind: "statement"
    ):
        | Array<
              | component_Node
              | dollars_Node
              | enum_Node
              | extern_Node
              | function_Node
              | import_Node
              | int_Node
              | interface_Node
              | namespace_Node
          >
        | undefined;
}
export interface scoped_name_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "scoped_name";
}
export interface skip_statement_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "skip_statement";
}
export interface system_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "system";
    childForFieldName(kind: "body"): system_body_Node;
}
export interface system_body_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "system_body";
    childrenForFieldName(kind: "instance_or_binding"): Array<binding_Node | instance_Node> | undefined;
}
export interface trigger_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "trigger";
    childForFieldName(kind: "formals"): trigger_formals_Node | undefined;
    childForFieldName(kind: "inevitable"): inevitable_Node | undefined;
    childForFieldName(kind: "name"): compound_name_Node | undefined;
    childForFieldName(kind: "optional"): optional_Node | undefined;
}
export interface trigger_formal_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "trigger_formal";
    childForFieldName(kind: "assign_name"): name_Node | undefined;
    childForFieldName(kind: "name"): name_Node;
}
export interface trigger_formals_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "trigger_formals";
    childrenForFieldName(kind: "trigger_formal"): Array<trigger_formal_Node> | undefined;
}
export interface triggers_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "triggers";
    childrenForFieldName(kind: "trigger"): Array<trigger_Node>;
}
export interface type_name_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "type_name";
    childForFieldName(kind: "name"): compound_name_Node | undefined;
}
export interface unary_expression_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "unary_expression";
    childForFieldName(
        kind: "expression"
    ):
        | binary_expression_Node
        | call_Node
        | compound_name_Node
        | dollars_Node
        | group_Node
        | literal_Node
        | unary_expression_Node;
    childForFieldName(kind: "operator"): UnnamedNode<"!"> | UnnamedNode<"-">;
}
export interface var_name_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "var_name";
}
export interface variable_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "variable";
    childForFieldName(
        kind: "expression"
    ):
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
export interface asterisk_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "asterisk";
}
export interface dollars_content_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "dollars_content";
}
export interface file_name_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "file_name";
}
export interface inevitable_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "inevitable";
}
export interface member_name_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "member_name";
}
export interface number_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "number";
}
export interface optional_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "optional";
}
export interface otherwise_Node
    extends Omit<
        Parser.SyntaxNode,
        "childForFieldName" | "childrenForFieldName" | "child" | "firstNamedChild" | "namedChildren"
    > {
    type: "otherwise";
}
export type AllNodes =
    | arguments_Node
    | assign_Node
    | behavior_Node
    | behavior_body_Node
    | binary_expression_Node
    | binding_Node
    | blocking_Node
    | call_Node
    | call_statement_Node
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
    | function_body_one_line_Node
    | group_Node
    | guard_Node
    | identifier_Node
    | if_statement_Node
    | illegal_Node
    | import_Node
    | instance_Node
    | int_Node
    | interface_Node
    | interface_action_Node
    | interface_action_statement_Node
    | interface_body_Node
    | invariant_Node
    | literal_Node
    | name_Node
    | namespace_Node
    | on_Node
    | port_Node
    | port_direction_Node
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
    | var_name_Node
    | variable_Node
    | asterisk_Node
    | dollars_content_Node
    | file_name_Node
    | inevitable_Node
    | member_name_Node
    | number_Node
    | optional_Node
    | otherwise_Node;
