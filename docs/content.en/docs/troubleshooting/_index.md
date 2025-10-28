---
title: "FAQs"
weight: 50
---

# FAQs and Troubleshooting

FAQs about INFINI Console and handling methods are provided here. You are welcome to submit your problems [here](https://github.com/infinilabs/console/issues/new).

## Common Faults

### Nginx is added in front of Elasticsearch, and the console prompts a 400 error

Similar error logs are as follows:

```
[11-25 18:26:58] [TRC] [v0.go:390] search response: {"query":{"match":{"status": "RUNNING"}}},<!DOCTYPE html>
  <title>Error 400 (Bad Request)!!1</title>
  <p><b>400.</b> <ins>That’s an error.</ins>
  <p>Your client has issued a malformed or illegal request.  <ins>That’s all we know.</ins>
[11-25 18:26:58] [ERR] [init.go:87] json: invalid character '<' looking for beginning of value: <!DOCTYPE html>
<html lang=en>
```

#### Fault Description

Nginx does not support passing request body for GET request type

#### Solution

Recommended to upgrade to the latest version.

### Monitoring data is not displayed after the cluster is registered

as shown below:
{{% load-img "/img/troubleshooting/monitor_no_data.png" "Cluster monitoring does not show data" %}}

#### Fault Description

INFINI Console needs to use some features of Elasticsearch 7.0 and above

#### Solution

Upgrade the Elasticsearch cluster version of the INFINI Console storage data to v7.0+

### Startup Error

```
[03-23 08:38:20] [ERR] [metadata.go:529] {"error":{"root_cause":[{"type":"illegal_argument_exception","reason":"Can't merge a non object mapping [payload.node_state.settings.http.type] with an object mapping [payload.node_state.settings.http.type]"}],"type":"illegal_argument_exception","reason":"Can't merge a non object mapping [payload.node_state.settings.http.type] with an object mapping [payload.node_state.settings.http.type]"},"status":400}
```

or

```
[04-16 09:45:06] [ERR] [schema.go:144] error on update mapping: {"root_cause":[{"type":"mapper_parsing_exception","reason":"Failed to parse mapping [_doc]: analyzer [suggest_text_search] has not been configured in mappings"}],"type":"mapper_parsing_exception","reason":"Failed to parse mapping [_doc]: analyzer [suggest_text_search] has not been configured in mappings","caused_by":{"type":"illegal_argument_exception","reason":"analyzer [suggest_text_search] has not been configured in mappings"}}
```

#### Fault Description

Version v0.3 modified the Template and Mapping, if the index already exists and the Mapping is not of the expected object type, then the error will be show up.

For upgrade, please refer to the [upgrade instructions](../upgrade/).

#### Solution

- stop console
- delete template `.infini`

```
DELETE _template/.infini
```

- delete index `.infini_node` and `.infini_index`

```
DELETE .infini_node
DELETE .infini_index
```

- start console

#### Problem Description

When an older version of INFINI Console (<=1.29.8) connects to a newer, incompatible version of INFINI Easysearch (>=1.5.0), an error occurs during the initialization process.

The following `index_not_found_exception` error is reported:
```json
PUT /.easysearch-ilm-config/_settings {"error":{"root_cause":[{"type":"index_not_found_exception","reason":"no such index [.easysearch-ilm-config]","resource.type":"index_or_alias","resource.id":".easysearch-ilm-config","index_uuid":"_na_","index":".easysearch-ilm-config"}],"type":"index_not_found_exception","reason":"no such index [.easysearch-ilm-config]","resource.type":"index_or_alias","resource.id":".easysearch-ilm-config","index_uuid":"_na_","index":".easysearch-ilm-config"},"status":404}
```

As shown in the image below:
{{% load-img "/img/troubleshooting/ilm-error.png" "Error during initialization" %}}

#### Solution

This issue is caused by a version incompatibility. To resolve it, you need to align the versions of INFINI Console and INFINI Easysearch.

First, stop the INFINI Console service. Then, choose **one** of the following two options:

*   **Option 1: Downgrade INFINI Easysearch**
    *   Downgrade your INFINI Easysearch instance to a compatible version, such as **1.4.2 or older**.

*   **Option 2: Upgrade INFINI Console**
    *   Upgrade your INFINI Console instance to a compatible version, such as **1.29.9 or newer**.