import * as ast from "../src/grammar/ast";
import { Program } from "../src";
import { TypeChecker } from "../src/semantics/type-checker";
import { findLeafAtPosition, findNameAtLocationInErrorNode, findNameAtPosition, isCompoundName } from "../src/util";

test("find declaration of port", async () => {
    const program = await Program.Init();
    const typeChecker = new TypeChecker(program);

    const nameAtPosition = await findNameAtCursor(
        program,
        `
        interface I {
            in void Foo();
        }
        component C {
            provides I i;

            behavior {
                on i<cursor>.Foo(): {}
            }
        }`
    );
    expect(nameAtPosition).toBeDefined();

    const symbol = typeChecker.symbolOfNode(nameAtPosition!);
    expect(symbol).toBeDefined();

    expect(symbol?.declaration.kind).toBe(ast.SyntaxKind.Port);
    expect((symbol?.declaration as ast.Port).name.text).toBe("i");
});

test("find declaration of event", async () => {
    const program = await Program.Init();
    const typeChecker = new TypeChecker(program);

    const nameAtPosition = await findNameAtCursor(
        program,
        `
        interface I {
            in void Foo();
        }
        component C {
            provides I i;

            behavior {
                on i.<cursor>Foo(): {}
            }
        }`
    );
    expect(nameAtPosition).toBeDefined();

    const symbol = typeChecker.symbolOfNode(nameAtPosition!);
    expect(symbol).toBeDefined();

    expect(symbol?.declaration.kind).toBe(ast.SyntaxKind.Event);
    expect((symbol?.declaration as ast.Event).name.text).toBe("Foo");
});

test("event parameter", async () => {
    const program = await Program.Init();

    const { leafAtPosition } = await findLeafAtCursor(
        program,
        `
        interface I {
            in void Foo(out Error error<cursor>);
        }`
    );
    expect(leafAtPosition).toBeDefined();

    expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.Identifier]);
    expect(ast.SyntaxKind[leafAtPosition!.parent!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.EventParameter]);
});

test("find declaration of interface", async () => {
    const program = await Program.Init();
    const typeChecker = new TypeChecker(program);

    const nameAtPosition = await findNameAtCursor(
        program,
        `
        interface I {
            in void Foo();
        }
        component C {
            provides I<cursor> i;

            behavior {
                on i.Foo(): {}
            }
        }`
    );
    expect(nameAtPosition).toBeDefined();

    const symbol = typeChecker.symbolOfNode(nameAtPosition!);
    expect(symbol).toBeDefined();

    expect(symbol?.declaration.kind).toBe(ast.SyntaxKind.InterfaceDefinition);
    expect((symbol?.declaration as ast.InterfaceDefinition).name.text).toBe("I");
});

test("keyword without definition", async () => {
    const program = await Program.Init();

    const nameAtPosition = await findNameAtCursor(
        program,
        `
        interface I {
            in void Foo();
        }
        component C {
            provides<cursor> I i;

            behavior {
                on i.Foo(): {}
            }
        }`
    );

    expect(nameAtPosition).toBeUndefined();
});

test("resolving port in system", async () => {
    const program = await Program.Init();
    const typeChecker = new TypeChecker(program);

    const nameAtPosition = await findNameAtCursor(
        program,
        `
        namespace ns {
            component c {
                provides I p;
            }
        }
        component s {
            system {
                ns.c ns;
                ns.p<cursor> <=> ns.b;
            }
        }`
    );

    expect(nameAtPosition).toBeDefined();

    const symbol = typeChecker.symbolOfNode(nameAtPosition!);
    expect(symbol).toBeDefined();
    expect(ast.SyntaxKind[symbol!.declaration.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.Port]);
});

