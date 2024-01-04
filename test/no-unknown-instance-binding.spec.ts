import { unknownVariable } from "../src/rules/no-unknown-variables";
import { testdznlint } from "./util";

test("no unknown instance bindings left", () => {
    testdznlint({
        diagnostic: unknownVariable.code,
        pass: `component A {

            provides Type myport;

            system {
                Instance myInstance;
                myInstance.port <=> myport;
                myport <=> myInstance.port;
            }
        }`,
        fail: `component A {

            provides Type myport;

            system {
                myInstance.port <=> myport;
            }
        }`,
    });
});

test("no unknown instance bindings right", () => {
    testdznlint({
        diagnostic: unknownVariable.code,
        pass: `component A {

            provides Type myport;

            system {
                Instance myInstance;
                myport <=> myInstance.port;
            }
        }`,
        fail: `component A {

            provides Type myport;

            system {
                myport <=> myInstance.port;
            }
        }`,
    });
});
