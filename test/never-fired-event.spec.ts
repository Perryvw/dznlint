import { neverFiredEvent } from "../src/rules/never-fired-event";
import { testdznlint } from "./util";

test("never sent interface event", async () => {
    await testdznlint({
        diagnostic: neverFiredEvent.code,
        pass: `
            interface IA {
                out void Foo();

                behavior {
                    on optional: Foo;
                }
            }`,
        fail: `
            interface IA {
                out void Foo();

                behavior { }
            }`,
    });
});

test("never sent interface event with parameter", async () => {
    await testdznlint({
        diagnostic: neverFiredEvent.code,
        pass: `
            interface IA {
                out void Foo(in Type p);

                behavior {
                    on optional: Foo(a);
                }
            }`,
        fail: `
            interface IA {
                out void Foo(in Type p);

                behavior { }
            }`,
    });
});

test("never sent events are allowed when no behavior is specified", async () => {
    await testdznlint({
        diagnostic: neverFiredEvent.code,
        pass: `
            interface IA {
                out void Foo();
            }`,
        fail: `
            interface IA {
                out void Foo();

                behavior { }
            }`,
    });
});

test("events in functions are considered 'seen'", async () => {
    await testdznlint({
        diagnostic: neverFiredEvent.code,
        pass: `
            interface IA {
                out void Foo();

                behavior {
                    void Bar() {
                        Foo;
                    }
                }
            }`,
    });
});
