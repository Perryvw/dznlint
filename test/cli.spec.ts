import * as path from "path";
import { parseCommandLineArguments } from "../src/cli/argument-parsing";
import { filesFromGlob } from "../src/cli/file-matching";

describe("argument parsing", () => {
    test("can deal with empty input", () => {
        const parsedArgs = parseCommandLineArguments([]);
        if (parsedArgs.success === true) {
            expect(parsedArgs.arguments.files).toEqual([]);
        } else {
            expect(parsedArgs.success).toEqual(true);
        }
    });

    test("can parse simplest cli input", () => {
        const parsedArgs = parseCommandLineArguments(["myfile.dzn"]);
        if (parsedArgs.success === true) {
            expect(parsedArgs.arguments.files).toEqual(["myfile.dzn"]);
        } else {
            expect(parsedArgs.success).toEqual(true);
        }
    });

    test("can accept multiple files", () => {
        const parsedArgs = parseCommandLineArguments(["myfile.dzn", "myfile2.dzn", "myfile3.dzn"]);
        if (parsedArgs.success === true) {
            expect(parsedArgs.arguments.files).toEqual(["myfile.dzn", "myfile2.dzn", "myfile3.dzn"]);
        } else {
            expect(parsedArgs.success).toEqual(true);
        }
    });

    test("can provide config file", () => {
        const parsedArgs = parseCommandLineArguments(["--config-file", "myconfigfile.json", "myfile.dzn"]);
        if (parsedArgs.success === true) {
            expect(parsedArgs.arguments.configFile).toEqual("myconfigfile.json");
            expect(parsedArgs.arguments.files).toEqual(["myfile.dzn"]);
        } else {
            expect(parsedArgs.success).toEqual(true);
        }
    });

    test("can request help", () => {
        const parsedArgs = parseCommandLineArguments(["--help"]);
        if (parsedArgs.success === true) {
            expect(parsedArgs.arguments.help).toBe(true);
        } else {
            expect(parsedArgs.success).toEqual(true);
        }
    });

    test("fails gracefully for unknown option", () => {
        const parsedArgs = parseCommandLineArguments(["--unknown-opt"]);
        if (parsedArgs.success === false) {
            expect(parsedArgs.message).toEqual(
                "Unknown cli option: --unknown-opt. See --help for supported arguments."
            );
        } else {
            expect(parsedArgs.success).toEqual(false);
        }
    });

    test("include directories", () => {
        const parsedArgs = parseCommandLineArguments([
            "--include",
            "includedir1",
            "--include",
            "./includedir2",
            "myfile.dzn",
            "myfile2.dzn",
        ]);

        if (parsedArgs.success === true) {
            expect(parsedArgs.arguments.files).toEqual(["myfile.dzn", "myfile2.dzn"]);
            expect(parsedArgs.arguments.includePaths).toEqual(["includedir1", "./includedir2"]);
        } else {
            expect(parsedArgs.success).toEqual(true);
        }
    });

    test("shortcut include directories", () => {
        const parsedArgs = parseCommandLineArguments([
            "-I",
            "includedir1",
            "-I",
            "./includedir2",
            "myfile.dzn",
            "myfile2.dzn",
        ]);

        if (parsedArgs.success === true) {
            expect(parsedArgs.arguments.files).toEqual(["myfile.dzn", "myfile2.dzn"]);
            expect(parsedArgs.arguments.includePaths).toEqual(["includedir1", "./includedir2"]);
        } else {
            expect(parsedArgs.success).toEqual(true);
        }
    });
});

