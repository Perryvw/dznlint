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

test("multiple bindings of same type is allowed", () => {
    testdznlint({
        diagnostic: duplicatePortBinding.code,
        pass: `
        interface Type {}
        component A {

            provides Type providedport1;
            provides Type providedport2;
            requires Type requiredport1;
            requires Type requiredport2;

            system {
                providedport1 <=> requiredport1;
                providedport2 <=> requiredport2;
            }
        }`,
    });
});

test("binding to multiple instances of same type is allowed", () => {
    testdznlint({
        diagnostic: duplicatePortBinding.code,
        pass: `
        interface Type {}
        component C { provides Type api; }
        component A {

            provides Type providedport1;
            provides Type providedport2;

            system {
                C c1;
                C c2;

                providedport1 <=> c1.api;
                providedport2 <=> c2.api;
            }
        }`,
    });
});

// https://github.com/Perryvw/dznlint/issues/11
test("binding to locator does not yield duplicate binding errors (#11)", () => {
    testdznlint({
        diagnostic: duplicatePortBinding.code,
        pass: `
        component A {
            system {
                Instance a;
                a.api <=> *;

                Instance b;
                b.api <=> *;

                Instance c;
                * <=> c.api;

                Instance d;
                * <=> d.api;
            }
        }`,
    });
});
