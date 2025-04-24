---
weight: 35
title: Role
asciinema: true
---

# Role Management

## Introduction

Role Management includes CURD operations for role. And INFINI Console has a builtin role named
`Administrator`, it has all privileges , includes Platform and Data. The data role can help us control privileges of elasticsearch,
includes elasticsearch api privileges which can be configured in the file config/permission.json of your setup path.

## Create Platform Role

{{% load-img "/img/screenshot/v1.29/settings/security-role-platform-create.png" "" %}}

- Input role name, role name should be unique.
- Select feature privileges, can not be empty.
- Input a description if needed

`All` privilege represents both read and write permission, `Read`
privilege represents only read permission, and `None` privilege represents
no permission

## Create Data Role

{{% load-img "/img/screenshot/v1.29/settings/security-role-data-create.png" "" %}}

- Input role name, role name should be unique.
- Select one or more cluster, `*` represents all clusters.
- Config cluster api privileges, `*` represents all privileges.
- Config index api privileges, `*` represents all privileges.
- Input a description if needed

## Search Role

{{% load-img "/img/screenshot/v1.29/settings/security-role.png" "" %}}

Input a keyword and click the search button to query roles.

## Update Platform Role

{{% load-img "/img/screenshot/v1.29/settings/security-role-platform-edit.png" "" %}}

Modify the role as needed, and then click the Save button to submit.

## Update Data Role

{{% load-img "/img/screenshot/v1.29/settings/security-role-data-edit.png" "" %}}

Modify the role as needed, and then click the Save button to submit.
