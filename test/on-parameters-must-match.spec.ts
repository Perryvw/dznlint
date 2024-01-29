import { incorrectOnParameterCount } from "../src/rules/on-parameters-must-match";
import { testdznlint } from "./util";

test("on parameters must not be more than the event parameters", () => {
    testdznlint({
        diagnostic: incorrectOnParameterCount.code,
        pass: `
            interface I {
                in void foo(bool a, bool b);
            }
            component C {
                provides I i;
                behavior {
                    on i.foo(a, b): {}
                }
            }`,
        fail: `
            interface I {
                in void foo(bool a, bool b);
            }
            component C {
                provides I i;
                behavior {
                    on i.foo(a, b, c): {}
                }
            }`,
    });
});

test("on parameters must not be less than the event parameters", () => {
    testdznlint({
        diagnostic: incorrectOnParameterCount.code,
        pass: `
            interface I {
                in void foo(bool a, bool b);
            }
            component C {
                provides I i;
                behavior {
                    on i.foo(a, b): {}
                }
            }`,
        fail: `
            interface I {
                in void foo(bool a, bool b);
            }
            component C {
                provides I i;
                behavior {
                    on i.foo(a): {}
                }
            }`,
    });
});

test("on parameters are checked in multiple triggers lists too", () => {
    testdznlint({
        diagnostic: incorrectOnParameterCount.code,
        debug: true,
        pass: `
            interface I {
                in void foo(bool a, bool b);
                in void bar(bool a, bool b, bool c);
                in void baz(bool a);
            }
            component C {
                provides I i;
                behavior {
                    on i.foo(a, b), i.bar(a, b, c), i.baz(a): {}
                }
            }`,
        fail: `
            interface I {
                in void foo(bool a, bool b);
                in void bar(bool a, bool b, bool c);
                in void baz(bool a);
            }
            component C {
                provides I i;
                behavior {
                    on i.foo(a, b, c), i.bar(a, b), i.baz(): {}
                }
            }`,
    });
});

test("warns when there are 0 arguments in on", () => {
    testdznlint({
        diagnostic: incorrectOnParameterCount.code,
        fail: `
            interface I {
                in void foo(bool a, bool b);
            }
            component C {
                provides I i;
                behavior {
                    on i.foo(): {}
                }
            }`,
    });
});

test("warns when there are 0 arguments in event", () => {
    testdznlint({
        diagnostic: incorrectOnParameterCount.code,
        fail: `
            interface I {
                in void foo();
            }
            component C {
                provides I i;
                behavior {
                    on i.foo(a): {}
                }
            }`,
    });
});

test("no complaints on interfaces", () => {
    testdznlint({
        diagnostic: incorrectOnParameterCount.code,
        pass: `
            interface I {
                in void foo(bool a, bool b);

                behavior {
                    on foo: {}
                }
            }`,
    });
});
