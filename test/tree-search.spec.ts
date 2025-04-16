import * as ast from "../src/grammar/ast";
import { Program } from "../src";
import { TypeChecker } from "../src/semantics/type-checker";
import { findLeafAtPosition, findNameAtLocationInErrorNode, findNameAtPosition } from "../src/util";

test("find declaration of port", async () => {
    const program = await Program.Init();
    const typeChecker = new TypeChecker(program);

    const nameAtPosition = await findNameAtCursor(
        program,
        `
        interface I {
            in void Foo();
        }
        component C {
            provides I i;

            behavior {
                on i<cursor>.Foo(): {}
            }
        }
    `
    );
    expect(nameAtPosition).toBeDefined();

    const symbol = typeChecker.symbolOfNode(nameAtPosition!);
    expect(symbol).toBeDefined();

    expect(symbol?.declaration.kind).toBe(ast.SyntaxKind.Port);
    expect((symbol?.declaration as ast.Port).name.text).toBe("i");
});

test("find declaration of event", async () => {
    const program = await Program.Init();
    const typeChecker = new TypeChecker(program);

    const nameAtPosition = await findNameAtCursor(
        program,
        `
        interface I {
            in void Foo();
        }
        component C {
            provides I i;

            behavior {
                on i.<cursor>Foo(): {}
            }
        }
    `
    );
    expect(nameAtPosition).toBeDefined();

    const symbol = typeChecker.symbolOfNode(nameAtPosition!);
    expect(symbol).toBeDefined();

    expect(symbol?.declaration.kind).toBe(ast.SyntaxKind.Event);
    expect((symbol?.declaration as ast.Event).eventName.text).toBe("Foo");
});

test("find declaration of interface", async () => {
    const program = await Program.Init();
    const typeChecker = new TypeChecker(program);

    const nameAtPosition = await findNameAtCursor(
        program,
        `
        interface I {
            in void Foo();
        }
        component C {
            provides I<cursor> i;

            behavior {
                on i.Foo(): {}
            }
        }
    `
    );
    expect(nameAtPosition).toBeDefined();

    const symbol = typeChecker.symbolOfNode(nameAtPosition!);
    expect(symbol).toBeDefined();

    expect(symbol?.declaration.kind).toBe(ast.SyntaxKind.InterfaceDefinition);
    expect((symbol?.declaration as ast.InterfaceDefinition).name.text).toBe("I");
});

test("keyword without definition", async () => {
    const program = await Program.Init();

    const nameAtPosition = await findNameAtCursor(
        program,
        `
        interface I {
            in void Foo();
        }
        component C {
            provides<cursor> I i;

            behavior {
                on i.Foo(): {}
            }
        }
    `
    );

    expect(nameAtPosition).toBeUndefined();
});