describe("file matching", () => {
    test("can resolve simple file", () => {
        const result = filesFromGlob("src/myfile.dzn", createMockHost());
        expect(result).toEqual(["src/myfile.dzn"]);
    });

    test("can resolve wildcard files", () => {
        const fileHost = createMockHost();
        fileHost.currentWorkingDirectory.mockImplementationOnce(() => ".");

        fileHost.readDir.mockImplementationOnce(p => {
            expect(p).toEqual("src");
            return [
                { name: "myfile1.dzn", isDirectory: () => false },
                { name: "myfile2.dzn", isDirectory: () => false },
            ];
        });

        const result = filesFromGlob("src/*.dzn", fileHost);
        expect(result).toEqual([path.join("src", "myfile1.dzn"), path.join("src", "myfile2.dzn")]);
    });

    test("can resolve files in wildcard directory", () => {
        const fileHost = createMockHost();
        fileHost.currentWorkingDirectory.mockImplementationOnce(() => ".");

        fileHost.readDir
            .mockImplementationOnce(p => {
                expect(p).toEqual("src");
                return [
                    { name: "subdir1", isDirectory: () => true },
                    { name: "subdir2", isDirectory: () => true },
                    { name: "myfile0.dzn", isDirectory: () => false },
                ];
            })
            .mockImplementationOnce(p => {
                expect(p).toEqual(path.join("src", "subdir1"));
                return [
                    { name: "myfile1.dzn", isDirectory: () => false },
                    { name: "myfile2.dzn", isDirectory: () => false },
                ];
            })
            .mockImplementationOnce(p => {
                expect(p).toEqual(path.join("src", "subdir2"));
                return [
                    { name: "myfile3.dzn", isDirectory: () => false },
                    { name: "myfile4.dzn", isDirectory: () => false },
                ];
            });

        const result = filesFromGlob("src/*/*.dzn", fileHost);
        expect(result).toEqual([
            path.join("src", "subdir1", "myfile1.dzn"),
            path.join("src", "subdir1", "myfile2.dzn"),
            path.join("src", "subdir2", "myfile3.dzn"),
            path.join("src", "subdir2", "myfile4.dzn"),
        ]);
    });

    test("can resolve files in recursive wildcard directory", () => {
        const fileHost = createMockHost();
        fileHost.currentWorkingDirectory.mockImplementationOnce(() => ".");

        fileHost.readDir
            .mockImplementationOnce(p => {
                expect(p).toEqual(".");
                return [{ name: "src", isDirectory: () => true }];
            })
            .mockImplementationOnce(p => {
                expect(p).toEqual("src");
                return [
                    { name: "subdir1", isDirectory: () => true },
                    { name: "subdir2", isDirectory: () => true },
                    { name: "myfile0.dzn", isDirectory: () => false },
                ];
            })
            .mockImplementationOnce(p => {
                expect(p).toEqual(path.join("src", "subdir1"));
                return [
                    { name: "myfile1.dzn", isDirectory: () => false },
                    { name: "myfile2.dzn", isDirectory: () => false },
                ];
            })
            .mockImplementationOnce(p => {
                expect(p).toEqual(path.join("src", "subdir2"));
                return [
                    { name: "myfile3.dzn", isDirectory: () => false },
                    { name: "myfile4.dzn", isDirectory: () => false },
                ];
            });

        const result = filesFromGlob("**/*.dzn", fileHost);
        expect(result).toEqual([
            path.join("src", "myfile0.dzn"),
            path.join("src", "subdir1", "myfile1.dzn"),
            path.join("src", "subdir1", "myfile2.dzn"),
            path.join("src", "subdir2", "myfile3.dzn"),
            path.join("src", "subdir2", "myfile4.dzn"),
        ]);
    });

    test("can resolve files in complicated pattern with recursive wildcard directory", () => {
        const fileHost = createMockHost();
        fileHost.currentWorkingDirectory.mockImplementationOnce(() => ".");

        fileHost.readDir
            .mockImplementationOnce(p => {
                expect(p).toEqual(".");
                return [{ name: "src", isDirectory: () => true }];
            })
            .mockImplementationOnce(p => {
                expect(p).toEqual("src");
                return [
                    { name: "subdir1", isDirectory: () => true },
                    { name: "subdir2", isDirectory: () => true },
                    { name: "myfile0.dzn", isDirectory: () => false },
                ];
            })
            .mockImplementationOnce(p => {
                expect(p).toEqual(path.join("src", "subdir1"));
                return [
                    { name: "myfile1.dzn", isDirectory: () => false },
                    { name: "myfile2.dzn", isDirectory: () => false },
                ];
            })
            .mockImplementationOnce(p => {
                expect(p).toEqual(path.join("src", "subdir2"));
                return [
                    { name: "myfile3.dzn", isDirectory: () => false },
                    { name: "myfile4.dzn", isDirectory: () => false },
                ];
            })
            .mockImplementationOnce(p => {
                expect(p).toEqual(path.join("src", "subdir1"));
                return [
                    { name: "myfile1.dzn", isDirectory: () => false },
                    { name: "myfile2.dzn", isDirectory: () => false },
                ];
            });

        fileHost.exists
            .mockImplementationOnce(p => {
                expect(p).toEqual(path.join("src", "subdir1", "subdir1"));
                return false;
            })
            .mockImplementationOnce(p => {
                expect(p).toEqual(path.join("src", "subdir2", "subdir1"));
                return false;
            })
            .mockImplementationOnce(p => {
                expect(p).toEqual(path.join("src", "subdir1"));
                return true;
            })
            .mockImplementationOnce(p => {
                expect(p).toEqual(path.join("subdir1"));
                return false;
            });

        fileHost.isDirectory.mockImplementationOnce(p => {
            expect(p).toEqual(path.join("src", "subdir1"));
            return true;
        });

        const result = filesFromGlob("**/subdir1/*.dzn", fileHost);
        expect(result).toEqual([
            path.join("src", "subdir1", "myfile1.dzn"),
            path.join("src", "subdir1", "myfile2.dzn"),
        ]);
    });

    function createMockHost() {
        const unexpectedCallNotAllowed =
            (name: string) =>
            (...args: unknown[]) => {
                throw new Error(`unexpected mock call ${name}(${args.join(", ")})`);
            };
        return {
            currentWorkingDirectory: jest.fn<string, []>(unexpectedCallNotAllowed("currentWorkingDirectory")),
            exists: jest.fn<boolean, [string]>(unexpectedCallNotAllowed("exists")),
            isDirectory: jest.fn<boolean, [string]>(unexpectedCallNotAllowed("isDirectory")),
            readDir: jest.fn<Array<{ name: string; isDirectory(): boolean }>, [string]>(
                unexpectedCallNotAllowed("readDir")
            ),
        };
    }
});
