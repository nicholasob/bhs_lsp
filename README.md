# Big Huge Script - Language server

A language server that provides support for the development of Big Huge Scripts, i.e a file with a .bhs extension. Big Huge Script is used in the real-time strategy video game Rise of Nations (RoN) as a tool to add extra functionalities when creating custom scenarios. The game provides an internal scripting editor that in my experience has a lot of issues and this extension provides an option to develop these scripts in Visual Studio Code.

## Functionality

This Language Server works for Big Huge Script files (.bhs). It has the following language features:
- Auto-Completion for internal RoN functions with a rather brief description of its functionality. All the relevant data has been automatically extracted from the scripting documentation (see section General). It might be necessary to retrigger the suggestion widget by pressing CTRL + SPACE.
- Auto-Completion for custom functions, labels, and variables declared by the user. The language server has the current position in respect when fetching suggestion variables, i.e variables that are out of scope and not accessible within the current block will not be included. 
- Diagnostics with warnings and errors for already declared variables, custom functions, or if there is an uneven match of brackets.

Important: Keep in mind that by default the fetching of variables and diagnostics will occur on every file change. There is an option in the settings to change this to only occur when a file save is done, which is necessary as the file sizes expand or if the computation is performance-critical because of hardware or other factors. 

## General

A template is available by inputting ´!template´ into the editor. The template provides a lot of labels that are relevant to some of the internal RoN functions. I refer to the documentation if unsure about any of the parameters (down below).

[Documentation](files/scenario_editor_docs.zip)

## LICENSE
This extension is licensed under the [MIT License](LICENSE.md)