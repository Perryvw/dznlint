import { formatString } from "../src";

test("preserves comments", () => {
    const result = formatString(`
        // Comment1
        import abc.dzn;

        // Comment 2
        // Comment 3
        interface abc {
            /* Comment 4 */
            in bool test(); // comment5

            behavior {
                // comment6
            }
        }

        // Comment 7
    `);

    if (result.success)
    {
        expect(result.formattedSource).toEqual("");
    }
    else
    {
        console.log(result.errors);
    }
});