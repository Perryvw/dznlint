import { nameDoesNotMatchConvention } from "../src/rules/naming-convention";
import { testdznlint } from "./util";

test("component naming convention", () => {
    testdznlint({
        diagnostic: nameDoesNotMatchConvention.code,
        pass: `component MyComponent {}`,
        fail: `component my_component {}`,
    });
});

test("interface naming convention", () => {
    testdznlint({
        diagnostic: nameDoesNotMatchConvention.code,
        pass: `interface IMyInterface {}`,
        fail: `interface MyInterface {}`,
    });
});
