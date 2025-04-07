import { incorrectArgumentCount } from "../src/rules/call-arguments-must-match";
import { testdznlint } from "./util";

test("function call argument count must match function parameters", async () => {
    await testdznlint({
        diagnostic: incorrectArgumentCount.code,
        pass: `
            extern ExtType $$;
            component C {
                behavior {
                    void foo() {
                        bar(true, false, $hi$);
                    }

                    void bar(in bool a, in bool b, ExtType c) { }
                }
            }`,
        fail: `
            extern ExtType $$;
            component C {
                behavior {
                    void foo() {
                        bar(true, false);
                    }

                    void bar(in bool a, in bool b, ExtType c) { }
                }
            }`,
    });
});

test("too many arguments is also an error", async () => {
    await testdznlint({
        diagnostic: incorrectArgumentCount.code,
        fail: `
            component C {
                behavior {
                    void foo() {
                        bar(true, false, $hi$);
                    }

                    void bar(in bool a, in bool b) { }
                }
            }`,
    });
});

test("function call argument count must match when calling an event", async () => {
    await testdznlint({
        diagnostic: incorrectArgumentCount.code,
        pass: `
            extern ExtType $$;
            interface I {
                in void bar(in bool a, in bool b, ExtType c);
            }
            component C {
                requires I if;

                behavior {
                    void foo() {
                        if.bar(true, false, $hi$);
                    }
                }
            }`,
        fail: `
            extern ExtType $$;
            interface I {
                in void bar(in bool a, in bool b, ExtType c);
            }
            component C {
                requires I if;

                behavior {
                    void foo() {
                        if.bar(true, false);
                    }
                }
            }`,
    });
});
