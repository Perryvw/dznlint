import { SourcePosition, SourceRange } from "./diagnostic";
import { ASTKinds, identifier, PosInfo } from "./grammar/parser";
import { ASTNode } from "./linting-rule";

export function nodeToSourceRange(node: { start: PosInfo; end: PosInfo }): SourceRange {
    return {
        from: posInfoToSourcePosition(node.start),
        to: posInfoToSourcePosition(node.end),
    };
}

export function posInfoToSourcePosition(pos: PosInfo): SourcePosition {
    return {
        index: pos.overallPos,
        line: pos.line,
        column: pos.offset,
    };
}

export function headTailToList<T>(obj: { head?: T; tail: Array<{ elem: T }> }): Array<NonNullable<T>> {
    const result = [];
    if (obj.head) {
        result.push(obj.head as NonNullable<T>);
    }
    for (const { elem } of obj.tail) {
        result.push(elem as NonNullable<T>);
    }
    return result;
}

export function isIdentifier(node: ASTNode): node is identifier {
    return node.kind === ASTKinds.identifier;
}
