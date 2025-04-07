import { unusedInstance } from "../src/rules/no-unused-instances";
import { testdznlint } from "./util";

test("no unknown instance bindings left", async () => {
    await testdznlint({
        diagnostic: unusedInstance.code,
        pass: `component A {
            system {
                Instance myInstance;
                myport <=> myInstance.port;
            }
        }`,
        fail: `component A {
            system {
                Instance myInstance;

            }
        }`,
    });
});
