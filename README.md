# Big Huge Script Language Server

A language server that provides support for the development of Big Huge Scripts, i.e a file with a .bhs extension. Big Huge Script is used in the real-time strategy video game Rise of Nations (RoN) as a tool to add extra functionalities when creating custom scenarios. The game provides an internal scripting editor that in my experience has a lot of issues and this extension provides an option to develop these scripts in Visual Studio Code.


## Functionality
This Language Server works for Big Huge Script files (.bhs). It has the following language features:
- Completion and signature help for built-in and user-defined functions.
- Position-aware completion for variables, parameters, labels, triggers, structs,
  fields, and arrays.
- Hover information for symbols and resolved overloads.
- Syntax and semantic diagnostics aligned with the game compiler.
- Symbol import and diagnostics for `include` files.
- Snippets for common script declarations and control-flow constructs.

Diagnostics are enabled by default and scheduled 200 ms after the latest edit.
Set `bhs.validationMethod` to `false` to disable automatic diagnostics.

## General

A template is available by typing `!template`. It includes common labels used by
built-in functions.

[Documentation](files/scenario_editor_docs.zip)

Note: Many functions are missing from the documentation. For instance, `close_file` and `unit_ignore_orders` are both listed in the "Insert Trigger Function..." menu and compile successfully, but are not documented.

## Development

The validation pipeline is intentionally separated by responsibility:

- `server/src/core/ast`: lexer, parser, and AST definitions.
- `server/src/core/semantic`: declaration collection, expression analysis,
  overload resolution, and statement validation.
- `server/src/core/validator`: document snapshots and validation orchestration.
- `server/src/services`: completion, hover, signature help, and markup.
- `server/src/core/includeResolver.ts`: include discovery and parsed-file caches.
- `syntaxes` and `snippets`: TextMate coloring and editor snippets.

Semantic analysis is run-local. A document version produces one cached analysis
snapshot that is shared by diagnostics and editor features. Declarations are
indexed first for tooling, while semantic availability is still applied in
source order to match the game compiler.

Useful commands:

```text
npm run compile
npm run lint
```

## License
This extension is licensed under the [MIT License](LICENSE.md)
