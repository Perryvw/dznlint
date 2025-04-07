import { nameDoesNotMatchConvention } from "../src/rules/naming-convention";
import { testdznlint } from "./util";

test("component naming convention", async () => {
    await testdznlint({
        diagnostic: nameDoesNotMatchConvention.code,
        pass: `component MyComponent {}`,
        fail: `component my_component {}`,
    });
});

test("interface naming convention", async () => {
    await testdznlint({
        diagnostic: nameDoesNotMatchConvention.code,
        pass: `interface IMyInterface {}`,
        fail: `interface MyInterface {}`,
    });
});

test("can deal with trailing comma in enum", async () => {
    await testdznlint({
        diagnostic: nameDoesNotMatchConvention.code,
        pass: `enum MyEnum {
            EnumValue1,
            EnumValue2,
        };`,
    });
});
