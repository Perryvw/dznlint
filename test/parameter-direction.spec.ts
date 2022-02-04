import { expectedParameterDirection } from "../src/rules/parameter-direction";
import { testdznlint } from "./util";

test("component naming convention", () => {
    testdznlint({
        diagnostic: expectedParameterDirection.code,
        pass: `component A { behavior {
            void myFunction(in data foo, out otherdata bar) {}
        } }`,
        fail: `component A { behavior {
            void myFunction(data foo, otherdata bar) {}
        } }`,
    });
});

test("component naming error", () => {
    testdznlint({
        diagnostic: expectedParameterDirection.code,
        pass: `component A { behavior {
            void myFunction(in data foo, out otherdata bar) {}
        } }`,
        fail: `component A { behavior {
            void myFunction(data foo, otherdata bar) {}
        } }`,
    });
});
