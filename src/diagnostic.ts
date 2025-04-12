import { InputSource } from "./semantics/program";

export enum DiagnosticSeverity {
    Hint,
    Warning,
    Error,
}

export interface SourcePosition {
    index: number;
    line: number;
    column: number;
}

export interface SourceRange {
    from: SourcePosition;
    to: SourcePosition;
}

export type DiagnosticCode = number & { __diagnosticIdBrand: never };

export interface Diagnostic {
    code: DiagnosticCode;
    source: InputSource;
    severity: DiagnosticSeverity;
    message: string;
    range: SourceRange;
}

// Colors to use in console
const Reset = "\x1b[0m";
const FgRed = "\x1b[31m";
const FgCyan = "\x1b[36m";
const FgYellow = "\x1b[93m";
const Dim = "\x1b[2m";

export function formatDiagnostic(diagnostic: Diagnostic): string {
    const lineColumn =
        `${diagnostic.range.from.line}:${diagnostic.range.from.column + 1}-` +
        `${diagnostic.range.to.line}:${diagnostic.range.to.column + 1}`;
    const fileLabel = diagnostic.source.fileName
        ? `${FgCyan}${diagnostic.source.fileName ?? "-"}${Reset}:${lineColumn}`
        : `-:${lineColumn}`;

    const color =
        diagnostic.severity === DiagnosticSeverity.Error
            ? FgRed
            : diagnostic.severity === DiagnosticSeverity.Warning
              ? FgYellow
              : diagnostic.severity === DiagnosticSeverity.Hint
                ? FgCyan
                : "";

    const typeLabel =
        diagnostic.severity === DiagnosticSeverity.Error
            ? color + "error" + Reset
            : diagnostic.severity === DiagnosticSeverity.Warning
              ? color + "warning" + Reset
              : diagnostic.severity === DiagnosticSeverity.Hint
                ? color + "hint" + Reset
                : "";

    const idLabel = `${Dim}DZNLINT-${diagnostic.code}:${Reset}`;

    const { fullLine, offsetInLine } = findFullLine(diagnostic.range, diagnostic.source.fileContent);
    const length = diagnostic.range.to.index - diagnostic.range.from.index;
    const underline = " ".repeat(offsetInLine) + color + "~".repeat(length) + Reset;

    return `${fileLabel} ${typeLabel} ${idLabel} ${diagnostic.message}\n\n    ${fullLine}\n    ${underline}\n`;
}

function findFullLine(range: SourceRange, source: string) {
    let lineStart = range.from.index;
    for (; lineStart > 0; lineStart--) {
        if (source[lineStart] === "\n") {
            ++lineStart;
            break;
        }
    }

    let lineEnd = range.to.index;
    for (; lineEnd < source.length; lineEnd++) {
        if (source[lineEnd] === "\n" || source[lineEnd] === "\r") break;
    }

    let line = source.slice(lineStart, lineEnd);
    const preTrimLength = line.length;
    line = line.trimStart();
    const trimmed = preTrimLength - line.length;

    return {
        fullLine: line.trimEnd(),
        offsetInLine: range.from.column - trimmed,
    };
}

let diagnosticsId = 1;

type DiagnosticFactory = (
    level: DiagnosticSeverity,
    message: string,
    source: InputSource,
    range: SourceRange
) => Diagnostic;
type DiagnosticFactoryWithCode = DiagnosticFactory & { code: DiagnosticCode };

export function createDiagnosticsFactory(): DiagnosticFactoryWithCode {
    const code = diagnosticsId++;
    const factory = (
        severity: DiagnosticSeverity,
        message: string,
        source: InputSource,
        range: SourceRange
    ): Diagnostic => ({
        code: code as DiagnosticCode,
        severity,
        message,
        source,
        range,
    });
    Object.assign(factory, { code });
    return factory as DiagnosticFactoryWithCode;
}
