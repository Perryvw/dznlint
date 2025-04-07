import { neverLegalEvent } from "../src/rules/never-legal-event";
import { testdznlint } from "./util";

test("never legal interface event", async () => {
    await testdznlint({
        diagnostic: neverLegalEvent.code,
        pass: `
            interface IA {
                in void Foo(out boolExt param);

                behavior {
                    on Foo(_): {
                    }
                }
            }`,
        fail: `
            interface IA {
                in void Foo(out bool param);

                behavior {
                    on Foo: illegal;
                }
            }`,
    });
});

test("never legal events are allowed when no behavior is specified", async () => {
    await testdznlint({
        diagnostic: neverLegalEvent.code,
        pass: `
            interface IA {
                in void Foo(out boolExt param);
            }`,
        fail: `
            interface IA {
                in void Foo(out bool param);

                behavior {
                    on Foo: illegal;
                }
            }`,
    });
});
