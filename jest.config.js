/** @type {import('jest').Config} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                isolatedModules: true,
                tsconfig: "<rootDir>/test/tsconfig.json",
                diagnostics: {
                    ignoreCodes: ["TS151001"],
                    warnOnly: false,
                },
            },
        ],
    },
};
