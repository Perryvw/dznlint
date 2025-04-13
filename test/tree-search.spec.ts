import * as ast from "../src/grammar/ast";
import { Program } from "../src";
import { TypeChecker } from "../src/semantics/type-checker";
import { findNameAtPosition } from "../src/util";

test.only("find declaration of port", async () => {
    const program = await Program.Init();
    const typeChecker = new TypeChecker(program);

    const nameAtPosition = await findNameAtCursor(program, `
        interface I {
            in void Foo();
        }
        component C {
            provides I i;

            behavior {
                on i<cursor>.Foo(): {}
            }
        }
    `);
    expect(nameAtPosition).toBeDefined();

    const symbol = typeChecker.symbolOfNode(nameAtPosition!);
    expect(symbol).toBeDefined();

    expect(symbol?.declaration.kind).toBe(ast.SyntaxKind.Port);
    expect((symbol?.declaration as ast.Port).name.text).toBe("i");
});

test.only("find declaration of event", async () => {
    const program = await Program.Init();
    const typeChecker = new TypeChecker(program);

    const nameAtPosition = await findNameAtCursor(program, `
        interface I {
            in void Foo();
        }
        component C {
            provides I i;

            behavior {
                on i.<cursor>Foo(): {}
            }
        }
    `);
    expect(nameAtPosition).toBeDefined();

    const symbol = typeChecker.symbolOfNode(nameAtPosition!);
    expect(symbol).toBeDefined();

    expect(symbol?.declaration.kind).toBe(ast.SyntaxKind.Event);
    expect((symbol?.declaration as ast.Event).eventName.text).toBe("Foo");
});

test.only("find declaration of interface", async () => {
    const program = await Program.Init();
    const typeChecker = new TypeChecker(program);

    const nameAtPosition = await findNameAtCursor(program, `
        interface I {
            in void Foo();
        }
        component C {
            provides I<cursor> i;

            behavior {
                on i.Foo(): {}
            }
        }
    `);
    expect(nameAtPosition).toBeDefined();

    const symbol = typeChecker.symbolOfNode(nameAtPosition!);
    expect(symbol).toBeDefined();

    expect(symbol?.declaration.kind).toBe(ast.SyntaxKind.InterfaceDefinition);
    expect((symbol?.declaration as ast.InterfaceDefinition).name.text).toBe("I");
});

async function findNameAtCursor(program: Program, text: string): Promise<ast.AnyAstNode | undefined> {
    const { line, column } = findCursor(text);
    text = text.replace("<cursor>", "");

    const sourceFile = program.parseFile("test.dzn", text)!;
    expect(sourceFile).toBeDefined();

    return findNameAtPosition(sourceFile, line, column, program);
}

function findCursor(text: string): { line: number; column: number; }
{
    const index = text.indexOf("<cursor>");
    expect(index).toBeGreaterThanOrEqual(0);

    let line = 0;
    let column = 0;

    for (let i = 0; i < index; i++) {
        if (text[i] === "\n") {
            line++;
            column = 0;
        } else {
            column++;
        }
    }
    return { line, column };
}