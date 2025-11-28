import { typeMismatch } from "../src/rules/type-check";
import { testdznlint } from "./util";

test("variable definition", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        pass: `
            enum Enum1 {A,B};

            component C {
                behavior {
                    Enum1 a = Enum1.A;
                    Enum1 b = a;
                }
            }`,
        fail: `
            enum Enum1 {A,B};
            enum Enum2 {C,D};

            component C {
                behavior {
                    Enum1 a = Enum1.A;
                    Enum2 b = a;
                }
            }`,
    });
});

test("variable definition with function return", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        fail: `
            enum Enum1 {A,B};
            enum Enum2 {C,D};

            component C {
                behavior {
                    Enum1 a = foo();

                    Enum2 foo() { return Enum2.D; }
                }
            }`,
    });
});

test("not allowed to assign enum to bool", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        fail: `
            enum Enum1 {A,B};

            component C {
                behavior {
                    bool a = Enum1.B;
                }
            }`,
    });
});

test("variable definition with event return", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        pass: `
            interface I {
                in bool ev();
            }

            component C {
                requires I i;
                behavior {
                    void foo() {
                        bool bla = i.ev();
                    }
                }
            }`,
    });
});

test("variable definition with enum", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        pass: `
            enum MyEnum {A,B};

            component C {
                behavior {
                    MyEnum e = MyEnum.A;

                    void foo() {
                        e = MyEnum.B;
                        bool enumToBool = e.A;
                    }
                }
            }`,
    });
});

test("function return must match return type", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        fail: `
            enum Enum1 {A,B};
            enum Enum2 {C,D};

            component C {
                behavior {                    
                    Enum2 foo() { 
                        Enum1 a = Enum1.A;
                        return a;
                    }
                }
            }`,
    });
});

test("variable assignment", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        pass: `
            enum Enum1 {A,B};

            component C {
                behavior {
                    Enum1 a = Enum1.A;
                    Enum1 b;

                    void foo() {
                        b = a;
                    }
                }
            }`,
        fail: `
            enum Enum1 {A,B};
            enum Enum2 {C,D};

            component C {
                behavior {
                    Enum1 a = Enum1.A;
                    Enum2 b = Enum2.C;

                    void foo() {
                        b = a;
                    }
                }
            }`,
    });
});

test("variable assignment to extern with dollars is allowed", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        pass: `
            extern ExternType1 $$;

            component C {
                behavior {
                    ExternType1 a = $$;

                    void foo() {
                        a = $bla$;
                    }
                }
            }`,
    });
});

test("variable assignment to bool with dollars is not allowed", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        fail: `
            component C {
                behavior {
                    bool a = $123$;
                }
            }`,
    });
});

test("variable assignment to enum with dollars is not allowed", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        fail: `
            enum Enum1 {A,B};

            component C {
                behavior {
                    bool a = Enum1.A;
                }
            }`,
    });
});

test("Different externs are assignable to each other", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        pass: `
            extern Extern1 $$;
            extern Extern2 $$;

            component C {
                behavior {
                    Extern1 a = $$;
                    Extern2 b = a;
                }
            }`,
    });
});

test("function call parameters", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        pass: `
            enum Enum1 {A,B};

            component C {
                behavior {
                    void foo(Enum1 a) {}

                    void bar() {
                        Enum1 bla = Enum1.A;
                        foo(bla);
                    }
                }
            }`,
        fail: `
            enum Enum1 {A,B};
            enum Enum2 {C,D};

            component C {
                behavior {
                    void foo(Enum1 a) {}

                    void bar() {
                        Enum2 bla = Enum2.C;
                        foo(bla);
                    }
                }
            }`,
    });
});

test("function call parameters dollars are always allowed", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        pass: `
            extern ExternType1 $$;

            component C {
                behavior {
                    void foo(ExternType1 a) {}

                    void bar() {
                        foo($baz$);
                    }
                }
            }`,
    });
});

test("event call parameters", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        pass: `
            enum Enum1 {A,B};

            interface I {
                in void ev(in Enum1 p);
            }

            component C {
                requires I i;

                behavior {
                    void foo() {
                        Enum1 bla = Enum1.A;
                        i.ev(bla);
                    }
                }
            }`,
        fail: `
            enum Enum1 {A,B};
            enum Enum2 {C,D};

            interface I {
                in void ev(in Enum1 p);
            }

            component C {
                requires I i;

                behavior {
                    void foo() {
                        Enum2 bla = Enum2.C;
                        i.ev(bla);
                    }
                }
            }`,
    });
});

