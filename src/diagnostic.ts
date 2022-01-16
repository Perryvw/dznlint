export enum DiagnosticLevel {
    Hint,
    Warning,
    Error
}

export interface SourcePosition {
    index: number,
    line: number,
    column: number
}

export interface Diagnostic {
    level: Diagnostic,
    message: string,
    range: {
        from: SourcePosition,
        to: SourcePosition
    }
}