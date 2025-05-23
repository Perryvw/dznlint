import { portMissingBlocking, portRedundantBlocking } from "../src/rules/port-missing-redundant-blocking";
import { testdznlint } from "./util";

test("is disabled by default", async () => {
    await testdznlint({
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

test("blocking port required when blocking keyword is used", async () => {
    await testdznlint({
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

test("blocking port required when blocking keyword is used in statement", async () => {
    await testdznlint({
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

test("blocking port is redundant when no blocking keyword is used", async () => {
    await testdznlint({
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

test("also considers blocking statements", async () => {
    await testdznlint({
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

test("should only complain about provides ports", async () => {
    await testdznlint({
        diagnostic: portRedundantBlocking.code,
        pass: `
            component C {
                provides blocking IApi api;
                requires blocking IRequired req;

                behavior {
                    on api.Foo(): reply(req.Bar());
                }
            }`,
        config: { port_missing_redundant_blocking: "error" },
    });
});

test("blocking missing if provided port not blocking but required port is", async () => {
    await testdznlint({
        diagnostic: portMissingBlocking.code,
        fail: `
            component C {
                provides IApi api;
                requires blocking IRequired req;

                behavior {
                    on api.Foo(): reply(req.Bar());
                }
            }`,
        config: { port_missing_redundant_blocking: "error" },
    });
});

test("no blocking rule on system components", async () => {
    await testdznlint({
        diagnostic: portMissingBlocking.code,
        pass: `
            component C {
                provides IApi api;
                requires blocking IRequired req;

                system {
                }
            }`,
        config: { port_missing_redundant_blocking: "error" },
    });
});
