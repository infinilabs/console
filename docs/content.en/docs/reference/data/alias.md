---
weight: 2
title: Alias Management
asciinema: true
---

# Alias Management

## Alias list

The alias list includes addition, deletion, modification, and search operations for aliases.

{{% load-img "/img/screenshot/data/alias-list.jpg" "Alias management" %}}

## New alias

{{% load-img "/img/screenshot/data/alias-create.jpg" "Alias management" %}}

- Alias: Input an alias name
- Index: Select the target index corresponding to the alias, and use (\*) to bind multiple indexes.
- Is Write Index: specify whether the selected index is writable. If the alias only binds one index, the index is writable by default; if multiple indexes are bound by (\*), it is most necessary to specify one of the indexes as writable .

## Alias and index relationship list

Clicking the `+` button at the beginning of the alias list row will expand and display the index list bound to the alias, and at the same time, you can set and delete the relational binding update of the index.

{{% load-img "/img/screenshot/data/alias-sub-list.jpg" "Alias management" %}}
