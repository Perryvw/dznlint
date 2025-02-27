import { expectedParameterDirection } from "../src/rules/parameter-direction";
import { testdznlint } from "./util";

test("missing parameter direction in behavior function", () => {
    testdznlint({
        diagnostic: expectedParameterDirection.code,
        pass: `
        component A {
            behavior {
                void myFunction(in ExternType t, out ExternType u, inout ExternType v) {}
            }
        }`,
        fail: `
        component A {
            behavior {
                void myFunction(ExternType t) {}
            }
        }`,
    });
});

test("missing parameter direction in event", () => {
    testdznlint({
        diagnostic: expectedParameterDirection.code,
        pass: `
        interface I {
            in void Bla(in ExternType t, out ExternType u, inout ExternType v);
        }`,
        fail: `
        interface I {
            in void Bla(ExternType t);
        }`,
    });
});