test("find variables in defer", async () => {
    const program = await Program.Init();
    const typeChecker = new TypeChecker(program);

    const { leafAtPosition } = await findLeafAtCursor(
        program,
        `
        component C {
            provides I port;
            behavior {
                on abc.def: {
                    defer {
                        <cursor>
                    }
                }
            }
        }`
    );

    expect(leafAtPosition).toBeDefined();
    expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.Compound]);

    const symbolsInScope = typeChecker.findAllVariablesKnownInScope(leafAtPosition as ast.Compound);
    expect(symbolsInScope.get("port")).toBeDefined();
});

test("namespace merging", async () => {
    const program = await Program.Init();
    const typeChecker = new TypeChecker(program);

    const { leafAtPosition } = await findLeafAtCursor(
        program,
        `
        namespace ns {
            enum MyEnum { A, B };
        }
        namespace ns2 {
            enum MyOtherEnum { C, D };
        }
        namespace ns {
            component C {
                behavior {
                    <cursor>
                }
            }
        }`
    );

    expect(leafAtPosition).toBeDefined();
    expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.Behavior]);

    const symbolsInScope = typeChecker.findAllVariablesKnownInScope(leafAtPosition as ast.Behavior);
    // enum in the same namespace should be known
    expect(symbolsInScope.get("MyEnum")).toBeDefined();
    // this enum is in a different namespace so should not be known
    expect(symbolsInScope.get("MyOtherEnum")).toBeUndefined();
});

test("enum value in call", async () => {
    const program = await Program.Init();
    const typeChecker = new TypeChecker(program);

    const { leafAtPosition } = await findLeafAtCursor(
        program,
        `
        enum MyEnum { Abc, Def };

        component C {
            behavior {
                void foo() {
                    bar(MyEnum.A<cursor>);
                }
            }
        }`
    );

    expect(leafAtPosition).toBeDefined();
    expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.Identifier]);

    const completingCompound =
        leafAtPosition?.parent &&
        isCompoundName(leafAtPosition.parent) &&
        leafAtPosition === leafAtPosition.parent.name;
    expect(completingCompound).toBeTruthy();

    const ownerType = typeChecker.typeOfNode((leafAtPosition?.parent as ast.CompoundName).compound!);
    const members = typeChecker.getMembersOfType(ownerType);

    expect(members.size).toBe(2);
    expect(members.has("Abc")).toBeTruthy();
    expect(members.has("Def")).toBeTruthy();
});

test("enum from transitive dependency file", async () => {
    const program = await Program.Init();
    const typeChecker = new TypeChecker(program);

    program.parseFile(
        "types/myenum.dzn",
        `
        namespace ns {
            enum MyEnum { Abc, Def };
        }    
    `
    );

    program.parseFile("other/myotherfile.dzn", "import types/myenum.dzn;");

    const { leafAtPosition } = await findLeafAtCursor(
        program,
        `
        import other/myotherfile.dzn;

        namespace ns {
            component C {
                behavior {
                    void foo() {
                        bar(MyEnum.A<cursor>);
                    }
                }
            }
        }`
    );

    expect(leafAtPosition).toBeDefined();
    expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.Identifier]);

    const completingCompound =
        leafAtPosition?.parent &&
        isCompoundName(leafAtPosition.parent) &&
        leafAtPosition === leafAtPosition.parent.name;
    expect(completingCompound).toBeTruthy();

    const ownerType = typeChecker.typeOfNode((leafAtPosition?.parent as ast.CompoundName).compound!);
    const members = typeChecker.getMembersOfType(ownerType);

    expect(members.size).toBe(2);
    expect(members.has("Abc")).toBeTruthy();
    expect(members.has("Def")).toBeTruthy();
});

