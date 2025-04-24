---
weight: 3
title: Data View
asciinema: true
---

# Data View

## View list

Creating and managing data views can help you better get data from Elasticsearch.

{{% load-img "/img/screenshot/v1.29/datamanage/view.png" "" %}}

## Create data view

### Step 1 Define the data view

{{% load-img "/img/screenshot/v1.29/datamanage/view-create.png" "" %}}

- Input a view name
- Matching rules: Match the corresponding index, you can also use (\*) to match multiple indexes.

### Step 2 Configuration

{{% load-img "/img/screenshot/v1.29/datamanage/view-create-configuration.png" "" %}}

- Select time field as time filter for view index

- Created

## Edit data view

{{% load-img "/img/screenshot/v1.29/datamanage/view-edit.png" "" %}}

The page lists all fields that match the index, and you can set the Format, Popularity, etc. of the fields.
