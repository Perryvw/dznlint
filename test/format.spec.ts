import { format } from "../src/format/format";
import * as fs from "fs";
import { TreeSitterNode, treeSitterParse } from "../src/parse";
import { DznLintFormatUserConfiguration } from "../src";

test("different interface formatting (interface)", async () => {
    await testFormat({
        input: `
        interface I {
            in void A();
            in void B();

            out void C();

            behavior {
                enum State {
                    S,
                    T
                };
                State s = State.S;

                [s.S] on A: { s = S.T; C; reply(true); }
                [s.T] on B: { s = S.S; C; reply(false); }

                [s.S] { on A: { s = S.T; C; reply(true); } }
                [s.T] { on B: { s = S.S; C; reply(false); } }

                [s.S] { 
                    on A: { 
                        [true] { s = S.T; C; reply(true); }
                        [true] { s = S.S; C; reply(false); }
                    }
                }
            }
        }
    `,
    });
});

test("different interface formatting (component)", async () => {
    await testFormat({
        input: `
        component C {
            requires I i;

            behavior {
                enum State {
                    S,
                    T
                };

                [s.S] {
                    on i.A(): { s = S.T; C; reply(true); }
                }
                [s.T] {
                    on i.B(): { s = S.S; C; reply(false); }
                }
            }
        }
    `,
    });
});

test("enum missing ;", async () => {
    await testFormat({
        verifyTreeEquality: false,
        input: `
            interface I {
                enum E
                {
                    A,
                    B
                }
            }
        `,
    });
});

test("variable missing ;", async () => {
    await testFormat({
        input: `
            interface I {
                bool b = false
            }
        `,
    });
});

test("guard missing ;", async () => {
    await testFormat({
        input: `
            interface I {
                behavior {
                    [c] illegal
                }
            }
        `,
    });
});

test("on missing ;", async () => {
    await testFormat({
        verifyTreeEquality: false,
        input: `
            interface I {
                behavior {
                    on a: illegal
                }
            }
        `,
    });
});

test("error", async () => {
    await testFormat({
        input: `
            interface I {
                enum E
                {

        `,
    });
});

test("single-line comments", async () => {
    await testFormat({
        input: `
            // Hi
            interface I // Hello
            {
                enum E { 
                    // Foo
                    A,
                     B, //Bar
                     C, // Baz
                     // Buzz
                     D
                     };

                // Trailing E

                behavior {
                    void foo(/* hello */in bool b) {
                        bool a  = true; // Hello
                        // Hi
                        bool b = false;
                    }
                }
            }
            // Trailing I
        `,
    });
});

test("multi-line comments", async () => {
    await testFormat({
        input: `
            /* Hi
             * Hello
             */
            interface I /* sup */
            {
                enum E { 
                    /* foo */
                    A,
                     B /*bar
                     foo
                     */
                     };

                /* Trailing E
                
                blala */
            }
                
            /*
            * Trailing I
            */
        `,
    });
});

test("leading comments", async () => {
    await testFormat({
        input: `
            component C {
                system {
                    Instance instance;
                    /*|*/Instance instance;
                    /*|--*/Instance isntance;
                }
            }
        `,
    });
});

test("trailing comments after guard", async () => {
    await testFormat({
        input: `
            component C {
                behavior {
                    State s = State.A;

                    [true] {
                        // hi
                    } // abc

                    [true] {
                        // ho
                    } // def
                }
            }
        `,
    });
});

test("pop expected types", async () => {
    await testFormat({
        input: `
            interface I {
                behavior {
                    on Foo, Bar:
                    {
                        [true] reply(true);
                        [true] reply(false);
                    }

                    on Baz: reply(Foo.Bar);
                }
            }
            component C {
                behavior {
                    on port.Action(): reply(Foo.Bar);
                    on port.Action(): s = Foo.Bar;
                }
            }
        `,
    });
});

test("spaces before trailing comments", async () => {
    await testFormat({
        input: `
            interface A {
                in bool Bla();// Hello
                in bool Bar(); // World
                in bool Bar();  // World
                in bool Bar();   // World
            }
        `,
    });
});

test("namespaces", async () => {
    await testFormat({
        input: `
            namespace A { namespace B { namespace C {

            enum MyEnum {
                A, B
            };

            interface I {
                in void Bla();

                behavior{}
            }

            component C {
                provides I i;
            }

            }}}
        `,
    });
});

test("one line if statement", () => {
    testFormat({
        input: `
        component C {
            behavior {
                void bla() {
                    if (!foo(bar)) return baz();
                }
            }
        }
        `
    })
});

test("comments in trigger list", () => {
    testFormat({
        input: `
        interface I {
            behavior {
                on a, b,
                // bla
                c, d,
                // foo
                e: { reply(Result.Ok); }
            }
        }
        `
    })
})

test.each([
    "files/component.dzn",
    "files/demo.dzn",
    "files/interface.dzn",
    "files/system.dzn",
    "files/format-component.dzn",
])("format file %s", async fileName => {
    const fileContent = fs.readFileSync(`${__dirname}/${fileName}`).toString();
    await testFormat({ input: fileContent });
});

describe("formatting configuration", () => {
    const unformatted = `
        interface I {
            in void A();
            in void B();

            out void C();

            behavior {
                enum State {
                    S,
                    T
                };
                State s = State.S;
                [s.S] on A: { s = S.T; C; }
                [s.T] on B: { s = S.S; C; }
            }
        }
    `;

    test.each([2, 4, 8])("indent (%p)", indent => {
        testFormat({
            input: unformatted,
            config: {
                indent: ["spaces", indent],
            },
        });
    });

    test.each(["same-line", "next-line"] as const)("braces (%p)", braces => {
        testFormat({
            input: unformatted,
            config: {
                braces,
            },
        });
    });
    test.each(["same-line", "next-line"] as const)("braces if statement (%p)", braces => {
        testFormat({
            input: `
                component C {
                    behavior {
                        void foo() {
                            if (true) {
                                // foo
                            } else {
                                // bar
                            }
                        }
                    }
                }
            `,
            config: {
                braces,
            },
        });
    });

    test.each([true, false])("indenting components and interfaces (%p)", doIndent => {
        testFormat({
            input:
                unformatted +
                `
                component C {
                    provides I p;
                    requires I r;
                    behavior {}
                }
            `,
            config: {
                indent_components_interfaces: doIndent,
            },
        });
    });
});

async function testFormat(formatTest: {
    input: string;
    verifyTreeEquality?: boolean;
    config?: DznLintFormatUserConfiguration;
}) {
    const result = await format({ fileContent: formatTest.input }, formatTest.config);
    expect(result).toMatchSnapshot();

    if (formatTest.verifyTreeEquality !== false) {
        const treeBeforeFormat = await treeSitterParse({ fileContent: formatTest.input });
        const treeAfterFormat = await treeSitterParse({ fileContent: result });

        expectEquivalentTrees(treeAfterFormat, treeBeforeFormat);
        expect(treeAfterFormat.toString()).toBe(treeBeforeFormat.toString());
    }
}

function expectEquivalentTrees(actual: TreeSitterNode, expected: TreeSitterNode) {
    if (actual.type !== expected.type) {
        expect(actual.toString()).toBe(expected.toString());
    }
    if (actual.childCount !== expected.childCount) {
        expect(actual.toString()).toBe(expected.toString());
    }
    for (let i = 0; i < actual.childCount; i++) {
        expectEquivalentTrees(actual.child(i)!, expected.child(i)!);
    }
}
