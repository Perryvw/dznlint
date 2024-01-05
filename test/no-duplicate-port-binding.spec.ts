import { duplicatePortBinding } from "../src/rules/no-duplicate-port-binding";
import { testdznlint } from "./util";

test("no duplicate port bindings", () => {
    testdznlint({
        diagnostic: duplicatePortBinding.code,
        pass: `
        component Instance {}

        component A {

            provides Type myport;

            system {
                Instance myInstance;
                myInstance.port <=> myport;
            }
        }`,
        fail: `
        component Instance {}

        component A {

            provides Type myport;

            system {
                Instance myInstance;
                myInstance.port <=> myport;
                myInstance.port2 <=> myport;
            }
        }`,
    });
});

test("side doesn't matter", () => {
    testdznlint({
        diagnostic: duplicatePortBinding.code,
        fail: `component A {

            provides Type myport;

            system {
                Instance myInstance;
                myInstance.port <=> myport;
                myport <=> myInstance.port2;
            }
        }`,
    });
});

test("also works when binding port to self", () => {
    testdznlint({
        diagnostic: duplicatePortBinding.code,
        fail: `component A {

            provides Type myport;

            system {
                myport <=> myport;
            }
        }`,
    });
});
