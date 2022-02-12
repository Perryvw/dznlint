import { unknownPortBinding } from "../src/rules/no-unknown-port-binding";
import { testdznlint } from "./util";

test("no unknown provided port bindings", () => {
    testdznlint({
        diagnostic: unknownPortBinding.code,
        pass: `component A {

            provides Type myport;

            system {
                Instance myInstance;
                myInstance.port <=> myport;
            }
        }`,
        fail: `component A {
            system {
                Instance myInstance;
                myInstance.port <=> myport;
            }
        }`,
    });
});

test("no unknown required port bindings", () => {
    testdznlint({
        diagnostic: unknownPortBinding.code,
        pass: `component A {

            requires Type myport;

            system {
                Instance myInstance;
                myInstance.port <=> myport;
            }
        }`,
        fail: `component A {
            system {
                Instance myInstance;
                myInstance.port <=> myport;
            }
        }`,
    });
});