describe("incomplete tree", () => {
    test("compound name in on", async () => {
        const program = await Program.Init();
        const typeChecker = new TypeChecker(program);

        const { leafAtPosition, cursorPos } = await findLeafAtCursor(
            program,
            `
            component C {
                provides I i;

                behavior {
                    on i.<cursor>
                }
            }
    `
        );
        expect(leafAtPosition).toBeDefined();
        expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.ERROR]);

        const { scope, owningObject, prefix } = findNameAtLocationInErrorNode(
            leafAtPosition as ast.Error,
            cursorPos.line,
            cursorPos.column,
            typeChecker
        );
        // prefix of thing is empty because there is no text after .
        expect(prefix).toBe("");
        // The object owning the incomplete name is the port i
        expect(owningObject?.declaration.kind).toBe(ast.SyntaxKind.Port);
        expect((owningObject?.declaration as ast.Port).name.text).toBe("i");
        // The name is in scope of the behavior (the guard is not complete and not recognized)
        expect(scope.kind).toBe(ast.SyntaxKind.Behavior);
    });

    test("compound name in guard", async () => {
        const program = await Program.Init();
        const typeChecker = new TypeChecker(program);

        const { leafAtPosition, cursorPos } = await findLeafAtCursor(
            program,
            `
            component C {
                provides I i;

                behavior {
                    [i.<cursor>]
                }
            }
    `
        );
        expect(leafAtPosition).toBeDefined();
        expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.ERROR]);

        const { scope, owningObject, prefix } = findNameAtLocationInErrorNode(
            leafAtPosition as ast.Error,
            cursorPos.line,
            cursorPos.column,
            typeChecker
        );
        // prefix of thing is empty because there is no text after .
        expect(prefix).toBe("");
        // The object owning the incomplete name is the port i
        expect(owningObject?.declaration.kind).toBe(ast.SyntaxKind.Port);
        expect((owningObject?.declaration as ast.Port).name.text).toBe("i");
        // The name is in scope of the behavior (the guard is not complete and not recognized)
        expect(scope.kind).toBe(ast.SyntaxKind.Behavior);
    });

    test("empty guard", async () => {
        const program = await Program.Init();
        const typeChecker = new TypeChecker(program);

        const { leafAtPosition, cursorPos } = await findLeafAtCursor(
            program,
            `
            component C {
                provides I i;

                behavior {
                    [<cursor>]
                }
            }
        `
        );
        expect(leafAtPosition).toBeDefined();
        expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.ERROR]);

        const { scope, owningObject, prefix } = findNameAtLocationInErrorNode(
            leafAtPosition as ast.Error,
            cursorPos.line,
            cursorPos.column,
            typeChecker
        );
        // prefix of thing is empty because there is no name at all
        expect(prefix).toBe("");
        // There is no owning object because there is no name
        expect(owningObject).toBeUndefined();
        // The name is in scope of the behavior (the guard is not complete and not recognized)
        expect(scope.kind).toBe(ast.SyntaxKind.Behavior);
    });

    test("partial name in function", async () => {
        const program = await Program.Init();
        const typeChecker = new TypeChecker(program);

        const { leafAtPosition, cursorPos } = await findLeafAtCursor(
            program,
            `
            component C {
                provides I i;

                behavior {
                    void bla() {
                        i.<cursor>
                    }
                }
            }
        `
        );
        expect(leafAtPosition).toBeDefined();
        expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.ERROR]);

        const { scope, owningObject, prefix } = findNameAtLocationInErrorNode(
            leafAtPosition as ast.Error,
            cursorPos.line,
            cursorPos.column,
            typeChecker
        );
        // prefix of name is empty (no text after .)
        expect(prefix).toBe("");
        // The object owning the incomplete name is the port i
        expect(owningObject?.declaration.kind).toBe(ast.SyntaxKind.Port);
        expect((owningObject?.declaration as ast.Port).name.text).toBe("i");
        // The name is in the compound scope of bla()
        expect(scope.kind).toBe(ast.SyntaxKind.Compound);
        expect(scope.parent?.kind).toBe(ast.SyntaxKind.FunctionDefinition);
    });

    test("partial name in function with prefix", async () => {
        const program = await Program.Init();
        const typeChecker = new TypeChecker(program);

        const { leafAtPosition, cursorPos } = await findLeafAtCursor(
            program,
            `
            component C {
                provides I i;

                behavior {
                    void bla() {
                        i.abc<cursor>
                    }
                }
            }
        `
        );
        expect(leafAtPosition).toBeDefined();
        expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.ERROR]);

        const { scope, owningObject, prefix } = findNameAtLocationInErrorNode(
            leafAtPosition as ast.Error,
            cursorPos.line,
            cursorPos.column,
            typeChecker
        );
        // prefix of thing is "abc"
        expect(prefix).toBe("abc");
        // The object owning the name abc is the port i
        expect(owningObject?.declaration.kind).toBe(ast.SyntaxKind.Port);
        expect((owningObject?.declaration as ast.Port).name.text).toBe("i");
        // The name is in the compound scope of bla()
        expect(scope.kind).toBe(ast.SyntaxKind.Compound);
        expect(scope.parent?.kind).toBe(ast.SyntaxKind.FunctionDefinition);
    });
});

async function findNameAtCursor(program: Program, text: string): Promise<ast.AnyAstNode | undefined> {
    const { line, column } = findCursor(text);
    text = text.replace("<cursor>", "");

    const sourceFile = program.parseFile("test.dzn", text)!;
    expect(sourceFile).toBeDefined();

    return findNameAtPosition(sourceFile, line, column, program);
}

async function findLeafAtCursor(
    program: Program,
    text: string
): Promise<{ leafAtPosition?: ast.AnyAstNode; cursorPos: { line: number; column: number } }> {
    const { line, column } = findCursor(text);
    text = text.replace("<cursor>", "");

    const sourceFile = program.parseFile("test.dzn", text)!;
    expect(sourceFile).toBeDefined();

    return { leafAtPosition: findLeafAtPosition(sourceFile, line, column, program), cursorPos: { line, column } };
}

function findCursor(text: string): { line: number; column: number } {
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
