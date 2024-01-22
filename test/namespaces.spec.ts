import { unknownVariable } from "../src/rules/no-unknown-variables";
import { testdznlint } from "./util";

test("namespace merging", () => {
    testdznlint({
        diagnostic: unknownVariable.code,
        pass: `
        namespace NS {
            extern Foo $$;
        }

        namespace NS {
            extern Bar $$;
        }

        interface I {
            in NS.Foo Event1();
            in NS.Bar Event2();
        }`,
    });
});

test("nested namespace merging merging", () => {
    testdznlint({
        diagnostic: unknownVariable.code,
        pass: `
        namespace NS {
            namespace NNS {
                extern Foo $$;
            }
        }

        namespace NS {
            namespace NNS {
                extern Bar $$;
            }
        }

        interface I {
            in NS.NNS.Foo Event1();
            in NS.NNS.Bar Event2();
        }`,
    });
});

test("access to variables in same namespace", () => {
    testdznlint({
        diagnostic: unknownVariable.code,
        pass: `
        namespace NS {
            extern Foo $$;
        }

        namespace NS {
            interface I {
                in Foo Event();
            }
        }`,
    });
});

test("access to variables in nested namespace in same namespace", () => {
    testdznlint({
        diagnostic: unknownVariable.code,
        pass: `
        namespace NS.A {
            extern Foo $$;
        }

        namespace NS {
            interface I {
                in A.Foo Event();
            }
        }`,
    });
});

test("lookup namespaced variable name in own namespace", () => {
    testdznlint({
        diagnostic: unknownVariable.code,
        pass: `
        namespace NS {
            extern Foo $$;

            interface I {
                in void Event(out NS.Foo b);
            }
        }`,
    });
});

test("nested merged namespace sibling lookup", () => {
    testdznlint({
        diagnostic: unknownVariable.code,
        pass: `
        namespace NS.A {
            extern Foo $$;
        }

        namespace NS.A {
            interface I {
                in Foo Event();
            }
        }`,
    });
});

test("merge multiple namespace imports", () => {
    testdznlint({
        diagnostic: unknownVariable.code,
        pass: {
            ["import1.dzn"]: `
            namespace NS {
                extern A $$;
            }`,
            ["import2.dzn"]: `
            namespace NS {
                extern B $$;
            }`,
            ["main.dzn"]: `
            import import1.dzn;
            import import2.dzn;
            namespace NS {
                interface I {
                    in void Foo(in NS.A a, in NS.B b);
                }
            }`,
        },
    });
});

test("chain namespace imports", () => {
    testdznlint({
        diagnostic: unknownVariable.code,
        pass: {
            ["import1.dzn"]: `
            namespace NS {
                extern A $$;
            }`,
            ["import2.dzn"]: `
            import import1.dzn;
            namespace NS {
                extern B $$;
            }`,
            ["main.dzn"]: `
            import import2.dzn;
            namespace NS {
                interface I {
                    in void Foo(in NS.A a, in NS.B b);
                }
            }`,
        },
    });
});
