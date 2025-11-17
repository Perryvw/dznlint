import { outParamInOutEvent } from "../src/rules/no-out-params-in-out-events";
import { testdznlint } from "./util";

test("not allowed to have out params in out events", async () => {
    await testdznlint({
        diagnostic: outParamInOutEvent.code,
        pass: `
            extern MyExternType $$;
            interface I {
                out void ev(in MyExternType a);
            }`,
        fail: `
            extern MyExternType $$;
            interface I {
                out void ev(out MyExternType a);
            }`,
    });
});
