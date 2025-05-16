import { invariantNotABool } from "../src/rules/invariant-must-be-bool";
import { testdznlint } from "./util";

test("invariant must evaluate to a boolean type", async () => {
    await testdznlint({
        diagnostic: invariantNotABool.code,
        pass: `
        component C {
            behaviour {
                enum State { A, B };
                State s = State.A;

                invariant s.B;
            }
        }`,
        fail: `
        component C {
            behaviour {
                enum State { A, B };
                State s = State.A;

                invariant s;
            }
        }`,
    });
});

test("invariant with negation", async () => {
    await testdznlint({
        diagnostic: invariantNotABool.code,
        pass: `
        component C {
            behaviour {
                enum State { A, B };
                State s = State.A;

                invariant !s.B;
            }
        }`,
    });
});

test.each(["true", "false"])("literal bool in predicate (%p)", async v => {
    await testdznlint({
        diagnostic: invariantNotABool.code,
        pass: `
        component C {
            behaviour {
                invariant ${v};
            }
        }`,
    });
});

test("implies statement", async () => {
    await testdznlint({
        diagnostic: invariantNotABool.code,
        pass: `
        component C {
            behaviour {
                enum State { A, B };
                State s = State.A;

                invariant s.B => s.A;
            }
        }`,
    });
});

test("invariant calling a predicate function", async () => {
    await testdznlint({
        diagnostic: invariantNotABool.code,
        pass: `
        component C {
            behaviour {
                bool bla() = true;

                invariant bla();
            }
        }`,
        fail: `
        component C {
            behaviour {
                enum State { A, B };
                State bla() = State.A;

                invariant bla();
            }
        }`,
    });
});

test("invariant forgetting to call a predicate function", async () => {
    await testdznlint({
        diagnostic: invariantNotABool.code,
        fail: `
        component C {
            behaviour {
                bool bla() = true;

                invariant bla; // Missing () to call the function
            }
        }`,
    });
});
