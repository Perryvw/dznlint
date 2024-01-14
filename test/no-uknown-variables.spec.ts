import { Program, lint } from "../src";
import { unknownVariable } from "../src/rules/no-unknown-variables";
import { expectNoDiagnosticOfType, testdznlint } from "./util";

describe("in systems", () => {
    test("no instance of unknown type", () => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            component B {}

            component A {
                system {
                    B myInstance;
                }
            }`,
            fail: `
            component A {
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

    test.each(["true", "false"])("literal bool arguments are known", boolLiteral => {
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

    test.each(["optional", "inevitable"])("optional inevitable are known", keyword => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            interface I {
                out void Bla();
                behavior {
                    on ${keyword}: {}
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

    test("no unknown enum members", () => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            component C {
                behavior {
                    enum MyEnum { A, B };
                    void foo() {
                        MyEnum bar = MyEnum.A;
                    }
                }
            }`,
            fail: `
            component C {
                behavior {
                    enum MyEnum { A, B };
                    void foo() {
                        MyEnum bar = MyEnum.C;
                    }
                }
            }`,
        });
    });

    test("no unknown reply", () => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            interface I { in void foo(); }
            component C {
                provides I port;
                behavior {
                    on port.foo(): {
                        reply();
                    }
                }
            }`,
        });
    });

    test("no unknown reply on port", () => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            interface I { in void foo(); }
            component C {
                provides I port;
                behavior {
                    on port.foo(): {
                        port.reply();
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

    test("no uknown imported symbols", () => {
        const files = [
            {
                fileName: "main.dzn",
                fileContent: `
                import other.dzn;
                component C {
                    behavior {
                        OtherNS.EType foo() {
                        }
                    }
                }
            `,
            },
            {
                fileName: "other.dzn",
                fileContent: `
                namespace OtherNS {
                    extern EType $$;
                }
            `,
            },
        ];

        const program = new Program();
        const sourceFiles = files.map(f => program.parseFile(f.fileName, f.fileContent)!);

        const diagnostics = lint(sourceFiles, {}, program);
        expectNoDiagnosticOfType(diagnostics, unknownVariable.code);
    });

    test("no unknown variables from event arguments", () => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            interface I {
                in bool Bla(bool v, bool v2);
            }
            component C {
                provides I api;
                behavior {
                    on api.Bla(v1, v2): {
                        reply(v2);
                    }
                }
            }`,
            fail: `
            interface I {
                in bool Bla(bool v, bool v2);
            }
            component C {
                provides I api;
                behavior {
                    on api.Bla(v1, v2): {
                        reply(v3);
                    }
                }
            }`,
        });
    });

    test("enum members in interface statement", () => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            interface I {
                enum State {
                    A,
                    B
                };
                behavior {
                    State s = State.A;
                }
            }`,
            fail: `
            interface I {
                enum State {
                    A,
                    B
                };
                behavior {
                    State s = State.C;
                }
            }`,
        });
    });

    test("enum members in interface on body", () => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            interface I {

                in void Foo();

                enum State {
                    A,
                    B
                };
                behavior {
                    State s = State.A;

                    on Foo: s = State.B;
                }
            }`,
            fail: `
            interface I {

                in void Foo();

                enum State {
                    A,
                    B
                };
                behavior {
                    State s = State.A;

                    on Foo: s = State.C;
                }
            }`,
        });
    });

    test("enum members in interface guards", () => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            interface I {
                enum State {
                    A,
                    B
                };
                behavior {
                    State s = State.A;

                    [s.A] { }
                }
            }`,
            fail: `
            interface I {
                enum State {
                    A,
                    B
                };
                behavior {
                    State s = State.A;

                    [s.C] { }
                }
            }`,
        });
    });

    test("enum members in component on body", () => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            interface I { in void foo(); }
            component C {
                provides I api;
                behavior {
                    enum State {
                        A,
                        B
                    };
                    State s = State.A;

                    on api.foo(): s = State.A;
                }
            }`,
            fail: `
            interface I { in void foo(); }
            component C {
                provides I api;
                behavior {
                    enum State {
                        A,
                        B
                    };
                    State s = State.A;

                    on api.foo(): s = State.C;
                }
            }`,
        });
    });

    test("enum members in component guards", () => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            component C {
                behavior {
                    enum State {
                        A,
                        B
                    };
                    State s = State.A;

                    [s.A] {

                    }
                }
            }`,
            fail: `
            component C {
                behavior {
                    enum State {
                        A,
                        B
                    };
                    State s = State.A;

                    [s.C] { }
                }
            }`,
        });
    });
});
