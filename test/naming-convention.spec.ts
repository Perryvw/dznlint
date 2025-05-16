import { nameDoesNotMatchConvention } from "../src/rules/naming-convention";
import { testdznlint } from "./util";

const NAMING_CONVENTIONS = {
    component: "[A-Z][a-zA-Z0-9]*",
    enum: "[A-Z][a-zA-Z0-9]*",
    enum_member: "[A-Z][a-zA-Z0-9]*",
    interface: "I[A-Z][a-zA-Z0-9]*",
    local: "[a-z_][a-zA-Z0-9]*",
    type: "[A-Z][a-zA-Z0-9]*",
};

test("component naming convention", async () => {
    await testdznlint({
        diagnostic: nameDoesNotMatchConvention.code,
        config: { naming_convention: ["hint", NAMING_CONVENTIONS] },
        pass: `component MyComponent {}`,
        fail: `component my_component {}`,
    });
});

test("interface naming convention", async () => {
    await testdznlint({
        diagnostic: nameDoesNotMatchConvention.code,
        config: { naming_convention: ["hint", NAMING_CONVENTIONS] },
        pass: `interface IMyInterface {}`,
        fail: `interface MyInterface {}`,
    });
});

test("can deal with trailing comma in enum", async () => {
    await testdznlint({
        diagnostic: nameDoesNotMatchConvention.code,
        config: { naming_convention: ["hint", NAMING_CONVENTIONS] },
        pass: `enum MyEnum {
            EnumValue1,
            EnumValue2,
        };`,
    });
});
