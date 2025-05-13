import { trailingAssignment } from "../src/rules/trailing-assignments";
import { testdznlint } from "./util";

test("trailing assignment after out event", async () => {
    await testdznlint({
        diagnostic: trailingAssignment.code,
        config: { trailing_assignments: "warning" },
        pass: `
            interface IA {
                in void f();
                out void bla();

                behavior {
                    enum State {
                        A,
                        B
                    };
                    State s = State.A;

                    [s.A] {
                        on f: {
                            s = State.B;
                            bla;
                        }
                    }
                }
            }`,
        fail: `
            interface IA {
                in void f();
                out void bla();

                behavior {
                    enum State {
                        A,
                        B
                    };
                    State s = State.A;

                    [s.A] {
                        on f: {
                            bla;
                            s = State.B;
                        }
                    }
                }
            }`,
    });
});

test("trailing assignment after reply", async () => {
    await testdznlint({
        diagnostic: trailingAssignment.code,
        config: { trailing_assignments: "warning" },
        pass: `
            interface IA {
                in void f();
                out void bla();

                behavior {
                    enum State {
                        A,
                        B
                    };
                    State s = State.A;

                    [s.A] {
                        on f: {
                            s = State.B;
                            reply();
                        }
                    }
                }
            }`,
        fail: `
            interface IA {
                in void f();
                out void bla();

                behavior {
                    enum State {
                        A,
                        B
                    };
                    State s = State.A;

                    [s.A] {
                        on f: {
                            reply();
                            s = State.B;
                        }
                    }
                }
            }`,
    });
});

test("trailing assignment no issue on component", async () => {
    await testdznlint({
        diagnostic: trailingAssignment.code,
        config: { trailing_assignments: "warning" },
        pass: `
            component C {
                provides I i;

                behavior {
                    enum State {
                        A,
                        B
                    };
                    State s = State.A;

                    [s.A] {
                        on i.f: {
                            i.foo();
                            s = State.B;
                        }
                    }
                }
            }`,
    });
});
