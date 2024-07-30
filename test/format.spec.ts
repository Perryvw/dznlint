import { format } from "../src/format/format";
import * as fs from "fs";

test("format", async () => {
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
                     B //Bar
                     };

                // Trailing E
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
                     B /*bar*/
                     };

                /* Trailing E */
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
}
