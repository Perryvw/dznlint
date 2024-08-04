import { format } from "../src/format/format";
import * as fs from "fs";
import { TreeSitterNode, treeSitterParse } from "../src/parse";

test("format", async () => {
    await testFormat({
        input: `
            interface I {
            enum E { A, B};
                }
        `,
    });
});

test("single-line comments", async () => {
    await testFormat({
        input: `
            // Hi
            interface I // Hello
            {
                enum E { 
                    // Foo
                    A,
                     B, //Bar
                     C, // Baz
                     // Buzz
                     D
                     };

                // Trailing E

                behavior {
                    void foo(/* hello */in bool b) {}
                }
            }
            // Trailing I
        `,
    });
});

test("multi-line comments", async () => {
    await testFormat({
        input: `
            /* Hi
             * Hello
             */
            interface I /* sup */
            {
                enum E { 
                    /* foo */
                    A,
                     B /*bar
                     foo
                     */
                     };

                /* Trailing E
                
                blala */
            }
                
            /*
            * Trailing I
            */
        `,
    });
});

test.each(["files/component.dzn", "files/demo.dzn", "files/interface.dzn", "files/system.dzn"])(
    "format file %s",
    async fileName => {
        const fileContent = fs.readFileSync(`${__dirname}/${fileName}`).toString();
        await testFormat({ input: fileContent });
    }
);

async function testFormat(formatTest: { input: string }) {
    const result = await format({ fileContent: formatTest.input });
    expect(result).toMatchSnapshot();
    const treeBeforeFormat = await treeSitterParse({ fileContent: formatTest.input });
    const treeAfterFormat = await treeSitterParse({ fileContent: result });

    expectEquivalentTrees(treeAfterFormat, treeBeforeFormat);
    expect(treeAfterFormat.toString()).toBe(treeBeforeFormat.toString());
}

function expectEquivalentTrees(actual: TreeSitterNode, expected: TreeSitterNode) {
    if (actual.type !== expected.type) {
        expect(actual.toString()).toBe(expected.toString());
    }
    if (actual.childCount !== expected.childCount) {
        expect(actual.toString()).toBe(expected.toString());
    }
    for (let i = 0; i < actual.childCount; i++) {
        expectEquivalentTrees(actual.child(i)!, expected.child(i)!);
    }
}
