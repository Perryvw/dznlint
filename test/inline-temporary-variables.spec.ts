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