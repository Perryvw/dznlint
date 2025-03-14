import * as path from "path";
import * as api from "../src";
import { expectDiagnosticOfType, expectNoDiagnostics } from "./util";
import { couldNotResolveFile } from "../src/rules/no-unknown-imports";
import { normalizePath } from "../src/resolve-imports";

test("basic import", () => {
    const files = [
        {
            fileName: "main.dzn",
            fileContent: `
            import other.dzn;
            component C {
                behavior {
                    EType foo() {
                    }
                }
            }
        `,
        },
        {
            fileName: "other.dzn",
            fileContent: `extern EType $$;`,
        },
    ];

    const program = new api.Program();
    const sourceFiles = files.map(f => program.parseFile(f.fileName, f.fileContent)!);

    expectNoDiagnostics(api.lint(sourceFiles, {}, program));
});

test("[bug] mixed scenario import interface", () => {
    const files = [
        {
            fileName: "main.dzn",
            fileContent: `
            import other.dzn;
            enum MyEnum { A, B, C };
            interface IMyInterface {
                in MyEnum Bla();
                behavior {
                    on Bla: reply(MyEnum.A);
                    on Bla: reply(MyEnum.B);
                    on Bla: reply(MyEnum.C);
                }
            }
        `,
        },
        {
            fileName: "other.dzn",
            fileContent: `interface IInterface {}`,
        },
    ];

    const program = new api.Program();
    const sourceFiles = files.map(f => program.parseFile(f.fileName, f.fileContent)!);

    expectNoDiagnostics(api.lint(sourceFiles, {}, program));
});

test("basic import with include dir", () => {
    const files = [
        {
            fileName: "main.dzn",
            fileContent: `
            import other.dzn;
            component C {
                behavior {
                    EType foo() {
                    }
                }
            }
        `,
        },
        {
            fileName: "mysubdir/other.dzn",
            fileContent: `extern EType $$;`,
        },
    ];

    const program = new api.Program({ includePaths: ["mysubdir"] });
    const sourceFiles = files.map(f => program.parseFile(f.fileName, f.fileContent)!);

    expectNoDiagnostics(api.lint(sourceFiles, {}, program));
});

test("resolve import from disk", () => {
    const files = [
        {
            fileName: "main.dzn",
            fileContent: `
            import other.dzn;
            component C {
                behavior {
                    EType foo() {
                    }
                }
            }
        `,
        },
    ];

    const mockHost = {
        fileExists: jest.fn(() => true),
        readFile: jest.fn(() => "extern EType $$;"),
    } satisfies Partial<api.LinterHost>;
    const program = new api.Program(mockHost);
    const sourceFiles = files.map(f => program.parseFile(f.fileName, f.fileContent)!);

    expectNoDiagnostics(api.lint(sourceFiles, { no_unknown_imports: false }, program));

    expect(mockHost.fileExists).toHaveBeenCalledTimes(2);
    expect(mockHost.fileExists).toHaveBeenNthCalledWith(1, "other.dzn"); // Resolve
    const resolvedAbsPath = normalizePath(path.resolve("other.dzn"));
    expect(mockHost.fileExists).toHaveBeenNthCalledWith(2, resolvedAbsPath); // Read
    expect(mockHost.readFile).toHaveBeenCalledTimes(1);
    expect(mockHost.readFile).toHaveBeenCalledWith(resolvedAbsPath);
});

test("resolve import from disk with include dir", () => {
    const files = [
        {
            fileName: "main.dzn",
            fileContent: `
            import other.dzn;
            component C {
                behavior {
                    EType foo() {
                    }
                }
            }
        `,
        },
    ];

    const mockHost = {
        includePaths: ["mysubdir"],
        fileExists: jest.fn(() => true),
        readFile: jest.fn(() => "extern EType $$;"),
    } satisfies Partial<api.LinterHost>;

    mockHost.fileExists.mockReturnValueOnce(false).mockReturnValueOnce(true).mockReturnValueOnce(true);

    const program = new api.Program(mockHost);
    const sourceFiles = files.map(f => program.parseFile(f.fileName, f.fileContent)!);

    expectNoDiagnostics(api.lint(sourceFiles, { no_unknown_imports: false }, program));

    expect(mockHost.fileExists).toHaveBeenCalledTimes(3);
    expect(mockHost.fileExists).toHaveBeenNthCalledWith(1, "other.dzn"); // Resolve
    expect(mockHost.fileExists).toHaveNthReturnedWith(1, false); // Resolve
    expect(mockHost.fileExists).toHaveBeenNthCalledWith(2, path.join("mysubdir", "other.dzn")); // Resolve
    expect(mockHost.fileExists).toHaveNthReturnedWith(2, true); // Resolve
    const resolvedAbsPath = normalizePath(path.resolve("mysubdir", "other.dzn"));
    expect(mockHost.fileExists).toHaveBeenNthCalledWith(3, resolvedAbsPath); // Read
    expect(mockHost.readFile).toHaveBeenCalledTimes(1);
    expect(mockHost.readFile).toHaveBeenCalledWith(resolvedAbsPath);
});

test("failed to resolve import", () => {
    const files = [
        {
            fileName: "main.dzn",
            fileContent: `
            import other.dzn;
            component C {
                behavior {
                }
            }
        `,
        },
    ];

    const mockHost = {
        fileExists: jest.fn(() => false),
        readFile: jest.fn(() => ""),
    } satisfies Partial<api.LinterHost>;

    const program = new api.Program(mockHost);
    const sourceFiles = files.map(f => program.parseFile(f.fileName, f.fileContent)!);

    expectDiagnosticOfType(api.lint(sourceFiles, {}, program), couldNotResolveFile.code);

    expect(mockHost.readFile).toHaveBeenCalledTimes(0);
});
