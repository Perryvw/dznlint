import { invalidInterfaceEventCall, invalidInterfaceOnTrigger } from "../src/rules/no-interface-event-parameters";
import { testdznlint } from "./util";

test("interface on triggers should not have a parameter list", async () => {
    await testdznlint({
        diagnostic: invalidInterfaceOnTrigger.code,
        fail: `
            interface I {
                in void foo(in bool a);

                behavior {
                    on foo(a): {}
                }
            }`,
        pass: `
            interface I {
                in void foo(in bool a);

                behavior {
                    on foo: {}
                }
            }`,
    });
});

test("empty parameter lists are also not okay", async () => {
    await testdznlint({
        diagnostic: invalidInterfaceOnTrigger.code,
        fail: `
            interface I {
                in void foo();

                behavior {
                    on foo(): {}
                }
            }`,
    });
});

test("component on should have a parameter list", async () => {
    await testdznlint({
        diagnostic: invalidInterfaceOnTrigger.code,
        pass: `
            component C {
                provides I i;

                behavior {
                    on i.foo(): {}
                }
            }`,
    });
});

test("interface event calls should not have arguments", async () => {
    await testdznlint({
        diagnostic: invalidInterfaceEventCall.code,
        fail: `
            interface I {
                in void foo();
                out void bar(in bool b);

                behavior {
                    on foo: {
                        bar(true);
                    }
                }
            }`,
        pass: `
            interface I {
                in void foo();
                out void bar(in bool b);

                behavior {
                    on foo: {
                        bar;
                    }
                }
            }`,
    });
});

test("single-line interface event calls also should not have arguments", async () => {
    await testdznlint({
        diagnostic: invalidInterfaceEventCall.code,
        fail: `
            interface I {
                in void foo();
                out void bar(in bool b);

                behavior {
                    on foo: bar(true);
                }
            }`,
    });
});

test("function calls in interface behavior do need a parameter list", async () => {
    await testdznlint({
        diagnostic: invalidInterfaceEventCall.code,
        pass: `
            interface I {
                in void foo();
                out void bar(in bool b);

                behavior {
                    on foo: {
                        bla(true);
                    }

                    void bla(in bool p) {}
                }
            }`,
    });
});
