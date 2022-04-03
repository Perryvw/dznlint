import { variableCanBeInlined } from "../src/rules/inline-temporary-variables";
import { testdznlint } from "./util";

test("temporary variable in event trigger", () => {
    testdznlint({
        diagnostic: variableCanBeInlined.code,
        pass: `component A {
            behavior {
                on port.event(): {
                    Result r = doSomething();
                    if (r) {
                    }
                    port.reply(r);
                }
            }
        }`,
        fail: `component A {
            behavior {
                on port.event(): {
                    Result r = doSomething();
                    if (r) {
                    }
                }
            }
        }`,
    });
});

test("temporary variable in function", () => {
    testdznlint({
        diagnostic: variableCanBeInlined.code,
        pass: `component A {
            behavior {
                void foo() {
                    Result r = doSomething();
                    if (r) {
                    }
                    return r;
                }
            }
        }`,
        fail: `component A {
            behavior {
                void foo() {
                    Result r = doSomething();
                    if (r) {
                    }
                }
            }
        }`,
    });
});

test("no inline suggestion on variables outside functions or event triggers", () => {
    testdznlint({
        diagnostic: variableCanBeInlined.code,
        pass: `component A {
            behavior {
                string g_mystring = $"bla"$;
                void foo() {
                    log(g_mystring);
                }
            }
        }`,
    });
});

test("no inline suggestion on out variables", () => {
    testdznlint({
        diagnostic: variableCanBeInlined.code,
        pass: `component A {
            behavior {
                void foo() {
                    bool outBool = true;
                    funcWithOut(outBool);
                }
            }
        }`,
    });
});

test("no inline suggestion on return expressions", () => {
    testdznlint({
        diagnostic: variableCanBeInlined.code,
        pass: `component A {
            behavior {
                void foo() {
                    bool outBool = true;
                    return outBool;
                }
            }
        }`,
    });
});

test("no inline suggestion on function arguments", () => {
    testdznlint({
        diagnostic: variableCanBeInlined.code,
        pass: `component A {
            behavior {
                void foo() {
                    bool outBool = true;
                    funcWithOut(outBool);
                }
            }
        }`,
    });
});
