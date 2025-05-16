import { emptyDeferCapture } from "../src/rules/no-empty-defer-capture";
import { testdznlint } from "./util";

test("empty defer capture", async () => {
    await testdznlint({
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

test("implicit defer capture", async () => {
    await testdznlint({
        diagnostic: emptyDeferCapture.code,
        pass: `component C {
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
