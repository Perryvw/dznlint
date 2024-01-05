import { unknownVariable } from "../src/rules/no-unknown-variables";
import { testdznlint } from "./util";

describe("in systems", () => {
    test("no instance of unknown type", () => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            component B {}

            component A {

                provides Type myport;

                system {
                    B myInstance;
                }
            }`,
            fail: `
            component A {

                provides Type myport;

                system {
                    B myInstance;
                }
            }`,
        });
    });

    test("no undefined instance bindings", () => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            interface I {}
            component B { requires I port; }

            component A {

                provides Type myport;

                system {
                    B myInstance;
                    myInstance.port <=> myport;
                }
            }`,
            fail: `
            component A {

                provides Type myport;

                system {
                    myInstance.port <=> myport;
                }
            }`,
        });
    });

    test("no undefined port bindings", () => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            interface I {}
            component B { requires I port; }

            component A {

                provides Type myport;

                system {
                    B myInstance;
                    myInstance.port <=> myport;
                }
            }`,
            fail: `
            component B {}

            component A {
                system {
                    B myInstance;
                    myInstance.port <=> myport;
                }
            }`,
        });
    });

    test("no undefined port on instance bindings", () => {
        testdznlint({
            diagnostic: unknownVariable.code,
            pass: `
            interface I {}
            component B { requires I port; }

            component A {

                provides I myport;

                system {
                    B myInstance;
                    myInstance.port <=> myport;
                }
            }`,
            fail: `
            component B {}

            component A {

                provides I myport;

                system {
                    B myInstance;
                    myInstance.port <=> myport;
                }
            }`,
        });
    });
});
