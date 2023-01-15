import { DznLintUserConfiguration } from "../config/dznlint-configuration";
import * as parser from "../grammar/parser";

export function printFile(file: parser.file, config: DznLintUserConfiguration): string
{
    return file.statements.map(s => "statement!").join("\n");
}