import * as path from "path";
import { formatDiagnostic } from "../src/diagnostic";
import { lintFiles, lintString } from "../src/dznlint";

test.each(["component.dzn", "interface.dzn", "system.dzn"])("can parse file without diagnostics (%p)", fileName => {
    const filePath = path.join(__dirname, "files", fileName);
    const result = lintFiles([filePath], { naming_convention: false });
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
                on event(data mydata): {}
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

function expectCanParseWithoutDiagnostics(dzn: string) {
    const result = lintString(dzn, { naming_convention: false });
    for (const diagnostic of result) {
        console.log(formatDiagnostic(diagnostic));
    }
    expect(result).toHaveLength(0);
}
