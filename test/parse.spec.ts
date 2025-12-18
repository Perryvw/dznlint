import * as path from "path";
import { formatDiagnostic } from "../src/diagnostic";
import { Diagnostic, DiagnosticCode, LinterHost, lintFiles, lintString } from "../src";
import { DznLintUserConfiguration } from "../src/config/dznlint-configuration";
import { emptyDeferCapture } from "../src/rules/no-empty-defer-capture";
import { expectNoDiagnostics } from "./util";
import { neverLegalEvent } from "../src/rules/never-legal-event";
import { failedToFullyParseFile } from "../src/parse";
import { typeMismatch } from "../src/rules/type-check";

const parseOnlyConfiguration: DznLintUserConfiguration = {
    naming_convention: false,
    no_unknown_imports: false,
    no_unknown_variables: false,
    no_unused_parameters: false,
    no_unused_ports: false,
    no_unused_instances: false,
    no_unused_variables: false,
};

test.each(["component.dzn", "interface.dzn", "system.dzn"])(
    "can parse file without diagnostics (%p)",
    async fileName => {
        const filePath = path.join(__dirname, "files", fileName);
        const result = await lintFiles([filePath], parseOnlyConfiguration);
        expectNoDiagnostics(result);
    }
);

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
        extern int $$;
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
        extern int $$;
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
    await expectCanParseWithoutDiagnostics(
        `
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
    `,
        [typeMismatch.code]
    );
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
        component C { behavior {
            MyEnum m = MyEnum.2;
        }}
    `);
});

test("namespaced enum", async () => {
    await expectCanParseWithoutDiagnostics(
        `
        namespace ns { enum MyEnum{a,b,c}; }
        
        interface i {
            in ns.MyEnum foo();
            behavior {
                ns.MyEnum m = ns.MyEnum.b;            
            }
        }
    `,
        [neverLegalEvent.code]
    );
});

test("namespaced global", async () => {
    await expectCanParseWithoutDiagnostics(`
        component {
            behavior {
                MyEnum test = .MyEnum.a;
            }
        }
    `);
});

test.each(["&&", "||", "==", "!=", "<="])("binary expression guard", async comparison => {
    await expectCanParseWithoutDiagnostics(
        `
        interface MyInterface {
            behavior {
                [a ${comparison} b] on event: {}
            }
        }
    `,
        [typeMismatch.code]
    );
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
    await expectCanParseWithoutDiagnostics(
        `component MyComponent {
        behavior {
            on event(mydata): {
                a = b ${operator} c;
            }
        }
    }`,
        [typeMismatch.code]
    );
});

test("complex if statement", async () => {
    await expectCanParseWithoutDiagnostics(
        `
        component MyComponent {
            behavior {
                on event(mydata): {
                    if ((a != b) && (c == d) && ((f > g) || (g <= i))) {

                    }
                }
            }
        }
    `,
        [typeMismatch.code]
    );
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

test("invariant", async () => {
    await expectCanParseWithoutDiagnostics(`
        component c {
            behavior {
                bool foo;
                bool bar;
                invariant foo == bar;
            }
        } 
    `);
});

test("implies statement", async () => {
    await expectCanParseWithoutDiagnostics(`
        component c {
            behavior {
                bool foo;
                bool bar;

                invariant foo => bar;
            }
        } 
    `);
});

test("invariant inside guard", async () => {
    await expectCanParseWithoutDiagnostics(`
        component c {
            behavior {
                bool foo;
                bool bar;

                [true]
                {
                    invariant foo == bar;
                }
            }
        } 
    `);
});

test("global functions", async () => {
    await expectCanParseWithoutDiagnostics(`
        interface I {} 

        void foo(provides I i) {}
        void bar(requires I i) {}
    `);
});

test("foreign functions", async () => {
    await expectCanParseWithoutDiagnostics(`
        bool foo(bool inp1, int inp2);
        namespace ns {
            ns2.sometime bar();
        }
    `);
});

test("one line function syntax", async () => {
    await expectCanParseWithoutDiagnostics(`
        bool foo() = true;
    `);
});

test("invalid syntax (enum at root level)", async () => {
    const diagnostics = await parseDiagnostics("MyEnum test = .MyEnum.a;");
    expect(diagnostics).toHaveLength(1);
    const diagnostic = diagnostics[0];
    expect(diagnostic.code).toBe(failedToFullyParseFile.code);
    expect(formatDiagnostic(diagnostic)).toContain("MyEnum test = .MyEnum.a;");
});

test("invalid syntax inside reply", async () => {
    const diagnostics = await parseDiagnostics(`
        component C {
            behavior {
                on abc.def(): {
                    reply(####);
                }
            }
        }
    `);
    expect(diagnostics).toHaveLength(1);
    const diagnostic = diagnostics[0];
    expect(diagnostic.code).toBe(failedToFullyParseFile.code);
    expect(formatDiagnostic(diagnostic)).toContain("reply(####);");
});

test("invalid syntax inside binary expression", async () => {
    const diagnostics = await parseDiagnostics(`
        component C {
            behavior {
                on abc.def(): {
                    var abc = def + ###;
                }
            }
        }
    `);
    expect(diagnostics).toHaveLength(1);
    const diagnostic = diagnostics[0];
    expect(diagnostic.code).toBe(failedToFullyParseFile.code);
    expect(formatDiagnostic(diagnostic)).toContain("+ ###");
});

test("missing syntax", async () => {
    const diagnostics = await parseDiagnostics("import abc.dzn");
    expect(diagnostics).toHaveLength(1);
    const diagnostic = diagnostics[0];
    expect(diagnostic.code).toBe(failedToFullyParseFile.code);
    expect(diagnostic.message).toContain("missing ;");
});

async function parseDiagnostics(dzn: string, ignoreCodes: DiagnosticCode[] = []): Promise<Diagnostic[]> {
    const parseOnlyHost: LinterHost = {
        includePaths: [],
        fileExists() {
            return false;
        },
        readFile() {
            return "";
        },
        resolveImport() {
            return undefined;
        },
    };
    const result = await lintString(dzn, parseOnlyConfiguration, parseOnlyHost);

    const ignoreCodesSet = new Set(ignoreCodes);
    const filteredDiagnostics = result.filter(d => !ignoreCodesSet.has(d.code));

    return filteredDiagnostics;
}

async function expectCanParseWithoutDiagnostics(dzn: string, ignoreCodes: DiagnosticCode[] = []) {
    const diagnostics = await parseDiagnostics(dzn, ignoreCodes);

    if (diagnostics.length > 0) {
        expect(diagnostics.map(formatDiagnostic).join("\n")).toBe("<no diagnostics>");
    }
}
