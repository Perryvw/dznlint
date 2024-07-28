import * as path from "path";
import { formatDiagnostic } from "../src/diagnostic";
import { DiagnosticCode, LinterHost, lintFiles, lintString } from "../src";
import { DznLintUserConfiguration } from "../src/config/dznlint-configuration";
import { emptyDeferCapture } from "../src/rules/no-empty-defer-capture";
import { expectNoDiagnostics } from "./util";
import { treeSitterParse } from "../src/parse";
import { walkAllNodes } from "../src/grammar/tree-sitter-util";

const parseOnlyConfiguration: DznLintUserConfiguration = {
    naming_convention: false,
    no_unknown_imports: false,
    no_unknown_variables: false,
    no_unused_parameters: false,
    no_unused_ports: false,
    no_unused_instances: false,
    no_unused_variables: false,
};

test.each(["component.dzn", "interface.dzn", "system.dzn"])("can parse file without diagnostics (%p)", fileName => {
    const filePath = path.join(__dirname, "files", fileName);
    const result = lintFiles([filePath], parseOnlyConfiguration);
    expectNoDiagnostics(result);
});

test("empty file", async () => {
    await expectCanParseWithoutDiagnostics("");
});

test("whitespace only file", async () => {
    await expectCanParseWithoutDiagnostics(" \n\n \n");
});

test("extern statement", async () => {
    await expectCanParseWithoutDiagnostics("extern int $2131$;");
});

test("dollars variable declaration expression", async () => {
    await expectCanParseWithoutDiagnostics(`
        component c {
            behavior {
                int myInt = $123$;
            }
        }
    `);
});

test("component with event", async () => {
    await expectCanParseWithoutDiagnostics(`
        component MyComponent {
            behavior {
                on event(mydata): {}
            }
        }
    `);
});

test("on with multiple events", async () => {
    await expectCanParseWithoutDiagnostics(`
        interface MyInterface {
            behavior {
                on event1, event2: {}
            }
        }
    `);
});

test("blocking on with assignment", async () => {
    await expectCanParseWithoutDiagnostics(`
        component MyComponent {
            behavior {
                blocking on event(outVar <- myData): {}
            }
        }
    `);
});

test("comment inside statement", async () => {
    await expectCanParseWithoutDiagnostics(`
        component MyComponent /* a */ /* b */ // c
        {
            behavior // d
            {
                int myInt = $123$;
            }
        }
    `);
});

test("multiline comment", async () => {
    await expectCanParseWithoutDiagnostics(`
        component MyComponent
        {
            /* Hello:
             * bla
             */
            behavior
            {
            }
        }
    `);
});

test("parenthesized expression", async () => {
    await expectCanParseWithoutDiagnostics(`
        component MyComponent
        {
            behavior
            {
                bool foo = (bar == baz);
                void f() {
                    if ((((a == ((b + c)))))) {
                    }
                }
            }
        }
    `);
});

test.each(["component", "interface"])("empty %s", async type => {
    await expectCanParseWithoutDiagnostics(`${type} abc{}`);
});

test("root extern", async () => {
    await expectCanParseWithoutDiagnostics("extern uint $uint$;");
});

test("root subint", async () => {
    await expectCanParseWithoutDiagnostics("subint foo {1..10};");
});

test("numeric enum values", async () => {
    await expectCanParseWithoutDiagnostics(`
        enum MyEnum{1,2,3};
        MyEnum m = MyEnum.2;
    `);
});

test("namespaced enum", async () => {
    await expectCanParseWithoutDiagnostics(`
        namespace ns { enum MyEnum{a,b,c}; }
        ns.MyEnum m = ns.MyEnum.b;

        interface i {
            in ns.MyEnum foo();
        }
    `);
});

test("namespaced shortcut", async () => {
    await expectCanParseWithoutDiagnostics("MyEnum test = .MyEnum.a;");
});

test.each(["&&", "||", "==", "!=", "<="])("binary expression guard", async comparison => {
    await expectCanParseWithoutDiagnostics(`
        interface MyInterface {
            behavior {
                [a ${comparison} b] on event: {}
            }
        }
    `);
});

test("if statement", async () => {
    await expectCanParseWithoutDiagnostics(`component MyComponent {
        behavior {
            on event(mydata): {
                if (mydata) {
                }
            }
        }
    }`);
});

test("if short form", async () => {
    await expectCanParseWithoutDiagnostics(`component MyComponent {
        behavior {
            on event(mydata): {
                if (mydata) return;
            }
        }
    }`);
});

test("if-else statement", async () => {
    await expectCanParseWithoutDiagnostics(`component MyComponent {
        behavior {
            on event(mydata): {
                if (mydata) {
                }
                else {
                }
            }
        }
    }`);
});

test("if-elseif-else statement", async () => {
    await expectCanParseWithoutDiagnostics(`component MyComponent {
        behavior {
            on event(mydata): {
                if (mydata) {
                }
                else if (mydata) {
                }
                else {
                }
            }
        }
    }`);
});

test.each(["+", "-", "&&", "||"])("binary statement (%p)", async operator => {
    await expectCanParseWithoutDiagnostics(`component MyComponent {
        behavior {
            on event(mydata): {
                a = b ${operator} c;
            }
        }
    }`);
});

