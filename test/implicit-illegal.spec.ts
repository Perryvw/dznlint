import { implicitIllegal } from "../src/rules/implicit-illegal";
import { testdznlint } from "./util";

test.only("implicit illegal", () => {
    testdznlint({
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
