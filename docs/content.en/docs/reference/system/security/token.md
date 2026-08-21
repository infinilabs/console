---
weight: 36
title: Token
---

# Token Management

## Introduction

The token created on this page is a **managed API token** for accessing protected INFINI Console HTTP APIs. It is intended for scripts, automation jobs, and external system integrations.

After creation, the full token value is shown only once, so copy and store it securely right away.

> This token is different from the user session token issued after web login. Session tokens are for Console login state, while this managed token is for long-running third-party or automation API calls.

## How to use

Include the following header when calling Console APIs:

```bash
X-API-TOKEN: <YOUR_TOKEN>
```

Example:

```bash
curl -X GET "http://localhost:9000/account/profile" \
  -H "X-API-TOKEN: <YOUR_TOKEN>"
```

If the request succeeds, Console returns the account profile for the user associated with the token.

## Common use cases

- Calling protected Console APIs from scripts
- Accessing Console APIs in CI/CD or operations jobs
- Integrating external systems with Console over HTTP

## Permission model

A token is bound to the user who created it and uses that user's permissions. The APIs it can access depend on the creator's platform and data privileges.

## Expiration and revocation

- You can configure the expiration time when creating the token
- Tokens can expire at a specific time or be set to **never expire**
- If no expiration is specified in the create request, the default is **1 year**
- Deleting a token revokes it immediately

## Notes

- The full token value is displayed only once after creation
- Do not commit tokens into source control or expose them in logs, screenshots, or chats
- Use tokens only where needed and rotate them regularly
