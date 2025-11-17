import { typeMismatch } from "../src/rules/type-check";
import { testdznlint } from "./util";

test("variable definition", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        config: { type_check: "error" },
        pass: `
            extern ExternType1 $$;

            component C {
                behavior {
                    ExternType1 a = $$;
                    ExternType1 b = a;
                }
            }`,
        fail: `
            extern ExternType1 $$;
            extern ExternType2 $$;

            component C {
                behavior {
                    ExternType1 a = $$;
                    ExternType2 b = a;
                }
            }`,
    });
});

test("variable definition with function return", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        config: { type_check: "error" },
        fail: `
            extern ExternType1 $$;
            extern ExternType2 $$;

            component C {
                behavior {
                    ExternType1 a = foo();

                    ExternType2 foo() { return $$; }
                }
            }`,
    });
});

test("function return must match return type", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        config: { type_check: "error" },
        fail: `
            extern ExternType1 $$;
            extern ExternType2 $$;

            component C {
                behavior {                    
                    ExternType2 foo() { 
                        ExternType1 a = $$;
                        return a;
                    }
                }
            }`,
    });
});

test("variable assignment", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        config: { type_check: "error" },
        pass: `
            extern ExternType1 $$;

            component C {
                behavior {
                    ExternType1 a = $$;
                    ExternType1 b;

                    void foo() {
                        b = a;
                    }
                }
            }`,
        fail: `
            extern ExternType1 $$;
            extern ExternType2 $$;

            component C {
                behavior {
                    ExternType1 a = $$;
                    ExternType2 b = $$;

                    void foo() {
                        b = a;
                    }
                }
            }`,
    });
});

test("variable assignment with dollars is allowed", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        config: { type_check: "error" },
        pass: `
            extern ExternType1 $$;

            component C {
                behavior {
                    ExternType1 a = $$;

                    void foo() {
                        a = $bla$;
                    }
                }
            }`,
    });
});

test("function call parameters", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        config: { type_check: "error" },
        pass: `
            extern ExternType1 $$;

            component C {
                behavior {
                    void foo(ExternType1 a) {}

                    void bar() {
                        ExternType1 bla = $$;
                        foo(bla);
                    }
                }
            }`,
        fail: `
            extern ExternType1 $$;
            extern ExternType2 $$;

            component C {
                behavior {
                    void foo(ExternType1 a) {}

                    void bar() {
                        ExternType2 bla = $$;
                        foo(bla);
                    }
                }
            }`,
    });
});

test("function call parameters dollars are always allowed", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        config: { type_check: "error" },
        pass: `
            extern ExternType1 $$;

            component C {
                behavior {
                    void foo(ExternType1 a) {}

                    void bar() {
                        foo($baz$);
                    }
                }
            }`,
    });
});

test("event call parameters", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        config: { type_check: "error" },
        pass: `
            extern ExternType1 $$;

            interface I {
                in void ev(in ExternType1 p);
            }

            component C {
                requires I i;

                behavior {
                    void foo() {
                        ExternType1 bla = $$;
                        i.ev(bla);
                    }
                }
            }`,
        fail: `
            extern ExternType1 $$;
            extern ExternType2 $$;

            interface I {
                in void ev(in ExternType1 p);
            }

            component C {
                requires I i;

                behavior {
                    void foo() {
                        ExternType2 bla = $$;
                        i.ev(bla);
                    }
                }
            }`,
    });
});

test("event call parameters dollars are always allowed", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        config: { type_check: "error" },
        pass: `
            extern ExternType1 $$;

            interface I {
                in void ev(in ExternType1 p);
            }

            component C {
                requires I i;

                behavior {
                    void foo() {
                        i.ev($$);
                    }
                }
            }`,
    });
});
