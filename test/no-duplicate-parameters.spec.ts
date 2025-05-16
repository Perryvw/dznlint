import { duplicateParameter } from "../src/rules/no-duplicate-parameters";
import { testdznlint } from "./util";

test("duplicate parameter name in on trigger", async () => {
    await testdznlint({
        diagnostic: duplicateParameter.code,
        pass: `component A {
            behavior {
                on port.something(myParam, myParam2): {
                }
            }
        }`,
        fail: `component A {
            behavior {
                on port.something(myParam, myParam): {
                }
            }
        }`,
    });
});

test("duplicate parameter name in function", async () => {
    await testdznlint({
        diagnostic: duplicateParameter.code,
        pass: `component A {
            behavior {
                void something(bool myParam, bool myParam2) {
                }
            }
        }`,
        fail: `component A {
            behavior {
                void something(bool myParam, bool myParam) {
                }
            }
        }`,
    });
});
