import { deadCode } from "../src/rules/dead-code";
import { testdznlint } from "./util";

test.only("dead code", () => {
    testdznlint({
        diagnostic: deadCode.code,
        pass: `
        component A {
            provides IFoo foo;
            behavior {
                void myFunction() {
                    foo.bar();
                    return;
                }
            }
        }`,
        fail: `
        component A {
            provides IFoo foo;
            behavior {
                void myFunction() {
                    return;
                    foo.bar();
                }
            }
        }`,
    });
});
