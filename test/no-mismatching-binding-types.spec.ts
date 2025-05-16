import { portBindingMismatch } from "../src/rules/no-mismatching-binding-types";
import { testdznlint } from "./util";

test("binding type mismatch", async () => {
    await testdznlint({
        diagnostic: portBindingMismatch.code,
        pass: `
        interface I {}
        component Instance {
            provides I api;
        }
        component A {
            provides I api;
            system {
                Instance myInstance;
                myInstance.api <=> api;
            }
        }`,
        fail: `
        interface I {}
        interface I2 {}
        component Instance {
            provides I api;
        }
        component A {
            provides I2 api;
            system {
                Instance myInstance;
                myInstance.api <=> api;
            }
        }`,
    });
});

test("assigning port to locator is not a type mismatch", async () => {
    await testdznlint({
        diagnostic: portBindingMismatch.code,
        pass: `
        interface I {}
        component Instance {
            provides I api;
        }
        component A {
            system {
                Instance myInstance;
                myInstance.api <=> *;
            }
        }`,
    });
});
