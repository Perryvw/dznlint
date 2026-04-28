import { requiredPortSharedStateInGuard } from "../src/rules/required-port-shared-state-guard";
import { testdznlint } from "./util";

test("no unused parameters in event trigger", async () => {
    const itf = `
        interface I {

            in void Foo();
            out void Bar();

            behavior {
                enum State {
                    A,
                    B
                };
                State state = State.A;
                [state.A] on Foo: {}
            }
        }`;

    await testdznlint({
        diagnostic: requiredPortSharedStateInGuard.code,
        pass: `
            ${itf}
            component A {
                provides I itf;

                behavior {
                    [itf.state.A] {
                        on itf.Foo(): {}
                    }
                }
            }`,
        fail: `
            ${itf}
            component A {
                requires I itf;

                behavior {
                    [itf.state.A] {
                        on itf.Foo(): {}
                    }
                }
            }`,
    });
});

test("required ports that contain no out parameters are allowed", async () => {
    await testdznlint({
        diagnostic: requiredPortSharedStateInGuard.code,
        pass: `
            interface I {
                in void Foo();

                behavior {
                    enum State {
                        A,
                        B
                    };
                    State state = State.A;
                    [state.A] on Foo: {}
                }
            }
            component A {
                provides I itf;

                behavior {
                    [itf.state.A] {
                        on itf.Foo(): {}
                    }
                }
            }`,
    });
});
