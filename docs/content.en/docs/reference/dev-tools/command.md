---
weight: 2
title: Common Commands
---

# Common Commands

## Introduction

Common commands are used to save frequently used Elasticsearch requests in Dev toolss, so that if you need to use them later,
Just use the LOAD command in the Dev tools to load, and it can be used quickly.

## Save frequently used commands

Open the Dev tools (Ctrl+shift+o) in the upper right corner of the console, and select the Elasticsearch request to be saved in the Dev tools
(Supports selecting multiple requests at one time and saving them as common commands), after selecting, click Save As Command in the toolbar to submit.

{{% load-img "/img/screenshot/v1.29/devtools/devtools-save-command.png" "" %}}

## Load common commands

In the Dev tools, input LOAD + saved command name keyword will automatically prompt related saved common commands,
After selecting the command to be loaded, press the Input key to automatically load the corresponding common command.

{{% load-img "/img/screenshot/v1.29/devtools/devtools-load.png" "" %}}

## Common command list

In the list of common commands, you can query the saved common commands

{{% load-img "/img/screenshot/v1.29/devtools/command.png" "" %}}

Click the name column of common commands in the list to view the specific information of common commands, and you can also modify the name and tag information

{{% load-img "/img/screenshot/v1.29/devtools/command-edit.png" "" %}}

## Delete common commands

Click the Delete button in the list of frequently used commands to confirm twice, and then execute the delete operation.
