import { ast } from "../src";
import { SyntaxKind } from "../src/grammar";
import { parseDznSource } from "../src/parse";
import { Program } from "../src/semantics/program";

describe("AST contains error node for malformed syntax", () => {
    test("malformed interface", async () => {
        const program = await Program.Init();
        const { ast, diagnostics } = parseDznSource(
            {
                fileContent: `
            interface I {
                in;
            }
        `,
            },
            program
        );

        const interfaceDefinition = ast?.statements[0] as ast.InterfaceDefinition;
        expect(interfaceDefinition.kind).toBe(SyntaxKind.InterfaceDefinition);
        expect(interfaceDefinition.errors).toEqual([
            expect.objectContaining({
                kind: SyntaxKind.ERROR,
                text: "in;",
            }),
        ]);
    });

    test("malformed component", async () => {
        const program = await Program.Init();
        const { ast, diagnostics } = parseDznSource(
            {
                fileContent: `
            interface I {}

            component C {
                provides I p;
                provides ;  // <= this part is complete missing from tree; also not in errors
                requires I r;

                behavior {}
            }
        `,
            },
            program
        );

        const componentDefinition = ast?.statements[1] as ast.ComponentDefinition;
        expect(componentDefinition.kind).toBe(SyntaxKind.ComponentDefinition);
        expect(componentDefinition.errors).toEqual([
            expect.objectContaining({
                kind: SyntaxKind.ERROR,
                text: "provides ;",
            }),
        ]);
    });

    test("malformed system", async () => {
        const program = await Program.Init();
        const { ast, diagnostics } = parseDznSource(
            {
                fileContent: `
            component C {
                system {
                    foo;
                }
            }
        `,
            },
            program
        );

        const componentDefinition = ast?.statements[0] as ast.ComponentDefinition;
        expect(componentDefinition.kind).toBe(SyntaxKind.ComponentDefinition);
        const system = componentDefinition.body as ast.System;
        expect(system.errors).toEqual([
            expect.objectContaining({
                kind: SyntaxKind.ERROR,
                text: "foo;",
            }),
        ]);
    });
});
