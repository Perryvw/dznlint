import { implicitIllegal } from "../src/rules/implicit-illegal";
import { testdznlint } from "./util";

test("implicit illegal", async () => {
    await testdznlint({
        diagnostic: implicitIllegal.code,
        pass: `
            interface IA {
                in void f();

                behavior {
                    // no illegal declaration of f
                }
            }`,
        fail: `
            interface IA {
                in void f();

                behavior {
                    on f: illegal;
                }
            }`,
    });
});
