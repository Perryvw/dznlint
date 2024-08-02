import { format } from "../src/format/format";
import * as fs from "fs";
import { TreeSitterNode, treeSitterParse } from "../src/parse";

test.only("format", async () => {
    await testFormat({
        input: `
            interface I {
            enum E { A, B};
                }
        `,
    });
});

test.only("single-line comments", async () => {
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

test.only("multi-line comments", async () => {
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

    expectEquivalentTrees(treeBeforeFormat, treeAfterFormat);
}

function expectEquivalentTrees(tree1: TreeSitterNode, tree2: TreeSitterNode) {
    if (tree1.type !== tree2.type)
    {
        expect(tree1.toString()).toBe(tree2.toString());
    }
    if (tree1.childCount !== tree2.childCount)
    {
        expect(tree1.toString()).toBe(tree2.toString());
    }
    for (let i = 0; i < tree1.childCount; i++)
    {
        expectEquivalentTrees(tree1.child(i)!, tree2.child(i)!);
    }
}
