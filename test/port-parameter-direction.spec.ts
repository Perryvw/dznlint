import { invalidParameterDirection, missingPortParameterDirection } from "../src/rules/port-parameter-direction";
import { testdznlint } from "./util";

test("port parameters must be marked either provides or requires", () => {
    testdznlint({
        diagnostic: missingPortParameterDirection.code,
        pass: `
        interface I {}        
        void f(provides I i){}
        void g(requires I i){}`,
        fail: `
        interface I {}        
        void f(I i){}`,
    });
});

test.each(["in", "out"])("port parameters with incorrect direction (%s)", direction => {
    testdznlint({
        diagnostic: missingPortParameterDirection.code,
        fail: `
        interface I {}        
        void f(${direction} I i){}`,
    });
});

test.each(["provides", "requires"])("non-port bool parameter should not have %s", direction => {
    testdznlint({
        diagnostic: invalidParameterDirection.code,
        fail: ` 
        void f(${direction} bool i){}`,
    });
});

test.each(["provides", "requires"])("non-port external data parameter should not have %s", direction => {
    testdznlint({
        diagnostic: invalidParameterDirection.code,
        fail: `
        extern MyData $$;
        void f(${direction} MyData i){}`,
        debug: true,
    });
});
