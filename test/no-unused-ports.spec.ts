import { unusedPort } from "../src/rules/no-unused-ports";
import { testdznlint } from "./util";

test("no unused ports multiple", () => {
    testdznlint({
        diagnostic: unusedPort.code,
        pass: `
        interface I { in void event(); }

        component C {
            provides I port;
            requires I port2;
            requires I port3;

            behavior {
                on port.event(): {
                    port2.event();
                    port3.event();
                }
            }
        }`,
    });
});

test("no unused provided ports", () => {
    testdznlint({
        diagnostic: unusedPort.code,
        pass: `
        interface I { in void event(); }

        component C {
            provides I port;

            behavior {
                on port.event(): {}
            }
        }`,
        fail: `
        interface I { in void event(); }

        component C {
            provides I port;

            behavior {
            }
        }`,
    });
});

test("no unused required ports", () => {
    testdznlint({
        diagnostic: unusedPort.code,
        pass: `
        interface I { in void event(); }

        component C {
            requires I port;

            behavior {
                void Foo() {
                    port.event();
                }
            }
        }`,
        fail: `
        interface I { in void event(); }

        component C {
            requires I port;

            behavior {
            }
        }`,
    });
});

test("no unused injected ports", () => {
    testdznlint({
        diagnostic: unusedPort.code,
        pass: `
        interface I { in void event(); }

        component C {
            requires injected I port;

            behavior {
                void Foo() {
                    port.event();
                }
            }
        }`,
        fail: `
        interface I { in void event(); }

        component C {
            requires injected I port;

            behavior {
            }
        }`,
    });
});
