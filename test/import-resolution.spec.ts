import * as path from "path";
import * as api from "../src/api";
import { expectNoDiagnostics } from "./util";

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

    expectNoDiagnostics(api.lint(files, {}, { includePaths: ["mysubdir"]}));
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
        }
    ];

    const mockHost = {
        fileExists: jest.fn(() => true),
        readFile: jest.fn(() => "extern EType $$;"),
    } satisfies Partial<api.LinterHost>;
    expectNoDiagnostics(api.lint(files, {}, mockHost));

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
        }
    ];

    const mockHost = {
        includePaths: ["mysubdir"],
        fileExists: jest.fn(() => true),
        readFile: jest.fn(() => "extern EType $$;"),
    } satisfies Partial<api.LinterHost>;

    mockHost.fileExists.mockReturnValueOnce(false).mockReturnValueOnce(true).mockReturnValueOnce(true);

    expectNoDiagnostics(api.lint(files, {}, mockHost));
    
    expect(mockHost.fileExists).toHaveBeenCalledTimes(3);
    expect(mockHost.fileExists).toHaveBeenNthCalledWith(1, "other.dzn"); // Resolve
    expect(mockHost.fileExists).toHaveNthReturnedWith(1, false); // Resolve
    expect(mockHost.fileExists).toHaveBeenNthCalledWith(2, path.join("mysubdir", "other.dzn")); // Resolve
    expect(mockHost.fileExists).toHaveNthReturnedWith(2, true); // Resolve
    expect(mockHost.fileExists).toHaveBeenNthCalledWith(2, path.join("mysubdir", "other.dzn")); // Read
    expect(mockHost.readFile).toHaveBeenCalledTimes(1);
    expect(mockHost.readFile).toHaveBeenCalledWith(path.join("mysubdir", "other.dzn"));
});
