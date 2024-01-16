import { unconnectedPort } from "../src/rules/no-unconnected-ports";
import { testdznlint } from "./util";

test.each(["provided", "required"])("no unknown %s port bindings", () => {
    testdznlint({
        diagnostic: unconnectedPort.code,
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

test("no unconnected port on instance", () => {
    testdznlint({
        diagnostic: unconnectedPort.code,
        pass: `
        component A {
            provides Type port1;
            requires Type port2;
        }
        component B {

            provides Type myport1;
            requires Type myport2;

            system {
                A myInstance;
                myInstance.port1 <=> myport1;
                myInstance.port2 <=> myport2;
            }
        }`,
        fail: `
        component A {
            provides Type port1;
            requires Type port2;
        }
        component B {

            provides Type myport1;

            system {
                A myInstance;
                myInstance.port1 <=> myport1;
                // myInstance.port2 <=> myport2; <-- port 2 not bound!
            }
        }`,
    });
});

test("no unconnected port on instance wildcard binding", () => {
    testdznlint({
        diagnostic: unconnectedPort.code,
        pass: `
        component A {
            provides Type port1;
            requires Type port2;
            requires Type port3;
        }
        component B {
            system {
                A myInstance;
                myInstance.* <=> *;
            }
        }`,
    });
});
