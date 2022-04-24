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
    "implicit_illegal": "warning", // Do not allow explicit illegals
    "naming_convention": {
        "component": "[A-Z][a-zA-Z0-9]*", // Set naming convention for component
        "interface": "I[A-Z][a-zA-Z0-9]*" // Set naming convention for interface
    },
    "no_shadowing": "warning" // Set shadowing rule violations to 'warning' severity
}
```

# Available rules:

Default values are indicated in bold.

## dead_code

No code allowed after return statements in functions.

**Possible values:** "hint" | "warning" | **"error"**

---

## implicit_illegal

Do not mark events explicitly illegal. As of Dezyne 2.14, events not mentioned are implicitly assumed to be illegal.

**Possible values:** "hint" | **"warning"** | "error"

---

## inline_temporary_variables

Temporary variables that are only referred to once should be inlined.

**Possible values:** **"hint"** | "warning" | "error"

---

## naming_convention

Naming convention for various different variables.

**Default value:**

```json
{
    "component": "[A-Z][a-zA-Z0-9]*",
    "enum": "[A-Z][a-zA-Z0-9]*",
    "enum_member": "[A-Z][a-zA-Z0-9]*",
    "interface": "I[A-Z][a-zA-Z0-9]*",
    "local": "[a-z_][a-zA-Z0-9]*",
    "type": "[A-Z][a-zA-Z0-9]*"
}
```

---

## never_legal_event

If an `in` event in an interface is always illegal it is not useful, and often indicates the programmer forgot something.

**Possible values:** "hint" | **"warning"** | "error"

---

## no_bool_out_parameters

Out parameters of type `bool` are not allowed by Dezyne and will lead to a well-formedness error.

**Possible values:** "hint" | "warning" | **"error"**

---

## no_duplicate_parameters

Parameters should have distinct names.

**Possible values:** "hint" | "warning" | **"error"**

---

## no_duplicate_port_binding

Ports cannot be bound more than once.

**Possible values:** "hint" | "warning" | **"error"**

---

## no_recursive_system

Systems cannot contain instances of themself.

**Possible values:** "hint" | "warning" | **"error"**

---

## no_shadowing

Parameters and variables should not shadow (re-define) variables that already exist in scope.

**Possible values:** "hint" | "warning" | **"error"**

---

## no_unknown_port_binding

Bindings cannot bind to unknown ports.

**Possible values:** "hint" | "warning" | **"error"**

---

## no_unused_instances

Defined instances should be used in at least one binding.

**Possible values:** "hint" | **"warning"** | "error"

---

## no_unused_parameters

Parameters should be referenced at least once, or escaped by prefixing (or replacing with) `_`.

**Possible values:** "hint" | **"warning"**| "error"

---

## no_unused_ports

System ports should be used in at least one binding.

**Possible values:** "hint" | **"warning"** | "error"

---

## no_unused_variables

Defined variables should be referenced at least once.

**Possible values:** "hint" | **"warning"** | "error"

---

## parameter_direction

Parameter direction (in/out/inout) should always be specified.

**Possible values:** "hint" | **"warning"** | "error"
