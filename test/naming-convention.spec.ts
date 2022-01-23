import { nameDoesNotMatchConvention } from "../src/rules/naming-convention";
import { testdznlint } from "./util";

test("test2", () => {
    testdznlint({
        diagnostic: nameDoesNotMatchConvention.code,
        pass: `abc`,
        fail: `def`,
    });
});