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

export interface SourceRange {
    from: SourcePosition
    to: SourcePosition
}

export interface Diagnostic {
    level: DiagnosticLevel,
    message: string,
    range: SourceRange
}

const Reset = "\x1b[0m"
const Underscore = "\x1b[4m"
const FgRed = "\x1b[31m"
const FgGreen = "\x1b[32m"
const FgCyan = "\x1b[36m"
const FgYellow = "\x1b[93m"
const FgWhite = "\x1b[37m"

export function formatDiagnostic(diagnostic : Diagnostic, source: string): string {
    const { fullLine, offsetInLine } = findFullLine(diagnostic.range, source);
    const length = diagnostic.range.to.index - diagnostic.range.from.index;
    const underline = " ".repeat(offsetInLine) + FgRed + "~".repeat(length) + Reset;

    const label = diagnostic.level === DiagnosticLevel.Error ? (FgRed + "error" + Reset)
        : diagnostic.level === DiagnosticLevel.Warning ? (FgYellow + "warning" + Reset)
        : diagnostic.level === DiagnosticLevel.Hint ? (FgCyan + "hint" + Reset) : "";

    return `${label}:${diagnostic.range.from.line} ${diagnostic.message}\n\n    ${fullLine}\n    ${underline}\n`;
}

function findFullLine(range: SourceRange, source: string) {
    let lineStart = range.from.index;
    for (; lineStart >= 0; lineStart--) {
        if (source[lineStart] === '\n') break;
    }

    let lineEnd = range.to.index;
    for (; lineEnd < source.length; lineEnd++) {
        if (source[lineEnd] === '\n' || source[lineEnd] === '\r') break;
    }

    let line = source.slice(lineStart, lineEnd);
    const preTrimLength = line.length;
    line = line.trimStart();
    const trimmed = preTrimLength - line.length;

    return {
        fullLine: line.trimEnd(),
        offsetInLine: range.from.index - lineStart - trimmed,
    };
}