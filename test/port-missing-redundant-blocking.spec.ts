import { portMissingBlocking, portRedundantBlocking } from "../src/rules/port-missing-redundant-blocking";
import { testdznlint } from "./util";

test("is disabled by default", () => {
    testdznlint({
        diagnostic: portMissingBlocking.code,
        pass: `
            component C {
                provides IApi api;

                behavior {
                    blocking on api.Foo(): {}
                }
            }`,
    });
});

test("blocking port required when blocking keyword is used", () => {
    testdznlint({
        diagnostic: portMissingBlocking.code,
        pass: `
            component C {
                provides blocking IApi api;

                behavior {
                    blocking on api.Foo(): {}
                }
            }`,
        fail: `
            component C {
                provides IApi api;

                behavior {
                    blocking on api.Foo(): {}
                }
            }`,
        config: { port_missing_redundant_blocking: "error" },
    });
});

test("blocking port required when blocking keyword is used in statement", () => {
    testdznlint({
        diagnostic: portMissingBlocking.code,
        pass: `
            component C {
                provides blocking IApi api;

                behavior {
                    on api.Foo(): blocking {}
                }
            }`,
        fail: `
            component C {
                provides IApi api;

                behavior {
                    on api.Foo(): blocking {}
                }
            }`,
        config: { port_missing_redundant_blocking: "error" },
    });
});

test("blocking port is redundant when no blocking keyword is used", () => {
    testdznlint({
        diagnostic: portRedundantBlocking.code,
        pass: `
            component C {
                provides blocking IApi api;

                behavior {
                    blocking on api.Foo(): {}
                }
            }`,
        fail: `
            component C {
                provides blocking IApi api;

                behavior {
                    on api.Foo(): {}
                }
            }`,
        config: { port_missing_redundant_blocking: "error" },
    });
});

test("also considers blocking statements", () => {
    testdznlint({
        diagnostic: portRedundantBlocking.code,
        pass: `
            component C {
                provides IApi api;

                behavior {
                    on api.Foo(): blocking {}
                }
            }`,
        config: { port_missing_redundant_blocking: "error" },
    });
});
