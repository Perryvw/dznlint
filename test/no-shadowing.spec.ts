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
