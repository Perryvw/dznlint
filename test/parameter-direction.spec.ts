import { expectedParameterDirection } from "../src/rules/parameter-direction";
import { testdznlint } from "./util";

test("component naming convention", () => {
    testdznlint({
        diagnostic: expectedParameterDirection.code,
        pass: `component A { behavior {
            function myFunction(in data foo, out otherdata bar) {}
        } }`,
        fail: `component A { behavior {
            function myFunction(data foo, otherdata bar) {}
        } }`,
    });
});

test("component naming error", () => {
    testdznlint({
        diagnostic: expectedParameterDirection.code,
        pass: `component A { behavior {
            function myFunction(in data foo, out otherdata bar) {}
        } }`,
        fail: `component A { behavior {
            function myFunction(data foo, otherdata bar) {}
        } }`,
    });
});
