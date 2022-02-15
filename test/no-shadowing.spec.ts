import { shadowingVariablesNotAllowed } from "../src/rules/no-shadowing";
import { testdznlint } from "./util";

test.each(["component", "interface"])("port parameter in %s shadowing variable", componentOrInterface => {
    testdznlint({
        diagnostic: shadowingVariablesNotAllowed.code,
        pass: `${componentOrInterface} A {
            behavior {
                bool _myBool;
                on port.something(myBool): {}
            }
        }`,
        fail: `${componentOrInterface} A {
            behavior {
                bool myBool;
                on port.something(myBool): {}
            }
        }`,
    });
});

test.each(["component", "interface"])("variable in %s shadowing port parameter", componentOrInterface => {
    testdznlint({
        diagnostic: shadowingVariablesNotAllowed.code,
        pass: `${componentOrInterface} A {
            behavior {
                on port.something(myBool): {
                    bool _myBool;
                }
            }
        }`,
        fail: `${componentOrInterface} A {
            behavior {
                on port.something(myBool): {
                    bool myBool;
                }
            }
        }`,
    });
});

test("variable shadowing other variable", () => {
    testdznlint({
        diagnostic: shadowingVariablesNotAllowed.code,
        pass: `component A {
            behavior {
                bool _myBool;
                on port.something(): {
                    bool myBool;
                }
            }
        }`,
        fail: `component A {
            behavior {
                bool myBool;
                on port.something(): {
                    bool myBool;
                }
            }
        }`,
    });
});

test("shadowing allows parameters with same name in different on statements", () => {
    testdznlint({
        diagnostic: shadowingVariablesNotAllowed.code,
        pass: `component A {
            behavior {
                on port.something(myParam): {
                }
                on port.something2(myParam): {
                }
            }
        }`,
        fail: `component A {
            behavior {
                bool myParam;
                on port.something(myParam): {
                }
            }
        }`,
    });
});

test("shadowing allows parameters with same name in different functions", () => {
    testdznlint({
        diagnostic: shadowingVariablesNotAllowed.code,
        pass: `component A {
            behavior {
                void something(bool myParam) {
                }
                void something2(bool myParam) {
                }
            }
        }`,
        fail: `component A {
            behavior {
                bool myParam;
                void something(bool myParam) {
                }
            }
        }`,
    });
});

test("shadowing does not have issue with return statements", () => {
    testdznlint({
        diagnostic: shadowingVariablesNotAllowed.code,
        pass: `component A {
            behavior {
                void something(bool myParam) {
                    return myParam;
                }
            }
        }`,
        fail: `component A {
            behavior {
                bool myParam;
                void something(bool myParam) {
                }
            }
        }`,
    });
});

test("function name shadowing variable", () => {
    testdznlint({
        diagnostic: shadowingVariablesNotAllowed.code,
        pass: `component A {
            behavior {
                bool _myBool;
                bool myBool() {}
            }
        }`,
        fail: `component A {
            behavior {
                bool myBool;
                bool myBool() {}
            }
        }`,
    });
});

test("function parameter shadowing variable", () => {
    testdznlint({
        diagnostic: shadowingVariablesNotAllowed.code,
        pass: `component A {
            behavior {
                bool _myBool;
                bool f(bool myBool) {}
            }
        }`,
        fail: `component A {
            behavior {
                bool myBool;
                bool f(bool myBool) {}
            }
        }`,
    });
});

test("variable shadowing function parameter", () => {
    testdznlint({
        diagnostic: shadowingVariablesNotAllowed.code,
        pass: `component A {
            behavior {
                bool f(bool myBool) {
                    bool _myBool;
                }
            }
        }`,
        fail: `component A {
            behavior {
                bool f(bool myBool) {
                    bool myBool;
                }
            }
        }`,
    });
});
