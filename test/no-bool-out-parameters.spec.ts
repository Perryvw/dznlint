import { illegalBoolOutParameter } from "../src/rules/no-bool-out-parameters";
import { testdznlint } from "./util";

test("bool out parameter in function", () => {
    testdznlint({
        diagnostic: illegalBoolOutParameter.code,
        pass: `
            interface IA {
                behavior {
                    void f(out boolExt boolParam) {
                    }
                }
            }`,
        fail: `
            interface IA {
                behavior {
                    void f(out bool boolParam) {
                    }
                }
            }`,
    });
});

test("bool in parameter in function still allowed", () => {
    testdznlint({
        diagnostic: illegalBoolOutParameter.code,
        pass: `
            interface IA {
                behavior {
                    void f(in bool boolParam) {
                    }
                }
            }`,
        fail: `
            interface IA {
                behavior {
                    void f(out bool boolParam) {
                    }
                }
            }`,
    });
});

test("bool out parameter in event", () => {
    testdznlint({
        diagnostic: illegalBoolOutParameter.code,
        pass: `
            interface IA {
                in void Foo(out boolExt param);
            }`,
        fail: `
            interface IA {
                in void Foo(out bool param);
            }`,
    });
});

test("bool in parameter in event still allowed", () => {
    testdznlint({
        diagnostic: illegalBoolOutParameter.code,
        pass: `
            interface IA {
                in void Foo(in bool param);
            }`,
        fail: `
            interface IA {
                in void Foo(out bool param);
            }`,
    });
});
