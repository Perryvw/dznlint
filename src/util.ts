import { SourcePosition, SourceRange } from "./diagnostic";
import { PosInfo } from "./grammar/parser";

export function nodeToSourceRange(node: { start: PosInfo, end: PosInfo }): SourceRange {
    return {
        from: posInfoToSourcePosition(node.start),
        to: posInfoToSourcePosition(node.end),
    }
}

function posInfoToSourcePosition(pos: PosInfo): SourcePosition {
    return {
        index: pos.overallPos,
        line: pos.line,
        column: pos.offset
    };
}