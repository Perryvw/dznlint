import { unusedPort } from "../src/rules/no-unused-ports";
import { testdznlint } from "./util";

test("no unknown provided port bindings", () => {
    testdznlint({
        diagnostic: unusedPort.code,
        pass: `component A {

            provides Type myport;

            system {
                Instance myInstance;
                myInstance.port <=> myport;
            }
        }`,
        fail: `component A {

            provides Type myport;

            system {
            }
        }`,
    });
});
