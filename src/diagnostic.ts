import { InputSource } from "./dznlint"

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

export type DiagnosticCode = number & { __diagnosticIdBrand: never };

export interface Diagnostic {
    code: DiagnosticCode;
    source: InputSource,
    level: DiagnosticLevel,
    message: string,
    range: SourceRange
}

// Colors to use in console
const Reset = "\x1b[0m"
const Underscore = "\x1b[4m"
const FgRed = "\x1b[31m"
const FgGreen = "\x1b[32m"
const FgCyan = "\x1b[36m"
const FgYellow = "\x1b[93m"
const FgWhite = "\x1b[37m"
const Dim = "\x1b[2m"

export function formatDiagnostic(diagnostic : Diagnostic): string {
    const fileLabel = diagnostic.source.fileName
        ? `${FgCyan}${diagnostic.source.fileName ?? "-"}${Reset}:${diagnostic.range.from.line}`
        : `-:${diagnostic.range.from.line}`;

    const typeLabel = diagnostic.level === DiagnosticLevel.Error ? (FgRed + "error" + Reset)
        : diagnostic.level === DiagnosticLevel.Warning ? (FgYellow + "warning" + Reset)
        : diagnostic.level === DiagnosticLevel.Hint ? (FgCyan + "hint" + Reset) : "";

    const idLabel = `${Dim}DZNLINT-${diagnostic.code}:${Reset}`;

    const { fullLine, offsetInLine } = findFullLine(diagnostic.range, diagnostic.source.fileContent);
    const length = diagnostic.range.to.index - diagnostic.range.from.index;
    const underline = " ".repeat(offsetInLine) + FgRed + "~".repeat(length) + Reset;

    return `${fileLabel} ${typeLabel} ${idLabel} ${diagnostic.message}\n\n    ${fullLine}\n    ${underline}\n`;
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

let diagnosticsId = 1;

type DiagnosticFactory = (level: DiagnosticLevel, message: string, source: InputSource, range: SourceRange) => Diagnostic;
type DiagnosticFactoryWithCode = DiagnosticFactory & { code: DiagnosticCode }

export function createDiagnosticsFactory(): DiagnosticFactoryWithCode {
    const code = diagnosticsId++;
    const factory = (level: DiagnosticLevel, message: string, source: InputSource, range: SourceRange): Diagnostic =>
    ({
        code: code as DiagnosticCode,
        level,
        message,
        source,
        range
    });
    Object.assign(factory, { code });
    return factory as DiagnosticFactoryWithCode;
}
