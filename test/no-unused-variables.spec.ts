import { unusedVariable } from "../src/rules/no-unused-variables";
import { testdznlint } from "./util";

test("unused variable in event trigger", () => {
    testdznlint({
        diagnostic: unusedVariable.code,
        pass: `component A {
            behavior {
                on port.event(): {
                    Result r = doSomething();
                    port.reply(r);
                }
            }
        }`,
        fail: `component A {
            behavior {
                on port.event(): {
                    Result r = doSomething();
                }
            }
        }`,
    });
});

test("unused variable in function", () => {
    testdznlint({
        diagnostic: unusedVariable.code,
        pass: `component A {
            behavior {
                void foo() {
                    Result r = doSomething();
                    return r;
                }
            }
        }`,
        fail: `component A {
            behavior {
                void foo() {
                    Result r = doSomething();
                }
            }
        }`,
    });
});

test("unused variable in defer", () => {
    testdznlint({
        diagnostic: unusedVariable.code,
        pass: `component A {
            behavior {
                void foo() {
                    defer {
                        Result r = doSomething();
                        return r;
                    }
                }
            }
        }`,
        fail: `component A {
            behavior {
                void foo() {
                    defer {
                        Result r = doSomething();
                    }
                }
            }
        }`,
    });
});

test("illegal is not unused variable", () => {
    testdznlint({
        diagnostic: unusedVariable.code,
        pass: `component A {
            behavior {
                void foo() {
                    if (true) {

                    }
                    else illegal;
                }
            }
        }`,
    });
});
