---
weight: 1
title: "Credential Management"
---

# Credential Management

## Introduction

Credential information is stored using encryption. Credential management can help us centralize management of authentication information, which can be directly referenced where needed, improving the storage security of authentication information.

> The encryption key for credential-sensitive information is automatically generated or user-defined during INFINI Console installation initialization. The key needs to be kept safe. If the key is lost, the previously saved credential information cannot be decrypted after the INFINI Console is upgraded and the system is reinitialized.

## Credential List

Created credential information can be queried in the credential list, and keyword search is supported
{{% load-img "/img/screenshot/credential/20230222-list.jpg" "credential list" %}}

## Add Credential

Click the "Add" button in the upper right corner of the credential list, and then the add credential window will pop up on the right as follows:

{{% load-img "/img/screenshot/credential/20230222-create.jpg" "add credential" %}}

- Select the credential type (only basic auth is supported)
- Enter a credential name (required)
- Enter username and password (required)
- Set credential tags (Optional)
- Click the Add button to finish

## Update Credential

Click the Edit button in the credential list table, and the update credential window will pop up on the right as follows:

{{% load-img "/img/screenshot/credential/20230222-edit.jpg" "edit credential" %}}

Modify the configuration as needed, then click the Save button to submit

## Delete Credential

Click the delete button in the credential list table for a second confirmation, and execute the delete operation after confirming the deletion (if the system detects that the credential has been quoted, it cannot be deleted).
