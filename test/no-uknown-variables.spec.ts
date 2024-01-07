import { unknownVariable } from "../src/rules/no-unknown-variables";
import { testdznlint } from "./util";

describe("in systems", () => {
    test("no instance of unknown type", () => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            interface I {}
            component B {}

            component A {

                provides I myport;

                system {
                    B myInstance;
                }
            }`,
            fail: `
            component A {

                provides Type myport;

                system {
                    B myInstance;
                }
            }`,
        });
    });

    test("no undefined instance bindings", () => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            interface I {}
            component B { requires I port; }

            component A {

                provides I myport;

                system {
                    B myInstance;
                    myInstance.port <=> myport;
                }
            }`,
            fail: `
            component A {

                provides Type myport;

                system {
                    myInstance.port <=> myport;
                }
            }`,
        });
    });

    test("no undefined port bindings", () => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            interface I {}
            component B { requires I port; }

            component A {

                provides I myport;

                system {
                    B myInstance;
                    myInstance.port <=> myport;
                }
            }`,
            fail: `
            component B {}

            component A {
                system {
                    B myInstance;
                    myInstance.port <=> myport;
                }
            }`,
        });
    });

    test("no undefined port on instance bindings", () => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            interface I {}
            component B { requires I port; }

            component A {

                provides I myport;

                system {
                    B myInstance;
                    myInstance.port <=> myport;
                }
            }`,
            fail: `
            component B {}

            component A {

                provides I myport;

                system {
                    B myInstance;
                    myInstance.port <=> myport;
                }
            }`,
        });
    });
});

describe("in interfaces", () => {
    test.each(["in", "out"])("no unknown %s event types", eventDirection => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            extern Bla $$;
            interface I {

                ${eventDirection} Bla myEvent();

                behavior {
                    on myEvent: {}
                }
            }`,
            fail: `
            interface I {

                ${eventDirection} Bla myEvent();

                behavior {
                    on myEvent: {}
                }
            }`,
        });
    });

    test.each(["in", "out"])("no unknown %s events", eventDirection => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            extern Bla $$;
            interface I {

                ${eventDirection} Bla myEvent();

                behavior {
                    on myEvent: {}
                }
            }`,
            fail: `
            interface I {
                behavior {
                    on myEvent: {}
                }
            }`,
        });
    });
});

describe("in components", () => {
    test("no ports for unknown interfaces", () => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            interface I { in void e(); }
            component A {

                provides I i;

                behavior {
                    on i.e: {}
                }
            }`,
            fail: `
            component A {
                provides I i;
            }`,
        });
    });

    test("no unknown ports", () => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            interface I { in void e(); }
            component A {

                provides I i;

                behavior {
                    on i.e: {}
                }
            }`,
            fail: `
            interface I { in void e(); }
            component A {
                behavior {
                    on i.e: {}
                }
            }`,
        });
    });

    test("no unknown events on known ports", () => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            interface I { in void e(); }
            component A {

                provides I i;

                behavior {
                    on i.e: {}
                }
            }`,
            fail: `
            interface I { in void e(); }
            component A {

                provides I i;

                behavior {
                    on i.e2: {}
                }
            }`,
        });
    });

    test("no functions with unknown types", () => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            component C {
                behavior {
                    void foo() { }
                }
            }`,
            fail: `
            component C {
                behavior {
                    UNKNOWN foo() { }
                }
            }`,
        });
    });

    test("no unknown function calls", () => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            component C {
                behavior {
                    void foo() {
                        bar();
                    }
                    void bar() {

                    }
                }
            }`,
            fail: `
            component C {
                behavior {
                    void foo() {
                        bar();
                    }
                }
            }`,
        });
    });

    test("no unknown parameter types", () => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            component C {
                behavior {
                    void foo(in bool b) {
                    }
                }
            }`,
            fail: `
            component C {
                behavior {
                    void foo(in UNKNOWN b) {
                    }
                }
            }`,
        });
    });

    test("no unknown call arguments", () => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            component C {
                behavior {
                    void foo(in bool b) {
                        foo(b);
                    }
                }
            }`,
            fail: `
            component C {
                behavior {
                    void foo(in bool b) {
                        foo(c);
                    }
                }
            }`,
        });
    });

    test.each(["true", "false"])("no literal bool arguments are known", boolLiteral => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            component C {
                behavior {
                    void foo(in bool b) {
                        foo(${boolLiteral});
                    }
                }
            }`,
        });
    });

    test("no unknown variable declaration type", () => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            component C {
                behavior {
                    void foo() {
                        bool bar = true;
                    }
                }
            }`,
            fail: `
            component C {
                behavior {
                    void foo() {
                        UNKNOWN bar = $bla$;
                    }
                }
            }`,
        });
    });

    test("no unknown namespaced variable declaration type", () => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            namespace NS {
                extern Type $$;
            }
            component C {
                behavior {
                    void foo() {
                        NS.Type bar = $bla$;
                    }
                }
            }`,
            fail: `
            component C {
                behavior {
                    void foo() {
                        NS.Type bar = $bla$;
                    }
                }
            }`,
        });
    });

    test("no unknown nested namespaced variable declaration type", () => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            namespace NS { namespace NS2 {
                extern Type $$;
            } }
            component C {
                behavior {
                    void foo() {
                        NS.NS2.Type bar = $bla$;
                    }
                }
            }`,
            fail: `
            component C {
                behavior {
                    void foo() {
                        NS.NS2.Type bar = $bla$;
                    }
                }
            }`,
        });
    });

    test("no unknown compound namespaced variable declaration type", () => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            namespace NS.NS2 {
                extern Type $$;
            }
            component C {
                behavior {
                    void foo() {
                        NS.NS2.Type bar = $bla$;
                    }
                }
            }`,
            fail: `
            component C {
                behavior {
                    void foo() {
                        NS.NS2.Type bar = $bla$;
                    }
                }
            }`,
        });
    });
});
