---
weight: 1
title: Setup wizard
bookCollapseSection: false
---

# Setup wizard

## Introduction

After the initial install, it will enter the initialization guide page where you need to initialize some configurations, such as system cluster and default user。

## Configuration

Connecting to system cluster (elasticsearch required version 5.3 or above).

{{% load-img "/img/screenshot/initialization/configuration.png" %}}

- TLS

  Default is http，enable is https。

- Auth

  Authentication is not required to default, it is required to enable。

  {{% load-img "/img/screenshot/initialization/configuration-auth.png" %}}

- Test Connection

  Test the connection configuration and proceed to the next step after success.

  {{% load-img "/img/screenshot/initialization/configuration-test.png" %}}

## Setup wizard

When entering the initialization step, it will verify whether there is old data in the cluster, and then enter the initialization configuration after relevant operations.

### Verification

- Old data exists

  {{% load-img "/img/screenshot/initialization/initialization-history.png" %}}

  You can use the script prompted to delete the old data, click Refresh, and enter the initialization. You can also skip this step and reuse the existing data.

- No old data exists

  It will enter the initialization.

### Configuration

- Use old data

  Just configure the credential key

  {{% load-img "/img/screenshot/initialization/initialization-create-old.png" %}}

- Don't use old data

  Configure the username and password of the default user and the credential key.

  {{% load-img "/img/screenshot/initialization/initialization-create.png" %}}

## Finish

After initialization, the configured information will be displayed, please download the configuration and keep it properly.

{{% load-img "/img/screenshot/initialization/finish.png" %}}
