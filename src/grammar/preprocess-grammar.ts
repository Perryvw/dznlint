import * as fs from "fs";

const GRAMMAR_PATH = "src/grammar/dzn-grammar.peg";
const GRAMMAR_OUT_PATH = "src/grammar/dzn-grammar.gen.peg";

const templateDefinitionPattern = /template\s+([a-zA-Z0-9_-]+)<([a-zA-Z0-9_-]+)>\s+([^\n]*)/g;

let grammar = fs.readFileSync(GRAMMAR_PATH).toString();

const templates = findTemplates(grammar);
grammar = removeTemplateDefinitions(grammar);

grammar = substituteTemplates(grammar, templates);

// Write preprocessed grammar
fs.writeFileSync(GRAMMAR_OUT_PATH, grammar);

interface Template {
    name: string;
    variableName: string;
    template: string;
}

function findTemplates(content: string): Template[] {
    const templates: Template[] = [];

    let match: RegExpExecArray | null;
    templateDefinitionPattern.lastIndex = 0; // Match from start
    while ((match = templateDefinitionPattern.exec(content))) {
        if (!match) break;

        const [, templateName, variableName, template] = match;
        templates.push({ name: templateName, variableName, template: template.trim() });
    }

    return templates;
}

function removeTemplateDefinitions(content: string): string {
    return content.replace(templateDefinitionPattern, "");
}

function substituteTemplates(content: string, templates: Template[]): string
{
    let replaced = true;
    while (replaced)
    {
        replaced = false;
        for (const template of templates)
        {
            content = content.replace(new RegExp(`${template.name}<[^><]*>`, "gm"), match => {
                replaced = true;
                const argumentMatch = /<([^>]*)/.exec(match);
                if (!argumentMatch) throw "incorrect template usage";

                const argument = argumentMatch[1].trim();
                return template.template.replace("$" + template.variableName, argument);

            });
        }
    }
    return content;
}