import { emptyDeferCapture } from "../src/rules/no-empty-defer-capture";
import { testdznlint } from "./util";

test("empty defer capture", () => {
    testdznlint({
        diagnostic: emptyDeferCapture.code,
        pass: `component C {
            behavior {
                on port.event(): {
                    defer(myVar) {
                        doSomething();
                    }
                }
            }
        }`,
        fail: `component C {
            behavior {
                on port.event(): {
                    defer() {
                        doSomething();
                    }
                }
            }
        }`,
    });
});

test("missing defer capture", () => {
    testdznlint({
        diagnostic: emptyDeferCapture.code,
        fail: `component C {
            behavior {
                on port.event(): {
                    defer {
                        doSomething();
                    }
                }
            }
        }`,
    });
});