test("complex if statement", async () => {
    await expectCanParseWithoutDiagnostics(`
        component MyComponent {
            behavior {
                on event(mydata): {
                    if ((a != b) && (c == d) && ((f > g) || (g <= i))) {

                    }
                }
            }
        }
    `);
});

test("2.15 blocking ports", async () => {
    await expectCanParseWithoutDiagnostics(`
        component c {
            provides blocking IPort port;
            provides IPort2 port2;
            requires IPort3 port3;
            requires blocking IPort4 port4;
        }
    `);
});

test("blocking with guard", async () => {
    await expectCanParseWithoutDiagnostics(`
        component c {
            provides blocking IPort port;

            behavior {
                blocking [someExpression] on port.foo(): {}
            }
        }
    `);
});

test("defer statement", async () => {
    await expectCanParseWithoutDiagnostics(
        `
        component c {
            provides blocking IPort port;

            behavior {
                blocking [someExpression] on port.foo(): {
                    defer port.bla();
                }
            }
        }
    `,
        [emptyDeferCapture.code]
    );
});

test("defer with empty capture", async () => {
    await expectCanParseWithoutDiagnostics(
        `
        component c {
            provides blocking IPort port;

            behavior {
                blocking [someExpression] on port.foo(): {
                    defer() port.bla();
                }
            }
        }
    `,
        [emptyDeferCapture.code]
    );
});

test("defer with capture", async () => {
    await expectCanParseWithoutDiagnostics(`
        component c {
            provides blocking IPort port;

            behavior {
                blocking [someExpression] on port.foo(): {
                    defer(a,b, c) port.bla();
                }
            }
        }
    `);
});

test("defer block", async () => {
    await expectCanParseWithoutDiagnostics(
        `
        component c {
            provides blocking IPort port;

            behavior {
                blocking [someExpression] on port.foo(): {
                    defer {
                        port.bla();
                        port.foo();
                    }
                }
            }
        }
    `,
        [emptyDeferCapture.code]
    );
});

test("parameter types", async () => {
    await expectCanParseWithoutDiagnostics(
        `
        interface foo {
            in void bar(in Type inparam);
            in void baz(out Type inparam);
            in void barNs(in Namespace.NestedNamespace.Type nsparam);
            in void BazNs(out Namespace.NestedNamespace.Type nsparam);
        }
        `
    );
});

test("namespace brackets", async () => {
    await expectCanParseWithoutDiagnostics(`
        namespace My { namespace Project {
        }}
    `);
});

test("no trailing whiteline brackets", async () => {
    await expectCanParseWithoutDiagnostics(`namespace MyNamespace{} // hello`);
});

// https://github.com/Perryvw/dznlint/issues/2
test("if without braces (#2)", async () => {
    await expectCanParseWithoutDiagnostics(`
        component c {
            provides blocking IPort port;

            behavior {
                on port.foo(): {
                    if (a) return b;
                    else if (c) return d;
                    else illegal;
                }
            }
        }
    `);
});

// https://github.com/Perryvw/dznlint/issues/2
test("if mixed with without braces (#2)", async () => {
    await expectCanParseWithoutDiagnostics(`
        component c {
            provides blocking IPort port;

            behavior {
                on port.foo(): {
                    if (a) return b;
                    else if (c) { return d; }
                    else illegal;
                }
            }
        }
    `);
});

// https://github.com/Perryvw/dznlint/issues/4
test("guard inside expression (#4)", async () => {
    await expectCanParseWithoutDiagnostics(`
        component c {
            behavior {
                on port.foo(): [guard] Y;
            }
        }
    `);
});

// https://github.com/Perryvw/dznlint/issues/10
test("multi-line comment (#10)", async () => {
    await expectCanParseWithoutDiagnostics(`
        /*
        * bla
        */
    `);
});

// https://github.com/Perryvw/dznlint/issues/10
test("empty multi-line comment (#10)", async () => {
    await expectCanParseWithoutDiagnostics(`
        /**/
    `);
});

test("dollars statement", async () => {
    await expectCanParseWithoutDiagnostics(`
        import abc.dzn;

        $#include "myHeader.h"$

        interface myInterface {}
    `);
});

// test.only("parser-test", async () => {
//     await expectCanParseWithoutDiagnostics(`
//         interface I { behavior {} }
//     `);
// });

async function expectCanParseWithoutDiagnostics(dzn: string, ignoreCodes: DiagnosticCode[] = []) {
    // const parseOnlyHost: LinterHost = {
    //     includePaths: [],
    //     fileExists() {
    //         return false;
    //     },
    //     readFile() {
    //         return "";
    //     },
    //     resolveImport() {
    //         return undefined;
    //     },
    // };
    // const result = lintString(dzn, parseOnlyConfiguration, parseOnlyHost);

    // const ignoreCodesSet = new Set(ignoreCodes);
    // const filteredDiagnostics = result.filter(d => !ignoreCodesSet.has(d.code));

    // for (const diagnostic of filteredDiagnostics) {
    //     console.log(formatDiagnostic(diagnostic));
    // }

    // expect(filteredDiagnostics).toHaveLength(0);
    const root = await treeSitterParse({ fileContent: dzn });
    let errors: string[] = [];
    walkAllNodes(root, node => {
        if (node.isError) {
            errors.push(node.text);
        }
    });
    expect(errors).toHaveLength(0);
}
