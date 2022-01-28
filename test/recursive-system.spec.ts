import { recursiveSystem } from "../src/rules/no-recursive-system";
import { testdznlint } from "./util";

test("recursive system is not allowed", () => {
    testdznlint({
        diagnostic: recursiveSystem.code,
        pass: `component A {
            system {
                B instance;
            }
        }`,
        fail: `component A {
            system {
                A instance;
            }
        }`,
    });
});