test("event call parameters dollars are always allowed", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        pass: `
            extern ExternType1 $$;

            interface I {
                in void ev(in ExternType1 p);
            }

            component C {
                requires I i;

                behavior {
                    void foo() {
                        i.ev($$);
                    }
                }
            }`,
    });
});

test("void return in function with non-void return type", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        fail: `
            component C {
                behavior {
                    bool foo() {
                        return;
                    }
                }
            }`,
    });
});

test("non-void return in function with void return type", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        fail: `
            component C {
                behavior {
                    void foo() {
                        return true;
                    }
                }
            }`,
    });
});

test("subint types are assignable to each other", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        pass: `
            subint Int1 {1..5};
            subint Int2 {1..2};

            component C {
                behavior {
                    void foo() {
                        Int1 i1 = 1;
                        Int2 i2 = i1; 
                    }
                }
            }`,
    });
});

test("subint is not assignable to bool", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        fail: `
            subint Int1 {1..5};

            component C {
                behavior {
                    void foo() {
                        Int1 i1 = 1;
                        bool b = i1;
                    }
                }
            }`,
    });
});

test("integer is not assignable to bool", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        fail: `
            component C {
                behavior {
                    void foo() {
                        bool b = 1;
                    }
                }
            }`,
    });
});

test("integer binary expression is not assignable to bool", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        pass: `
            subint Int1 {1..5};
            subint Int2 {1..5};

            component C {
                behavior {
                    void foo() {
                        Int1 i1 = 1;
                        Int2 i2 = i1 + 2;
                    }
                }
            }
        `,
        fail: `
            subint Int1 {1..5};

            component C {
                behavior {
                    void foo() {
                        Int1 i1 = 1;
                        bool b = i1 + 2;
                    }
                }
            }`,
    });
});

test("boolean check on enum values is assignable to bool", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        pass: `
            enum MyEnum {A,B};

            component C {
                behavior {
                    void foo() {
                        bool b = MyEnum.A == MyEnum.B;
                    }
                }
            }`,
    });
});

test("using number in boolean binary operator is not allowed", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        pass: `
            component C {
                behavior {
                    void foo() {
                        bool b = true || false;
                    }
                }
            }`,
        fail: `
            component C {
                behavior {
                    void foo() {
                        bool b = 3 || false;
                    }
                }
            }`,
    });
});

test("using enum in integer binary operator is not allowed", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        pass: `
            subint Int1 {1..5};

            component C {
                behavior {
                    void foo() {
                        Int1 i = 5 + 3;
                    }
                }
            }`,
        fail: `
            enum MyEnum {A,B};
            subint Int1 {1..5};

            component C {
                behavior {
                    void foo() {
                        Int1 i = 5 + MyEnum.B;
                    }
                }
            }`,
    });
});

test("not allowed to compare two different enums", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        pass: `
            enum MyEnum {A,B};

            component C {
                behavior {
                    void foo() {
                        bool b = MyEnum.A == MyEnum.B;
                    }
                }
            }`,
        fail: `
            enum MyEnum {A,B};
            enum MyEnum2 {C,D};

            component C {
                behavior {
                    void foo() {
                        bool b = MyEnum.A == MyEnum2.C;
                    }
                }
            }`,
    });
});

test("allowed to compare two different subints", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        pass: `
            subint Int1 {1..5};
            subint Int2 {1..8};

            component C {
                behavior {
                    void foo() {
                        Int1 i1 = 3;
                        Int2 i2 = 5;
                        bool b = i1 == i2;
                    }
                }
            }`,
    });
});

test("correct type with operator precedence taken into account", async () => {
    await testdznlint({
        diagnostic: typeMismatch.code,
        pass: `
            enum Enum1 {A,B};
            enum Enum2 {C,D};

            component C {
                behavior {
                    void foo() {
                        Enum1 a = Enum1.A;
                        Enum2 d = Enum2.D;

                        bool mybool = !a.B && a == Enum1.A || d == Enum2.D;
                    }
                }
            }`,
    });
});
