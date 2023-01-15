import * as fs from "fs";
import { InputSource } from "../api";
import { DznLintUserConfiguration } from "../config/dznlint-configuration";
import { Diagnostic } from "../diagnostic";
import { parseDznSource } from "../parse";
import { printFile } from "./print";

export type FormatResult = { success: true; formattedSource: string } | { success: false; errors: Diagnostic[] };

export function formatString(source: string, config?: DznLintUserConfiguration): FormatResult {
    const sources = [{ fileContent: source }];
    return format(sources, config)[0];
}

export function formatFiles(fileNames: string[], config?: DznLintUserConfiguration): FormatResult[] {
    const sources = fileNames.map(f => ({ fileName: f, fileContent: fs.readFileSync(f).toString() }));
    return format(sources, config);
}

export function format(sources: InputSource[], config: DznLintUserConfiguration = {}): FormatResult[] {
    const result: FormatResult[] = [];
    for (const source of sources) {
        const { ast, diagnostics } = parseDznSource(source);

        if (ast) {
            result.push({ success: true, formattedSource: printFile(ast, config) });
        } else {
            result.push({ success: false, errors: diagnostics });
        }
    }

    return result;
}
