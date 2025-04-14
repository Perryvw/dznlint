import { deadCode } from "../src/rules/dead-code";
import { testdznlint } from "./util";

test("dead code", async () => {
    await testdznlint({
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

test("code after return statements with if", async () => {
    await testdznlint({
        diagnostic: deadCode.code,
        pass: `
        component A {
            provides IFoo foo;
            behavior {
                void myFunction() {
                    if (abc) return;
                    foo.bar();
                }
            }
        }`,
    });
});

test("code after return statements else/if", async () => {
    await testdznlint({
        diagnostic: deadCode.code,
        pass: `
        component A {
            provides IFoo foo;
            behavior {
                bool abc()
                {       
                    if (false) return true;
                    else return false;
                }
            }
        }`
    });
});
