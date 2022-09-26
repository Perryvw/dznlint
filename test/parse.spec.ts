import * as path from "path";
import { formatDiagnostic } from "../src/diagnostic";
import { lintFiles, lintString } from "../src";
import { DznLintUserConfiguration } from "../src/config/dznlint-configuration";

const parseOnlyConfiguration: DznLintUserConfiguration = {
    naming_convention: false,
    no_unused_parameters: false,
    no_unused_instances: false,
    no_unused_variables: false,
};

test.each(["component.dzn", "interface.dzn", "system.dzn"])("can parse file without diagnostics (%p)", fileName => {
    const filePath = path.join(__dirname, "files", fileName);
    const result = lintFiles([filePath], parseOnlyConfiguration);
    for (const diagnostic of result) {
        console.log(formatDiagnostic(diagnostic));
    }
    expect(result).toHaveLength(0);
});

test("empty file", () => {
    expectCanParseWithoutDiagnostics("");
});

test("whitespace only file", () => {
    expectCanParseWithoutDiagnostics(" \n\n \n");
});

test("extern statement", () => {
    expectCanParseWithoutDiagnostics("extern int $2131$;");
});

test("dollars variable declaration expression", () => {
    expectCanParseWithoutDiagnostics(`
        component c {
            behavior {
                int myInt = $123$;
            }
        }
    `);
});

test("component with event", () => {
    expectCanParseWithoutDiagnostics(`
        component MyComponent {
            behavior {
                on event(mydata): {}
            }
        }
    `);
});

test("on with multiple events", () => {
    expectCanParseWithoutDiagnostics(`
        interface MyInterface {
            behavior {
                on event1, event2: {}
            }
        }
    `);
});

test("blocking on with assignment", () => {
    expectCanParseWithoutDiagnostics(`
        component MyComponent {
            behavior {
                blocking on event(outVar <- myData): {}
            }
        }
    `);
});

test("comment inside statement", () => {
    expectCanParseWithoutDiagnostics(`
        component MyComponent /* a */ /* b */ // c
        {
            behavior // d
            {
                int myInt = $123$;
            }
        }
    `);
});

test("parenthesized expression", () => {
    expectCanParseWithoutDiagnostics(`
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

test.each(["component", "interface"])("empty %s", type => {
    expectCanParseWithoutDiagnostics(`${type} abc{}`);
});

test("root extern", () => {
    expectCanParseWithoutDiagnostics("extern uint $uint$;");
});

test("root subint", () => {
    expectCanParseWithoutDiagnostics("subint foo {1..10};");
});

test("numeric enum values", () => {
    expectCanParseWithoutDiagnostics(`
        enum MyEnum{1,2,3};
        MyEnum m = MyEnum.2;
    `);
});

test("namespaced enum", () => {
    expectCanParseWithoutDiagnostics(`
        namespace ns { enum MyEnum{a,b,c}; }
        ns.MyEnum m = ns.MyEnum.b;

        interface i {
            in ns.MyEnum foo();
        }
    `);
});

test("namespaced shortcut", () => {
    expectCanParseWithoutDiagnostics("MyEnum test = .MyEnum.a;");
});

test.each(["&&", "||", "==", "!=", "<="])("binary expression guard", comparison => {
    expectCanParseWithoutDiagnostics(`
        interface MyInterface {
            behavior {
                [a ${comparison} b] on event: {}
            }
        }
    `);
});

test("if statement", () => {
    expectCanParseWithoutDiagnostics(`component MyComponent {
        behavior {
            on event(mydata): {
                if (mydata) {
                }
            }
        }
    }`);
});

test("if short form", () => {
    expectCanParseWithoutDiagnostics(`component MyComponent {
        behavior {
            on event(mydata): {
                if (mydata) return;
            }
        }
    }`);
});

test("if-else statement", () => {
    expectCanParseWithoutDiagnostics(`component MyComponent {
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

test("if-elseif-else statement", () => {
    expectCanParseWithoutDiagnostics(`component MyComponent {
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

test.each(["+", "-", "&&", "||"])("binary statement (%p)", operator => {
    expectCanParseWithoutDiagnostics(`component MyComponent {
        behavior {
            on event(mydata): {
                a = b ${operator} c;
            }
        }
    }`);
});

test("complex if statement", () => {
    expectCanParseWithoutDiagnostics(`
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

test("2.15 blocking ports", () => {
    expectCanParseWithoutDiagnostics(`
        component c {
            provides blocking IPort port;
            provides IPort2 port2;
            requires IPort3 port3;
            requires blocking IPort4 port4;
        }
    `);
});

test("blocking with guard", () => {
    expectCanParseWithoutDiagnostics(`
        component c {
            provides blocking IPort port;

            behavior {
                blocking [someExpression] on port.foo(): {}
            }
        }
    `);
});

test("defer statement", () => {
    expectCanParseWithoutDiagnostics(`
        component c {
            provides blocking IPort port;

            behavior {
                blocking [someExpression] on port.foo(): {
                    defer port.bla();
                }
            }
        }
    `);
});

test("defer with empty capture", () => {
    expectCanParseWithoutDiagnostics(`
        component c {
            provides blocking IPort port;

            behavior {
                blocking [someExpression] on port.foo(): {
                    defer() port.bla();
                }
            }
        }
    `);
});

test("defer with capture", () => {
    expectCanParseWithoutDiagnostics(`
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

test("defer block", () => {
    expectCanParseWithoutDiagnostics(`
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
    `);
});

function expectCanParseWithoutDiagnostics(dzn: string) {
    const result = lintString(dzn, parseOnlyConfiguration);
    for (const diagnostic of result) {
        console.log(formatDiagnostic(diagnostic));
    }
    expect(result).toHaveLength(0);
}
