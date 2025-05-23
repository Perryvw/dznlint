import { unknownVariable } from "../src/rules/no-unknown-variables";
import { testdznlint } from "./util";

describe("in systems", () => {
    test("no instance of unknown type", async () => {
        await testdznlint({
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

    test("no undefined instance bindings", async () => {
        await testdznlint({
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

    test("no undefined port bindings", async () => {
        await testdznlint({
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

    test("no undefined port on instance bindings", async () => {
        await testdznlint({
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
    test.each(["in", "out"])("no unknown %s event types", async eventDirection => {
        await testdznlint({
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

    test.each(["in", "out"])("no unknown %s events", async eventDirection => {
        await testdznlint({
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

    test("no unknown event variable types", async () => {
        await testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            extern Bla $$;
            interface I {
                in void myEvent(in Bla arg);
            }`,
            fail: `
            interface I {
                in void myEvent(in Bla arg);
            }`,
        });
    });

    // https://github.com/Perryvw/dznlint/issues/17
    test("identifier expression (#17)", async () => {
        await testdznlint({
            diagnostic: unknownVariable.code,
            fail: `
            interface I {
                behavior {
                    on inevitable:
                    {
                        Unknown;
                    }
                }
            }`,
        });
    });
});

describe("in components", () => {
    test("no ports for unknown interfaces", async () => {
        await testdznlint({
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

    test("no unknown ports", async () => {
        await testdznlint({
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

    test("no unknown events on known ports", async () => {
        await testdznlint({
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

    test("no functions with unknown types", async () => {
        await testdznlint({
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

    test("no unknown function calls", async () => {
        await testdznlint({
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

    test("no unknown parameter types", async () => {
        await testdznlint({
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

    test("no unknown call arguments", async () => {
        await testdznlint({
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

    test.each(["true", "false"])("literal bool arguments are known", async boolLiteral => {
        await testdznlint({
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

    test.each(["optional", "inevitable"])("optional inevitable are known", async keyword => {
        await testdznlint({
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

    test("no unknown variable declaration type", async () => {
        await testdznlint({
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

    test("no unknown enum members", async () => {
        await testdznlint({
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

    test("no unknown reply", async () => {
        await testdznlint({
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

    test("no unknown reply on port", async () => {
        await testdznlint({
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

    test("no unknown namespaced variable declaration type", async () => {
        await testdznlint({
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

    test("no unknown nested namespaced variable declaration type", async () => {
        await testdznlint({
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

    test("no unknown compound namespaced variable declaration type", async () => {
        await testdznlint({
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

    test("no unknown imported symbols", async () => {
        await testdznlint({
            diagnostic: unknownVariable.code,
            pass: {
                ["main.dzn"]: `
                import other.dzn;
                component C {
                    behavior {
                        OtherNS.EType foo() {
                        }
                    }
                }
                `,
                ["other.dzn"]: `
                namespace OtherNS {
                    extern EType $$;
                }
                `,
            },
        });
    });

    test("no unknown variables from event arguments", async () => {
        await testdznlint({
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

    test("enum members in interface statement", async () => {
        await testdznlint({
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

    test("enum members in interface on body", async () => {
        await testdznlint({
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

    test("enum members in interface guards", async () => {
        await testdznlint({
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

    test("enum members in component on body", async () => {
        await testdznlint({
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

    test("enum members in component guards", async () => {
        await testdznlint({
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

    test("int type variable", async () => {
        await testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            subint SmallInt {0..9};

            component C {
                behavior {
                    SmallInt myInt = 0;
                }
            }`,
        });
    });

    test("int type variable inside behavior", async () => {
        await testdznlint({
            diagnostic: unknownVariable.code,
            pass: `            
            component C {
                behavior {
                    subint SmallInt {0..9};
                    SmallInt myInt = 0;
                }
            }`,
        });
    });

    test("unknown member in return statement", async () => {
        await testdznlint({
            diagnostic: unknownVariable.code,
            fail: `            
            component C {
                behavior {
                    enum MyEnum {
                        A, B
                    };
                    MyEnum foo() {
                        return MyEnum.D;
                    }
                }
            }`,
        });
    });

    test("unknown variable in return statement", async () => {
        await testdznlint({
            diagnostic: unknownVariable.code,
            fail: `            
            component C {
                behavior {
                    MyEnum foo() {
                        return MyEnum.A;
                    }
                }
            }`,
        });
    });

    // https://github.com/Perryvw/dznlint/issues/9
    test("shared state variable in interface (#9)", async () => {
        await testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            interface I {
                behavior {
                    enum State {
                        A,
                        B
                    };
                    State s = State.A;
                }
            }
            component C {
                provides I api;
                
                behavior {
                    [api.s.B] {
                        reply(api.s.A);
                    }
                    bool foo(in bool b) {
                        foo(api.s.A);
                        return api.s.B;
                    }
                }
            }`,
        });
    });

    test("do not assume defer as part of variable is a defer statement", async () => {
        await testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            interface ITimer { 
                in void start();
                in void stop();
                out void tick(); 
            }
            component C {
                requires ITimer deferTimer;
                requires ITimer elseTimer;
                requires ITimer importTimer;
                
                behavior {
                    on deferTimer.tick(): {
                        deferTimer.stop();
                        elseTimer.stop();
                        importTimer.stop();
                    }
                }
            }`,
        });
    });

    test("parameter shadowing interface name", async () => {
        await testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            interface I {
                in void bla(in bool b);
            }
            component C {
                provides I api;
                
                behavior {
                    on api.bla(api): {
                        reply(api);
                    }
                }
            }`,
        });
    });

    // https://github.com/Perryvw/dznlint/issues/15
    test("identifier in if condition (#15)", async () => {
        await testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            component C {                
                behavior {
                    void foo() {
                        bool bar = true;
                        if (bar) {
                        }
                    }
                }
            }`,
            fail: `
            component C {                
                behavior {
                    void foo() {
                        if (bar) {
                        }
                    }
                }
            }`,
        });
    });

    // https://github.com/Perryvw/dznlint/issues/15
    test("identifier in else-if condition (#15)", async () => {
        await testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            component C {                
                behavior {
                    void foo() {
                        bool bar = true;
                        if (false) {
                        }
                        else if (bar) {
                        }
                    }
                }
            }`,
            fail: `
            component C {                
                behavior {
                    void foo() {
                        if (false) {
                        }
                        else if (bar) {
                        }
                    }
                }
            }`,
        });
    });

    // https://github.com/Perryvw/dznlint/issues/25
    test("enum use in function (#25)", async () => {
        await testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            component C {                
                behavior {
                    enum MyEnum {
                        A,
                        B
                    };
                    void foo(MyEnum e) {
                        if (e.B) {
                        }
                        else {
                        }
                    }
                }
            }`,
            fail: `
            component C {                
                behavior {
                    void foo(MyEnum e) {
                        if (e.B) {
                        }
                        else {
                        }
                    }
                }
            }`,
        });
    });

    //https://github.com/Perryvw/dznlint/issues/22
    test("shared state enum in other file behavior (#22)", async () => {
        await testdznlint({
            diagnostic: unknownVariable.code,
            pass: {
                ["main.dzn"]: `
                    import IEnableSeq.dzn;

                    component C {
                        provides I i;

                        behavior {
                            [i.s.A] {}
                        }
                    }
                `,
                ["IEnableSeq.dzn"]: `
                    interface I {
                        behavior {
                            enum State {
                                A,
                                B
                            };
                            State s = State.A;
                        }
                    }
                `,
            },
        });
    });
});

// https://github.com/Perryvw/dznlint/issues/23
describe("used variables missing from on triggers (#23)", () => {
    test("parameter not in all triggers (empty parameter list)", async () => {
        await testdznlint({
            diagnostic: unknownVariable.code,
            fail: `
            interface I {
                in void foo();
                in void bar(in bool b);
            }
            component C {
                provides I api;
                
                behavior {
                    on api.foo(), api.bar(b): {
                        DoSomething(b);
                        DoSomething(b);
                    }

                    void DoSomething(bool b) {}
                }
            }`,
            pass: `
            interface I {
                in void foo(in bool b);
                in void bar(in bool b);
            }
            component C {
                provides I api;
                
                behavior {
                    on api.foo(b), api.bar(b): {
                        DoSomething(b);
                    }

                    void DoSomething(bool b) {}
                }
            }`,
        });
    });

    test("parameter not in all triggers", async () => {
        await testdznlint({
            diagnostic: unknownVariable.code,
            fail: `
            interface I {
                in void foo(in bool a, in bool b);
                in void bar(in bool b);
            }
            component C {
                provides I api;
                
                behavior {
                    on api.foo(a, b), api.bar(b): {
                        DoSomething(a);
                    }

                    void DoSomething(bool b) {}
                }
            }`,
            pass: `
            interface I {
                in void foo(in bool a, in bool b);
                in void bar(in bool b);
            }
            component C {
                provides I api;
                
                behavior {
                    on api.foo(a, b), api.bar(b): {
                        DoSomething(b);
                    }

                    void DoSomething(bool b) {}
                }
            }`,
        });
    });

    test("parameter named differently in some triggers", async () => {
        await testdznlint({
            diagnostic: unknownVariable.code,
            fail: `
            interface I {
                in void foo(in bool a);
                in void bar(in bool b);
            }
            component C {
                provides I api;
                
                behavior {
                    on api.foo(a), api.bar(b): {
                        DoSomething(b);
                    }

                    void DoSomething(bool b) {}
                }
            }`,
            pass: `
            interface I {
                in void foo(in bool a);
                in void bar(in bool b);
            }
            component C {
                provides I api;
                
                behavior {
                    on api.foo(b), api.bar(b): {
                        DoSomething(b);
                    }

                    void DoSomething(bool b) {}
                }
            }`,
        });
    });

    test("many other triggers", async () => {
        await testdznlint({
            diagnostic: unknownVariable.code,
            fail: `
            interface I {
                in void foo(in bool b);
                in void bar(in bool b);
                in void baz(in bool b);
                in void buzz(in bool b);
            }
            component C {
                provides I api;
                
                behavior {
                    on api.foo(a), api.bar(b), api.baz(a), api.buzz(a): {
                        DoSomething(b);
                    }

                    void DoSomething(bool b) {}
                }
            }`,
        });
    });
});

test("namespace and instance with same name", async () => {
    await testdznlint({
        diagnostic: unknownVariable.code,
        pass: `
        namespace myNS {
            component C {}
            component S {
                system {
                    myNS.C myNS;
                }
            }
        }`,
    });
});

test("variables in invariant", async () => {
    await testdznlint({
        diagnostic: unknownVariable.code,
        pass: `
        component C {
            behavior {
                enum State {
                    A,
                    B
                };
                State s = State.A;

                invariant s.A => s.B; // tautology but variables should be known
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

                invariant s.A => s.C;
            }
        }`,
    });
});

test("invariant using predicate function", async () => {
    await testdznlint({
        diagnostic: unknownVariable.code,
        pass: `
        component C {
            behavior {
                bool predicate() = true;
                invariant predicate();
            }
        }`,
        fail: `
        component C {
            behavior {
                invariant predicate();
            }
        }`,
    });
});

test("call global function", async () => {
    await testdznlint({
        diagnostic: unknownVariable.code,
        pass: `
        component C {
            behavior {
                bool foo = bar();
            }
        }
            
        bool bar() {
            return true;
        }`,
    });
});

test("call global function in namespace", async () => {
    await testdznlint({
        diagnostic: unknownVariable.code,
        pass: `
        component C {
            behavior {
                bool foo = baz.bar();
            }
        }
            
        namespace baz {
            bool bar() {
                return true;
            }
        }`,
    });
});

test("global function with port", async () => {
    await testdznlint({
        diagnostic: unknownVariable.code,
        pass: `
        interface I {
            behavior {
                enum State { A, B };
                State s = State.A;
            }
        }
            
        bool bar(in I port) {
            return port.s.B;
        }`,
        fail: `
        interface I {
            behavior {
                enum State { A, B };
                State s = State.A;
            }
        }
            
        bool bar(in I port) {
            return port.s.C; // C does not exist
        }`,
    });
});

test("outside reference to enum type declared inside interface behavior", async () => {
    await testdznlint({
        diagnostic: unknownVariable.code,
        pass: `
        interface I {
            behavior {
                enum State { A, B };
                State s = State.A;
            }
        }
            
        component C {
            provides I i;

            behavior {
                [i.s == I.State.A] {}
            }
        }`,
    });
});

test("trying to call an action on on_trigger parameter", async () => {
    await testdznlint({
        diagnostic: unknownVariable.code,
        fail: `
        extern ExternType $$;
        interface I {
            in void Foo(in ExternType a);
        }
            
        component C {
            provides I i;

            behavior {
                on i.Foo(a): {
                    a.Bar();
                }
            }
        }`,
    });
});

test("trying to call an action on function parameter", async () => {
    await testdznlint({
        diagnostic: unknownVariable.code,
        fail: `
        extern ExternType $$;
            
        component C {
            behavior {
                void Foo(in ExternType a) {
                    a.Bar();
                }
            }
        }`,
    });
});
