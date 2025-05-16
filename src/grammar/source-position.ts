export interface SourcePosition {
    index: number;
    line: number;
    column: number;
}

export interface SourceRange {
    from: SourcePosition;
    to: SourcePosition;
}
