import * as path from "path";
import * as api from "../src/api";
import { expectDiagnosticOfType, expectNoDiagnostics } from "./util";
import { couldNotResolveFile } from "../src/rules/no-unknown-imports";

test("basic import", () => {
    const files: api.InputSource[] = [
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

    expectNoDiagnostics(api.lint(files));
});

test("basic import with include dir", () => {
    const files: api.InputSource[] = [
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

    expectNoDiagnostics(api.lint(files, {}, { includePaths: ["mysubdir"] }));
});

test("resolve import from disk", () => {
    const files: api.InputSource[] = [
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
    expectNoDiagnostics(api.lint(files, { no_unknown_imports: false }, mockHost));

    expect(mockHost.fileExists).toHaveBeenCalledTimes(2);
    expect(mockHost.fileExists).toHaveBeenNthCalledWith(1, "other.dzn"); // Resolve
    expect(mockHost.fileExists).toHaveBeenNthCalledWith(2, "other.dzn"); // Read
    expect(mockHost.readFile).toHaveBeenCalledTimes(1);
    expect(mockHost.readFile).toHaveBeenCalledWith("other.dzn");
});

test("resolve import from disk with include dir", () => {
    const files: api.InputSource[] = [
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

    expectNoDiagnostics(api.lint(files, { no_unknown_imports: false }, mockHost));

    expect(mockHost.fileExists).toHaveBeenCalledTimes(3);
    expect(mockHost.fileExists).toHaveBeenNthCalledWith(1, "other.dzn"); // Resolve
    expect(mockHost.fileExists).toHaveNthReturnedWith(1, false); // Resolve
    expect(mockHost.fileExists).toHaveBeenNthCalledWith(2, path.join("mysubdir", "other.dzn")); // Resolve
    expect(mockHost.fileExists).toHaveNthReturnedWith(2, true); // Resolve
    expect(mockHost.fileExists).toHaveBeenNthCalledWith(2, path.join("mysubdir", "other.dzn")); // Read
    expect(mockHost.readFile).toHaveBeenCalledTimes(1);
    expect(mockHost.readFile).toHaveBeenCalledWith(path.join("mysubdir", "other.dzn"));
});

test("failed to resolve import", () => {
    const files: api.InputSource[] = [
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

    expectDiagnosticOfType(api.lint(files, {}, mockHost), couldNotResolveFile.code);

    expect(mockHost.readFile).toHaveBeenCalledTimes(0);
});