test("nested namespace merging", async () => {
    const program = await Program.Init();
    const typeChecker = new TypeChecker(program);

    const { leafAtPosition } = await findLeafAtCursor(
        program,
        `
        namespace ns.foo {
            enum MyEnum { A, B };
        }
        namespace ns {
            enum OtherKnownEnum { C, D };

            namespace bla {
                enum OtherUnknownEnum
            }
        }
        namespace ns {
            namespace foo {
                component C {
                    behavior {
                        <cursor>
                    }
                }
            }
        }`
    );

    expect(leafAtPosition).toBeDefined();
    expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.Behavior]);

    const symbolsInScope = typeChecker.findAllVariablesKnownInScope(leafAtPosition as ast.Behavior);
    // MyEnum is in ns.foo like C, so should be known
    expect(symbolsInScope.get("MyEnum")).toBeDefined();
    // OtherKnownEnum is in namespace ns, so should also be known in ns.foo
    expect(symbolsInScope.get("OtherKnownEnum")).toBeDefined();
    // OtherUnknownEnum is in ns.bla, so should not be known in ns.foo
    expect(symbolsInScope.get("OtherUnknownEnum")).toBeUndefined();
});

describe("incomplete tree", () => {
    test("compound name in on", async () => {
        const program = await Program.Init();
        const typeChecker = new TypeChecker(program);

        const { leafAtPosition, cursorPos } = await findLeafAtCursor(
            program,
            `
            component C {
                provides I i;

                behavior {
                    on i.<cursor>
                }
            }`
        );
        expect(leafAtPosition).toBeDefined();
        expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.ERROR]);

        const { scope, owningObject, prefix } = findNameAtLocationInErrorNode(
            leafAtPosition as ast.Error,
            cursorPos.line,
            cursorPos.column,
            typeChecker
        );
        // prefix of thing is empty because there is no text after .
        expect(prefix).toBe("");
        // The object owning the incomplete name is the port i
        expect(owningObject?.declaration.kind).toBe(ast.SyntaxKind.Port);
        expect((owningObject?.declaration as ast.Port).name.text).toBe("i");
        // The name is in scope of the behavior (the guard is not complete and not recognized)
        expect(scope.kind).toBe(ast.SyntaxKind.Behavior);
    });

    test("compound name in guard", async () => {
        const program = await Program.Init();
        const typeChecker = new TypeChecker(program);

        const { leafAtPosition, cursorPos } = await findLeafAtCursor(
            program,
            `
            component C {
                provides I i;

                behavior {
                    [i.<cursor>]
                }
            }`
        );
        expect(leafAtPosition).toBeDefined();
        expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.ERROR]);

        const { scope, owningObject, prefix } = findNameAtLocationInErrorNode(
            leafAtPosition as ast.Error,
            cursorPos.line,
            cursorPos.column,
            typeChecker
        );
        // prefix of thing is empty because there is no text after .
        expect(prefix).toBe("");
        // The object owning the incomplete name is the port i
        expect(owningObject?.declaration.kind).toBe(ast.SyntaxKind.Port);
        expect((owningObject?.declaration as ast.Port).name.text).toBe("i");
        // The name is in scope of the behavior (the guard is not complete and not recognized)
        expect(scope.kind).toBe(ast.SyntaxKind.Behavior);
    });

    test("binary expression in guard", async () => {
        const program = await Program.Init();
        const typeChecker = new TypeChecker(program);

        const { leafAtPosition, cursorPos } = await findLeafAtCursor(
            program,
            `
            component C {
                provides I i;

                behavior {
                    [i.s.bla || i.<cursor>] {}
                }
            }`
        );
        expect(leafAtPosition).toBeDefined();
        expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.ERROR]);

        const { scope, owningObject, prefix } = findNameAtLocationInErrorNode(
            leafAtPosition as ast.Error,
            cursorPos.line,
            cursorPos.column,
            typeChecker
        );
        // prefix of thing is empty because there is no text after .
        expect(prefix).toBe("");
        // The object owning the incomplete name is the port i
        expect(owningObject?.declaration.kind).toBe(ast.SyntaxKind.Port);
        expect((owningObject?.declaration as ast.Port).name.text).toBe("i");
        // The name is in scope of the behavior (the guard is not complete and not recognized)
        expect(scope.kind).toBe(ast.SyntaxKind.GuardStatement);
    });

    test("empty guard", async () => {
        const program = await Program.Init();
        const typeChecker = new TypeChecker(program);

        const { leafAtPosition, cursorPos } = await findLeafAtCursor(
            program,
            `
            component C {
                provides I i;

                behavior {
                    [<cursor>]
                }
            }`
        );
        expect(leafAtPosition).toBeDefined();
        expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.ERROR]);

        const { scope, owningObject, prefix } = findNameAtLocationInErrorNode(
            leafAtPosition as ast.Error,
            cursorPos.line,
            cursorPos.column,
            typeChecker
        );
        // prefix of thing is empty because there is no name at all
        expect(prefix).toBe("");
        // There is no owning object because there is no name
        expect(owningObject).toBeUndefined();
        // The name is in scope of the behavior (the guard is not complete and not recognized)
        expect(scope.kind).toBe(ast.SyntaxKind.Behavior);
    });

    test("partial name in function", async () => {
        const program = await Program.Init();
        const typeChecker = new TypeChecker(program);

        const { leafAtPosition, cursorPos } = await findLeafAtCursor(
            program,
            `
            component C {
                provides I i;

                behavior {
                    void bla() {
                        i.<cursor>
                    }
                }
            }`
        );
        expect(leafAtPosition).toBeDefined();
        expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.ERROR]);

        const { scope, owningObject, prefix } = findNameAtLocationInErrorNode(
            leafAtPosition as ast.Error,
            cursorPos.line,
            cursorPos.column,
            typeChecker
        );
        // prefix of name is empty (no text after .)
        expect(prefix).toBe("");
        // The object owning the incomplete name is the port i
        expect(owningObject?.declaration.kind).toBe(ast.SyntaxKind.Port);
        expect((owningObject?.declaration as ast.Port).name.text).toBe("i");
        // The name is in the compound scope of bla()
        expect(scope.kind).toBe(ast.SyntaxKind.Compound);
        expect(scope.parent?.kind).toBe(ast.SyntaxKind.FunctionDefinition);
    });

    test("partial name in call", async () => {
        const program = await Program.Init();
        const typeChecker = new TypeChecker(program);

        const { leafAtPosition, cursorPos } = await findLeafAtCursor(
            program,
            `
            enum MyEnum { Abc, Def };

            component C {
                behavior {
                    void foo() {
                        bar(MyEnum.<cursor>);
                    }
                }
            }`
        );

        expect(leafAtPosition).toBeDefined();
        expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.ERROR]);

        const { owningObject } = findNameAtLocationInErrorNode(
            leafAtPosition as ast.Error,
            cursorPos.line,
            cursorPos.column,
            typeChecker
        );

        // The object owning the enum MyEnum
        expect(ast.SyntaxKind[owningObject!.declaration.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.EnumDefinition]);
        expect((owningObject?.declaration as ast.EnumDefinition).name.text).toBe("MyEnum");
    });

    test("partial name in variable", async () => {
        const program = await Program.Init();
        const typeChecker = new TypeChecker(program);

        const { leafAtPosition, cursorPos } = await findLeafAtCursor(
            program,
            `
            enum MyEnum { Abc, Def };

            component C {
                behavior {
                    void foo() {
                        MyEnum e = MyEnum.<cursor>;
                    }
                }
            }`
        );

        expect(leafAtPosition).toBeDefined();
        expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.ERROR]);

        const { owningObject } = findNameAtLocationInErrorNode(
            leafAtPosition as ast.Error,
            cursorPos.line,
            cursorPos.column,
            typeChecker
        );

        // The object owning the enum MyEnum
        expect(ast.SyntaxKind[owningObject!.declaration.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.EnumDefinition]);
        expect((owningObject?.declaration as ast.EnumDefinition).name.text).toBe("MyEnum");
    });

    test("partial name in call without ;", async () => {
        const program = await Program.Init();
        const typeChecker = new TypeChecker(program);

        const { leafAtPosition, cursorPos } = await findLeafAtCursor(
            program,
            `
            enum MyEnum { Abc, Def };

            component C {
                behavior {
                    void foo() {
                        bar(MyEnum.<cursor>)
                    }
                }
            }`
        );

        expect(leafAtPosition).toBeDefined();
        expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.ERROR]);

        const { owningObject } = findNameAtLocationInErrorNode(
            leafAtPosition as ast.Error,
            cursorPos.line,
            cursorPos.column,
            typeChecker
        );

        // The object owning the enum MyEnum
        expect(owningObject?.declaration.kind).toBe(ast.SyntaxKind.EnumDefinition);
        expect((owningObject?.declaration as ast.EnumDefinition).name.text).toBe("MyEnum");
    });

    test("enum member in variable without ;", async () => {
        const program = await Program.Init();
        const typeChecker = new TypeChecker(program);

        const { leafAtPosition, cursorPos } = await findLeafAtCursor(
            program,
            `
            interface I {
                enum MyEnum { Abc, Def };

                behavior {
                    MyEnum e = MyEnum.<cursor>
                }
            }`
        );

        expect(leafAtPosition).toBeDefined();
        expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.ERROR]);

        const { owningObject } = findNameAtLocationInErrorNode(
            leafAtPosition as ast.Error,
            cursorPos.line,
            cursorPos.column,
            typeChecker
        );

        // The object owning the enum MyEnum
        expect(owningObject?.declaration.kind).toBe(ast.SyntaxKind.EnumDefinition);
        expect((owningObject?.declaration as ast.EnumDefinition).name.text).toBe("MyEnum");
    });

    test("partial name in function with prefix", async () => {
        const program = await Program.Init();
        const typeChecker = new TypeChecker(program);

        const { leafAtPosition, cursorPos } = await findLeafAtCursor(
            program,
            `
            component C {
                provides I i;

                behavior {
                    void bla() {
                        i.abc<cursor>
                    }
                }
            }`
        );
        expect(leafAtPosition).toBeDefined();
        expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.ERROR]);

        const { scope, owningObject, prefix } = findNameAtLocationInErrorNode(
            leafAtPosition as ast.Error,
            cursorPos.line,
            cursorPos.column,
            typeChecker
        );
        // prefix of thing is "abc"
        expect(prefix).toBe("abc");
        // The object owning the name abc is the port i
        expect(owningObject?.declaration.kind).toBe(ast.SyntaxKind.Port);
        expect((owningObject?.declaration as ast.Port).name.text).toBe("i");
        // The name is in the compound scope of bla()
        expect(scope.kind).toBe(ast.SyntaxKind.Compound);
        expect(scope.parent?.kind).toBe(ast.SyntaxKind.FunctionDefinition);
    });

    test("name in error node with suffix", async () => {
        const program = await Program.Init();
        const typeChecker = new TypeChecker(program);

        const { leafAtPosition, cursorPos } = await findLeafAtCursor(
            program,
            `
            component C {
                behavior {
                    void bla() {
                        abc<cursor>def(
                    }
                }
            }`
        );
        expect(leafAtPosition).toBeDefined();
        expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.ERROR]);

        const { scope, owningObject, prefix, suffix } = findNameAtLocationInErrorNode(
            leafAtPosition as ast.Error,
            cursorPos.line,
            cursorPos.column,
            typeChecker
        );
        // prefix of thing is "abc"
        expect(prefix).toBe("abc");
        expect(suffix).toBe("def");
        // No owning object
        expect(owningObject).toBeUndefined();
        // The name is in the compound scope of bla()
        expect(scope.kind).toBe(ast.SyntaxKind.Compound);
        expect(scope.parent?.kind).toBe(ast.SyntaxKind.FunctionDefinition);
    });

    test("compound name in error node with suffix", async () => {
        const program = await Program.Init();
        const typeChecker = new TypeChecker(program);

        const { leafAtPosition, cursorPos } = await findLeafAtCursor(
            program,
            `
            component C {
                requires I i;
                behavior {
                    void bla() {
                        i.abc<cursor>def(
                    }
                }
            }`
        );
        expect(leafAtPosition).toBeDefined();
        expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.ERROR]);

        const { scope, owningObject, prefix, suffix } = findNameAtLocationInErrorNode(
            leafAtPosition as ast.Error,
            cursorPos.line,
            cursorPos.column,
            typeChecker
        );
        // prefix of thing is "abc"
        expect(prefix).toBe("abc");
        expect(suffix).toBe("def");
        // The object owning the name abc is the port i
        expect(owningObject?.declaration.kind).toBe(ast.SyntaxKind.Port);
        expect((owningObject?.declaration as ast.Port).name.text).toBe("i");
        // The name is in the compound scope of bla()
        expect(scope.kind).toBe(ast.SyntaxKind.Compound);
        expect(scope.parent?.kind).toBe(ast.SyntaxKind.FunctionDefinition);
    });

    test("compound name in error node consisting of multiple lines", async () => {
        const program = await Program.Init();
        const typeChecker = new TypeChecker(program);

        const { leafAtPosition, cursorPos } = await findLeafAtCursor(
            program,
            `
            component C {
                requires I i;
                behavior {
                    foo
                    j.a(); i.<cursor>
                }
            }`
        );
        expect(leafAtPosition).toBeDefined();
        expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.ERROR]);

        const { scope, owningObject, prefix } = findNameAtLocationInErrorNode(
            leafAtPosition as ast.Error,
            cursorPos.line,
            cursorPos.column,
            typeChecker
        );
        // prefix of thing is "abc"
        expect(prefix).toBe("");
        // The object owning the name abc is the port i
        expect(ast.SyntaxKind[owningObject!.declaration.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.Port]);
        expect((owningObject?.declaration as ast.Port).name.text).toBe("i");
        // The name is in the compound scope of bla()
        expect(ast.SyntaxKind[scope.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.Behavior]);
    });

    test("incomplete compound followed by reply", async () => {
        const program = await Program.Init();

        const { leafAtPosition } = await findLeafAtCursor(
            program,
            `
            component C {
                behavior {
                    void bla() {
                        i.<cursor>
                        reply();
                    }
                }
            }`
        );
        expect(leafAtPosition).toBeDefined();
        expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.Reply]);

        expect((leafAtPosition as ast.Reply).port?.text).toBe("i");
    });

    test("compound name in incomplete if statement", async () => {
        const program = await Program.Init();
        const typeChecker = new TypeChecker(program);

        const { leafAtPosition, cursorPos } = await findLeafAtCursor(
            program,
            `
            component C {
                requires I i;
                behavior {
                    on bla(): {
                        if (i.<cursor>) {}
                    }
                }
            }`
        );
        expect(leafAtPosition).toBeDefined();
        expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.ERROR]);

        const { owningObject } = findNameAtLocationInErrorNode(
            leafAtPosition as ast.Error,
            cursorPos.line,
            cursorPos.column,
            typeChecker
        );
        // The object owning the name abc is the port i
        expect(ast.SyntaxKind[owningObject!.declaration.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.Port]);
        expect((owningObject?.declaration as ast.VariableDefinition).name.text).toBe("i");
    });

    test("compound name in incomplete on trigger", async () => {
        const program = await Program.Init();
        const typeChecker = new TypeChecker(program);

        const { leafAtPosition, cursorPos } = await findLeafAtCursor(
            program,
            `
            component C {
                requires I i;
                behavior {
                    on i.foo(): i.<cursor>;
                }
            }`
        );
        expect(leafAtPosition).toBeDefined();
        expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.ERROR]);

        const { owningObject } = findNameAtLocationInErrorNode(
            leafAtPosition as ast.Error,
            cursorPos.line,
            cursorPos.column,
            typeChecker
        );
        // The object owning the name abc is the port i
        expect(ast.SyntaxKind[owningObject!.declaration.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.Port]);
        expect((owningObject?.declaration as ast.VariableDefinition).name.text).toBe("i");
    });

    test("compound name in incomplete else if condition", async () => {
        const program = await Program.Init();
        const typeChecker = new TypeChecker(program);

        const { leafAtPosition, cursorPos } = await findLeafAtCursor(
            program,
            `
            component C {
                requires I i;
                behavior {
                    MyEnum m = MyEnum.foo;
                    on bla(): {
                        if (a) {}
                        else if (m.<cursor>
                        else if (b) {}
                    }
                }
            }`
        );
        expect(leafAtPosition).toBeDefined();
        expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.ERROR]);

        const { owningObject } = findNameAtLocationInErrorNode(
            leafAtPosition as ast.Error,
            cursorPos.line,
            cursorPos.column,
            typeChecker
        );
        // The object owning the name abc is the port i
        expect(ast.SyntaxKind[owningObject!.declaration.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.VariableDefinition]);
        expect((owningObject?.declaration as ast.VariableDefinition).name.text).toBe("m");
    });

    test("incomplete binding expression in system", async () => {
        const program = await Program.Init();
        const typeChecker = new TypeChecker(program);

        const { leafAtPosition, cursorPos } = await findLeafAtCursor(
            program,
            `
            component S {
                system {
                    C1 c1;
                    C2 c2;

                    c1.port <=> c2.<cursor>;
                }
            }`
        );
        expect(leafAtPosition).toBeDefined();
        expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.ERROR]);

        const { owningObject } = findNameAtLocationInErrorNode(
            leafAtPosition as ast.Error,
            cursorPos.line,
            cursorPos.column,
            typeChecker
        );

        // The object owning the name abc is the port i
        expect(ast.SyntaxKind[owningObject!.declaration.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.Instance]);
        expect((owningObject?.declaration as ast.Instance).name.text).toBe("c2");
    });

    test("incomplete on trigger", async () => {
        const program = await Program.Init();
        const typeChecker = new TypeChecker(program);

        const { leafAtPosition, cursorPos } = await findLeafAtCursor(
            program,
            `
            interface I {
                in void abc();
            }
            component S {
                provides I port;
                behavior {
                    on port.<cursor>:
                    {
                    }
                }
            }`
        );
        expect(leafAtPosition).toBeDefined();
        expect(ast.SyntaxKind[leafAtPosition!.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.ERROR]);

        const { owningObject } = findNameAtLocationInErrorNode(
            leafAtPosition as ast.Error,
            cursorPos.line,
            cursorPos.column,
            typeChecker
        );

        // The object owning the name abc is the port i
        expect(ast.SyntaxKind[owningObject!.declaration.kind]).toBe(ast.SyntaxKind[ast.SyntaxKind.Port]);
        expect((owningObject?.declaration as ast.Port).name.text).toBe("port");
    });
});

async function findNameAtCursor(program: Program, text: string): Promise<ast.AnyAstNode | undefined> {
    const { line, column } = findCursor(text);
    text = text.replace("<cursor>", "");

    const sourceFile = program.parseFile("test.dzn", text)!;
    expect(sourceFile).toBeDefined();

    return findNameAtPosition(sourceFile, line, column, program);
}

async function findLeafAtCursor(
    program: Program,
    text: string
): Promise<{ leafAtPosition?: ast.AnyAstNode; cursorPos: { line: number; column: number } }> {
    const { line, column } = findCursor(text);
    text = text.replace("<cursor>", "");

    const sourceFile = program.parseFile("test.dzn", text)!;
    expect(sourceFile).toBeDefined();

    return { leafAtPosition: findLeafAtPosition(sourceFile, line, column, program), cursorPos: { line, column } };
}

function findCursor(text: string): { line: number; column: number } {
    const index = text.indexOf("<cursor>");
    expect(index).toBeGreaterThanOrEqual(0);

    let line = 0;
    let column = 0;

    for (let i = 0; i < index; i++) {
        if (text[i] === "\n") {
            line++;
            column = 0;
        } else {
            column++;
        }
    }
    return { line, column };
}
