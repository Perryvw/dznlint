[![CI](https://github.com/Perryvw/dznlint/actions/workflows/ci.yml/badge.svg)](https://github.com/Perryvw/dznlint/actions/workflows/ci.yml)

# dznlint

A linter helping you write correct and consistent [Dezyne](https://dezyne.org/) code.

Requires Node.js to run.

## Installation

```bash
$ npm install -D dznlint
```

## Usage

```bash
npx dznlint <options> [...files]
```

For help on the different options, see:

```bash
npx dznlint --help
```

## Configuration

By default, `dznlint` will look for the file `dznlint.config.json` in its working directory. You can also specify which config file to use by providing the `--config-file` CLI argument. This json file should contain a subset of [the available configuration values](./src/config/dznlint-configuration.ts).

For example:

```json
{
    "implicit_illegal": "never", // Never allow implicit illegals
    "naming_convention": {
        "component": "[A-Z][a-zA-Z0-9]*", // Set naming convention for component
        "interface": "I[A-Z][a-zA-Z0-9]*" // Set naming convention for interface
    },
    "no_shadowing": "warning" // Set shadowing rule violations to 'warning' severity
}
```
