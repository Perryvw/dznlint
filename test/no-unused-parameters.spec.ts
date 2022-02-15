import { unusedParameter } from "../src/rules/no-unused-parameter";
import { testdznlint } from "./util";

test.each(["", "in", "out", "inout"])("no unused %s parameters in function", direction => {
    testdznlint({
        diagnostic: unusedParameter.code,
        pass: `component A {
            behavior {
                void myFunc(${direction} bool _) {}
            }
        }`,
        fail: `component A {
            behavior {
                void myFunc(${direction} bool a) {}
            }
        }`,
    });
});

test("no unused parameters in event trigger", () => {
    testdznlint({
        diagnostic: unusedParameter.code,
        pass: `component A {
            behavior {
                on port.event(_, __): {}
            }
        }`,
        fail: `component A {
            behavior {
                on port.event(a, b): {}
            }
        }`,
    });
});

test("parameter with <- assignment is not unused", () => {
    testdznlint({
        diagnostic: unusedParameter.code,
        pass: `component A {
            behavior {
                on port.event(a <- b): {}
            }
        }`,
    });
});

test("no unused parameters in multiple event trigger", () => {
    testdznlint({
        diagnostic: unusedParameter.code,
        pass: `component A {
            behavior {
                on port.event(_, __): {}
            }
        }`,
        fail: `component A {
            behavior {
                on port.event(_), port.event2(a): {}
            }
        }`,
    });
});

test("ignores underscores", () => {
    testdznlint({
        diagnostic: unusedParameter.code,
        pass: `component A {
            behavior {
                void myFunc(bool _a) {}
            }
        }`,
        fail: `component A {
            behavior {
                void myFunc(bool a) {}
            }
        }`,
    });
});
