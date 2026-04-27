PUT $[[SETUP_INDEX_PREFIX]]alert-rule
{
  "mappings": {
    "properties": {
      "bucket_conditions": {
        "properties": {
          "items": {
            "properties": {
              "bucket_count": {
                "type": "long"
              },
              "minimum_period_match": {
                "type": "long"
              },
              "operator": {
                "type": "keyword",
                "ignore_above": 256
              },
              "priority": {
                "type": "keyword",
                "ignore_above": 256
              },
              "type": {
                "type": "keyword",
                "ignore_above": 256
              },
              "values": {
                "type": "keyword",
                "ignore_above": 256
              }
            }
          },
          "operator": {
            "type": "keyword",
            "ignore_above": 256
          }
        }
      },
      "category": {
        "type": "keyword",
        "ignore_above": 256
      },
      "conditions": {
        "properties": {
          "items": {
            "properties": {
              "minimum_period_match": {
                "type": "long"
              },
              "operator": {
                "type": "keyword",
                "ignore_above": 256
              },
              "priority": {
                "type": "keyword",
                "ignore_above": 256
              },
              "values": {
                "type": "keyword",
                "ignore_above": 256
              }
            }
          },
          "operator": {
            "type": "keyword",
            "ignore_above": 256
          }
        }
      },
      "created": {
        "type": "date"
      },
      "creator": {
        "properties": {
          "id": {
            "type": "keyword",
            "ignore_above": 256
          },
          "name": {
            "type": "keyword",
            "ignore_above": 256
          }
        }
      },
      "enabled": {
        "type": "boolean"
      },
      "id": {
        "type": "keyword",
        "ignore_above": 256
      },
      "metrics": {
        "properties": {
          "bucket_label": {
            "properties": {
              "enabled": {
                "type": "boolean"
              }
            }
          },
          "bucket_size": {
            "type": "keyword",
            "ignore_above": 256
          },
          "expression": {
            "type": "keyword",
            "ignore_above": 256
          },
          "format_type": {
            "type": "keyword",
            "ignore_above": 256
          },
          "formula": {
            "type": "keyword",
            "ignore_above": 256
          },
          "groups": {
            "properties": {
              "field": {
                "type": "keyword",
                "ignore_above": 256
              },
              "limit": {
                "type": "long"
              }
            }
          },
          "items": {
            "properties": {
              "field": {
                "type": "keyword",
                "ignore_above": 256
              },
              "name": {
                "type": "keyword",
                "ignore_above": 256
              },
              "statistic": {
                "type": "keyword",
                "ignore_above": 256
              }
            }
          }
        }
      },
      "name": {
        "type": "keyword",
        "ignore_above": 256
      },
      "notification_config": {
        "properties": {
          "accept_time_range": {
            "properties": {
              "end": {
                "type": "keyword",
                "ignore_above": 256
              },
              "start": {
                "type": "keyword",
                "ignore_above": 256
              }
            }
          },
          "enabled": {
            "type": "boolean"
          },
          "escalation_throttle_period": {
            "type": "keyword",
            "ignore_above": 256
          },
          "message": {
            "type": "keyword",
            "ignore_above": 256
          },
          "normal": {
            "properties": {
              "created": {
                "type": "date"
              },
              "enabled": {
                "type": "boolean"
              },
              "id": {
                "type": "keyword",
                "ignore_above": 256
              },
              "name": {
                "type": "keyword",
                "ignore_above": 256
              },
              "sub_type": {
                "type": "keyword",
                "ignore_above": 256
              },
              "type": {
                "type": "keyword",
                "ignore_above": 256
              },
              "updated": {
                "type": "date"
              },
              "webhook": {
                "properties": {
                  "body": {
                    "type": "keyword",
                    "ignore_above": 256
                  },
                  "header_params": {
                    "properties": {
                      "Content-Type": {
                        "type": "keyword",
                        "ignore_above": 256
                      },
                      "Content-type": {
                        "type": "keyword",
                        "ignore_above": 256
                      }
                    }
                  },
                  "method": {
                    "type": "keyword",
                    "ignore_above": 256
                  }
                }
              }
            }
          },
          "throttle_period": {
            "type": "keyword",
            "ignore_above": 256
          },
          "title": {
            "type": "keyword",
            "ignore_above": 256
          }
        }
      },
      "recovery_notification_config": {
        "properties": {
          "accept_time_range": {
            "properties": {
              "end": {
                "type": "keyword",
                "ignore_above": 256
              },
              "start": {
                "type": "keyword",
                "ignore_above": 256
              }
            }
          },
          "enabled": {
            "type": "boolean"
          },
          "event_enabled": {
            "type": "boolean"
          },
          "message": {
            "type": "keyword",
            "ignore_above": 256
          },
          "normal": {
            "properties": {
              "enabled": {
                "type": "boolean"
              },
              "id": {
                "type": "keyword",
                "ignore_above": 256
              }
            }
          },
          "title": {
            "type": "keyword",
            "ignore_above": 256
          }
        }
      },
      "resource": {
        "properties": {
          "context": {
            "type": "object"
          },
          "filter": {
            "type": "object",
            "enabled": false
          },
          "objects": {
            "type": "keyword",
            "ignore_above": 256
          },
          "raw_filter": {
            "type": "object",
            "enabled": false
          },
          "resource_id": {
            "type": "keyword",
            "ignore_above": 256
          },
          "resource_name": {
            "type": "keyword",
            "ignore_above": 256
          },
          "time_field": {
            "type": "keyword",
            "ignore_above": 256
          },
          "type": {
            "type": "keyword",
            "ignore_above": 256
          }
        }
      },
      "schedule": {
        "properties": {
          "interval": {
            "type": "keyword",
            "ignore_above": 256
          }
        }
      },
      "updated": {
        "type": "date"
      }
    }
  }
}

#alerting channel
#The `id` value is consistent with the `_id` value
POST $[[SETUP_INDEX_PREFIX]]channel/$[[SETUP_DOC_TYPE]]/cgnb2nt3q95nmusjl65g
{
    "id": "cgnb2nt3q95nmusjl65g",
    "created": "2023-04-06T11:47:43.104108279Z",
    "updated": "2023-08-09T22:39:50.494915568+08:00",
    "name": "[Alerting] Slack Notification",
    "type": "webhook",
    "webhook": {
    "header_params": {
      "Content-type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.SLACK_WEBHOOK_ENDPOINT}}",
    "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}|#{{.event_id}}> is ongoing !*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.trigger_at | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n    {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"*Cluster:* <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{ index .group_values 0}}|{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}>\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
    },
    "sub_type": "slack",
    "enabled": false
}
POST $[[SETUP_INDEX_PREFIX]]channel/$[[SETUP_DOC_TYPE]]/cj8bq8d3q95ogankugqg
{
  "id": "cj8bq8d3q95ogankugqg",
  "created": "2023-08-07T17:45:05.534408059+08:00",
  "updated": "2023-08-09T22:39:56.489567891+08:00",
  "name": "[Recovery] Slack Notification",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-Type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.SLACK_WEBHOOK_ENDPOINT}}",
    "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*ResolveAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Target:* {{.resource_name}}-{{.objects}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.trigger_at | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Duration:* {{.duration}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    },\n    {\n      \"type\": \"actions\",\n      \"elements\": [\n        {\n          \"type\": \"button\",\n          \"text\": {\n            \"type\": \"plain_text\",\n            \"text\": \"View Incident\"   \n          },\n          \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}\"\n        }\n      ]\n    }\n  ]\n}"
  },
  "sub_type": "slack",
  "enabled": false
}
POST $[[SETUP_INDEX_PREFIX]]channel/$[[SETUP_DOC_TYPE]]/cgnb2kt3q95nmusjl64g
{
  "id": "cgnb2kt3q95nmusjl64g",
  "created": "2023-04-06T11:47:31.161587662Z",
  "updated": "2023-08-09T22:39:51.540172306+08:00",
  "name": "[Alerting] Wechat Notification",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-Type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.WECOM_WEBHOOK_ENDPOINT}}",
    "body": "{\n  \"msgtype\": \"markdown\",\n  \"markdown\": {\n      \"content\": \"**[ INFINI Platform Alerting ]**\\n🔥 Incident [#{{.event_id}}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}) is ongoing\\n**{{.title}}**\\nPriority: {{.priority}}\\n\\nEventID: {{.event_id}}\\n\\nTarget: {{.resource_name}}-{{.objects}}\\n\\nTriggerAt: {{.trigger_at | datetime}}\\n{{.message}}\"\n  }\n}"
  },
  "sub_type": "wechat",
  "enabled": false
}
POST $[[SETUP_INDEX_PREFIX]]channel/$[[SETUP_DOC_TYPE]]/cgiospt3q95q49k3u00g
{
  "id": "cgiospt3q95q49k3u00g",
  "created": "2023-03-30T13:28:07.531263747Z",
  "updated": "2023-08-09T22:39:52.356059486+08:00",
  "name": "[Alerting] DingTalk Notification",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-Type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.DINGTALK_WEBHOOK_ENDPOINT}}",
    "body": "{\n  \"msgtype\": \"markdown\",\n  \"markdown\": {\n    \"title\": \"{{.title}}\",\n    \"text\": \"![INFINI Platform Alerting](https://infinilabs.cn/img/email/alert-header.png)\\n\\n🔥 Incident [{{.event_id}}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}) is ongoing\\n\\n**{{.title}}**\\n\\nPriority: {{.priority}}\\n\\nEventID: {{.event_id}}\\n\\nTarget: {{.resource_name}}-{{.objects}}\\n\\nTriggerAt: {{.trigger_at | datetime}}\\n\\n---\\n\\n{{.message}}\"\n  }\n}"
  },
  "sub_type": "dingtalk",
  "enabled": false
}
POST $[[SETUP_INDEX_PREFIX]]channel/$[[SETUP_DOC_TYPE]]/cj8ctat3q95l9ebbntlg
{
  "id": "cj8ctat3q95l9ebbntlg",
  "created": "2023-08-07T18:59:55.28732241+08:00",
  "updated": "2023-08-09T22:39:58.967970184+08:00",
  "name": "[Recovery] DingTalk Notification",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-Type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.DINGTALK_WEBHOOK_ENDPOINT}}",
    "body": "{\n  \"msgtype\": \"markdown\",\n  \"markdown\": {\n    \"title\": \"{{.title}}\",\n    \"text\": \"![INFINI Platform Alerting](https://infinilabs.cn/img/email/recovery-header.png)\\n\\n**{{.title}}**\\n\\n{{.message}}\\n\\n> [View Incident]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}})\"\n  }\n}\n"
  },
  "sub_type": "dingtalk",
  "enabled": false
}
POST $[[SETUP_INDEX_PREFIX]]channel/$[[SETUP_DOC_TYPE]]/cj8e9gt3q95gsdbb0170
{
  "id": "cj8e9gt3q95gsdbb0170",
  "created": "2023-08-07T20:34:11.998953512+08:00",
  "updated": "2023-08-09T22:40:04.665871275+08:00",
  "name": "[Recovery] Wechat Notification",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-Type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.WECOM_WEBHOOK_ENDPOINT}}",
    "body": "{\n  \"msgtype\": \"markdown\",\n  \"markdown\": {\n    \"content\": \"**[ INFINI Platform Alerting ]**\\n**{{.title}}**\\n\\n{{.message}}\\n\\n> [View Incident]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}})\"\n  }\n}\n"
  },
  "sub_type": "wechat",
  "enabled": false
}
POST $[[SETUP_INDEX_PREFIX]]channel/$[[SETUP_DOC_TYPE]]/cgnb2r53q95nmusjl6vg
{
  "id": "cgnb2r53q95nmusjl6vg",
  "created": "2023-04-06T11:47:56.652637309Z",
  "updated": "2023-08-10T12:04:08.046781556+08:00",
  "name": "[Alerting] Email Notification",
  "type": "email",
  "sub_type": "email",
  "email": {
    "server_id": "",
    "recipients": {
      "to": [],
      "cc": []
    },
    "subject": "[INFINI Platform Alerting] 🔥 {{.title}}",
    "body": "<html xmlns=\"http://www.w3.org/1999/xhtml\" xmlns:o=\"urn:schemas-microsoft-com:office:office\" xmlns:v=\"urn:schemas-microsoft-com:vml\" lang=\"en\"><head>\n      <title></title>\n      <meta property=\"og:title\" content=\"\">\n      <meta name=\"twitter:title\" content=\"\">\n  <meta name=\"x-apple-disable-message-reformatting\">\n  <meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\">\n  <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n      <!--[if gte mso 9]>\n    <xml>\n        <o:OfficeDocumentSettings>\n        <o:AllowPNG/>\n        <o:PixelsPerInch>96</o:PixelsPerInch>\n        </o:OfficeDocumentSettings>\n    </xml>\n    <style>\n      ul > li {\n        text-indent: -1em;\n      }\n    </style>\n  <![endif]-->\n  <!--[if mso]>\n  <style type=\"text/css\">\n   body, td {font-family: Arial, Helvetica, sans-serif;} \n   .hse-body-wrapper-table {background-color: #EAF0F6;padding: 20px 0 !important}\n  </style>\n  <![endif]-->\n    <meta name=\"generator\" content=\"HubSpot\">\n    <style type=\"text/css\">.moz-text-html .hse-column-container{max-width:600px !important;width:600px !important}\n  .moz-text-html .hse-column{display:table-cell;vertical-align:top}.moz-text-html .hse-section .hse-size-12{max-width:600px !important;width:600px !important}\n  [owa] .hse-column-container{max-width:600px !important;width:600px !important}[owa] .hse-column{display:table-cell;vertical-align:top}\n  [owa] .hse-section .hse-size-12{max-width:600px !important;width:600px !important}\n  @media only screen and (min-width:640px){.hse-column-container{max-width:600px !important;width:600px !important}\n  .hse-column{display:table-cell;vertical-align:top}.hse-section .hse-size-12{max-width:600px !important;width:600px !important}\n  }@media only screen and (max-width:639px){img.stretch-on-mobile,.hs_rss_email_entries_table img,.hs-stretch-cta .hs-cta-img{height:auto !important;width:100% !important}\n  .display_block_on_small_screens{display:block}.hs_padded{padding-left:20px !important;padding-right:20px !important}\n  }</style><!--<![endif]--><style type=\"text/css\">body[data-outlook-cycle] img.stretch-on-mobile,body[data-outlook-cycle] .hs_rss_email_entries_table img{height:auto !important;width:100% !important}\n  body[data-outlook-cycle] .hs_padded{padding-left:20px !important;padding-right:20px !important}\n  a[x-apple-data-detectors]{color:inherit !important;text-decoration:none !important;font-size:inherit !important;font-family:inherit !important;font-weight:inherit !important;line-height:inherit !important}\n  #outlook a{padding:0}.yshortcuts a{border-bottom:none !important}a{text-decoration:underline}\n  .ExternalClass{width:100%}.ExternalClass,.ExternalClass p,.ExternalClass td,.ExternalClass div,.ExternalClass span,.ExternalClass font{line-height:100%}\n  p{margin:0}body{-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;-webkit-font-smoothing:antialiased;moz-osx-font-smoothing:grayscale}</style>\n  </head>\n  <body bgcolor=\"#EAF0F6\"\n    style=\"margin:0 !important; padding:0 !important; font-family:Arial, sans-serif; font-size:15px; color:#23496d; word-break:break-word\">\n    <!--[if gte mso 9]>\n  <v:background xmlns:v=\"urn:schemas-microsoft-com:vml\" fill=\"t\">\n      <v:fill type=\"tile\" size=\"100%,100%\"  color=\"#ffffff\"/>\n  </v:background>\n  <![endif]-->\n    <div class=\"hse-body-background\" style=\"background-color:#eaf0f6\" bgcolor=\"#eaf0f6\">\n      <table role=\"presentation\" class=\"hse-body-wrapper-table\" cellpadding=\"0\" cellspacing=\"0\"\n        style=\"border-spacing:0 !important; border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; margin:0; padding:0; width:100% !important; min-width:200px !important; height:100% !important\"\n        width=\"100%\" height=\"100%\">\n        <tbody>\n          <tr>\n            <td class=\"hse-body-wrapper-td\" valign=\"top\"\n              style=\"border-collapse:collapse; mso-line-height-rule:exactly; font-family:Arial, sans-serif; font-size:15px; color:#23496d; word-break:break-word\">\n              <div id=\"hs_cos_wrapper_main\" class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_dnd_area\"\n                style=\"color: inherit; font-size: inherit; line-height: inherit;\" data-hs-cos-general-type=\"widget\"\n                data-hs-cos-type=\"dnd_area\">\n                <div id=\"section-1\" class=\"hse-section hse-section-first\"\n                  style=\"padding-left:10px; padding-right:10px; padding-top:20px\">\n                  <!--[if !((mso)|(IE))]><!-- -->\n                  <div class=\"hse-column-container\"\n                    style=\"min-width:200px; max-width:600px; margin-left:auto; margin-right:auto; border-collapse:collapse; border-spacing:0; background-color:#ffffff; padding-bottom:30px;\"\n                    bgcolor=\"#ffffff\">\n                    <!--<![endif]-->\n                    <!--[if (mso)|(IE)]>\n        <div class=\"hse-column-container\" style=\"min-width:200px;max-width:600px;width:100%;Margin-left:auto;Margin-right:auto;border-collapse:collapse;border-spacing:0;\">\n        <table align=\"center\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px;\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\" width=\"600\" bgcolor=\"#ffffff\">\n        <tr style=\"background-color:#ffffff;\">\n      <![endif]-->\n                    <!--[if (mso)|(IE)]>\n    <td valign=\"top\" style=\"width:600px;padding-bottom:30px;\">\n  <![endif]-->\n                    <!--[if gte mso 9]>\n    <table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px\">\n  <![endif]-->\n                    <div id=\"column-1-0\" class=\"hse-column hse-size-12\">\n                      <div id=\"hs_cos_wrapper_module_16873376536522\"\n                        class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module\"\n                        style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                        data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"module\">\n                        <table class=\"hse-image-wrapper\" role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"\n                          style=\"border-spacing:0 !important; border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt\">\n                          <tbody>\n                            <tr>\n                              <td align=\"center\" valign=\"top\"\n                                style=\"border-collapse:collapse; mso-line-height-rule:exactly; font-family:Arial, sans-serif; color:#23496d; word-break:break-word; text-align:center;  font-size:0px\">\n                                <img alt=\"email-header\" src=\"data:image/png;base64,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\"\n                                  style=\"outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; max-width:100%; font-size:16px\"\n                                  width=\"600\" align=\"middle\">\n                              </td>\n                            </tr>\n                          </tbody>\n                        </table>\n                      </div>\n                      <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\"\n                        style=\"border-spacing:0 !important; border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt\">\n                        <tbody>\n                          <tr>\n                            <td class=\"hs_padded\"\n                              style=\"border-collapse:collapse; mso-line-height-rule:exactly; font-family:Arial, sans-serif; font-size:15px; color:#23496d; word-break:break-word; padding:10px 20px\">\n                              <div id=\"hs_cos_wrapper_module-1-0-0\"\n                                class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module\"\n                                style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                                data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"module\">\n                                <div id=\"hs_cos_wrapper_module-1-0-0_\"\n                                  class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_rich_text\"\n                                  style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                                  data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"rich_text\">\n                                  <p\n                                    style=\"mso-line-height-rule:exactly; margin-top: 20px;margin-bottom: 20px;font-size: 24px;font-weight: 600;line-height: 29px;letter-spacing: -0.6px;color: #FF4D4F;\">{{.title}}\n                                  </p>\n                                  <div\n                                    style=\"mso-line-height-rule:exactly; line-height:175%; margin-bottom:20px;font-size: 14px;color: #666666;white-space: normal;font-family: PingFang SC;\">\n                                    <p>Priority: {{.priority}}</p>\n                                    <p>EventID: {{.event_id}}</p>\n                                    <p>Target: {{.resource_name}}-{{.objects}}</p>\n                                    <p style=\"margin-bottom: 20px;\">TriggerAt: {{.trigger_at | datetime}}</p>\n                                    {{.message | md_to_html}}\n                                  </div>\n                                  <p>\n                                  <div\n                                    style=\"width: 120px;height: 32px;border-radius: 5px;background-color: #1677FF;line-height: 32px;text-align: center;margin-top:0px;margin-bottom: 20px;\">\n                                    <a style=\"font-size: 14px;color: #ffffff;text-decoration: none;\" href=\"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}\"}}\"\n                                      target=\"_blank\">\n                                      View Detail\n                                    </a>\n                                  </div>\n                                  <div\n                                    style=\"width: 100%;height: 0px;opacity: 1;border: 1px solid #EEEEEE;margin-top: 20px;margin-bottom: 20px;\">\n                                  </div>\n                                  <div style=\"margin-top: 20px;margin-bottom: 20px;\">\n                                    <ul style=\"list-style:none;padding:0px; margin:0px;\">\n                                      <li\n                                        style=\"list-style:none;padding:0px; margin:0px;display:inline;color: #999999;\">\n                                        💡 <a style=\"font-size: 10px;color: #999999;text-decoration: none; \"\n                                          href=\"https://docs.infinilabs.com/console/main/zh/docs/tutorials/cluster_node_jvm_usage/\"\n                                          target=\"_blank\">How to monitor the JVM usage of cluster nodes </a></li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;color: #999999; \">\n                                        | <a style=\"font-size: 10px;color: #999999;text-decoration: none; \"\n                                          href=\"https://docs.infinilabs.com/console/main/zh/docs/tutorials/cluster_health_change/\"\n                                          target=\"_blank\">How to monitor cluster health status </a>\n                                      </li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;color: #999999; \">\n                                        | <a style=\"font-size: 10px;color: #999999;text-decoration: none; \"\n                                          href=\"https://docs.infinilabs.com/console/main/zh/docs/\"\n                                          target=\"_blank\">Learn more ... </a>\n                                      </li>\n                                    </ul>\n                                  </div>\n                                  <p />\n                                  <p\n                                    style=\"mso-line-height-rule:exactly; line-height:175%; margin-top:30px;margin-bottom:30px;position: relative;\">\n                                  <div style=\"float: left;\">\n                                    <img alt=\"INFINI Labs\" src=\"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iX+WbvuWxgl8yIiBkYXRhLW5hbWU9IuWbvuWxgiAyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMzkuNTkgNDUuMjMiPgogIDxkZWZzPgogICAgPHN0eWxlPgogICAgICAuY2xzLTEgewogICAgICAgIGZpbGw6ICMwMDVmZTg7CiAgICAgIH0KICAgIDwvc3R5bGU+CiAgPC9kZWZzPgogIDxnIGlkPSJf5Zu+5bGCXzEtMiIgZGF0YS1uYW1lPSLlm77lsYIgMSI+CiAgICA8Zz4KICAgICAgPGc+CiAgICAgICAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNMTg1Ljc1LDE4LjUydjE1LjQ4aDYuMDN2Mi4zNmgtOC45NlYxOC41MmgyLjkzWiIvPgogICAgICAgIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTE5OS45MiwyMS45OWMyLjM5LDAsNC4wMywxLjEzLDQuOSwyLjI4di0yLjA1aDIuOTV2MTQuMTRoLTIuOTV2LTIuMWMtLjksMS4yMS0yLjU5LDIuMzQtNC45NSwyLjM0LTMuNjcsMC02LjYyLTMtNi42Mi03LjM3czIuOTUtNy4yNCw2LjY3LTcuMjRabS42MiwyLjU0Yy0yLjE4LDAtNC4yOSwxLjY0LTQuMjksNC43czIuMTEsNC44Myw0LjI5LDQuODMsNC4yOS0xLjcyLDQuMjktNC43OC0yLjA4LTQuNzUtNC4yOS00Ljc1WiIvPgogICAgICAgIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTIxOS40OSwyMS45OWMzLjc1LDAsNi42NSwyLjg4LDYuNjUsNy4yNHMtMi45Myw3LjM3LTYuNjUsNy4zN2MtMi4zNCwwLTQtMS4wNS00LjkzLTIuMjh2Mi4wNWgtMi45M1YxNy4zN2gyLjkzdjYuOTZjLjkyLTEuMjgsMi43LTIuMzQsNC45My0yLjM0Wm0tLjY0LDIuNTRjLTIuMTgsMC00LjI5LDEuNzItNC4yOSw0Ljc1czIuMTEsNC43OCw0LjI5LDQuNzgsNC4zMS0xLjc3LDQuMzEtNC44My0yLjExLTQuNy00LjMxLTQuN1oiLz4KICAgICAgICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0yMzQuMTcsMzYuNmMtMy4zOSwwLTUuNzgtMi01LjktNC41N2gzLjAzYy4xLDEuMTYsMS4yMSwyLjEsMi44MiwyLjFzMi41OS0uNzIsMi41OS0xLjY5YzAtMi43Ny04LjIxLTEuMTgtOC4yMS02LjM3LDAtMi4yNiwyLjExLTQuMDgsNS40NC00LjA4czUuMzEsMS43Miw1LjQ3LDQuNTRoLTIuOTNjLS4xLTEuMjMtMS4wNS0yLjA4LTIuNjQtMi4wOHMtMi4zOSwuNjQtMi4zOSwxLjU5YzAsMi44NSw3Ljk4LDEuMjYsOC4xNCw2LjM3LDAsMi4zOS0yLjA4LDQuMTgtNS40Miw0LjE4WiIvPgogICAgICA8L2c+CiAgICAgIDxnPgogICAgICAgIDxwYXRoIGQ9Ik01MC4yNSwzNi41M2w1Ljk5LTI3Ljk3aDcuMzFsLTUuOTksMjcuOTdoLTcuMzFaIi8+CiAgICAgICAgPHBhdGggZD0iTTYyLjk0LDM2LjUzbDYuMTktMjguODhoLjdsMTUuNTgsMTYuMzIsMy4zLTE1LjQxaDYuNzRsLTYuMjIsMjkuMDNoLS42M2wtMTUuNjQtMTYuMzItMy4yNywxNS4yNmgtNi43NFoiLz4KICAgICAgICA8cGF0aCBkPSJNOTUuMzgsMzYuNTNsNS45OS0yNy45N2gxOS4wNGwtMS4yMiw1LjY5aC0xMS43N2wtMS4xOSw1LjU4aDEwLjUybC0xLjIxLDUuNjVoLTEwLjUybC0yLjM3LDExLjA1aC03LjI3WiIvPgogICAgICAgIDxwYXRoIGQ9Ik0xMTkuMzUsMzYuNTNsNS45OS0yNy45N2g3LjMxbC01Ljk5LDI3Ljk3aC03LjMxWiIvPgogICAgICAgIDxwYXRoIGQ9Ik0xMzEuNzcsMzYuNTNsNi4xOS0yOC44OGguN2wxNS41OCwxNi4zMiwzLjMtMTUuNDFoNi43NGwtNi4yMiwyOS4wM2gtLjYzbC0xNC45OS0xNi4zMi0zLjMyLDE1LjI2aC03LjM1WiIvPgogICAgICAgIDxwYXRoIGQ9Ik0xNjQuMDgsMzYuNTNsNS45OS0yNy45N2g3LjMxbC01Ljk5LDI3Ljk3aC03LjMxWiIvPgogICAgICA8L2c+CiAgICAgIDxnPgogICAgICAgIDxwYXRoIGQ9Ik0yMi42Miw0NS4yM0MxMC4xNSw0NS4yMywwLDM1LjA5LDAsMjIuNjJTMTAuMTUsMCwyMi42MiwwczIyLjYyLDEwLjE1LDIyLjYyLDIyLjYyLTEwLjE1LDIyLjYyLTIyLjYyLDIyLjYyWm0wLTQyLjc4QzExLjUsMi40NSwyLjQ1LDExLjUsMi40NSwyMi42MnM5LjA1LDIwLjE3LDIwLjE3LDIwLjE3LDIwLjE3LTkuMDUsMjAuMTctMjAuMTdTMzMuNzQsMi40NSwyMi42MiwyLjQ1WiIvPgogICAgICAgIDxnPgogICAgICAgICAgPHBhdGggZD0iTTM1LjM4LDEwLjM3Yy0xLjg3LTIuMDQtNC4yMS0zLjY1LTYuODUtNC42MywwLC4wMSwwLC4wMiwwLC4wMmwtMy4xNCwxNC41NC0xMS4yMi03Ljk4LTEuNTYsNy40NiwxOC4xLDEyLjY2LDQuNjktMjIuMDciLz4KICAgICAgICAgIDxwYXRoIGQ9Ik0xOC42NiwyOC4wN2wtNi44LTQuOC0yLjQsMTEuMTNjMS44OSwyLjAxLDQuMjQsMy41Nyw2Ljg4LDQuNTNsMi4zMi0xMC44NloiLz4KICAgICAgICA8L2c+CiAgICAgIDwvZz4KICAgIDwvZz4KICA8L2c+Cjwvc3ZnPg==\"\n                                      style=\"outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; max-width:100%; \"\n                                      width=\"160\" height=\"28\" align=\"middle\">\n                                  </div>\n                                  <div style=\"float: right;\">\n                                    <ul style=\"list-style:none;padding:0px; margin:0px;\">\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;\">\n                                        <a title=\"Website\" href=\"https://infinilabs.com\" target=\"_blank\"\n                                          style=\"padding-left: 10;text-decoration:none; \">\n                                          <img alt=\"tips\" src=\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBmaWxsPSJub25lIiB2ZXJzaW9uPSIxLjEiIHdpZHRoPSIyOCIgaGVpZ2h0PSIyOCIgdmlld0JveD0iMCAwIDI4IDI4Ij48Zz48ZyBzdHlsZT0ib3BhY2l0eTowOyI+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjI4IiBoZWlnaHQ9IjI4IiByeD0iMCIgZmlsbD0iI0Q4RDhEOCIgZmlsbC1vcGFjaXR5PSIxIi8+PC9nPjxnPjxwYXRoIGQ9Ik0yNCwxNFEyNCwxNC4yNDU1LDIzLjk4OCwxNC40OTA3UTIzLjk3NTksMTQuNzM1OSwyMy45NTE4LDE0Ljk4MDJRMjMuOTI3OCwxNS4yMjQ1LDIzLjg5MTgsMTUuNDY3M1EyMy44NTU3LDE1LjcxMDEsMjMuODA3OCwxNS45NTA5UTIzLjc2LDE2LjE5MTcsMjMuNzAwMywxNi40Mjk4UTIzLjY0MDcsMTYuNjY3OSwyMy41Njk0LDE2LjkwMjhRMjMuNDk4MSwxNy4xMzc4LDIzLjQxNTQsMTcuMzY4OVEyMy4zMzI3LDE3LjYsMjMuMjM4OCwxNy44MjY4UTIzLjE0NDgsMTguMDUzNiwyMy4wMzk5LDE4LjI3NTVRMjIuOTM0OSwxOC40OTc1MDAwMDAwMDAwMDIsMjIuODE5MiwxOC43MTRRMjIuNzAzNSwxOC45MzA1MDAwMDAwMDAwMDIsMjIuNTc3MywxOS4xNDFRMjIuNDUxMSwxOS4zNTE1OTk5OTk5OTk5OTgsMjIuMzE0NywxOS41NTU3UTIyLjE3ODMsMTkuNzU5OCwyMi4wMzIxLDE5Ljk1N1EyMS44ODU4LDIwLjE1NDIsMjEuNzMwMSwyMC4zNDM5UTIxLjU3NDQsMjAuNTMzNywyMS40MDk1LDIwLjcxNTZRMjEuMjQ0NiwyMC44OTc1LDIxLjA3MTEsMjEuMDcxMVEyMC44OTc1LDIxLjI0NDYsMjAuNzE1NiwyMS40MDk1UTIwLjUzMzcsMjEuNTc0NCwyMC4zNDM5LDIxLjczMDFRMjAuMTU0MiwyMS44ODU4LDE5Ljk1NywyMi4wMzIxUTE5Ljc1OTgsMjIuMTc4MywxOS41NTU3LDIyLjMxNDdRMTkuMzUxNTk5OTk5OTk5OTk4LDIyLjQ1MTEsMTkuMTQxLDIyLjU3NzNRMTguOTMwNTAwMDAwMDAwMDAyLDIyLjcwMzUsMTguNzE0LDIyLjgxOTJRMTguNDk3NTAwMDAwMDAwMDAyLDIyLjkzNDksMTguMjc1NSwyMy4wMzk5UTE4LjA1MzYsMjMuMTQ0OCwxNy44MjY4LDIzLjIzODhRMTcuNiwyMy4zMzI3LDE3LjM2ODksMjMuNDE1NFExNy4xMzc4LDIzLjQ5ODEsMTYuOTAyOCwyMy41Njk0UTE2LjY2NzksMjMuNjQwNywxNi40Mjk4LDIzLjcwMDNRMTYuMTkxNywyMy43NiwxNS45NTA5LDIzLjgwNzhRMTUuNzEwMSwyMy44NTU3LDE1LjQ2NzMsMjMuODkxOFExNS4yMjQ1LDIzLjkyNzgsMTQuOTgwMiwyMy45NTE4UTE0LjczNTksMjMuOTc1OSwxNC40OTA3LDIzLjk4OFExNC4yNDU1LDI0LDE0LDI0UTEzLjc1NDUxLDI0LDEzLjUwOTMyLDIzLjk4OFExMy4yNjQxMywyMy45NzU5LDEzLjAxOTgzLDIzLjk1MThRMTIuNzc1NTIsMjMuOTI3OCwxMi41MzI2OSwyMy44OTE4UTEyLjI4OTg3LDIzLjg1NTcsMTIuMDQ5MSwyMy44MDc4UTExLjgwODMzLDIzLjc2LDExLjU3MDIsMjMuNzAwM1ExMS4zMzIwNywyMy42NDA3LDExLjA5NzE1LDIzLjU2OTRRMTAuODYyMjQsMjMuNDk4MSwxMC42MzExLDIzLjQxNTRRMTAuMzk5OTYsMjMuMzMyNywxMC4xNzMxNiwyMy4yMzg4UTkuOTQ2MzYsMjMuMTQ0OCw5LjcyNDQ1MDAwMDAwMDAwMSwyMy4wMzk5UTkuNTAyNTMsMjIuOTM0OSw5LjI4NjAzLDIyLjgxOTJROS4wNjk1MywyMi43MDM1LDguODU4OTcsMjIuNTc3M1E4LjY0ODQxLDIyLjQ1MTEsOC40NDQzLDIyLjMxNDdROC4yNDAxNzk5OTk5OTk5OTksMjIuMTc4Myw4LjA0MzAwOTk5OTk5OTk5OSwyMi4wMzIxUTcuODQ1ODI5OTk5OTk5OTk5LDIxLjg4NTgsNy42NTYwNywyMS43MzAxUTcuNDY2MywyMS41NzQ0LDcuMjg0NDA5OTk5OTk5OTk5LDIxLjQwOTVRNy4xMDI1MiwyMS4yNDQ2LDYuOTI4OTI5OTk5OTk5OTk5LDIxLjA3MTFRNi43NTUzNSwyMC44OTc1LDYuNTkwNDksMjAuNzE1NlE2LjQyNTYzLDIwLjUzMzcsNi4yNjk5LDIwLjM0MzlRNi4xMTQxNiwyMC4xNTQyLDUuOTY3OTE5OTk5OTk5OTk5NCwxOS45NTdRNS44MjE2OSwxOS43NTk4LDUuNjg1MywxOS41NTU3UTUuNTQ4OTIsMTkuMzUxNTk5OTk5OTk5OTk4LDUuNDIyNzEsMTkuMTQxUTUuMjk2NTEsMTguOTMwNTAwMDAwMDAwMDAyLDUuMTgwNzksMTguNzE0UTUuMDY1MDcsMTguNDk3NTAwMDAwMDAwMDAyLDQuOTYwMTA3LDE4LjI3NTVRNC44NTUxNDgsMTguMDUzNiw0Ljc2MTIwNSwxNy44MjY4UTQuNjY3MjYxLDE3LjYsNC41ODQ1NTkwMDAwMDAwMDA1LDE3LjM2ODlRNC41MDE4NTcsMTcuMTM3OCw0LjQzMDU5NywxNi45MDI4UTQuMzU5MzM2LDE2LjY2NzksNC4yOTk2ODcsMTYuNDI5OFE0LjI0MDAzOSwxNi4xOTE3LDQuMTkyMTQ3LDE1Ljk1MDlRNC4xNDQyNTUsMTUuNzEwMSw0LjEwODIzNSwxNS40NjczUTQuMDcyMjE0NiwxNS4yMjQ1LDQuMDQ4MTUyNywxNC45ODAyUTQuMDI0MDkwOSwxNC43MzU5LDQuMDEyMDQ1NCwxNC40OTA3UTQsMTQuMjQ1NSw0LDE0UTQsMTMuNzU0NTEsNC4wMTIwNDU0LDEzLjUwOTMyUTQuMDI0MDkwOSwxMy4yNjQxMyw0LjA0ODE1MjcsMTMuMDE5ODNRNC4wNzIyMTQ2LDEyLjc3NTUyLDQuMTA4MjM1LDEyLjUzMjY5UTQuMTQ0MjU1LDEyLjI4OTg3LDQuMTkyMTQ3LDEyLjA0OTFRNC4yNDAwMzksMTEuODA4MzMsNC4yOTk2ODcsMTEuNTcwMlE0LjM1OTMzNiwxMS4zMzIwNyw0LjQzMDU5NywxMS4wOTcxNVE0LjUwMTg1NywxMC44NjIyNCw0LjU4NDU1OTAwMDAwMDAwMDUsMTAuNjMxMVE0LjY2NzI2MSwxMC4zOTk5Niw0Ljc2MTIwNSwxMC4xNzMxNlE0Ljg1NTE0OCw5Ljk0NjM2LDQuOTYwMTA3LDkuNzI0NDUwMDAwMDAwMDAxUTUuMDY1MDcsOS41MDI1Myw1LjE4MDc5LDkuMjg2MDNRNS4yOTY1MSw5LjA2OTUzLDUuNDIyNzEsOC44NTg5N1E1LjU0ODkyLDguNjQ4NDEsNS42ODUzLDguNDQ0M1E1LjgyMTY5LDguMjQwMTc5OTk5OTk5OTk5LDUuOTY3OTE5OTk5OTk5OTk5NCw4LjA0MzAwOTk5OTk5OTk5OVE2LjExNDE2LDcuODQ1ODI5OTk5OTk5OTk5LDYuMjY5OSw3LjY1NjA3UTYuNDI1NjMsNy40NjYzLDYuNTkwNDksNy4yODQ0MDk5OTk5OTk5OTlRNi43NTUzNSw3LjEwMjUyLDYuOTI4OTI5OTk5OTk5OTk5LDYuOTI4OTI5OTk5OTk5OTk5UTcuMTAyNTIsNi43NTUzNSw3LjI4NDQwOTk5OTk5OTk5OSw2LjU5MDQ5UTcuNDY2Myw2LjQyNTYzLDcuNjU2MDcsNi4yNjk5UTcuODQ1ODI5OTk5OTk5OTk5LDYuMTE0MTYsOC4wNDMwMDk5OTk5OTk5OTksNS45Njc5MTk5OTk5OTk5OTk0UTguMjQwMTc5OTk5OTk5OTk5LDUuODIxNjksOC40NDQzLDUuNjg1M1E4LjY0ODQxLDUuNTQ4OTIsOC44NTg5Nyw1LjQyMjcxUTkuMDY5NTMsNS4yOTY1MSw5LjI4NjAzLDUuMTgwNzlROS41MDI1Myw1LjA2NTA3LDkuNzI0NDUwMDAwMDAwMDAxLDQuOTYwMTA3UTkuOTQ2MzYsNC44NTUxNDgsMTAuMTczMTYsNC43NjEyMDVRMTAuMzk5OTYsNC42NjcyNjEsMTAuNjMxMSw0LjU4NDU1OTAwMDAwMDAwMDVRMTAuODYyMjQsNC41MDE4NTcsMTEuMDk3MTUsNC40MzA1OTdRMTEuMzMyMDcsNC4zNTkzMzYsMTEuNTcwMiw0LjI5OTY4N1ExMS44MDgzMyw0LjI0MDAzOSwxMi4wNDkxLDQuMTkyMTQ3UTEyLjI4OTg3LDQuMTQ0MjU1LDEyLjUzMjY5LDQuMTA4MjM1UTEyLjc3NTUyLDQuMDcyMjE0NiwxMy4wMTk4Myw0LjA0ODE1MjdRMTMuMjY0MTMsNC4wMjQwOTA5LDEzLjUwOTMyLDQuMDEyMDQ1NFExMy43NTQ1MSw0LDE0LDRRMTQuMjQ1NSw0LDE0LjQ5MDcsNC4wMTIwNDU0UTE0LjczNTksNC4wMjQwOTA5LDE0Ljk4MDIsNC4wNDgxNTI3UTE1LjIyNDUsNC4wNzIyMTQ2LDE1LjQ2NzMsNC4xMDgyMzVRMTUuNzEwMSw0LjE0NDI1NSwxNS45NTA5LDQuMTkyMTQ3UTE2LjE5MTcsNC4yNDAwMzksMTYuNDI5OCw0LjI5OTY4N1ExNi42Njc5LDQuMzU5MzM2LDE2LjkwMjgsNC40MzA1OTdRMTcuMTM3OCw0LjUwMTg1NywxNy4zNjg5LDQuNTg0NTU5MDAwMDAwMDAwNVExNy42LDQuNjY3MjYxLDE3LjgyNjgsNC43NjEyMDVRMTguMDUzNiw0Ljg1NTE0OCwxOC4yNzU1LDQuOTYwMTA3UTE4LjQ5NzUwMDAwMDAwMDAwMiw1LjA2NTA3LDE4LjcxNCw1LjE4MDc5UTE4LjkzMDUwMDAwMDAwMDAwMiw1LjI5NjUxLDE5LjE0MSw1LjQyMjcxUTE5LjM1MTU5OTk5OTk5OTk5OCw1LjU0ODkyLDE5LjU1NTcsNS42ODUzUTE5Ljc1OTgsNS44MjE2OSwxOS45NTcsNS45Njc5MTk5OTk5OTk5OTk0UTIwLjE1NDIsNi4xMTQxNiwyMC4zNDM5LDYuMjY5OVEyMC41MzM3LDYuNDI1NjMsMjAuNzE1Niw2LjU5MDQ5UTIwLjg5NzUsNi43NTUzNSwyMS4wNzExLDYuOTI4OTI5OTk5OTk5OTk5UTIxLjI0NDYsNy4xMDI1MiwyMS40MDk1LDcuMjg0NDA5OTk5OTk5OTk5UTIxLjU3NDQsNy40NjYzLDIxLjczMDEsNy42NTYwN1EyMS44ODU4LDcuODQ1ODI5OTk5OTk5OTk5LDIyLjAzMjEsOC4wNDMwMDk5OTk5OTk5OTlRMjIuMTc4Myw4LjI0MDE3OTk5OTk5OTk5OSwyMi4zMTQ3LDguNDQ0M1EyMi40NTExLDguNjQ4NDEsMjIuNTc3Myw4Ljg1ODk3UTIyLjcwMzUsOS4wNjk1MywyMi44MTkyLDkuMjg2MDNRMjIuOTM0OSw5LjUwMjUzLDIzLjAzOTksOS43MjQ0NTAwMDAwMDAwMDFRMjMuMTQ0OCw5Ljk0NjM2LDIzLjIzODgsMTAuMTczMTZRMjMuMzMyNywxMC4zOTk5NiwyMy40MTU0LDEwLjYzMTFRMjMuNDk4MSwxMC44NjIyNCwyMy41Njk0LDExLjA5NzE1UTIzLjY0MDcsMTEuMzMyMDcsMjMuNzAwMywxMS41NzAyUTIzLjc2LDExLjgwODMzLDIzLjgwNzgsMTIuMDQ5MVEyMy44NTU3LDEyLjI4OTg3LDIzLjg5MTgsMTIuNTMyNjlRMjMuOTI3OCwxMi43NzU1MiwyMy45NTE4LDEzLjAxOTgzUTIzLjk3NTksMTMuMjY0MTMsMjMuOTg4LDEzLjUwOTMyUTI0LDEzLjc1NDUxLDI0LDE0Wk0xMC41NjgwOCw4Ljk4OTExQzExLjQxMTM5LDkuMzYxNDMsMTIuMzI2MzQsOS41OTU1OCwxMy4yODU3Miw5LjY3NTk0TDEzLjI4NTcyLDUuNTczNDlDMTIuMjYwMjcsNS45NzEwMywxMS4yNTExMiw3LjE5MTU3MDAwMDAwMDAwMDUsMTAuNTY4MDgsOC45ODkxMVpNMTQuNzE0Myw5LjY3NTk0TDE0LjcxNDMsNS41NzM0OUMxNS43Mzk3LDUuOTcwODEsMTYuNzQ4OSw3LjE5MTc5LDE3LjQzMTksOC45ODkxMUMxNi41ODg2LDkuMzYxNjYsMTUuNjczNyw5LjU5NTgxLDE0LjcxNDMsOS42NzU5NFpNMTcuNTkyOSw2LjIyODM5QzE4LjMzOTEwMDAwMDAwMDAwMiw2LjU3NDgsMTkuMDMxNyw3LjAyNjY3LDE5LjY0OTMsNy41NzAxM0MxOS4zNDg5LDcuODM1MDksMTkuMDI0Niw4LjA3MTkyLDE4LjY4OTMsOC4yOTMzNUMxOC4zODA0LDcuNTE4MTMsMTguMDExNiw2LjgyMjM2OTk5OTk5OTk5OSwxNy41OTI5LDYuMjI4MzlaTTkuMzEwOTQsOC4yOTM0N0M4Ljk3NTY3MDAwMDAwMDAwMSw4LjA3MTgxOTk5OTk5OTk5OSw4LjY1MTM0MDAwMDAwMDAwMSw3LjgzNTIxLDguMzUwODksNy41NzAyNkM4Ljk2ODQ5OTk5OTk5OTk5OSw3LjAyNjcxLDkuNjYxMDgsNi41NzQ4NCwxMC40MDczNiw2LjIyODUyQzkuOTg4Mzg5OTk5OTk5OTk5LDYuODIyMjcsOS42MTk2NCw3LjUxODAyLDkuMzEwOTQsOC4yOTM0N1pNOC44NDc5OTk5OTk5OTk5OTksOS42OTY0QzguNTQ3MTEsMTAuNzk3NTA5OTk5OTk5OTk5LDguMzU4MjcwMDAwMDAwMDAxLDEyLjAwNjg5LDguMzA2NDgsMTMuMjg1NjhMNS40NjQ5NywxMy4yODU2OEM1LjYxMTg0LDExLjUxNzE2LDYuMjkzNTQsOS44OTkwOCw3LjM1MzgxLDguNTk3MjkwMDAwMDAwMDAxQzcuODE0NTIsOS4wMDkzNCw4LjMxNjc0OTk5OTk5OTk5OSw5LjM3NDMsOC44NDc5OTk5OTk5OTk5OTksOS42OTY0Wk0xOS42OTM3LDEzLjI4NTY4QzE5LjY0MiwxMi4wMDY4OSwxOS40NTMxLDEwLjc5NzUwOTk5OTk5OTk5OSwxOS4xNTIyLDkuNjk2NEMxOS42ODM1MDAwMDAwMDAwMDIsOS4zNzQzLDIwLjE4NTUsOS4wMDkzNCwyMC42NDY2LDguNTk3MjkwMDAwMDAwMDAxQzIxLjcwNjksOS44OTkwOCwyMi4zODg2LDExLjUxNzE2LDIyLjUzNTUsMTMuMjg1NjhMMTkuNjkzNywxMy4yODU2OFpNMTMuMjg1NzIsMTEuMTA0NjRMMTMuMjg1NzIsMTMuMjg1NjdMOS43MzQxNiwxMy4yODU2N0M5Ljc3OTkyLDEyLjIyNjUyLDkuOTI0MzQsMTEuMjQ0NiwxMC4xNDQ2NSwxMC4zNTc1NEMxMS4xMjIxMSwxMC43NjkzNywxMi4xNzgxMywxMS4wMjU2MiwxMy4yODU3MiwxMS4xMDQ2NFpNMTQuNzE0MywxMy4yODU2N0wxNC43MTQzLDExLjEwNDY0QzE1LjgyMTksMTEuMDI1NjIsMTYuODc3OSwxMC43NjkzNywxNy44NTU0LDEwLjM1NzU0QzE4LjA3NTksMTEuMjQ0NiwxOC4yMjAxMDAwMDAwMDAwMDIsMTIuMjI2NTIsMTguMjY1OTAwMDAwMDAwMDAyLDEzLjI4NTY3TDE0LjcxNDMsMTMuMjg1NjdaTTguMzA2MjUsMTQuNzE0MkM4LjM1ODAzOTk5OTk5OTk5OSwxNS45OTMsOC41NDY4NywxNy4yMDI0LDguODQ3NzcsMTguMzAzNUM4LjMxNjUyLDE4LjYyNTYsNy44MTQ1MSwxOC45OTA2LDcuMzUzMzUsMTkuNDAyNkM2LjI5MzA4LDE4LjEwMDgsNS42MTEzODAwMDAwMDAwMDA1LDE2LjQ4Mjc5OTk5OTk5OTk5Nyw1LjQ2NDUxLDE0LjcxNDJMOC4zMDYyNSwxNC43MTQyWk0xMy4yODU3MiwxNC43MTQyTDEzLjI4NTcyLDE2Ljg5NTNDMTIuMTc4MTMsMTYuOTc0MywxMS4xMjIxMSwxNy4yMzA1LDEwLjE0NDY1LDE3LjY0MjQwMDAwMDAwMDAwMkM5LjkyNDEyLDE2Ljc1NTMsOS43Nzk5MiwxNS43NzM0LDkuNzM0MTYsMTQuNzE0MkwxMy4yODU3MiwxNC43MTQyWk0xNC43MTQzLDE2Ljg5NTNMMTQuNzE0MywxNC43MTQyTDE4LjI2NTkwMDAwMDAwMDAwMiwxNC43MTQyQzE4LjIyMDEwMDAwMDAwMDAwMiwxNS43NzM0LDE4LjA3NTksMTYuNzU1MywxNy44NTU0LDE3LjY0MjQwMDAwMDAwMDAwMkMxNi44Nzc5LDE3LjIzMDMsMTUuODIxOSwxNi45NzQzLDE0LjcxNDMsMTYuODk1M1pNMTkuMTUyLDE4LjMwMzVDMTkuNDUyOSwxNy4yMDI0LDE5LjY0MTcsMTUuOTkzLDE5LjY5MzUsMTQuNzE0MkwyMi41MzUsMTQuNzE0MkMyMi4zODgyLDE2LjQ4Mjc5OTk5OTk5OTk5NywyMS43MDY1LDE4LjEwMDgsMjAuNjQ2MiwxOS40MDI2QzIwLjE4NTUsMTguOTkwNiwxOS42ODMzLDE4LjYyNTYsMTkuMTUyLDE4LjMwMzVaTTEzLjI4NTcyLDIyLjQyNjZMMTMuMjg1NzIsMTguMzI0MUMxMi4zMjYzNCwxOC40MDQyLDExLjQxMTM5LDE4LjYzODQsMTAuNTY4MDgsMTkuMDEwOUMxMS4yNTExMiwyMC44MDgyLDEyLjI2MDI3LDIyLjAyOSwxMy4yODU3MiwyMi40MjY2Wk0xNC43MTQzLDE4LjMyNDFDMTUuNjczNywxOC40MDQ1LDE2LjU4ODYsMTguNjM4NiwxNy40MzE5LDE5LjAxMDlDMTYuNzQ4OSwyMC44MDg1LDE1LjczOTcsMjIuMDI5MiwxNC43MTQzLDIyLjQyNjZMMTQuNzE0MywxOC4zMjQxWk05LjMxMDk0LDE5LjcwNjQwMDAwMDAwMDAwMkM5LjYxOTY0LDIwLjQ4MTksOS45ODgzODk5OTk5OTk5OTksMjEuMTc3OCwxMC40MDczNiwyMS43NzE2QzkuNjYxMTMsMjEuNDI1Miw4Ljk2ODU1LDIwLjk3MzMsOC4zNTA4OSwyMC40Mjk5QzguNjUxMzQwMDAwMDAwMDAxLDIwLjE2NDcsOC45NzU2NzAwMDAwMDAwMDEsMTkuOTI3Nzk5OTk5OTk5OTk4LDkuMzEwOTQsMTkuNzA2NDAwMDAwMDAwMDAyWk0xOC42ODksMTkuNzA2NDAwMDAwMDAwMDAyQzE5LjAyNDMsMTkuOTI4MSwxOS4zNDg1OTk5OTk5OTk5OTgsMjAuMTY0NywxOS42NDkxLDIwLjQyOTZDMTkuMDMxNSwyMC45NzMyLDE4LjMzODkwMDAwMDAwMDAwMiwyMS40MjUxLDE3LjU5MjU5OTk5OTk5OTk5NywyMS43NzE0QzE4LjAxMTYsMjEuMTc3NiwxOC4zODAzLDIwLjQ4MTksMTguNjg5LDE5LjcwNjQwMDAwMDAwMDAwMloiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZmlsbD0iI0Q4RDhEOCIgZmlsbC1vcGFjaXR5PSIxIi8+PC9nPjwvZz48L3N2Zz4=\"\n                                            style=\"outline:none; -ms-interpolation-mode:bicubic; max-width:100%;\"\n                                            width=\"28\" height=\"28\" align=\"middle\">\n                                        </a>\n                                      </li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;\">\n                                        <a title=\"Discord\" href=\"https://discord.com/invite/4tKTMkkvVX\" target=\"_blank\"\n                                          style=\"padding-left: 10;text-decoration:none; \">\n                                          <img alt=\"tips\" src=\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBmaWxsPSJub25lIiB2ZXJzaW9uPSIxLjEiIHdpZHRoPSIyOCIgaGVpZ2h0PSIyOCIgdmlld0JveD0iMCAwIDI4IDI4Ij48Zz48ZyBzdHlsZT0ib3BhY2l0eTowOyI+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjI4IiBoZWlnaHQ9IjI4IiByeD0iMCIgZmlsbD0iI0Q4RDhEOCIgZmlsbC1vcGFjaXR5PSIxIi8+PC9nPjxnPjxwYXRoIGQ9Ik0yMS45NzQzLDcuNDI5MjJDMjEuOTg2OSw3LjQzNDQyLDIxLjk5NzIsNy40NDM5NywyMi4wMDM0LDcuNDU2MTZDMjQuNTM0NiwxMS4yMTM0NCwyNS43ODQ3LDE1LjQ1MTc5LDI1LjMxNzIsMjAuMzMxMUMyNS4zMTU0LDIwLjM1MTgsMjUuMzA0OCwyMC4zNzA4LDI1LjI4ODEsMjAuMzgzMUMyMy41OTQsMjEuNjQ5OTAwMDAwMDAwMDAyLDIxLjY5ODEsMjIuNjE1NCwxOS42ODIyLDIzLjIzODJDMTkuNjUzLDIzLjI0NzIsMTkuNjIxNCwyMy4yMzY0LDE5LjYwMzYsMjMuMjExMkMxOS4xNzcyLDIyLjYxNDEsMTguNzk0OSwyMS45ODYyLDE4LjQ1OTUsMjEuMzMyNkMxOC40NTAyMDAwMDAwMDAwMDIsMjEuMzE0MywxOC40NDg5OTk5OTk5OTk5OTgsMjEuMjkyOSwxOC40NTYzLDIxLjI3MzY5OTk5OTk5OTk5OEMxOC40NjM2LDIxLjI1NDUsMTguNDc4NiwyMS4yMzk0LDE4LjQ5NzYsMjEuMjMyMTAwMDAwMDAwMDAzQzE5LjEwMzEsMjEuMDAyMjk5OTk5OTk5OTk4LDE5LjY4ODMsMjAuNzIxMiwyMC4yNDY5LDIwLjM5MkMyMC4yNjc1LDIwLjM3OTYsMjAuMjgwNSwyMC4zNTc1OTk5OTk5OTk5OTgsMjAuMjgxOCwyMC4zMzM1QzIwLjI4MywyMC4zMDkzLDIwLjI3MjMsMjAuMjg2MDk5OTk5OTk5OTk4LDIwLjI1MzEsMjAuMjcxN0MyMC4xMzQ4LDIwLjE4MjcsMjAuMDE4NywyMC4wOTA4LDE5LjkwNSwxOS45OTYxQzE5Ljg4NDMsMTkuOTc5LDE5Ljg1NTcsMTkuOTc1NiwxOS44MzE2LDE5Ljk4NzA5OTk5OTk5OTk5OEMxNi4yMDY4OTk5OTk5OTk5OTcsMjEuNjc3MzAwMDAwMDAwMDAyLDEyLjIzNTY1LDIxLjY3NzMwMDAwMDAwMDAwMiw4LjU2NzUyLDE5Ljk4NzA5OTk5OTk5OTk5OEM4LjU0MzQ3OTk5OTk5OTk5OSwxOS45NzYzMDAwMDAwMDAwMDIsOC41MTU0MTk5OTk5OTk5OTksMTkuOTgwMSw4LjQ5NTA5MDAwMDAwMDAwMSwxOS45OTdDOC4zODE0NTAwMDAwMDAwMDEsMjAuMDkxMiw4LjI2NTY4LDIwLjE4MjgsOC4xNDc4NzAwMDAwMDAwMDEsMjAuMjcxN0M4LjEyODc5LDIwLjI4NjMsOC4xMTgxOSwyMC4zMDk2LDguMTE5NiwyMC4zMzM3QzguMTIxMDIsMjAuMzU3OSw4LjEzNDI2MDAwMDAwMDAwMSwyMC4zNzk3LDguMTU0OTIsMjAuMzkyQzguNzE0ODIsMjAuNzE4NSw5LjI5OTQ2LDIwLjk5OTcsOS45MDMzNSwyMS4yMzNDOS45MjIzOCwyMS4yNDAwMDAwMDAwMDAwMDIsOS45Mzc1MSwyMS4yNTQ5LDkuOTQ0OTM5OTk5OTk5OTk5LDIxLjI3NEM5Ljk1MjM1OTk5OTk5OTk5OSwyMS4yOTMsOS45NTEzNjAwMDAwMDAwMDEsMjEuMzE0Myw5Ljk0MjIsMjEuMzMyNkM5LjYxMjM3LDIxLjk4OTksOS4yMjk0MSwyMi42MTg2LDguNzk3MjIsMjMuMjEyM0M4Ljc3ODk4LDIzLjIzNjcsOC43NDc2LDIzLjI0NzEsOC43MTg1OCwyMy4yMzgzQzYuNzA2MzAwMDAwMDAwMDAxLDIyLjYxMzQsNC44MTM3Nzk5OTk5OTk5OTk1LDIxLjY0NzksMy4xMjE3ODQsMjAuMzgzMUMzLjEwNTM2NiwyMC4zNzAyLDMuMDk0ODQyOSwyMC4zNTExMDAwMDAwMDAwMDIsMy4wOTI2MjM1LDIwLjMzMDE5OTk5OTk5OTk5OEMyLjcwMjEzNCwxNi4xMDk3LDMuNDk4MTMyLDExLjgzNjM1OTk5OTk5OTk5OSw2LjQwMzg5MDAwMDAwMDAwMDUsNy40NTUyNzAwMDAwMDAwMDA1QzYuNDExLDcuNDQzNjcsNi40MjE0OSw3LjQzNDU4LDYuNDMzOTMsNy40MjkyNkM3Ljg4Njk1LDYuNzU1NTE2LDkuNDIwNjEsNi4yNzU0NjQsMTAuOTk2Myw2LjAwMTE4MTRDMTEuMDI1NTUsNS45OTY1Mjc3MywxMS4wNTQ2NCw2LjAxMDQyMDYsMTEuMDY5NjQsNi4wMzYyMDNDMTEuMjgzMjYsNi40MTc3NCwxMS40NzU4Niw2LjgxMDg4OCwxMS42NDY1Nyw3LjIxMzg1QzEzLjM0NDksNi45NTM1NywxNS4wNzI0LDYuOTUzNTcsMTYuNzcwNjk5OTk5OTk5OTk4LDcuMjEzODVDMTYuOTQwMyw2LjgxMTkwOCwxNy4xMjk5LDYuNDE4ODU4LDE3LjMzODcsNi4wMzYyMDNDMTcuMzUzMDk5OTk5OTk5OTk4LDYuMDA5Nzg4NjQsMTcuMzgyNiw1Ljk5NTY3MDksMTcuNDEyLDYuMDAxMTgxNEMxOC45ODc1LDYuMjc2MDQxLDIwLjUyMTEsNi43NTYwNTcsMjEuOTc0Myw3LjQyOTIyWk0xMC40OSwxNy43NjA0QzkuMzg1NjIsMTcuNzYwNCw4LjQ3NTY1LDE2LjczNzIsOC40NzU2NSwxNS40ODA1OUM4LjQ3NTY1LDE0LjIyMzk3LDkuMzY3OTcsMTMuMjAwNjgsMTAuNDksMTMuMjAwNjhDMTEuNjIwNzksMTMuMjAwNjgsMTIuNTIxOTYsMTQuMjMyODYsMTIuNTA0MzEsMTUuNDgwNTFDMTIuNTA0MzEsMTYuNzM3MiwxMS42MTE5NSwxNy43NjA0LDEwLjQ5LDE3Ljc2MDRaTTE3LjkzNzcsMTcuNzYwNEMxNi44MzMzLDE3Ljc2MDQsMTUuOTIzMywxNi43MzcyLDE1LjkyMzMsMTUuNDgwNTlDMTUuOTIzMywxNC4yMjM5NywxNi44MTU3LDEzLjIwMDY4LDE3LjkzNzcsMTMuMjAwNjhDMTkuMDY4NSwxMy4yMDA2OCwxOS45Njk3LDE0LjIzMjg2LDE5Ljk1MiwxNS40ODA1MUMxOS45NTIsMTYuNzM3MiwxOS4wNjg1LDE3Ljc2MDQsMTcuOTM3NywxNy43NjA0WiIgZmlsbC1ydWxlPSJldmVub2RkIiBmaWxsPSIjRDhEOEQ4IiBmaWxsLW9wYWNpdHk9IjEiLz48L2c+PC9nPjwvc3ZnPg==\"\n                                            style=\"outline:none; -ms-interpolation-mode:bicubic; max-width:100%;;\"\n                                            width=\"28\" height=\"28\" align=\"middle\">\n                                        </a>\n                                      </li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;\">\n                                        <a title=\"Github\" href=\"https://github.com/infinilabs\" target=\"_blank\"\n                                          style=\"padding-left: 10;text-decoration:none; \">\n                                          <img alt=\"tips\" src=\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBmaWxsPSJub25lIiB2ZXJzaW9uPSIxLjEiIHdpZHRoPSIyOCIgaGVpZ2h0PSIyOCIgdmlld0JveD0iMCAwIDI4IDI4Ij48Zz48ZyBzdHlsZT0ib3BhY2l0eTowOyI+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjI4IiBoZWlnaHQ9IjI4IiByeD0iMCIgZmlsbD0iI0Q4RDhEOCIgZmlsbC1vcGFjaXR5PSIxIi8+PC9nPjxnPjxwYXRoIGQ9Ik0xNC41MTg1NDgwNTk4NDQ5NywzLjExMTExMTE2NDA5MzAxNzZDOC43ODk3NDgwNTk4NDQ5NzEsMy4xMTExMTExNjQwOTMwMTc2LDQuMTQ4MTQ4MDU5ODQ0OTcxLDcuODY5OTIxMTY0MDkzMDE4LDQuMTQ4MTQ4MDU5ODQ0OTcxLDEzLjc0MzMxMTE2NDA5MzAxN0M0LjE0ODE0ODA1OTg0NDk3MSwxOC40MzkyMTExNjQwOTMwMTcsNy4xMTkyNTgwNTk4NDQ5NywyMi40MjYzMTExNjQwOTMwMiwxMS4yNDA2MTgwNTk4NDQ5NywyMy44MzI0MTExNjQwOTMwMTdDMTEuNzYwODY4MDU5ODQ0OTcsMjMuOTI5OTExMTY0MDkzMDE3LDExLjk0OTI1ODA1OTg0NDk3MiwyMy42MDM5MTExNjQwOTMwMTcsMTEuOTQ5MjU4MDU5ODQ0OTcyLDIzLjMyMDMxMTE2NDA5MzAxN0MxMS45NDkyNTgwNTk4NDQ5NzIsMjMuMDY2OTExMTY0MDkzMDE4LDExLjkzOTc0ODA1OTg0NDk3LDIyLjM5ODkxMTE2NDA5MzAyLDExLjkzNjI5ODA1OTg0NDk3LDIxLjUxMjgxMTE2NDA5MzAyQzkuMDQ5ODc4MDU5ODQ0OTcxLDIyLjE1MzQxMTE2NDA5MzAyLDguNDQyMzQ4MDU5ODQ0OTcsMjAuMDg3MjExMTY0MDkzMDE2LDguNDQyMzQ4MDU5ODQ0OTcsMjAuMDg3MjExMTY0MDkzMDE2QzcuOTY5NjI4MDU5ODQ0OTcxLDE4Ljg1ODMxMTE2NDA5MzAxNyw3LjI5MTIzODA1OTg0NDk3MSwxOC41Mjk2MTExNjQwOTMwMiw3LjI5MTIzODA1OTg0NDk3MSwxOC41Mjk2MTExNjQwOTMwMkM2LjM0OTI1ODA1OTg0NDk3MSwxNy44NzIyMTExNjQwOTMwMTcsNy4zNjIwOTgwNTk4NDQ5NzEsMTcuODg2NDExMTY0MDkzMDIsNy4zNjIwOTgwNTk4NDQ5NzEsMTcuODg2NDExMTY0MDkzMDJDOC40MDE3MjgwNTk4NDQ5NywxNy45NjI2MTExNjQwOTMwMiw4Ljk0ODc2ODA1OTg0NDk3MSwxOC45Nzk3MTExNjQwOTMwMiw4Ljk0ODc2ODA1OTg0NDk3MSwxOC45Nzk3MTExNjQwOTMwMkM5Ljg3MzQ1ODA1OTg0NDk3MSwyMC42MDY0MTExNjQwOTMwMTgsMTEuMzc1NDI4MDU5ODQ0OTcxLDIwLjEzNjAxMTE2NDA5MzAxNiwxMS45NjY1NDgwNTk4NDQ5NzEsMTkuODY1NzExMTY0MDkzMDE4QzEyLjA2MTYwODA1OTg0NDk3MSwxOS4xNzczMTExNjQwOTMwMTYsMTIuMzMxMjM4MDU5ODQ0OTcsMTguNzA5NTExMTY0MDkzMDE2LDEyLjYyNTA1ODA1OTg0NDk3LDE4LjQ0MzcxMTE2NDA5MzAxN0MxMC4zMjI4MzgwNTk4NDQ5NywxOC4xNzcwMTExNjQwOTMwMTcsNy45MDIyMTgwNTk4NDQ5NzEsMTcuMjYzNTExMTY0MDkzMDE4LDcuOTAyMjE4MDU5ODQ0OTcxLDEzLjE4OTYxMTE2NDA5MzAxOEM3LjkwMjIxODA1OTg0NDk3MSwxMi4wMjYyNDExNjQwOTMwMTcsOC4zMDc1MjgwNTk4NDQ5NywxMS4wNzgyMDExNjQwOTMwMTYsOC45Njg2MzgwNTk4NDQ5NywxMC4zMzM5NDExNjQwOTMwMThDOC44NjQwNzgwNTk4NDQ5NywxMC4wNjgxNDExNjQwOTMwMTcsOC41MDYyOTgwNTk4NDQ5NzEsOC45ODQ1NDExNjQwOTMwMTcsOS4wNjk3NTgwNTk4NDQ5NzIsNy41MjA4MzExNjQwOTMwMThDOS4wNjk3NTgwNTk4NDQ5NzIsNy41MjA4MzExNjQwOTMwMTgsOS45NDA4NjgwNTk4NDQ5Nyw3LjIzNzMwMTE2NDA5MzAxOCwxMS45MjI0NjgwNTk4NDQ5Nyw4LjYxMDYzMTE2NDA5MzAxOEMxMi43Njg2NzgwNTk4NDQ5NzEsOC4zNzQ4NzExNjQwOTMwMTksMTMuNjQxNjE4MDU5ODQ0OTcxLDguMjU1MTAxMTY0MDkzMDE2LDE0LjUxODU0ODA1OTg0NDk3LDguMjU0NDUxMTY0MDkzMDE4QzE1LjQwMDA0ODA1OTg0NDk3LDguMjU4MDAxMTY0MDkzMDE3LDE2LjI4NzU0ODA1OTg0NDk3Myw4LjM3NDk1MTE2NDA5MzAxOCwxNy4xMTQ1NDgwNTk4NDQ5Nyw4LjYxMDYzMTE2NDA5MzAxOEMxOS4wOTYxNDgwNTk4NDQ5Nyw3LjIzNzMwMTE2NDA5MzAxOCwxOS45NjM4NDgwNTk4NDQ5Nyw3LjUyMDgzMTE2NDA5MzAxOCwxOS45NjM4NDgwNTk4NDQ5Nyw3LjUyMDgzMTE2NDA5MzAxOEMyMC41MzA3NDgwNTk4NDQ5Nyw4Ljk4NDU0MTE2NDA5MzAxNywyMC4xNzY0NDgwNTk4NDQ5NzIsMTAuMDY4MTQxMTY0MDkzMDE3LDIwLjA2NzU0ODA1OTg0NDk3LDEwLjMzMzk0MTE2NDA5MzAxOEMyMC43MzI5NDgwNTk4NDQ5NzIsMTEuMDc4MjAxMTY0MDkzMDE2LDIxLjEzMTM0ODA1OTg0NDk3LDEyLjAyNjI0MTE2NDA5MzAxNywyMS4xMzEzNDgwNTk4NDQ5NywxMy4xODk2MTExNjQwOTMwMThDMjEuMTMxMzQ4MDU5ODQ0OTcsMTcuMjc0MTExMTY0MDkzMDE4LDE4LjcwODE0ODA1OTg0NDk3MywxOC4xNjk5MTExNjQwOTMwMTYsMTYuMzk5MDQ4MDU5ODQ0OTcyLDE4LjQzNjYxMTE2NDA5MzAxNkMxNi43NzA2NDgwNTk4NDQ5NzMsMTguNzYxODExMTY0MDkzMDE4LDE3LjEwMDc0ODA1OTg0NDk3LDE5LjQxMjExMTE2NDA5MzAxNiwxNy4xMDA3NDgwNTk4NDQ5NywyMC40MDI3MTExNjQwOTMwMTdDMTcuMTAwNzQ4MDU5ODQ0OTcsMjEuODI0NzExMTY0MDkzMDE3LDE3LjA5MTI0ODA1OTg0NDk3MiwyMi45NzAzMTExNjQwOTMwMiwxNy4wOTEyNDgwNTk4NDQ5NzIsMjMuMzIwMzExMTY0MDkzMDE3QzE3LjA5MTI0ODA1OTg0NDk3MiwyMy42MDM5MTExNjQwOTMwMTcsMTcuMjc2MTQ4MDU5ODQ0OTcsMjMuOTM2MTExMTY0MDkzMDE3LDE3LjgwMzM0ODA1OTg0NDk3LDIzLjgzMjQxMTE2NDA5MzAxN0MyMS45MjEyNDgwNTk4NDQ5NywyMi40MjM3MTExNjQwOTMwMTcsMjQuODg4ODQ4MDU5ODQ0OTcsMTguNDM5MjExMTY0MDkzMDE3LDI0Ljg4ODg0ODA1OTg0NDk3LDEzLjc0MzMxMTE2NDA5MzAxN0MyNC44ODg4NDgwNTk4NDQ5Nyw3Ljg2OTkyMTE2NDA5MzAxOCwyMC4yNDcyNDgwNTk4NDQ5NywzLjExMTExMTE2NDA5MzAxNzYsMTQuNTE4NTQ4MDU5ODQ0OTcsMy4xMTExMTExNjQwOTMwMTc2WiIgZmlsbD0iI0Q4RDhEOCIgZmlsbC1vcGFjaXR5PSIxIi8+PC9nPjwvZz48L3N2Zz4=\"\n                                            style=\"outline:none; -ms-interpolation-mode:bicubic; max-width:100%;\"\n                                            width=\"28\" height=\"28\" align=\"middle\">\n                                        </a>\n                                      </li>\n                                    </ul>\n                                  </div>\n                                  </p>\n                                </div>\n                              </div>\n                            </td>\n                          </tr>\n                        </tbody>\n                      </table>\n                    </div>\n                    <!--[if gte mso 9]></table><![endif]-->\n                    <!--[if (mso)|(IE)]></td><![endif]-->\n                    <!--[if (mso)|(IE)]></tr></table><![endif]-->\n                  </div>\n                </div>\n                <div id=\"section-2\" class=\"hse-section\" style=\"padding-left:10px; padding-right:10px\">\n                  <!--[if !((mso)|(IE))]><!-- -->\n                  <div class=\"hse-column-container\"\n                    style=\"min-width:200px; max-width:600px; width:100%; Margin-left:auto; Margin-right:auto; border-collapse:collapse; border-spacing:0; padding-bottom:20px; padding-top:20px\">\n                    <!--<![endif]-->\n                    <!--[if (mso)|(IE)]>\n        <div class=\"hse-column-container\" style=\"min-width:280px;max-width:600px;width:100%;Margin-left:auto;Margin-right:auto;border-collapse:collapse;border-spacing:0;\">\n        <table align=\"center\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px;\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\">\n        <tr>\n      <![endif]-->\n                    <!--[if (mso)|(IE)]>\n    <td valign=\"top\" style=\"width:600px;padding-bottom:20px; padding-top:20px;\">\n  <![endif]-->\n                    <!--[if gte mso 9]>\n    <table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px\">\n  <![endif]-->\n                    <div id=\"column-2-0\" class=\"hse-column hse-size-12\">\n                      <div id=\"hs_cos_wrapper_module-2-0-0\"\n                        class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module\"\n                        style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                        data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"module\">\n                      </div>\n                    </div>\n                    <!--[if gte mso 9]></table><![endif]-->\n                    <!--[if (mso)|(IE)]></td><![endif]-->\n                    <!--[if (mso)|(IE)]></tr></table><![endif]-->\n                  </div>\n                </div>\n                <!--[if (mso)|(IE)]></td></tr></table><![endif]-->\n              </div>\n    </div>\n    </div>\n    </td>\n    </tr>\n    </tbody>\n    </table>\n    </div>\n  </body>\n  </html>",
    "content_type": "text/html"
  },
  "enabled": false
}
POST $[[SETUP_INDEX_PREFIX]]channel/$[[SETUP_DOC_TYPE]]/cj8atf53q95lhahebg8g
{
  "id": "cj8atf53q95lhahebg8g",
  "created": "2023-08-07T16:43:40.062389175+08:00",
  "updated": "2023-08-10T12:04:42.842628127+08:00",
  "name": "[Recovery]  Email Notification",
  "type": "email",
  "sub_type": "email",
  "email": {
    "server_id": "",
    "recipients": {
      "to": [],
      "cc": []
    },
    "subject": "[INFINI Platform Alerting] {{.title}}",
    "body": "<html xmlns=\"http://www.w3.org/1999/xhtml\" xmlns:o=\"urn:schemas-microsoft-com:office:office\" xmlns:v=\"urn:schemas-microsoft-com:vml\" lang=\"en\"><head>\n      <title></title>\n      <meta property=\"og:title\" content=\"\">\n      <meta name=\"twitter:title\" content=\"\">\n  <meta name=\"x-apple-disable-message-reformatting\">\n  <meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\">\n  <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n      <!--[if gte mso 9]>\n    <xml>\n        <o:OfficeDocumentSettings>\n        <o:AllowPNG/>\n        <o:PixelsPerInch>96</o:PixelsPerInch>\n        </o:OfficeDocumentSettings>\n    </xml>\n    <style>\n      ul > li {\n        text-indent: -1em;\n      }\n    </style>\n  <![endif]-->\n  <!--[if mso]>\n  <style type=\"text/css\">\n   body, td {font-family: Arial, Helvetica, sans-serif;} \n   .hse-body-wrapper-table {background-color: #EAF0F6;padding: 20px 0 !important}\n  </style>\n  <![endif]-->\n    <meta name=\"generator\" content=\"HubSpot\">\n    <style type=\"text/css\">.moz-text-html .hse-column-container{max-width:600px !important;width:600px !important}\n  .moz-text-html .hse-column{display:table-cell;vertical-align:top}.moz-text-html .hse-section .hse-size-12{max-width:600px !important;width:600px !important}\n  [owa] .hse-column-container{max-width:600px !important;width:600px !important}[owa] .hse-column{display:table-cell;vertical-align:top}\n  [owa] .hse-section .hse-size-12{max-width:600px !important;width:600px !important}\n  @media only screen and (min-width:640px){.hse-column-container{max-width:600px !important;width:600px !important}\n  .hse-column{display:table-cell;vertical-align:top}.hse-section .hse-size-12{max-width:600px !important;width:600px !important}\n  }@media only screen and (max-width:639px){img.stretch-on-mobile,.hs_rss_email_entries_table img,.hs-stretch-cta .hs-cta-img{height:auto !important;width:100% !important}\n  .display_block_on_small_screens{display:block}.hs_padded{padding-left:20px !important;padding-right:20px !important}\n  }</style><!--<![endif]--><style type=\"text/css\">body[data-outlook-cycle] img.stretch-on-mobile,body[data-outlook-cycle] .hs_rss_email_entries_table img{height:auto !important;width:100% !important}\n  body[data-outlook-cycle] .hs_padded{padding-left:20px !important;padding-right:20px !important}\n  a[x-apple-data-detectors]{color:inherit !important;text-decoration:none !important;font-size:inherit !important;font-family:inherit !important;font-weight:inherit !important;line-height:inherit !important}\n  #outlook a{padding:0}.yshortcuts a{border-bottom:none !important}a{text-decoration:underline}\n  .ExternalClass{width:100%}.ExternalClass,.ExternalClass p,.ExternalClass td,.ExternalClass div,.ExternalClass span,.ExternalClass font{line-height:100%}\n  p{margin:0}body{-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;-webkit-font-smoothing:antialiased;moz-osx-font-smoothing:grayscale}</style>\n  </head>\n  <body bgcolor=\"#EAF0F6\"\n    style=\"margin:0 !important; padding:0 !important; font-family:Arial, sans-serif; font-size:15px; color:#23496d; word-break:break-word\">\n    <!--[if gte mso 9]>\n  <v:background xmlns:v=\"urn:schemas-microsoft-com:vml\" fill=\"t\">\n      <v:fill type=\"tile\" size=\"100%,100%\"  color=\"#ffffff\"/>\n  </v:background>\n  <![endif]-->\n    <div class=\"hse-body-background\" style=\"background-color:#eaf0f6\" bgcolor=\"#eaf0f6\">\n      <table role=\"presentation\" class=\"hse-body-wrapper-table\" cellpadding=\"0\" cellspacing=\"0\"\n        style=\"border-spacing:0 !important; border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; margin:0; padding:0; width:100% !important; min-width:200px !important; height:100% !important\"\n        width=\"100%\" height=\"100%\">\n        <tbody>\n          <tr>\n            <td class=\"hse-body-wrapper-td\" valign=\"top\"\n              style=\"border-collapse:collapse; mso-line-height-rule:exactly; font-family:Arial, sans-serif; font-size:15px; color:#23496d; word-break:break-word\">\n              <div id=\"hs_cos_wrapper_main\" class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_dnd_area\"\n                style=\"color: inherit; font-size: inherit; line-height: inherit;\" data-hs-cos-general-type=\"widget\"\n                data-hs-cos-type=\"dnd_area\">\n                <div id=\"section-1\" class=\"hse-section hse-section-first\"\n                  style=\"padding-left:10px; padding-right:10px; padding-top:20px\">\n                  <!--[if !((mso)|(IE))]><!-- -->\n                  <div class=\"hse-column-container\"\n                    style=\"min-width:200px; max-width:600px; margin-left:auto; margin-right:auto; border-collapse:collapse; border-spacing:0; background-color:#ffffff; padding-bottom:30px;\"\n                    bgcolor=\"#ffffff\">\n                    <!--<![endif]-->\n                    <!--[if (mso)|(IE)]>\n        <div class=\"hse-column-container\" style=\"min-width:200px;max-width:600px;width:100%;Margin-left:auto;Margin-right:auto;border-collapse:collapse;border-spacing:0;\">\n        <table align=\"center\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px;\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\" width=\"600\" bgcolor=\"#ffffff\">\n        <tr style=\"background-color:#ffffff;\">\n      <![endif]-->\n                    <!--[if (mso)|(IE)]>\n    <td valign=\"top\" style=\"width:600px;padding-bottom:30px;\">\n  <![endif]-->\n                    <!--[if gte mso 9]>\n    <table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px\">\n  <![endif]-->\n                    <div id=\"column-1-0\" class=\"hse-column hse-size-12\">\n                      <div id=\"hs_cos_wrapper_module_16873376536522\"\n                        class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module\"\n                        style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                        data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"module\">\n                        <table class=\"hse-image-wrapper\" role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"\n                          style=\"border-spacing:0 !important; border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt\">\n                          <tbody>\n                            <tr>\n                              <td align=\"center\" valign=\"top\"\n                                style=\"border-collapse:collapse; mso-line-height-rule:exactly; font-family:Arial, sans-serif; color:#23496d; word-break:break-word; text-align:center;  font-size:0px\">\n                                <img alt=\"email-header\" src=\"data:image/png;base64,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\"\n                                  style=\"outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; max-width:100%; font-size:16px\"\n                                  width=\"600\" align=\"middle\">\n                              </td>\n                            </tr>\n                          </tbody>\n                        </table>\n                      </div>\n                      <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\"\n                        style=\"border-spacing:0 !important; border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt\">\n                        <tbody>\n                          <tr>\n                            <td class=\"hs_padded\"\n                              style=\"border-collapse:collapse; mso-line-height-rule:exactly; font-family:Arial, sans-serif; font-size:15px; color:#23496d; word-break:break-word; padding:10px 20px\">\n                              <div id=\"hs_cos_wrapper_module-1-0-0\"\n                                class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module\"\n                                style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                                data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"module\">\n                                <div id=\"hs_cos_wrapper_module-1-0-0_\"\n                                  class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_rich_text\"\n                                  style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                                  data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"rich_text\">\n                                  <p\n                                    style=\"mso-line-height-rule:exactly; margin-top: 20px;margin-bottom: 20px;font-size: 24px;font-weight: 600;line-height: 29px;letter-spacing: -0.6px;color: #52C41A;\">{{.title}}\n                                  </p>\n                                  <div\n                                    style=\"mso-line-height-rule:exactly; line-height:175%; margin-bottom:20px;font-size: 14px;color: #666666;white-space: normal;font-family: PingFang SC;\">{{.message | md_to_html}}\n                                  </div>\n                                  <p>\n                                  <div\n                                    style=\"width: 120px;height: 32px;border-radius: 5px;background-color: #1677FF;line-height: 32px;text-align: center;margin-top:0px;margin-bottom: 20px;\">\n                                    <a style=\"font-size: 14px;color: #ffffff;text-decoration: none;\" href=\"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}\"}}\"\n                                      target=\"_blank\">\n                                      View Detail\n                                    </a>\n                                  </div>\n                                  <div\n                                    style=\"width: 100%;height: 0px;opacity: 1;border: 1px solid #EEEEEE;margin-top: 20px;margin-bottom: 20px;\">\n                                  </div>\n                                  <div style=\"margin-top: 20px;margin-bottom: 20px;\">\n                                    <ul style=\"list-style:none;padding:0px; margin:0px;\">\n                                      <li\n                                        style=\"list-style:none;padding:0px; margin:0px;display:inline;color: #999999;\">\n                                        💡 <a style=\"font-size: 10px;color: #999999;text-decoration: none; \"\n                                          href=\"https://docs.infinilabs.com/console/main/zh/docs/tutorials/cluster_node_jvm_usage/\"\n                                          target=\"_blank\">How to monitor the JVM usage of cluster nodes </a></li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;color: #999999; \">\n                                        | <a style=\"font-size: 10px;color: #999999;text-decoration: none; \"\n                                          href=\"https://docs.infinilabs.com/console/main/zh/docs/tutorials/cluster_health_change/\"\n                                          target=\"_blank\">How to monitor cluster health status </a>\n                                      </li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;color: #999999; \">\n                                        | <a style=\"font-size: 10px;color: #999999;text-decoration: none; \"\n                                          href=\"https://docs.infinilabs.com/console/main/zh/docs/\"\n                                          target=\"_blank\">Learn more ... </a>\n                                      </li>\n                                    </ul>\n                                  </div>\n                                  <p />\n                                  <p\n                                    style=\"mso-line-height-rule:exactly; line-height:175%; margin-top:30px;margin-bottom:30px;position: relative;\">\n                                  <div style=\"float: left;\">\n                                    <img alt=\"INFINI Labs\" src=\"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iX+WbvuWxgl8yIiBkYXRhLW5hbWU9IuWbvuWxgiAyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMzkuNTkgNDUuMjMiPgogIDxkZWZzPgogICAgPHN0eWxlPgogICAgICAuY2xzLTEgewogICAgICAgIGZpbGw6ICMwMDVmZTg7CiAgICAgIH0KICAgIDwvc3R5bGU+CiAgPC9kZWZzPgogIDxnIGlkPSJf5Zu+5bGCXzEtMiIgZGF0YS1uYW1lPSLlm77lsYIgMSI+CiAgICA8Zz4KICAgICAgPGc+CiAgICAgICAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNMTg1Ljc1LDE4LjUydjE1LjQ4aDYuMDN2Mi4zNmgtOC45NlYxOC41MmgyLjkzWiIvPgogICAgICAgIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTE5OS45MiwyMS45OWMyLjM5LDAsNC4wMywxLjEzLDQuOSwyLjI4di0yLjA1aDIuOTV2MTQuMTRoLTIuOTV2LTIuMWMtLjksMS4yMS0yLjU5LDIuMzQtNC45NSwyLjM0LTMuNjcsMC02LjYyLTMtNi42Mi03LjM3czIuOTUtNy4yNCw2LjY3LTcuMjRabS42MiwyLjU0Yy0yLjE4LDAtNC4yOSwxLjY0LTQuMjksNC43czIuMTEsNC44Myw0LjI5LDQuODMsNC4yOS0xLjcyLDQuMjktNC43OC0yLjA4LTQuNzUtNC4yOS00Ljc1WiIvPgogICAgICAgIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTIxOS40OSwyMS45OWMzLjc1LDAsNi42NSwyLjg4LDYuNjUsNy4yNHMtMi45Myw3LjM3LTYuNjUsNy4zN2MtMi4zNCwwLTQtMS4wNS00LjkzLTIuMjh2Mi4wNWgtMi45M1YxNy4zN2gyLjkzdjYuOTZjLjkyLTEuMjgsMi43LTIuMzQsNC45My0yLjM0Wm0tLjY0LDIuNTRjLTIuMTgsMC00LjI5LDEuNzItNC4yOSw0Ljc1czIuMTEsNC43OCw0LjI5LDQuNzgsNC4zMS0xLjc3LDQuMzEtNC44My0yLjExLTQuNy00LjMxLTQuN1oiLz4KICAgICAgICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0yMzQuMTcsMzYuNmMtMy4zOSwwLTUuNzgtMi01LjktNC41N2gzLjAzYy4xLDEuMTYsMS4yMSwyLjEsMi44MiwyLjFzMi41OS0uNzIsMi41OS0xLjY5YzAtMi43Ny04LjIxLTEuMTgtOC4yMS02LjM3LDAtMi4yNiwyLjExLTQuMDgsNS40NC00LjA4czUuMzEsMS43Miw1LjQ3LDQuNTRoLTIuOTNjLS4xLTEuMjMtMS4wNS0yLjA4LTIuNjQtMi4wOHMtMi4zOSwuNjQtMi4zOSwxLjU5YzAsMi44NSw3Ljk4LDEuMjYsOC4xNCw2LjM3LDAsMi4zOS0yLjA4LDQuMTgtNS40Miw0LjE4WiIvPgogICAgICA8L2c+CiAgICAgIDxnPgogICAgICAgIDxwYXRoIGQ9Ik01MC4yNSwzNi41M2w1Ljk5LTI3Ljk3aDcuMzFsLTUuOTksMjcuOTdoLTcuMzFaIi8+CiAgICAgICAgPHBhdGggZD0iTTYyLjk0LDM2LjUzbDYuMTktMjguODhoLjdsMTUuNTgsMTYuMzIsMy4zLTE1LjQxaDYuNzRsLTYuMjIsMjkuMDNoLS42M2wtMTUuNjQtMTYuMzItMy4yNywxNS4yNmgtNi43NFoiLz4KICAgICAgICA8cGF0aCBkPSJNOTUuMzgsMzYuNTNsNS45OS0yNy45N2gxOS4wNGwtMS4yMiw1LjY5aC0xMS43N2wtMS4xOSw1LjU4aDEwLjUybC0xLjIxLDUuNjVoLTEwLjUybC0yLjM3LDExLjA1aC03LjI3WiIvPgogICAgICAgIDxwYXRoIGQ9Ik0xMTkuMzUsMzYuNTNsNS45OS0yNy45N2g3LjMxbC01Ljk5LDI3Ljk3aC03LjMxWiIvPgogICAgICAgIDxwYXRoIGQ9Ik0xMzEuNzcsMzYuNTNsNi4xOS0yOC44OGguN2wxNS41OCwxNi4zMiwzLjMtMTUuNDFoNi43NGwtNi4yMiwyOS4wM2gtLjYzbC0xNC45OS0xNi4zMi0zLjMyLDE1LjI2aC03LjM1WiIvPgogICAgICAgIDxwYXRoIGQ9Ik0xNjQuMDgsMzYuNTNsNS45OS0yNy45N2g3LjMxbC01Ljk5LDI3Ljk3aC03LjMxWiIvPgogICAgICA8L2c+CiAgICAgIDxnPgogICAgICAgIDxwYXRoIGQ9Ik0yMi42Miw0NS4yM0MxMC4xNSw0NS4yMywwLDM1LjA5LDAsMjIuNjJTMTAuMTUsMCwyMi42MiwwczIyLjYyLDEwLjE1LDIyLjYyLDIyLjYyLTEwLjE1LDIyLjYyLTIyLjYyLDIyLjYyWm0wLTQyLjc4QzExLjUsMi40NSwyLjQ1LDExLjUsMi40NSwyMi42MnM5LjA1LDIwLjE3LDIwLjE3LDIwLjE3LDIwLjE3LTkuMDUsMjAuMTctMjAuMTdTMzMuNzQsMi40NSwyMi42MiwyLjQ1WiIvPgogICAgICAgIDxnPgogICAgICAgICAgPHBhdGggZD0iTTM1LjM4LDEwLjM3Yy0xLjg3LTIuMDQtNC4yMS0zLjY1LTYuODUtNC42MywwLC4wMSwwLC4wMiwwLC4wMmwtMy4xNCwxNC41NC0xMS4yMi03Ljk4LTEuNTYsNy40NiwxOC4xLDEyLjY2LDQuNjktMjIuMDciLz4KICAgICAgICAgIDxwYXRoIGQ9Ik0xOC42NiwyOC4wN2wtNi44LTQuOC0yLjQsMTEuMTNjMS44OSwyLjAxLDQuMjQsMy41Nyw2Ljg4LDQuNTNsMi4zMi0xMC44NloiLz4KICAgICAgICA8L2c+CiAgICAgIDwvZz4KICAgIDwvZz4KICA8L2c+Cjwvc3ZnPg==\"\n                                      style=\"outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; max-width:100%; \"\n                                      width=\"160\" height=\"28\" align=\"middle\">\n                                  </div>\n                                  <div style=\"float: right;\">\n                                    <ul style=\"list-style:none;padding:0px; margin:0px;\">\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;\">\n                                        <a title=\"Website\" href=\"https://infinilabs.com\" target=\"_blank\"\n                                          style=\"padding-left: 10;text-decoration:none; \">\n                                          <img alt=\"tips\" src=\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBmaWxsPSJub25lIiB2ZXJzaW9uPSIxLjEiIHdpZHRoPSIyOCIgaGVpZ2h0PSIyOCIgdmlld0JveD0iMCAwIDI4IDI4Ij48Zz48ZyBzdHlsZT0ib3BhY2l0eTowOyI+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjI4IiBoZWlnaHQ9IjI4IiByeD0iMCIgZmlsbD0iI0Q4RDhEOCIgZmlsbC1vcGFjaXR5PSIxIi8+PC9nPjxnPjxwYXRoIGQ9Ik0yNCwxNFEyNCwxNC4yNDU1LDIzLjk4OCwxNC40OTA3UTIzLjk3NTksMTQuNzM1OSwyMy45NTE4LDE0Ljk4MDJRMjMuOTI3OCwxNS4yMjQ1LDIzLjg5MTgsMTUuNDY3M1EyMy44NTU3LDE1LjcxMDEsMjMuODA3OCwxNS45NTA5UTIzLjc2LDE2LjE5MTcsMjMuNzAwMywxNi40Mjk4UTIzLjY0MDcsMTYuNjY3OSwyMy41Njk0LDE2LjkwMjhRMjMuNDk4MSwxNy4xMzc4LDIzLjQxNTQsMTcuMzY4OVEyMy4zMzI3LDE3LjYsMjMuMjM4OCwxNy44MjY4UTIzLjE0NDgsMTguMDUzNiwyMy4wMzk5LDE4LjI3NTVRMjIuOTM0OSwxOC40OTc1MDAwMDAwMDAwMDIsMjIuODE5MiwxOC43MTRRMjIuNzAzNSwxOC45MzA1MDAwMDAwMDAwMDIsMjIuNTc3MywxOS4xNDFRMjIuNDUxMSwxOS4zNTE1OTk5OTk5OTk5OTgsMjIuMzE0NywxOS41NTU3UTIyLjE3ODMsMTkuNzU5OCwyMi4wMzIxLDE5Ljk1N1EyMS44ODU4LDIwLjE1NDIsMjEuNzMwMSwyMC4zNDM5UTIxLjU3NDQsMjAuNTMzNywyMS40MDk1LDIwLjcxNTZRMjEuMjQ0NiwyMC44OTc1LDIxLjA3MTEsMjEuMDcxMVEyMC44OTc1LDIxLjI0NDYsMjAuNzE1NiwyMS40MDk1UTIwLjUzMzcsMjEuNTc0NCwyMC4zNDM5LDIxLjczMDFRMjAuMTU0MiwyMS44ODU4LDE5Ljk1NywyMi4wMzIxUTE5Ljc1OTgsMjIuMTc4MywxOS41NTU3LDIyLjMxNDdRMTkuMzUxNTk5OTk5OTk5OTk4LDIyLjQ1MTEsMTkuMTQxLDIyLjU3NzNRMTguOTMwNTAwMDAwMDAwMDAyLDIyLjcwMzUsMTguNzE0LDIyLjgxOTJRMTguNDk3NTAwMDAwMDAwMDAyLDIyLjkzNDksMTguMjc1NSwyMy4wMzk5UTE4LjA1MzYsMjMuMTQ0OCwxNy44MjY4LDIzLjIzODhRMTcuNiwyMy4zMzI3LDE3LjM2ODksMjMuNDE1NFExNy4xMzc4LDIzLjQ5ODEsMTYuOTAyOCwyMy41Njk0UTE2LjY2NzksMjMuNjQwNywxNi40Mjk4LDIzLjcwMDNRMTYuMTkxNywyMy43NiwxNS45NTA5LDIzLjgwNzhRMTUuNzEwMSwyMy44NTU3LDE1LjQ2NzMsMjMuODkxOFExNS4yMjQ1LDIzLjkyNzgsMTQuOTgwMiwyMy45NTE4UTE0LjczNTksMjMuOTc1OSwxNC40OTA3LDIzLjk4OFExNC4yNDU1LDI0LDE0LDI0UTEzLjc1NDUxLDI0LDEzLjUwOTMyLDIzLjk4OFExMy4yNjQxMywyMy45NzU5LDEzLjAxOTgzLDIzLjk1MThRMTIuNzc1NTIsMjMuOTI3OCwxMi41MzI2OSwyMy44OTE4UTEyLjI4OTg3LDIzLjg1NTcsMTIuMDQ5MSwyMy44MDc4UTExLjgwODMzLDIzLjc2LDExLjU3MDIsMjMuNzAwM1ExMS4zMzIwNywyMy42NDA3LDExLjA5NzE1LDIzLjU2OTRRMTAuODYyMjQsMjMuNDk4MSwxMC42MzExLDIzLjQxNTRRMTAuMzk5OTYsMjMuMzMyNywxMC4xNzMxNiwyMy4yMzg4UTkuOTQ2MzYsMjMuMTQ0OCw5LjcyNDQ1MDAwMDAwMDAwMSwyMy4wMzk5UTkuNTAyNTMsMjIuOTM0OSw5LjI4NjAzLDIyLjgxOTJROS4wNjk1MywyMi43MDM1LDguODU4OTcsMjIuNTc3M1E4LjY0ODQxLDIyLjQ1MTEsOC40NDQzLDIyLjMxNDdROC4yNDAxNzk5OTk5OTk5OTksMjIuMTc4Myw4LjA0MzAwOTk5OTk5OTk5OSwyMi4wMzIxUTcuODQ1ODI5OTk5OTk5OTk5LDIxLjg4NTgsNy42NTYwNywyMS43MzAxUTcuNDY2MywyMS41NzQ0LDcuMjg0NDA5OTk5OTk5OTk5LDIxLjQwOTVRNy4xMDI1MiwyMS4yNDQ2LDYuOTI4OTI5OTk5OTk5OTk5LDIxLjA3MTFRNi43NTUzNSwyMC44OTc1LDYuNTkwNDksMjAuNzE1NlE2LjQyNTYzLDIwLjUzMzcsNi4yNjk5LDIwLjM0MzlRNi4xMTQxNiwyMC4xNTQyLDUuOTY3OTE5OTk5OTk5OTk5NCwxOS45NTdRNS44MjE2OSwxOS43NTk4LDUuNjg1MywxOS41NTU3UTUuNTQ4OTIsMTkuMzUxNTk5OTk5OTk5OTk4LDUuNDIyNzEsMTkuMTQxUTUuMjk2NTEsMTguOTMwNTAwMDAwMDAwMDAyLDUuMTgwNzksMTguNzE0UTUuMDY1MDcsMTguNDk3NTAwMDAwMDAwMDAyLDQuOTYwMTA3LDE4LjI3NTVRNC44NTUxNDgsMTguMDUzNiw0Ljc2MTIwNSwxNy44MjY4UTQuNjY3MjYxLDE3LjYsNC41ODQ1NTkwMDAwMDAwMDA1LDE3LjM2ODlRNC41MDE4NTcsMTcuMTM3OCw0LjQzMDU5NywxNi45MDI4UTQuMzU5MzM2LDE2LjY2NzksNC4yOTk2ODcsMTYuNDI5OFE0LjI0MDAzOSwxNi4xOTE3LDQuMTkyMTQ3LDE1Ljk1MDlRNC4xNDQyNTUsMTUuNzEwMSw0LjEwODIzNSwxNS40NjczUTQuMDcyMjE0NiwxNS4yMjQ1LDQuMDQ4MTUyNywxNC45ODAyUTQuMDI0MDkwOSwxNC43MzU5LDQuMDEyMDQ1NCwxNC40OTA3UTQsMTQuMjQ1NSw0LDE0UTQsMTMuNzU0NTEsNC4wMTIwNDU0LDEzLjUwOTMyUTQuMDI0MDkwOSwxMy4yNjQxMyw0LjA0ODE1MjcsMTMuMDE5ODNRNC4wNzIyMTQ2LDEyLjc3NTUyLDQuMTA4MjM1LDEyLjUzMjY5UTQuMTQ0MjU1LDEyLjI4OTg3LDQuMTkyMTQ3LDEyLjA0OTFRNC4yNDAwMzksMTEuODA4MzMsNC4yOTk2ODcsMTEuNTcwMlE0LjM1OTMzNiwxMS4zMzIwNyw0LjQzMDU5NywxMS4wOTcxNVE0LjUwMTg1NywxMC44NjIyNCw0LjU4NDU1OTAwMDAwMDAwMDUsMTAuNjMxMVE0LjY2NzI2MSwxMC4zOTk5Niw0Ljc2MTIwNSwxMC4xNzMxNlE0Ljg1NTE0OCw5Ljk0NjM2LDQuOTYwMTA3LDkuNzI0NDUwMDAwMDAwMDAxUTUuMDY1MDcsOS41MDI1Myw1LjE4MDc5LDkuMjg2MDNRNS4yOTY1MSw5LjA2OTUzLDUuNDIyNzEsOC44NTg5N1E1LjU0ODkyLDguNjQ4NDEsNS42ODUzLDguNDQ0M1E1LjgyMTY5LDguMjQwMTc5OTk5OTk5OTk5LDUuOTY3OTE5OTk5OTk5OTk5NCw4LjA0MzAwOTk5OTk5OTk5OVE2LjExNDE2LDcuODQ1ODI5OTk5OTk5OTk5LDYuMjY5OSw3LjY1NjA3UTYuNDI1NjMsNy40NjYzLDYuNTkwNDksNy4yODQ0MDk5OTk5OTk5OTlRNi43NTUzNSw3LjEwMjUyLDYuOTI4OTI5OTk5OTk5OTk5LDYuOTI4OTI5OTk5OTk5OTk5UTcuMTAyNTIsNi43NTUzNSw3LjI4NDQwOTk5OTk5OTk5OSw2LjU5MDQ5UTcuNDY2Myw2LjQyNTYzLDcuNjU2MDcsNi4yNjk5UTcuODQ1ODI5OTk5OTk5OTk5LDYuMTE0MTYsOC4wNDMwMDk5OTk5OTk5OTksNS45Njc5MTk5OTk5OTk5OTk0UTguMjQwMTc5OTk5OTk5OTk5LDUuODIxNjksOC40NDQzLDUuNjg1M1E4LjY0ODQxLDUuNTQ4OTIsOC44NTg5Nyw1LjQyMjcxUTkuMDY5NTMsNS4yOTY1MSw5LjI4NjAzLDUuMTgwNzlROS41MDI1Myw1LjA2NTA3LDkuNzI0NDUwMDAwMDAwMDAxLDQuOTYwMTA3UTkuOTQ2MzYsNC44NTUxNDgsMTAuMTczMTYsNC43NjEyMDVRMTAuMzk5OTYsNC42NjcyNjEsMTAuNjMxMSw0LjU4NDU1OTAwMDAwMDAwMDVRMTAuODYyMjQsNC41MDE4NTcsMTEuMDk3MTUsNC40MzA1OTdRMTEuMzMyMDcsNC4zNTkzMzYsMTEuNTcwMiw0LjI5OTY4N1ExMS44MDgzMyw0LjI0MDAzOSwxMi4wNDkxLDQuMTkyMTQ3UTEyLjI4OTg3LDQuMTQ0MjU1LDEyLjUzMjY5LDQuMTA4MjM1UTEyLjc3NTUyLDQuMDcyMjE0NiwxMy4wMTk4Myw0LjA0ODE1MjdRMTMuMjY0MTMsNC4wMjQwOTA5LDEzLjUwOTMyLDQuMDEyMDQ1NFExMy43NTQ1MSw0LDE0LDRRMTQuMjQ1NSw0LDE0LjQ5MDcsNC4wMTIwNDU0UTE0LjczNTksNC4wMjQwOTA5LDE0Ljk4MDIsNC4wNDgxNTI3UTE1LjIyNDUsNC4wNzIyMTQ2LDE1LjQ2NzMsNC4xMDgyMzVRMTUuNzEwMSw0LjE0NDI1NSwxNS45NTA5LDQuMTkyMTQ3UTE2LjE5MTcsNC4yNDAwMzksMTYuNDI5OCw0LjI5OTY4N1ExNi42Njc5LDQuMzU5MzM2LDE2LjkwMjgsNC40MzA1OTdRMTcuMTM3OCw0LjUwMTg1NywxNy4zNjg5LDQuNTg0NTU5MDAwMDAwMDAwNVExNy42LDQuNjY3MjYxLDE3LjgyNjgsNC43NjEyMDVRMTguMDUzNiw0Ljg1NTE0OCwxOC4yNzU1LDQuOTYwMTA3UTE4LjQ5NzUwMDAwMDAwMDAwMiw1LjA2NTA3LDE4LjcxNCw1LjE4MDc5UTE4LjkzMDUwMDAwMDAwMDAwMiw1LjI5NjUxLDE5LjE0MSw1LjQyMjcxUTE5LjM1MTU5OTk5OTk5OTk5OCw1LjU0ODkyLDE5LjU1NTcsNS42ODUzUTE5Ljc1OTgsNS44MjE2OSwxOS45NTcsNS45Njc5MTk5OTk5OTk5OTk0UTIwLjE1NDIsNi4xMTQxNiwyMC4zNDM5LDYuMjY5OVEyMC41MzM3LDYuNDI1NjMsMjAuNzE1Niw2LjU5MDQ5UTIwLjg5NzUsNi43NTUzNSwyMS4wNzExLDYuOTI4OTI5OTk5OTk5OTk5UTIxLjI0NDYsNy4xMDI1MiwyMS40MDk1LDcuMjg0NDA5OTk5OTk5OTk5UTIxLjU3NDQsNy40NjYzLDIxLjczMDEsNy42NTYwN1EyMS44ODU4LDcuODQ1ODI5OTk5OTk5OTk5LDIyLjAzMjEsOC4wNDMwMDk5OTk5OTk5OTlRMjIuMTc4Myw4LjI0MDE3OTk5OTk5OTk5OSwyMi4zMTQ3LDguNDQ0M1EyMi40NTExLDguNjQ4NDEsMjIuNTc3Myw4Ljg1ODk3UTIyLjcwMzUsOS4wNjk1MywyMi44MTkyLDkuMjg2MDNRMjIuOTM0OSw5LjUwMjUzLDIzLjAzOTksOS43MjQ0NTAwMDAwMDAwMDFRMjMuMTQ0OCw5Ljk0NjM2LDIzLjIzODgsMTAuMTczMTZRMjMuMzMyNywxMC4zOTk5NiwyMy40MTU0LDEwLjYzMTFRMjMuNDk4MSwxMC44NjIyNCwyMy41Njk0LDExLjA5NzE1UTIzLjY0MDcsMTEuMzMyMDcsMjMuNzAwMywxMS41NzAyUTIzLjc2LDExLjgwODMzLDIzLjgwNzgsMTIuMDQ5MVEyMy44NTU3LDEyLjI4OTg3LDIzLjg5MTgsMTIuNTMyNjlRMjMuOTI3OCwxMi43NzU1MiwyMy45NTE4LDEzLjAxOTgzUTIzLjk3NTksMTMuMjY0MTMsMjMuOTg4LDEzLjUwOTMyUTI0LDEzLjc1NDUxLDI0LDE0Wk0xMC41NjgwOCw4Ljk4OTExQzExLjQxMTM5LDkuMzYxNDMsMTIuMzI2MzQsOS41OTU1OCwxMy4yODU3Miw5LjY3NTk0TDEzLjI4NTcyLDUuNTczNDlDMTIuMjYwMjcsNS45NzEwMywxMS4yNTExMiw3LjE5MTU3MDAwMDAwMDAwMDUsMTAuNTY4MDgsOC45ODkxMVpNMTQuNzE0Myw5LjY3NTk0TDE0LjcxNDMsNS41NzM0OUMxNS43Mzk3LDUuOTcwODEsMTYuNzQ4OSw3LjE5MTc5LDE3LjQzMTksOC45ODkxMUMxNi41ODg2LDkuMzYxNjYsMTUuNjczNyw5LjU5NTgxLDE0LjcxNDMsOS42NzU5NFpNMTcuNTkyOSw2LjIyODM5QzE4LjMzOTEwMDAwMDAwMDAwMiw2LjU3NDgsMTkuMDMxNyw3LjAyNjY3LDE5LjY0OTMsNy41NzAxM0MxOS4zNDg5LDcuODM1MDksMTkuMDI0Niw4LjA3MTkyLDE4LjY4OTMsOC4yOTMzNUMxOC4zODA0LDcuNTE4MTMsMTguMDExNiw2LjgyMjM2OTk5OTk5OTk5OSwxNy41OTI5LDYuMjI4MzlaTTkuMzEwOTQsOC4yOTM0N0M4Ljk3NTY3MDAwMDAwMDAwMSw4LjA3MTgxOTk5OTk5OTk5OSw4LjY1MTM0MDAwMDAwMDAwMSw3LjgzNTIxLDguMzUwODksNy41NzAyNkM4Ljk2ODQ5OTk5OTk5OTk5OSw3LjAyNjcxLDkuNjYxMDgsNi41NzQ4NCwxMC40MDczNiw2LjIyODUyQzkuOTg4Mzg5OTk5OTk5OTk5LDYuODIyMjcsOS42MTk2NCw3LjUxODAyLDkuMzEwOTQsOC4yOTM0N1pNOC44NDc5OTk5OTk5OTk5OTksOS42OTY0QzguNTQ3MTEsMTAuNzk3NTA5OTk5OTk5OTk5LDguMzU4MjcwMDAwMDAwMDAxLDEyLjAwNjg5LDguMzA2NDgsMTMuMjg1NjhMNS40NjQ5NywxMy4yODU2OEM1LjYxMTg0LDExLjUxNzE2LDYuMjkzNTQsOS44OTkwOCw3LjM1MzgxLDguNTk3MjkwMDAwMDAwMDAxQzcuODE0NTIsOS4wMDkzNCw4LjMxNjc0OTk5OTk5OTk5OSw5LjM3NDMsOC44NDc5OTk5OTk5OTk5OTksOS42OTY0Wk0xOS42OTM3LDEzLjI4NTY4QzE5LjY0MiwxMi4wMDY4OSwxOS40NTMxLDEwLjc5NzUwOTk5OTk5OTk5OSwxOS4xNTIyLDkuNjk2NEMxOS42ODM1MDAwMDAwMDAwMDIsOS4zNzQzLDIwLjE4NTUsOS4wMDkzNCwyMC42NDY2LDguNTk3MjkwMDAwMDAwMDAxQzIxLjcwNjksOS44OTkwOCwyMi4zODg2LDExLjUxNzE2LDIyLjUzNTUsMTMuMjg1NjhMMTkuNjkzNywxMy4yODU2OFpNMTMuMjg1NzIsMTEuMTA0NjRMMTMuMjg1NzIsMTMuMjg1NjdMOS43MzQxNiwxMy4yODU2N0M5Ljc3OTkyLDEyLjIyNjUyLDkuOTI0MzQsMTEuMjQ0NiwxMC4xNDQ2NSwxMC4zNTc1NEMxMS4xMjIxMSwxMC43NjkzNywxMi4xNzgxMywxMS4wMjU2MiwxMy4yODU3MiwxMS4xMDQ2NFpNMTQuNzE0MywxMy4yODU2N0wxNC43MTQzLDExLjEwNDY0QzE1LjgyMTksMTEuMDI1NjIsMTYuODc3OSwxMC43NjkzNywxNy44NTU0LDEwLjM1NzU0QzE4LjA3NTksMTEuMjQ0NiwxOC4yMjAxMDAwMDAwMDAwMDIsMTIuMjI2NTIsMTguMjY1OTAwMDAwMDAwMDAyLDEzLjI4NTY3TDE0LjcxNDMsMTMuMjg1NjdaTTguMzA2MjUsMTQuNzE0MkM4LjM1ODAzOTk5OTk5OTk5OSwxNS45OTMsOC41NDY4NywxNy4yMDI0LDguODQ3NzcsMTguMzAzNUM4LjMxNjUyLDE4LjYyNTYsNy44MTQ1MSwxOC45OTA2LDcuMzUzMzUsMTkuNDAyNkM2LjI5MzA4LDE4LjEwMDgsNS42MTEzODAwMDAwMDAwMDA1LDE2LjQ4Mjc5OTk5OTk5OTk5Nyw1LjQ2NDUxLDE0LjcxNDJMOC4zMDYyNSwxNC43MTQyWk0xMy4yODU3MiwxNC43MTQyTDEzLjI4NTcyLDE2Ljg5NTNDMTIuMTc4MTMsMTYuOTc0MywxMS4xMjIxMSwxNy4yMzA1LDEwLjE0NDY1LDE3LjY0MjQwMDAwMDAwMDAwMkM5LjkyNDEyLDE2Ljc1NTMsOS43Nzk5MiwxNS43NzM0LDkuNzM0MTYsMTQuNzE0MkwxMy4yODU3MiwxNC43MTQyWk0xNC43MTQzLDE2Ljg5NTNMMTQuNzE0MywxNC43MTQyTDE4LjI2NTkwMDAwMDAwMDAwMiwxNC43MTQyQzE4LjIyMDEwMDAwMDAwMDAwMiwxNS43NzM0LDE4LjA3NTksMTYuNzU1MywxNy44NTU0LDE3LjY0MjQwMDAwMDAwMDAwMkMxNi44Nzc5LDE3LjIzMDMsMTUuODIxOSwxNi45NzQzLDE0LjcxNDMsMTYuODk1M1pNMTkuMTUyLDE4LjMwMzVDMTkuNDUyOSwxNy4yMDI0LDE5LjY0MTcsMTUuOTkzLDE5LjY5MzUsMTQuNzE0MkwyMi41MzUsMTQuNzE0MkMyMi4zODgyLDE2LjQ4Mjc5OTk5OTk5OTk5NywyMS43MDY1LDE4LjEwMDgsMjAuNjQ2MiwxOS40MDI2QzIwLjE4NTUsMTguOTkwNiwxOS42ODMzLDE4LjYyNTYsMTkuMTUyLDE4LjMwMzVaTTEzLjI4NTcyLDIyLjQyNjZMMTMuMjg1NzIsMTguMzI0MUMxMi4zMjYzNCwxOC40MDQyLDExLjQxMTM5LDE4LjYzODQsMTAuNTY4MDgsMTkuMDEwOUMxMS4yNTExMiwyMC44MDgyLDEyLjI2MDI3LDIyLjAyOSwxMy4yODU3MiwyMi40MjY2Wk0xNC43MTQzLDE4LjMyNDFDMTUuNjczNywxOC40MDQ1LDE2LjU4ODYsMTguNjM4NiwxNy40MzE5LDE5LjAxMDlDMTYuNzQ4OSwyMC44MDg1LDE1LjczOTcsMjIuMDI5MiwxNC43MTQzLDIyLjQyNjZMMTQuNzE0MywxOC4zMjQxWk05LjMxMDk0LDE5LjcwNjQwMDAwMDAwMDAwMkM5LjYxOTY0LDIwLjQ4MTksOS45ODgzODk5OTk5OTk5OTksMjEuMTc3OCwxMC40MDczNiwyMS43NzE2QzkuNjYxMTMsMjEuNDI1Miw4Ljk2ODU1LDIwLjk3MzMsOC4zNTA4OSwyMC40Mjk5QzguNjUxMzQwMDAwMDAwMDAxLDIwLjE2NDcsOC45NzU2NzAwMDAwMDAwMDEsMTkuOTI3Nzk5OTk5OTk5OTk4LDkuMzEwOTQsMTkuNzA2NDAwMDAwMDAwMDAyWk0xOC42ODksMTkuNzA2NDAwMDAwMDAwMDAyQzE5LjAyNDMsMTkuOTI4MSwxOS4zNDg1OTk5OTk5OTk5OTgsMjAuMTY0NywxOS42NDkxLDIwLjQyOTZDMTkuMDMxNSwyMC45NzMyLDE4LjMzODkwMDAwMDAwMDAwMiwyMS40MjUxLDE3LjU5MjU5OTk5OTk5OTk5NywyMS43NzE0QzE4LjAxMTYsMjEuMTc3NiwxOC4zODAzLDIwLjQ4MTksMTguNjg5LDE5LjcwNjQwMDAwMDAwMDAwMloiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZmlsbD0iI0Q4RDhEOCIgZmlsbC1vcGFjaXR5PSIxIi8+PC9nPjwvZz48L3N2Zz4=\"\n                                            style=\"outline:none; -ms-interpolation-mode:bicubic; max-width:100%;\"\n                                            width=\"28\" height=\"28\" align=\"middle\">\n                                        </a>\n                                      </li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;\">\n                                        <a title=\"Discord\" href=\"https://discord.com/invite/4tKTMkkvVX\" target=\"_blank\"\n                                          style=\"padding-left: 10;text-decoration:none; \">\n                                          <img alt=\"tips\" src=\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBmaWxsPSJub25lIiB2ZXJzaW9uPSIxLjEiIHdpZHRoPSIyOCIgaGVpZ2h0PSIyOCIgdmlld0JveD0iMCAwIDI4IDI4Ij48Zz48ZyBzdHlsZT0ib3BhY2l0eTowOyI+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjI4IiBoZWlnaHQ9IjI4IiByeD0iMCIgZmlsbD0iI0Q4RDhEOCIgZmlsbC1vcGFjaXR5PSIxIi8+PC9nPjxnPjxwYXRoIGQ9Ik0yMS45NzQzLDcuNDI5MjJDMjEuOTg2OSw3LjQzNDQyLDIxLjk5NzIsNy40NDM5NywyMi4wMDM0LDcuNDU2MTZDMjQuNTM0NiwxMS4yMTM0NCwyNS43ODQ3LDE1LjQ1MTc5LDI1LjMxNzIsMjAuMzMxMUMyNS4zMTU0LDIwLjM1MTgsMjUuMzA0OCwyMC4zNzA4LDI1LjI4ODEsMjAuMzgzMUMyMy41OTQsMjEuNjQ5OTAwMDAwMDAwMDAyLDIxLjY5ODEsMjIuNjE1NCwxOS42ODIyLDIzLjIzODJDMTkuNjUzLDIzLjI0NzIsMTkuNjIxNCwyMy4yMzY0LDE5LjYwMzYsMjMuMjExMkMxOS4xNzcyLDIyLjYxNDEsMTguNzk0OSwyMS45ODYyLDE4LjQ1OTUsMjEuMzMyNkMxOC40NTAyMDAwMDAwMDAwMDIsMjEuMzE0MywxOC40NDg5OTk5OTk5OTk5OTgsMjEuMjkyOSwxOC40NTYzLDIxLjI3MzY5OTk5OTk5OTk5OEMxOC40NjM2LDIxLjI1NDUsMTguNDc4NiwyMS4yMzk0LDE4LjQ5NzYsMjEuMjMyMTAwMDAwMDAwMDAzQzE5LjEwMzEsMjEuMDAyMjk5OTk5OTk5OTk4LDE5LjY4ODMsMjAuNzIxMiwyMC4yNDY5LDIwLjM5MkMyMC4yNjc1LDIwLjM3OTYsMjAuMjgwNSwyMC4zNTc1OTk5OTk5OTk5OTgsMjAuMjgxOCwyMC4zMzM1QzIwLjI4MywyMC4zMDkzLDIwLjI3MjMsMjAuMjg2MDk5OTk5OTk5OTk4LDIwLjI1MzEsMjAuMjcxN0MyMC4xMzQ4LDIwLjE4MjcsMjAuMDE4NywyMC4wOTA4LDE5LjkwNSwxOS45OTYxQzE5Ljg4NDMsMTkuOTc5LDE5Ljg1NTcsMTkuOTc1NiwxOS44MzE2LDE5Ljk4NzA5OTk5OTk5OTk5OEMxNi4yMDY4OTk5OTk5OTk5OTcsMjEuNjc3MzAwMDAwMDAwMDAyLDEyLjIzNTY1LDIxLjY3NzMwMDAwMDAwMDAwMiw4LjU2NzUyLDE5Ljk4NzA5OTk5OTk5OTk5OEM4LjU0MzQ3OTk5OTk5OTk5OSwxOS45NzYzMDAwMDAwMDAwMDIsOC41MTU0MTk5OTk5OTk5OTksMTkuOTgwMSw4LjQ5NTA5MDAwMDAwMDAwMSwxOS45OTdDOC4zODE0NTAwMDAwMDAwMDEsMjAuMDkxMiw4LjI2NTY4LDIwLjE4MjgsOC4xNDc4NzAwMDAwMDAwMDEsMjAuMjcxN0M4LjEyODc5LDIwLjI4NjMsOC4xMTgxOSwyMC4zMDk2LDguMTE5NiwyMC4zMzM3QzguMTIxMDIsMjAuMzU3OSw4LjEzNDI2MDAwMDAwMDAwMSwyMC4zNzk3LDguMTU0OTIsMjAuMzkyQzguNzE0ODIsMjAuNzE4NSw5LjI5OTQ2LDIwLjk5OTcsOS45MDMzNSwyMS4yMzNDOS45MjIzOCwyMS4yNDAwMDAwMDAwMDAwMDIsOS45Mzc1MSwyMS4yNTQ5LDkuOTQ0OTM5OTk5OTk5OTk5LDIxLjI3NEM5Ljk1MjM1OTk5OTk5OTk5OSwyMS4yOTMsOS45NTEzNjAwMDAwMDAwMDEsMjEuMzE0Myw5Ljk0MjIsMjEuMzMyNkM5LjYxMjM3LDIxLjk4OTksOS4yMjk0MSwyMi42MTg2LDguNzk3MjIsMjMuMjEyM0M4Ljc3ODk4LDIzLjIzNjcsOC43NDc2LDIzLjI0NzEsOC43MTg1OCwyMy4yMzgzQzYuNzA2MzAwMDAwMDAwMDAxLDIyLjYxMzQsNC44MTM3Nzk5OTk5OTk5OTk1LDIxLjY0NzksMy4xMjE3ODQsMjAuMzgzMUMzLjEwNTM2NiwyMC4zNzAyLDMuMDk0ODQyOSwyMC4zNTExMDAwMDAwMDAwMDIsMy4wOTI2MjM1LDIwLjMzMDE5OTk5OTk5OTk5OEMyLjcwMjEzNCwxNi4xMDk3LDMuNDk4MTMyLDExLjgzNjM1OTk5OTk5OTk5OSw2LjQwMzg5MDAwMDAwMDAwMDUsNy40NTUyNzAwMDAwMDAwMDA1QzYuNDExLDcuNDQzNjcsNi40MjE0OSw3LjQzNDU4LDYuNDMzOTMsNy40MjkyNkM3Ljg4Njk1LDYuNzU1NTE2LDkuNDIwNjEsNi4yNzU0NjQsMTAuOTk2Myw2LjAwMTE4MTRDMTEuMDI1NTUsNS45OTY1Mjc3MywxMS4wNTQ2NCw2LjAxMDQyMDYsMTEuMDY5NjQsNi4wMzYyMDNDMTEuMjgzMjYsNi40MTc3NCwxMS40NzU4Niw2LjgxMDg4OCwxMS42NDY1Nyw3LjIxMzg1QzEzLjM0NDksNi45NTM1NywxNS4wNzI0LDYuOTUzNTcsMTYuNzcwNjk5OTk5OTk5OTk4LDcuMjEzODVDMTYuOTQwMyw2LjgxMTkwOCwxNy4xMjk5LDYuNDE4ODU4LDE3LjMzODcsNi4wMzYyMDNDMTcuMzUzMDk5OTk5OTk5OTk4LDYuMDA5Nzg4NjQsMTcuMzgyNiw1Ljk5NTY3MDksMTcuNDEyLDYuMDAxMTgxNEMxOC45ODc1LDYuMjc2MDQxLDIwLjUyMTEsNi43NTYwNTcsMjEuOTc0Myw3LjQyOTIyWk0xMC40OSwxNy43NjA0QzkuMzg1NjIsMTcuNzYwNCw4LjQ3NTY1LDE2LjczNzIsOC40NzU2NSwxNS40ODA1OUM4LjQ3NTY1LDE0LjIyMzk3LDkuMzY3OTcsMTMuMjAwNjgsMTAuNDksMTMuMjAwNjhDMTEuNjIwNzksMTMuMjAwNjgsMTIuNTIxOTYsMTQuMjMyODYsMTIuNTA0MzEsMTUuNDgwNTFDMTIuNTA0MzEsMTYuNzM3MiwxMS42MTE5NSwxNy43NjA0LDEwLjQ5LDE3Ljc2MDRaTTE3LjkzNzcsMTcuNzYwNEMxNi44MzMzLDE3Ljc2MDQsMTUuOTIzMywxNi43MzcyLDE1LjkyMzMsMTUuNDgwNTlDMTUuOTIzMywxNC4yMjM5NywxNi44MTU3LDEzLjIwMDY4LDE3LjkzNzcsMTMuMjAwNjhDMTkuMDY4NSwxMy4yMDA2OCwxOS45Njk3LDE0LjIzMjg2LDE5Ljk1MiwxNS40ODA1MUMxOS45NTIsMTYuNzM3MiwxOS4wNjg1LDE3Ljc2MDQsMTcuOTM3NywxNy43NjA0WiIgZmlsbC1ydWxlPSJldmVub2RkIiBmaWxsPSIjRDhEOEQ4IiBmaWxsLW9wYWNpdHk9IjEiLz48L2c+PC9nPjwvc3ZnPg==\"\n                                            style=\"outline:none; -ms-interpolation-mode:bicubic; max-width:100%;;\"\n                                            width=\"28\" height=\"28\" align=\"middle\">\n                                        </a>\n                                      </li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;\">\n                                        <a title=\"Github\" href=\"https://github.com/infinilabs\" target=\"_blank\"\n                                          style=\"padding-left: 10;text-decoration:none; \">\n                                          <img alt=\"tips\" src=\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBmaWxsPSJub25lIiB2ZXJzaW9uPSIxLjEiIHdpZHRoPSIyOCIgaGVpZ2h0PSIyOCIgdmlld0JveD0iMCAwIDI4IDI4Ij48Zz48ZyBzdHlsZT0ib3BhY2l0eTowOyI+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjI4IiBoZWlnaHQ9IjI4IiByeD0iMCIgZmlsbD0iI0Q4RDhEOCIgZmlsbC1vcGFjaXR5PSIxIi8+PC9nPjxnPjxwYXRoIGQ9Ik0xNC41MTg1NDgwNTk4NDQ5NywzLjExMTExMTE2NDA5MzAxNzZDOC43ODk3NDgwNTk4NDQ5NzEsMy4xMTExMTExNjQwOTMwMTc2LDQuMTQ4MTQ4MDU5ODQ0OTcxLDcuODY5OTIxMTY0MDkzMDE4LDQuMTQ4MTQ4MDU5ODQ0OTcxLDEzLjc0MzMxMTE2NDA5MzAxN0M0LjE0ODE0ODA1OTg0NDk3MSwxOC40MzkyMTExNjQwOTMwMTcsNy4xMTkyNTgwNTk4NDQ5NywyMi40MjYzMTExNjQwOTMwMiwxMS4yNDA2MTgwNTk4NDQ5NywyMy44MzI0MTExNjQwOTMwMTdDMTEuNzYwODY4MDU5ODQ0OTcsMjMuOTI5OTExMTY0MDkzMDE3LDExLjk0OTI1ODA1OTg0NDk3MiwyMy42MDM5MTExNjQwOTMwMTcsMTEuOTQ5MjU4MDU5ODQ0OTcyLDIzLjMyMDMxMTE2NDA5MzAxN0MxMS45NDkyNTgwNTk4NDQ5NzIsMjMuMDY2OTExMTY0MDkzMDE4LDExLjkzOTc0ODA1OTg0NDk3LDIyLjM5ODkxMTE2NDA5MzAyLDExLjkzNjI5ODA1OTg0NDk3LDIxLjUxMjgxMTE2NDA5MzAyQzkuMDQ5ODc4MDU5ODQ0OTcxLDIyLjE1MzQxMTE2NDA5MzAyLDguNDQyMzQ4MDU5ODQ0OTcsMjAuMDg3MjExMTY0MDkzMDE2LDguNDQyMzQ4MDU5ODQ0OTcsMjAuMDg3MjExMTY0MDkzMDE2QzcuOTY5NjI4MDU5ODQ0OTcxLDE4Ljg1ODMxMTE2NDA5MzAxNyw3LjI5MTIzODA1OTg0NDk3MSwxOC41Mjk2MTExNjQwOTMwMiw3LjI5MTIzODA1OTg0NDk3MSwxOC41Mjk2MTExNjQwOTMwMkM2LjM0OTI1ODA1OTg0NDk3MSwxNy44NzIyMTExNjQwOTMwMTcsNy4zNjIwOTgwNTk4NDQ5NzEsMTcuODg2NDExMTY0MDkzMDIsNy4zNjIwOTgwNTk4NDQ5NzEsMTcuODg2NDExMTY0MDkzMDJDOC40MDE3MjgwNTk4NDQ5NywxNy45NjI2MTExNjQwOTMwMiw4Ljk0ODc2ODA1OTg0NDk3MSwxOC45Nzk3MTExNjQwOTMwMiw4Ljk0ODc2ODA1OTg0NDk3MSwxOC45Nzk3MTExNjQwOTMwMkM5Ljg3MzQ1ODA1OTg0NDk3MSwyMC42MDY0MTExNjQwOTMwMTgsMTEuMzc1NDI4MDU5ODQ0OTcxLDIwLjEzNjAxMTE2NDA5MzAxNiwxMS45NjY1NDgwNTk4NDQ5NzEsMTkuODY1NzExMTY0MDkzMDE4QzEyLjA2MTYwODA1OTg0NDk3MSwxOS4xNzczMTExNjQwOTMwMTYsMTIuMzMxMjM4MDU5ODQ0OTcsMTguNzA5NTExMTY0MDkzMDE2LDEyLjYyNTA1ODA1OTg0NDk3LDE4LjQ0MzcxMTE2NDA5MzAxN0MxMC4zMjI4MzgwNTk4NDQ5NywxOC4xNzcwMTExNjQwOTMwMTcsNy45MDIyMTgwNTk4NDQ5NzEsMTcuMjYzNTExMTY0MDkzMDE4LDcuOTAyMjE4MDU5ODQ0OTcxLDEzLjE4OTYxMTE2NDA5MzAxOEM3LjkwMjIxODA1OTg0NDk3MSwxMi4wMjYyNDExNjQwOTMwMTcsOC4zMDc1MjgwNTk4NDQ5NywxMS4wNzgyMDExNjQwOTMwMTYsOC45Njg2MzgwNTk4NDQ5NywxMC4zMzM5NDExNjQwOTMwMThDOC44NjQwNzgwNTk4NDQ5NywxMC4wNjgxNDExNjQwOTMwMTcsOC41MDYyOTgwNTk4NDQ5NzEsOC45ODQ1NDExNjQwOTMwMTcsOS4wNjk3NTgwNTk4NDQ5NzIsNy41MjA4MzExNjQwOTMwMThDOS4wNjk3NTgwNTk4NDQ5NzIsNy41MjA4MzExNjQwOTMwMTgsOS45NDA4NjgwNTk4NDQ5Nyw3LjIzNzMwMTE2NDA5MzAxOCwxMS45MjI0NjgwNTk4NDQ5Nyw4LjYxMDYzMTE2NDA5MzAxOEMxMi43Njg2NzgwNTk4NDQ5NzEsOC4zNzQ4NzExNjQwOTMwMTksMTMuNjQxNjE4MDU5ODQ0OTcxLDguMjU1MTAxMTY0MDkzMDE2LDE0LjUxODU0ODA1OTg0NDk3LDguMjU0NDUxMTY0MDkzMDE4QzE1LjQwMDA0ODA1OTg0NDk3LDguMjU4MDAxMTY0MDkzMDE3LDE2LjI4NzU0ODA1OTg0NDk3Myw4LjM3NDk1MTE2NDA5MzAxOCwxNy4xMTQ1NDgwNTk4NDQ5Nyw4LjYxMDYzMTE2NDA5MzAxOEMxOS4wOTYxNDgwNTk4NDQ5Nyw3LjIzNzMwMTE2NDA5MzAxOCwxOS45NjM4NDgwNTk4NDQ5Nyw3LjUyMDgzMTE2NDA5MzAxOCwxOS45NjM4NDgwNTk4NDQ5Nyw3LjUyMDgzMTE2NDA5MzAxOEMyMC41MzA3NDgwNTk4NDQ5Nyw4Ljk4NDU0MTE2NDA5MzAxNywyMC4xNzY0NDgwNTk4NDQ5NzIsMTAuMDY4MTQxMTY0MDkzMDE3LDIwLjA2NzU0ODA1OTg0NDk3LDEwLjMzMzk0MTE2NDA5MzAxOEMyMC43MzI5NDgwNTk4NDQ5NzIsMTEuMDc4MjAxMTY0MDkzMDE2LDIxLjEzMTM0ODA1OTg0NDk3LDEyLjAyNjI0MTE2NDA5MzAxNywyMS4xMzEzNDgwNTk4NDQ5NywxMy4xODk2MTExNjQwOTMwMThDMjEuMTMxMzQ4MDU5ODQ0OTcsMTcuMjc0MTExMTY0MDkzMDE4LDE4LjcwODE0ODA1OTg0NDk3MywxOC4xNjk5MTExNjQwOTMwMTYsMTYuMzk5MDQ4MDU5ODQ0OTcyLDE4LjQzNjYxMTE2NDA5MzAxNkMxNi43NzA2NDgwNTk4NDQ5NzMsMTguNzYxODExMTY0MDkzMDE4LDE3LjEwMDc0ODA1OTg0NDk3LDE5LjQxMjExMTE2NDA5MzAxNiwxNy4xMDA3NDgwNTk4NDQ5NywyMC40MDI3MTExNjQwOTMwMTdDMTcuMTAwNzQ4MDU5ODQ0OTcsMjEuODI0NzExMTY0MDkzMDE3LDE3LjA5MTI0ODA1OTg0NDk3MiwyMi45NzAzMTExNjQwOTMwMiwxNy4wOTEyNDgwNTk4NDQ5NzIsMjMuMzIwMzExMTY0MDkzMDE3QzE3LjA5MTI0ODA1OTg0NDk3MiwyMy42MDM5MTExNjQwOTMwMTcsMTcuMjc2MTQ4MDU5ODQ0OTcsMjMuOTM2MTExMTY0MDkzMDE3LDE3LjgwMzM0ODA1OTg0NDk3LDIzLjgzMjQxMTE2NDA5MzAxN0MyMS45MjEyNDgwNTk4NDQ5NywyMi40MjM3MTExNjQwOTMwMTcsMjQuODg4ODQ4MDU5ODQ0OTcsMTguNDM5MjExMTY0MDkzMDE3LDI0Ljg4ODg0ODA1OTg0NDk3LDEzLjc0MzMxMTE2NDA5MzAxN0MyNC44ODg4NDgwNTk4NDQ5Nyw3Ljg2OTkyMTE2NDA5MzAxOCwyMC4yNDcyNDgwNTk4NDQ5NywzLjExMTExMTE2NDA5MzAxNzYsMTQuNTE4NTQ4MDU5ODQ0OTcsMy4xMTExMTExNjQwOTMwMTc2WiIgZmlsbD0iI0Q4RDhEOCIgZmlsbC1vcGFjaXR5PSIxIi8+PC9nPjwvZz48L3N2Zz4=\"\n                                            style=\"outline:none; -ms-interpolation-mode:bicubic; max-width:100%;\"\n                                            width=\"28\" height=\"28\" align=\"middle\">\n                                        </a>\n                                      </li>\n                                    </ul>\n                                  </div>\n                                  </p>\n                                </div>\n                              </div>\n                            </td>\n                          </tr>\n                        </tbody>\n                      </table>\n                    </div>\n                    <!--[if gte mso 9]></table><![endif]-->\n                    <!--[if (mso)|(IE)]></td><![endif]-->\n                    <!--[if (mso)|(IE)]></tr></table><![endif]-->\n                  </div>\n                </div>\n                <div id=\"section-2\" class=\"hse-section\" style=\"padding-left:10px; padding-right:10px\">\n                  <!--[if !((mso)|(IE))]><!-- -->\n                  <div class=\"hse-column-container\"\n                    style=\"min-width:200px; max-width:600px; width:100%; Margin-left:auto; Margin-right:auto; border-collapse:collapse; border-spacing:0; padding-bottom:20px; padding-top:20px\">\n                    <!--<![endif]-->\n                    <!--[if (mso)|(IE)]>\n        <div class=\"hse-column-container\" style=\"min-width:280px;max-width:600px;width:100%;Margin-left:auto;Margin-right:auto;border-collapse:collapse;border-spacing:0;\">\n        <table align=\"center\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px;\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\">\n        <tr>\n      <![endif]-->\n                    <!--[if (mso)|(IE)]>\n    <td valign=\"top\" style=\"width:600px;padding-bottom:20px; padding-top:20px;\">\n  <![endif]-->\n                    <!--[if gte mso 9]>\n    <table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px\">\n  <![endif]-->\n                    <div id=\"column-2-0\" class=\"hse-column hse-size-12\">\n                      <div id=\"hs_cos_wrapper_module-2-0-0\"\n                        class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module\"\n                        style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                        data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"module\">\n                      </div>\n                    </div>\n                    <!--[if gte mso 9]></table><![endif]-->\n                    <!--[if (mso)|(IE)]></td><![endif]-->\n                    <!--[if (mso)|(IE)]></tr></table><![endif]-->\n                  </div>\n                </div>\n                <!--[if (mso)|(IE)]></td></tr></table><![endif]-->\n              </div>\n    </div>\n    </div>\n    </td>\n    </tr>\n    </tbody>\n    </table>\n    </div>\n  </body>\n  </html>",
    "content_type": "text/html"
  },
  "enabled": false
}
POST $[[SETUP_INDEX_PREFIX]]channel/$[[SETUP_DOC_TYPE]]/ch1os6t3q95lk6lepkq0
{
   "id": "ch1os6t3q95lk6lepkq0",
   "created": "2023-04-22T07:34:51.848540351Z",
   "updated": "2023-08-10T17:18:38.592432088+08:00",
   "name": "[Alerting] Feishu Notification",
   "type": "webhook",
   "webhook": {
     "header_params": {
       "Content-Type": "application/json"
     },
     "method": "POST",
     "url": "{{$.env.FEISHU_WEBHOOK_ENDPOINT}}",
     "body": "{\n  \"msg_type\": \"interactive\",\n  \"card\": {\n      \"header\": {\n              \"title\": {\n                      \"content\": \"[ INFINI Platform Alerting ]\",\n                      \"tag\": \"plain_text\"\n              },\n              \"template\":\"{{if eq .priority \"critical\"}}red{{else if eq .priority \"high\"}}orange{{else if eq .priority \"medium\"}}yellow{{else if eq .priority \"low\"}}grey{{else}}blue{{end}}\"\n      },\n      \"elements\": [{\n              \"tag\": \"markdown\",\n              \"content\": \"🔥 Incident [#{{.event_id}}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}) is ongoing\\n **{{.title}}**\\nPriority: {{.priority}}\\nEventID: {{.event_id}}\\nTarget: {{.resource_name}}-{{.objects}}\\nTriggerAt: {{.trigger_at | datetime}}\"\n      },{\n    \"tag\": \"hr\"\n  },\n  {\n    \"tag\": \"markdown\",\n     \"content\": \"{{ .message | str_replace \"\\n\" \"\\\\n\" }}\"\n  }\n  ]\n}\n}"
   },
   "sub_type": "feishu",
   "enabled": false
 }
POST $[[SETUP_INDEX_PREFIX]]channel/$[[SETUP_DOC_TYPE]]/cj8e9s53q95gsdbb054g
{
  "id": "cj8e9s53q95gsdbb054g",
  "created": "2023-08-07T20:34:56.334695598+08:00",
  "updated": "2023-08-10T17:18:36.035896482+08:00",
  "name": "[Recovery] Feishu Notification",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-Type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.FEISHU_WEBHOOK_ENDPOINT}}",
    "body": "{\n  \"msg_type\": \"interactive\",\n  \"card\": {\n      \"header\": {\n        \"title\": {\n          \"content\": \"[ INFINI Platform Alerting ]\",\n          \"tag\": \"plain_text\"\n        },\n        \"template\":\"green\"\n      },\n      \"elements\": [\n      {\n        \"tag\": \"markdown\",\n        \"content\": \"🌈 **{{.title}}**\"\n      },\n      {\n        \"tag\": \"hr\"\n      },\n      {\n        \"tag\": \"markdown\",\n        \"content\": \"{{ .message | str_replace \"\\n\" \"\\\\n\" }}\"\n      },\n      {\n        \"tag\": \"hr\"\n      },\n      {\n        \"tag\": \"markdown\",\n        \"content\": \"[View Incident]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}})\"\n      }\n    ]\n  }\n}"
  },
  "sub_type": "feishu",
  "enabled": false
}
POST $[[SETUP_INDEX_PREFIX]]channel/$[[SETUP_DOC_TYPE]]/cj865st3q95rega919ig
{
  "id": "cj865st3q95rega919ig",
  "created": "2023-08-07T11:20:19.223545026+08:00",
  "updated": "2023-08-10T17:18:41.92016786+08:00",
  "name": "[Alerting] Discord Notification",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-Type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.DISCORD_WEBHOOK_ENDPOINT}}",
    "body": "{\"content\": \"**[ INFINI Platform Alerting ]**\\n🔥 Incident [#{{.event_id}}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}) is ongoing\\n**{{.title}}**\\n\\nPriority: {{.priority}}\\nEventID: {{.event_id}}\\nTarget: {{.resource_name}}-{{.objects}}\\nTriggerAt: {{.trigger_at | datetime}}\\n{{ .message | str_replace \"\\n\" \"\\\\n\" }}\"}"
  },
  "sub_type": "discord",
  "enabled": false
}
POST $[[SETUP_INDEX_PREFIX]]channel/$[[SETUP_DOC_TYPE]]/cj86l0l3q95rrpfea6ug
{
  "id": "cj86l0l3q95rrpfea6ug",
  "created": "2023-08-07T11:52:34.192522006+08:00",
  "updated": "2023-08-10T17:18:44.422687739+08:00",
  "name": "[Recovery] Discord Notification",
  "type": "webhook",
  "webhook": {
    "header_params": {
      "Content-Type": "application/json"
    },
    "method": "POST",
    "url": "{{$.env.DISCORD_WEBHOOK_ENDPOINT}}",
    "body": "{\n    \"content\": \"**[ INFINI Platform Alerting ]**\\n🌈 **{{.title}}**\\n\\n{{.message | str_replace \"\\n\" \"\\\\n\" }}\\n> [View Incident]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}})\"\n}"
  },
  "sub_type": "discord",
  "enabled": false
}

#alerting
#The `id` value is consistent with the `_id` value
POST $[[SETUP_INDEX_PREFIX]]alert-rule/$[[SETUP_DOC_TYPE]]/builtin-cal8n7p7h710dpnoaps0
{
  "id": "builtin-cal8n7p7h710dpnoaps0",
  "created": "2022-06-16T01:47:11.326727124Z",
  "updated": "2023-08-09T22:39:43.98598502+08:00",
  "name": "Cluster Health Change to Red",
  "enabled": true,
  "resource": {
    "resource_id": "$[[SETUP_RESOURCE_ID]]",
    "resource_name": "$[[SETUP_RESOURCE_NAME]]",
    "type": "elasticsearch",
    "objects": [
      ".infini_metrics*"
    ],
    "filter": {},
    "raw_filter": {
      "bool": {
        "must": [
          {
            "term": {
              "payload.elasticsearch.cluster_health.status": "red"
            }
          },
          {
            "term": {
              "metadata.name": {
                "value": "cluster_health"
              }
            }
          }
        ]
      }
    },
    "time_field": "timestamp",
    "context": {
      "fields": null
    }
  },
  "metrics": {
    "bucket_size": "1m",
    "groups": [
      {
        "field": "metadata.labels.cluster_id",
        "limit": 5
      }
    ],
    "formula": "a",
    "items": [
      {
        "name": "a",
        "field": "payload.elasticsearch.cluster_health.status",
        "statistic": "count"
      }
    ],
    "format_type": "num",
    "bucket_label": {
      "enabled": false
    },
    "expression": "count(payload.elasticsearch.cluster_health.status)"
  },
  "conditions": {
    "operator": "any",
    "items": [
      {
        "minimum_period_match": 1,
        "operator": "gte",
        "values": [
          "1"
        ],
        "priority": "critical"
      }
    ]
  },
  "notification_config": {
    "enabled": true,
    "title": "Health of Clusters ({{len .results}} clusters in total) Changed to Red",
    "message": "{{range .results}}\n{{$cn := lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\n{{$cu := printf \"%s/#/cluster/monitor/elasticsearch/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0)}}\nCluster: [{{$cn}}]({{$cu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{$cn | urlquery}}%22%7D) is Red now\n{{end}}",
    "normal": [
      {
        "id": "cgnb2nt3q95nmusjl65g",
        "created": "2023-04-06T11:47:43.104108279Z",
        "updated": "2023-08-07T15:02:17.165625799+08:00",
        "name": "[Alerting] Slack Notification",
        "type": "webhook",
        "webhook": {
          "header_params": {
            "Content-Type": "application/json"
          },
          "method": "POST",
          "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}|#{{.event_id}}> is ongoing*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n    {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"*Cluster:* <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{ index .group_values 0}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22} | {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}> is Red now\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
        },
        "sub_type": "slack",
        "enabled": true
      },
      {
        "id": "cgiospt3q95q49k3u00g",
        "enabled": true
      },
      {
        "id": "cj865st3q95rega919ig",
        "enabled": true
      },
      {
        "id": "cgnb2r53q95nmusjl6vg",
        "enabled": true
      },
      {
        "id": "ch1os6t3q95lk6lepkq0",
        "enabled": true
      },
      {
        "id": "cgnb2kt3q95nmusjl64g",
        "enabled": true
      }
    ],
    "throttle_period": "1h",
    "accept_time_range": {
      "start": "00:00",
      "end": "23:59"
    }
  },
  "category": "Platform",
  "recovery_notification_config": {
    "enabled": true,
    "title": "🌈 [{{.rule_name}}] Resolved",
    "message": "EventID: {{.event_id}}  \nTarget: {{.resource_name}}-{{.objects}}  \nTriggerAt: {{.trigger_at | datetime}}  \nResolveAt: {{.timestamp | datetime}}  \nDuration: {{.duration}}  ",
    "normal": [
      {
        "id": "cj8atf53q95lhahebg8g",
        "enabled": true
      },
      {
        "id": "cj8bq8d3q95ogankugqg",
        "enabled": true
      },
      {
        "id": "cj8ctat3q95l9ebbntlg",
        "enabled": true
      },
      {
        "id": "cj8e9s53q95gsdbb054g",
        "enabled": true
      },
      {
        "id": "cj8e9gt3q95gsdbb0170",
        "enabled": true
      },
      {
        "id": "cj86l0l3q95rrpfea6ug",
        "enabled": true
      }
    ],
    "event_enabled": true
  },
  "schedule": {
    "interval": "1m"
  },
  "creator": {
    "name": "$[[SETUP_USERNAME]]",
    "id": "$[[SETUP_USER_ID]]"
  }
}
POST $[[SETUP_INDEX_PREFIX]]alert-rule/$[[SETUP_DOC_TYPE]]/builtin-calavvp7h710dpnp32r3
{
  "id": "builtin-calavvp7h710dpnp32r3",
  "created": "2022-06-16T04:22:23.001354546Z",
  "updated": "2023-08-09T22:20:17.864619426+08:00",
  "name": "Index Health Change to Red",
  "enabled": true,
  "resource": {
    "resource_id": "$[[SETUP_RESOURCE_ID]]",
    "resource_name": "$[[SETUP_RESOURCE_NAME]]",
    "type": "elasticsearch",
    "objects": [
      ".infini_metrics"
    ],
    "filter": {},
    "raw_filter": {"bool":{"must":[{"term":{"payload.elasticsearch.index_health.status":"red"}},{"term":{"metadata.name":{"value":"index_health"}}}]}},
    "time_field": "timestamp",
    "context": {
      "fields": null
    }
  },
  "metrics": {
    "bucket_size": "1m",
    "groups": [
      {
        "field": "metadata.cluster_id",
        "limit": 50
      },
      {
        "field": "metadata.index_name",
        "limit": 1000
      }
    ],
    "formula": "a",
    "items": [
      {
        "name": "a",
        "field": "metadata.index_name",
        "statistic": "count"
      }
    ],
    "format_type": "num",
    "bucket_label": {
      "enabled": false
    },
    "expression": "count(metadata.index_name)"
  },
  "conditions": {
    "operator": "any",
    "items": [
      {
        "minimum_period_match": 1,
        "operator": "gte",
        "values": [
          "1"
        ],
        "priority": "high"
      }
    ]
  },
  "notification_config": {
    "enabled": true,
    "title": "Health of Indices ({{len .results}} indices in total) Changed to Red",
    "message": "{{range .results}}\n{{$cn := lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\n{{$iu := printf \"%s/#/cluster/monitor/%s/indices/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0) (index .group_values 1)}}\n{{$cu := printf \"%s/#/cluster/monitor/elasticsearch/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0)}}\nIndex: [{{index .group_values 1}}]({{$iu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{$cn | urlquery}}%22%7D) of Cluster: [{{$cn}}]({{$cu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D) is Red now\n{{end}}",
    "normal": [
      {
        "id": "cgnb2nt3q95nmusjl65g",
        "created": "2023-04-06T11:47:43.104108279Z",
        "updated": "2023-08-07T15:17:26.18861218+08:00",
        "name": "[Alerting] Slack Notification",
        "type": "webhook",
        "webhook": {
          "header_params": {
            "Content-type": "application/json"
          },
          "method": "POST",
          "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}|#{{.event_id}}> is ongoing*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n      {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"Index: <{{$.env.INFINI_CONSOLE_ENDPOINT}}#/cluster/monitor/{{ index .group_values 0}}/indices/{{ index .group_values 1}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{ lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0)}}%22} | {{index .group_values 1}}> of Cluster: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22} | {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}> is Red now\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
        },
        "sub_type": "slack",
        "enabled": true
      },
      {
        "id": "cgiospt3q95q49k3u00g",
        "enabled": true
      },
      {
        "id": "cj865st3q95rega919ig",
        "enabled": true
      },
      {
        "id": "cgnb2r53q95nmusjl6vg",
        "enabled": true
      },
      {
        "id": "ch1os6t3q95lk6lepkq0",
        "enabled": true
      },
      {
        "id": "cgnb2kt3q95nmusjl64g",
        "enabled": true
      }
    ],
    "throttle_period": "1h",
    "accept_time_range": {
      "start": "00:00",
      "end": "23:59"
    }
  },
  "category": "Platform",
  "recovery_notification_config": {
    "enabled": true,
    "title": "🌈 [{{.rule_name}}] Resolved",
    "message": "EventID: {{.event_id}}  \nTarget: {{.resource_name}}-{{.objects}}  \nTriggerAt: {{.trigger_at | datetime}}  \nResolveAt: {{.timestamp | datetime}}  \nDuration: {{.duration}}  ",
    "normal": [
      {
        "id": "cj8bq8d3q95ogankugqg",
        "enabled": true
      },
      {
        "id": "cj8ctat3q95l9ebbntlg",
        "enabled": true
      },
      {
        "id": "cj8atf53q95lhahebg8g",
        "enabled": true
      },
      {
        "id": "cj8e9s53q95gsdbb054g",
        "enabled": true
      },
      {
        "id": "cj8e9gt3q95gsdbb0170",
        "enabled": true
      },
      {
        "id": "cj86l0l3q95rrpfea6ug",
        "enabled": true
      }
    ],
    "event_enabled": true
  },
  "schedule": {
    "interval": "1m"
  },
  "creator": {
    "name": "$[[SETUP_USERNAME]]",
    "id": "$[[SETUP_USER_ID]]"
  }
}
POST $[[SETUP_INDEX_PREFIX]]alert-rule/$[[SETUP_DOC_TYPE]]/builtin-cbp20n2anisjmu4gehc5
{
  "id": "builtin-cbp20n2anisjmu4gehc5",
  "created": "2022-08-09T08:52:44.63345561Z",
  "updated": "2023-08-09T22:11:45.679048697+08:00",
  "name": "Elasticsearch node left cluster",
  "enabled": true,
  "resource": {
    "resource_id": "$[[SETUP_RESOURCE_ID]]",
    "resource_name": "$[[SETUP_RESOURCE_NAME]]",
    "type": "elasticsearch",
    "objects": [
      ".infini_node"
    ],
    "filter": {},
    "raw_filter": {
      "match_phrase": {
        "metadata.labels.status": "unavailable"
      }
    },
    "time_field": "timestamp",
    "context": {
      "fields": null
    }
  },
  "metrics": {
    "bucket_size": "1m",
    "groups": [
      {
        "field": "metadata.cluster_id",
        "limit": 5
      },
      {
        "field": "metadata.node_id",
        "limit": 50
      }
    ],
    "formula": "a",
    "items": [
      {
        "name": "a",
        "field": "metadata.labels.status",
        "statistic": "count"
      }
    ],
    "format_type": "num",
    "bucket_label": {
      "enabled": false
    },
    "expression": "count(metadata.labels.status)"
  },
  "conditions": {
    "operator": "any",
    "items": [
      {
        "minimum_period_match": 1,
        "operator": "gte",
        "values": [
          "1"
        ],
        "priority": "critical"
      }
    ]
  },
  "notification_config": {
    "enabled": true,
    "title": "Elasticsearch node left cluster",
    "message": "{{range .results}}\n{{$cn := lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\n{{$nn := lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}\n{{$nu := printf \"%s/#/cluster/monitor/%s/nodes/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0) (index .group_values 1)}}\n{{$cu := printf \"%s/#/cluster/monitor/elasticsearch/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0)}}\nNode: [{{$nn}}]({{$nu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{$cn | urlquery}}%22%2C%22node_name%22:%22{{$nn}}%22%7D) of Cluster: [{{$cn}}]({{$cu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%7D), Left: {{.result_value}}\n{{end}}",
    "normal": [
      {
        "id": "cgnb2nt3q95nmusjl65g",
        "created": "2023-04-06T11:47:43.104108279Z",
        "updated": "2023-08-07T10:42:17.686776304+08:00",
        "name": "Slack Notification",
        "type": "webhook",
        "webhook": {
          "header_params": {
            "Content-type": "application/json"
          },
          "method": "POST",
          "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}|#{{.event_id}}> is ongoing*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n    {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"Node: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/{{index .group_values 0}}/nodes/{{index .group_values 1}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22%2C%22node_name%22:%22{{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}%22} | {{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}> of Cluster: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22} | {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}>, Left: {{.result_value}}\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
        },
        "sub_type": "slack",
        "enabled": true
      },
      {
        "id": "cgnb2r53q95nmusjl6vg",
        "enabled": true
      },
      {
        "id": "ch1os6t3q95lk6lepkq0",
        "enabled": true
      },
      {
        "id": "cgnb2kt3q95nmusjl64g",
        "enabled": true
      },
      {
        "id": "cj865st3q95rega919ig",
        "enabled": true
      },
      {
        "id": "cgiospt3q95q49k3u00g",
        "enabled": true
      }
    ],
    "throttle_period": "1h",
    "accept_time_range": {
      "start": "00:00",
      "end": "23:59"
    }
  },
  "category": "Platform",
  "recovery_notification_config": {
    "enabled": true,
    "title": "🌈 [{{.rule_name}}] Resolved",
    "message": "EventID: {{.event_id}}  \nTarget: {{.resource_name}}-{{.objects}}  \nTriggerAt: {{.trigger_at | datetime}}  \nResolveAt: {{.timestamp | datetime}}  \nDuration: {{.duration}}  ",
    "normal": [
      {
        "id": "cj8bq8d3q95ogankugqg",
        "enabled": true
      },
      {
        "id": "cj8ctat3q95l9ebbntlg",
        "enabled": true
      },
      {
        "id": "cj8e9s53q95gsdbb054g",
        "enabled": true
      },
      {
        "id": "cj8e9gt3q95gsdbb0170",
        "enabled": true
      },
      {
        "id": "cj86l0l3q95rrpfea6ug",
        "enabled": true
      },
      {
        "id": "cj8atf53q95lhahebg8g",
        "enabled": true
      }
    ],
    "event_enabled": true
  },
  "schedule": {
    "interval": "1m"
  },
  "creator": {
    "name": "$[[SETUP_USERNAME]]",
    "id": "$[[SETUP_USER_ID]]"
  }
}
POST $[[SETUP_INDEX_PREFIX]]alert-rule/$[[SETUP_DOC_TYPE]]/builtin-cb34sfl6psfiqtovhpt4
{
  "id": "builtin-cb34sfl6psfiqtovhpt4",
  "created": "2022-07-07T03:08:46.297166036Z",
  "updated": "2023-08-09T22:38:41.764325087+08:00",
  "name": "Too Many Deleted Documents",
  "enabled": true,
  "resource": {
    "resource_id": "$[[SETUP_RESOURCE_ID]]",
    "resource_name": "$[[SETUP_RESOURCE_NAME]]",
    "type": "elasticsearch",
    "objects": [
      ".infini_metrics*"
    ],
    "filter": {},
    "raw_filter": {
      "range": {
        "payload.elasticsearch.cluster_stats.indices.store.size_in_bytes": {
          "gte": 32212254720
        }
      }
    },
    "time_field": "timestamp",
    "context": {
      "fields": null
    }
  },
  "metrics": {
    "bucket_size": "1m",
    "groups": [
      {
        "field": "metadata.labels.cluster_id",
        "limit": 20
      },
      {
        "field": "metadata.labels.index_name",
        "limit": 10
      }
    ],
    "formula": "(a/(a+b))*100",
    "items": [
      {
        "name": "a",
        "field": "payload.elasticsearch.index_stats.primaries.docs.deleted",
        "statistic": "max"
      },
      {
        "name": "b",
        "field": "payload.elasticsearch.index_stats.primaries.docs.count",
        "statistic": "max"
      }
    ],
    "format_type": "ratio",
    "bucket_label": {
      "enabled": false
    },
    "expression": "(max(payload.elasticsearch.index_stats.primaries.docs.deleted)/(max(payload.elasticsearch.index_stats.primaries.docs.deleted)+max(payload.elasticsearch.index_stats.primaries.docs.count)))*100"
  },
  "conditions": {
    "operator": "any",
    "items": [
      {
        "minimum_period_match": 1,
        "operator": "gte",
        "values": [
          "30"
        ],
        "priority": "medium"
      },
      {
        "minimum_period_match": 1,
        "operator": "gte",
        "values": [
          "40"
        ],
        "priority": "high"
      },
      {
        "minimum_period_match": 1,
        "operator": "gte",
        "values": [
          "55"
        ],
        "priority": "low"
      }
    ]
  },
  "notification_config": {
    "enabled": true,
    "title": "Too Many Deleted Documents (>30%)",
    "message": "{{range .results}}\n{{$cn := lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\n{{$iu := printf \"%s/#/cluster/monitor/%s/indices/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0) (index .group_values 1)}}\n{{$cu := printf \"%s/#/cluster/monitor/elasticsearch/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0)}}\nIndex: [{{index .group_values 1}}]({{$iu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{$cn | urlquery}}%22%7D) of Cluster: [{{$cn}}]({{$cu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%7D), Deleted: {{.result_value | to_fixed 2}}%\n{{end}}",
    "normal": [
      {
        "id": "cgnb2nt3q95nmusjl65g",
        "name": "",
        "type": "webhook",
        "webhook": {
          "header_params": {
            "Content-type": "application/json"
          },
          "method": "POST",
          "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}|#{{.event_id}}> is ongoing*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n      {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"Index: <{{$.env.INFINI_CONSOLE_ENDPOINT}}#/cluster/monitor/{{ index .group_values 0}}/indices/{{ index .group_values 1}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{ lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0)}}%22} | {{index .group_values 1}}> of Cluster: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22} | {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}>, Deleted ratio: {{.result_value | to_fixed 2}}%\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
        },
        "sub_type": "",
        "enabled": true
      },
      {
        "id": "cj865st3q95rega919ig",
        "enabled": true
      },
      {
        "id": "cgiospt3q95q49k3u00g",
        "enabled": true
      },
      {
        "id": "cgnb2r53q95nmusjl6vg",
        "enabled": true
      },
      {
        "id": "ch1os6t3q95lk6lepkq0",
        "enabled": true
      },
      {
        "id": "cgnb2kt3q95nmusjl64g",
        "enabled": true
      }
    ],
    "throttle_period": "24h",
    "accept_time_range": {
      "start": "00:00",
      "end": "23:59"
    }
  },
  "category": "Platform",
  "recovery_notification_config": {
    "enabled": true,
    "title": "🌈 [{{.rule_name}}] Resolved",
    "message": "EventID: {{.event_id}}  \nTarget: {{.resource_name}}-{{.objects}}  \nTriggerAt: {{.trigger_at | datetime}}  \nResolveAt: {{.timestamp | datetime}}  \nDuration: {{.duration}}  ",
    "normal": [
      {
        "id": "cj8bq8d3q95ogankugqg",
        "enabled": true
      },
      {
        "id": "cj8ctat3q95l9ebbntlg",
        "enabled": true
      },
      {
        "id": "cj8atf53q95lhahebg8g",
        "enabled": true
      },
      {
        "id": "cj8e9s53q95gsdbb054g",
        "enabled": true
      },
      {
        "id": "cj8e9gt3q95gsdbb0170",
        "enabled": true
      },
      {
        "id": "cj86l0l3q95rrpfea6ug",
        "enabled": true
      }
    ],
    "event_enabled": true
  },
  "schedule": {
    "interval": "1m"
  },
  "creator": {
    "name": "$[[SETUP_USERNAME]]",
    "id": "$[[SETUP_USER_ID]]"
  }
}
POST $[[SETUP_INDEX_PREFIX]]alert-rule/$[[SETUP_DOC_TYPE]]/builtin-cbp2e4ianisjmu4giqs7
{
  "id": "builtin-cbp2e4ianisjmu4giqs7",
  "created": "2022-06-16T04:11:10.242061032Z",
  "updated": "2023-08-09T22:39:15.339913317+08:00",
  "name": "Search latency is great than 500ms",
  "enabled": true,
  "resource": {
    "resource_id": "$[[SETUP_RESOURCE_ID]]",
    "resource_name": "$[[SETUP_RESOURCE_NAME]]",
    "type": "elasticsearch",
    "objects": [
      ".infini_metrics*"
    ],
    "filter": {},
    "raw_filter": {
      "bool": {
        "must": [
          {
            "term": {
              "metadata.name": {
                "value": "index_stats"
              }
            }
          },
          {
            "term": {
              "metadata.category": {
                "value": "elasticsearch"
              }
            }
          }
        ],
        "must_not": [
          {
            "term": {
              "metadata.labels.index_name": {
                "value": "_all"
              }
            }
          }
        ]
      }
    },
    "time_field": "timestamp",
    "context": {
      "fields": null
    }
  },
  "metrics": {
    "bucket_size": "1m",
    "groups": [
      {
        "field": "metadata.labels.cluster_id",
        "limit": 50
      },
      {
        "field": "metadata.labels.index_name",
        "limit": 10
      }
    ],
    "formula": "a/b",
    "items": [
      {
        "name": "a",
        "field": "payload.elasticsearch.index_stats.total.search.query_time_in_millis",
        "statistic": "rate"
      },
      {
        "name": "b",
        "field": "payload.elasticsearch.index_stats.primaries.search.query_total",
        "statistic": "rate"
      }
    ],
    "format_type": "num",
    "bucket_label": {
      "enabled": false
    },
    "expression": "rate(payload.elasticsearch.index_stats.total.search.query_time_in_millis)/rate(payload.elasticsearch.index_stats.primaries.search.query_total)"
  },
  "conditions": {
    "operator": "any",
    "items": [
      {
        "minimum_period_match": 1,
        "operator": "gte",
        "values": [
          "500"
        ],
        "priority": "medium"
      },
      {
        "minimum_period_match": 1,
        "operator": "gte",
        "values": [
          "300"
        ],
        "priority": "low"
      }
    ]
  },
  "notification_config": {
    "enabled": true,
    "title": "Search latency is great than 500ms",
    "message": "{{range .results}}\n{{$cn := lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\n{{$iu := printf \"%s/#/cluster/monitor/%s/indices/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0) (index .group_values 1)}}\n{{$cu := printf \"%s/#/cluster/monitor/elasticsearch/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0)}}\nIndex: [{{index .group_values 1}}]({{$iu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{$cn | urlquery}}%22%7D) of Cluster: [{{$cn}}]({{$cu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%7D), Latency: {{.result_value | to_fixed 2}}ms\n{{end}}",
    "normal": [
      {
        "id": "cgnb2nt3q95nmusjl65g",
        "created": "2023-04-06T11:47:43.104108279Z",
        "updated": "2023-08-06T15:46:34.404507399+08:00",
        "name": "Slack Notification",
        "type": "webhook",
        "webhook": {
          "header_params": {
            "Content-type": "application/json"
          },
          "method": "POST",
          "body": "\n{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}|#{{.event_id}}> is ongoing*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n      {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"Index: <{{$.env.INFINI_CONSOLE_ENDPOINT}}#/cluster/monitor/{{ index .group_values 0}}/indices/{{ index .group_values 1}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{ lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0)}}%22} | {{index .group_values 1}}> of Cluster: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22} | {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}>, Search latency: {{.result_value | to_fixed 2}}ms\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
        },
        "sub_type": "slack",
        "enabled": true
      },
      {
        "id": "cgiospt3q95q49k3u00g",
        "enabled": true
      },
      {
        "id": "cj865st3q95rega919ig",
        "enabled": true
      },
      {
        "id": "cgnb2r53q95nmusjl6vg",
        "enabled": true
      },
      {
        "id": "ch1os6t3q95lk6lepkq0",
        "enabled": true
      },
      {
        "id": "cgnb2kt3q95nmusjl64g",
        "enabled": true
      }
    ],
    "throttle_period": "1h",
    "accept_time_range": {
      "start": "00:00",
      "end": "23:59"
    }
  },
  "category": "Platform",
  "recovery_notification_config": {
    "enabled": true,
    "title": "🌈 [{{.rule_name}}] Resolved",
    "message": "EventID: {{.event_id}}  \nTarget: {{.resource_name}}-{{.objects}}  \nTriggerAt: {{.trigger_at | datetime}}  \nResolveAt: {{.timestamp | datetime}}  \nDuration: {{.duration}}  ",
    "normal": [
      {
        "id": "cj8bq8d3q95ogankugqg",
        "enabled": true
      },
      {
        "id": "cj8ctat3q95l9ebbntlg",
        "enabled": true
      },
      {
        "id": "cj8atf53q95lhahebg8g",
        "enabled": true
      },
      {
        "id": "cj8e9s53q95gsdbb054g",
        "enabled": true
      },
      {
        "id": "cj8e9gt3q95gsdbb0170",
        "enabled": true
      },
      {
        "id": "cj86l0l3q95rrpfea6ug",
        "enabled": true
      }
    ],
    "event_enabled": true
  },
  "schedule": {
    "interval": "1m"
  },
  "creator": {
    "name": "$[[SETUP_USERNAME]]",
    "id": "$[[SETUP_USER_ID]]"
  }
}
POST $[[SETUP_INDEX_PREFIX]]alert-rule/$[[SETUP_DOC_TYPE]]/builtin-calaqnh7h710dpnp2bm8
{
  "id": "builtin-calaqnh7h710dpnp2bm8",
  "created": "2022-06-16T04:11:10.242061032Z",
  "updated": "2023-08-09T22:38:55.677122718+08:00",
  "name": "JVM utilization is Too High",
  "enabled": true,
  "resource": {
    "resource_id": "$[[SETUP_RESOURCE_ID]]",
    "resource_name": "$[[SETUP_RESOURCE_NAME]]",
    "type": "elasticsearch",
    "objects": [
      ".infini_metrics*"
    ],
    "filter": {},
    "raw_filter": {
      "bool": {
        "must": [
          {
            "term": {
              "metadata.name": {
                "value": "node_stats"
              }
            }
          },
          {
            "term": {
              "metadata.category": {
                "value": "elasticsearch"
              }
            }
          }
        ]
      }
    },
    "time_field": "timestamp",
    "context": {
      "fields": null
    }
  },
  "metrics": {
    "bucket_size": "1m",
    "groups": [
      {
        "field": "metadata.labels.cluster_id",
        "limit": 5
      },
      {
        "field": "metadata.labels.node_id",
        "limit": 300
      }
    ],
    "formula": "a",
    "items": [
      {
        "name": "a",
        "field": "payload.elasticsearch.node_stats.jvm.mem.heap_used_percent",
        "statistic": "p90"
      }
    ],
    "format_type": "ratio",
    "bucket_label": {
      "enabled": false
    },
    "expression": "p90(payload.elasticsearch.node_stats.jvm.mem.heap_used_percent)"
  },
  "conditions": {
    "operator": "any",
    "items": [
      {
        "minimum_period_match": 1,
        "operator": "gte",
        "values": [
          "80"
        ],
        "priority": "low"
      },
      {
        "minimum_period_match": 1,
        "operator": "gte",
        "values": [
          "90"
        ],
        "priority": "medium"
      },
      {
        "minimum_period_match": 1,
        "operator": "gte",
        "values": [
          "95"
        ],
        "priority": "high"
      }
    ]
  },
  "notification_config": {
    "enabled": true,
    "title": "JVM Usage of Nodes ({{len .results}} nodes in total) >= {{.first_threshold}}%",
    "message": "{{range .results}}\n{{$cn := lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\n{{$nn := lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}\n{{$nu := printf \"%s/#/cluster/monitor/%s/nodes/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0) (index .group_values 1)}}\n{{$cu := printf \"%s/#/cluster/monitor/elasticsearch/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0)}}\nNode: [{{$nn}}]({{$nu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{$cn | urlquery}}%22%2C%22node_name%22:%22{{$nn}}%22%7D) of Cluster: [{{$cn}}]({{$cu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%7D), JVM Usage: {{.result_value | to_fixed 2}}%\n{{end}}",
    "normal": [
      {
        "id": "cgnb2nt3q95nmusjl65g",
        "created": "2023-04-06T11:47:43.104108279Z",
        "updated": "2023-08-06T15:46:34.404507399+08:00",
        "name": "Slack Notification",
        "type": "webhook",
        "webhook": {
          "header_params": {
            "Content-type": "application/json"
          },
          "method": "POST",
          "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}|#{{.event_id}}> is ongoing*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n    {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"Node: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/{{index .group_values 0}}/nodes/{{index .group_values 1}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22%2C%22node_name%22:%22{{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}%22} | {{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}> of Cluster: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22} | {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}>, JVM Usage: {{.result_value | to_fixed 2}}%\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
        },
        "sub_type": "slack",
        "enabled": true
      },
      {
        "id": "cgiospt3q95q49k3u00g",
        "enabled": true
      },
      {
        "id": "cj865st3q95rega919ig",
        "enabled": true
      },
      {
        "id": "cgnb2r53q95nmusjl6vg",
        "enabled": true
      },
      {
        "id": "ch1os6t3q95lk6lepkq0",
        "enabled": true
      },
      {
        "id": "cgnb2kt3q95nmusjl64g",
        "enabled": true
      }
    ],
    "throttle_period": "1h",
    "accept_time_range": {
      "start": "00:00",
      "end": "23:59"
    }
  },
  "category": "Platform",
  "recovery_notification_config": {
    "enabled": true,
    "title": "🌈 [{{.rule_name}}] Resolved",
    "message": "EventID: {{.event_id}}  \nTarget: {{.resource_name}}-{{.objects}}  \nTriggerAt: {{.trigger_at | datetime}}  \nResolveAt: {{.timestamp | datetime}}  \nDuration: {{.duration}}  ",
    "normal": [
      {
        "id": "cj8bq8d3q95ogankugqg",
        "enabled": true
      },
      {
        "id": "cj8ctat3q95l9ebbntlg",
        "enabled": true
      },
      {
        "id": "cj8atf53q95lhahebg8g",
        "enabled": true
      },
      {
        "id": "cj8e9s53q95gsdbb054g",
        "enabled": true
      },
      {
        "id": "cj8e9gt3q95gsdbb0170",
        "enabled": true
      },
      {
        "id": "cj86l0l3q95rrpfea6ug",
        "enabled": true
      }
    ],
    "event_enabled": true
  },
  "schedule": {
    "interval": "1m"
  },
  "creator": {
    "name": "$[[SETUP_USERNAME]]",
    "id": "$[[SETUP_USER_ID]]"
  }
}
POST $[[SETUP_INDEX_PREFIX]]alert-rule/$[[SETUP_DOC_TYPE]]/builtin-calakp97h710dpnp1fa2
{
  "id": "builtin-calakp97h710dpnp1fa2",
  "created": "2022-06-16T03:58:29.437447113Z",
  "updated": "2023-08-09T22:33:25.692835454+08:00",
  "name": "CPU utilization is Too High",
  "enabled": true,
  "resource": {
    "resource_id": "$[[SETUP_RESOURCE_ID]]",
    "resource_name": "$[[SETUP_RESOURCE_NAME]]",
    "type": "elasticsearch",
    "objects": [
      ".infini_metrics*"
    ],
    "filter": {},
    "raw_filter": {
      "bool": {
        "must": [
          {
            "term": {
              "metadata.name": {
                "value": "node_stats"
              }
            }
          },
          {
            "term": {
              "metadata.category": {
                "value": "elasticsearch"
              }
            }
          }
        ]
      }
    },
    "time_field": "timestamp",
    "context": {
      "fields": null
    }
  },
  "metrics": {
    "bucket_size": "1m",
    "groups": [
      {
        "field": "metadata.labels.cluster_id",
        "limit": 5
      },
      {
        "field": "metadata.labels.node_id",
        "limit": 300
      }
    ],
    "formula": "a",
    "items": [
      {
        "name": "a",
        "field": "payload.elasticsearch.node_stats.process.cpu.percent",
        "statistic": "avg"
      }
    ],
    "format_type": "ratio",
    "bucket_label": {
      "enabled": false
    },
    "expression": "avg(payload.elasticsearch.node_stats.process.cpu.percent)"
  },
  "conditions": {
    "operator": "any",
    "items": [
      {
        "minimum_period_match": 1,
        "operator": "gte",
        "values": [
          "80"
        ],
        "priority": "low"
      },
      {
        "minimum_period_match": 1,
        "operator": "gte",
        "values": [
          "90"
        ],
        "priority": "medium"
      },
      {
        "minimum_period_match": 1,
        "operator": "gte",
        "values": [
          "95"
        ],
        "priority": "high"
      }
    ]
  },
  "notification_config": {
    "enabled": true,
    "title": "CPU Usage of Nodes ({{len .results}} nodes in total) >= {{.first_threshold}}%",
    "message": "{{range .results}}\n{{$cn := lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\n{{$nn := lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}\n{{$nu := printf \"%s/#/cluster/monitor/%s/nodes/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0) (index .group_values 1)}}\n{{$cu := printf \"%s/#/cluster/monitor/elasticsearch/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0)}}\nNode: [{{$nn}}]({{$nu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{$cn | urlquery}}%22%2C%22node_name%22:%22{{$nn}}%22%7D) of Cluster: [{{$cn}}]({{$cu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%7D), CPU Usage: {{.result_value | to_fixed 2}}%\n{{end}}",
    "normal": [
      {
        "id": "cgnb2nt3q95nmusjl65g",
        "created": "2023-04-06T11:47:43.104108279Z",
        "updated": "2023-08-07T15:17:26.18861218+08:00",
        "name": "[Alerting] Slack Notification",
        "type": "webhook",
        "webhook": {
          "header_params": {
            "Content-type": "application/json"
          },
          "method": "POST",
          "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}|#{{.event_id}}> is ongoing*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n    {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"Node: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/{{index .group_values 0}}/nodes/{{index .group_values 1}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22%2C%22node_name%22:%22{{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}%22} | {{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}> of Cluster: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22} | {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}>, CPU Usage: {{.result_value | to_fixed 2}}%\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
        },
        "sub_type": "slack",
        "enabled": true
      },
      {
        "id": "cgiospt3q95q49k3u00g",
        "enabled": true
      },
      {
        "id": "cj865st3q95rega919ig",
        "enabled": true
      },
      {
        "id": "cgnb2r53q95nmusjl6vg",
        "enabled": true
      },
      {
        "id": "ch1os6t3q95lk6lepkq0",
        "enabled": true
      },
      {
        "id": "cgnb2kt3q95nmusjl64g",
        "enabled": true
      }
    ],
    "throttle_period": "6h",
    "accept_time_range": {
      "start": "00:00",
      "end": "23:59"
    }
  },
  "category": "Platform",
  "recovery_notification_config": {
    "enabled": true,
    "title": "🌈 [{{.rule_name}}] Resolved",
    "message": "EventID: {{.event_id}}  \nTarget: {{.resource_name}}-{{.objects}}  \nTriggerAt: {{.trigger_at | datetime}}  \nResolveAt: {{.timestamp | datetime}}  \nDuration: {{.duration}}  ",
    "normal": [
      {
        "id": "cj8bq8d3q95ogankugqg",
        "enabled": true
      },
      {
        "id": "cj8ctat3q95l9ebbntlg",
        "enabled": true
      },
      {
        "id": "cj8atf53q95lhahebg8g",
        "enabled": true
      },
      {
        "id": "cj8e9s53q95gsdbb054g",
        "enabled": true
      },
      {
        "id": "cj8e9gt3q95gsdbb0170",
        "enabled": true
      },
      {
        "id": "cj86l0l3q95rrpfea6ug",
        "enabled": true
      }
    ],
    "event_enabled": true
  },
  "schedule": {
    "interval": "1m"
  },
  "creator": {
    "name": "$[[SETUP_USERNAME]]",
    "id": "$[[SETUP_USER_ID]]"
  }
}
POST $[[SETUP_INDEX_PREFIX]]alert-rule/$[[SETUP_DOC_TYPE]]/builtin-calgapp7h710dpnpbeb6
{
  "id": "builtin-calgapp7h710dpnpbeb6",
  "created": "2022-06-16T10:26:47.360988761Z",
  "updated": "2023-08-09T22:37:44.038127695+08:00",
  "name": "Shard Storage >= 55G",
  "enabled": true,
  "resource": {
    "resource_id": "$[[SETUP_RESOURCE_ID]]",
    "resource_name": "$[[SETUP_RESOURCE_NAME]]",
    "type": "elasticsearch",
    "objects": [
      ".infini_metrics*"
    ],
    "filter": {},
    "raw_filter": {
      "range": {
        "payload.elasticsearch.index_stats.shard_info.store_in_bytes": {
          "gte": 59055800320
        }
      }
    },
    "time_field": "timestamp",
    "context": {
      "fields": null
    }
  },
  "metrics": {
    "bucket_size": "1m",
    "groups": [
      {
        "field": "metadata.labels.cluster_id",
        "limit": 5
      },
      {
        "field": "metadata.labels.index_name",
        "limit": 500
      }
    ],
    "formula": "a",
    "items": [
      {
        "name": "a",
        "field": "payload.elasticsearch.index_stats.shard_info.store_in_bytes",
        "statistic": "max"
      }
    ],
    "format_type": "bytes",
    "bucket_label": {
      "enabled": false
    },
    "expression": "max(payload.elasticsearch.index_stats.shard_info.store_in_bytes)"
  },
  "conditions": {
    "operator": "any",
    "items": [
      {
        "minimum_period_match": 1,
        "operator": "gte",
        "values": [
          "59055800320"
        ],
        "priority": "high"
      }
    ]
  },
  "notification_config": {
    "enabled": true,
    "title": "Shard Storage >55GB in ({{len .results}} indices in total)",
    "message": "{{range .results}}\n{{$cn := lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\n{{$iu := printf \"%s/#/cluster/monitor/%s/indices/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0) (index .group_values 1)}}\n{{$cu := printf \"%s/#/cluster/monitor/elasticsearch/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0)}}\nIndex: [{{index .group_values 1}}]({{$iu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{$cn | urlquery}}%22%7D) of Cluster: [{{$cn}}]({{$cu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%7D), Max Shard Storage: {{.result_value | format_bytes 2}}\n{{end}}",
    "normal": [
      {
        "id": "cgnb2nt3q95nmusjl65g",
        "created": "2023-04-06T11:47:43.104108279Z",
        "updated": "2023-08-07T14:02:53.734855705+08:00",
        "name": "[Alerting] Slack Notification",
        "type": "webhook",
        "webhook": {
          "header_params": {
            "Content-type": "application/json"
          },
          "method": "POST",
          "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}|#{{.event_id}}> is ongoing*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n      {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"Index: <{{$.env.INFINI_CONSOLE_ENDPOINT}}#/cluster/monitor/{{ index .group_values 0}}/indices/{{ index .group_values 1}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{ lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0)}}%22} | {{index .group_values 1}}> of Cluster: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}}?_g={%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22} | {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}>, Max shard storage: {{.result_value | format_bytes 2}}\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
        },
        "sub_type": "slack",
        "enabled": true
      },
      {
        "id": "cj865st3q95rega919ig",
        "enabled": true
      },
      {
        "id": "cgiospt3q95q49k3u00g",
        "enabled": true
      },
      {
        "id": "cgnb2r53q95nmusjl6vg",
        "enabled": true
      },
      {
        "id": "ch1os6t3q95lk6lepkq0",
        "enabled": true
      },
      {
        "id": "cgnb2kt3q95nmusjl64g",
        "enabled": true
      }
    ],
    "throttle_period": "1h",
    "accept_time_range": {
      "start": "00:00",
      "end": "23:59"
    }
  },
  "category": "Platform",
  "recovery_notification_config": {
    "enabled": true,
    "title": "🌈 [{{.rule_name}}] Resolved",
    "message": "- EventID: {{.event_id}}\n- Target: {{.resource_name}}-{{.objects}}\n- TriggerAt: {{.trigger_at | datetime}}\n- ResolveAt: {{.timestamp | datetime}}\n- Duration: {{.duration}}",
    "normal": [
      {
        "id": "cj8bq8d3q95ogankugqg",
        "enabled": true
      },
      {
        "id": "cj8ctat3q95l9ebbntlg",
        "enabled": true
      },
      {
        "id": "cj8atf53q95lhahebg8g",
        "enabled": true
      },
      {
        "id": "cj8e9s53q95gsdbb054g",
        "enabled": true
      },
      {
        "id": "cj8e9gt3q95gsdbb0170",
        "enabled": true
      },
      {
        "id": "cj86l0l3q95rrpfea6ug",
        "enabled": true
      }
    ],
    "event_enabled": true
  },
  "schedule": {
    "interval": "1m"
  },
  "creator": {
    "name": "$[[SETUP_USERNAME]]",
    "id": "$[[SETUP_USER_ID]]"
  }
}
POST $[[SETUP_INDEX_PREFIX]]alert-rule/$[[SETUP_DOC_TYPE]]/builtin-cal8n7p7h710dpnogps1
{
  "id": "builtin-cal8n7p7h710dpnogps1",
  "created": "2022-06-16T03:11:01.445958361Z",
  "updated": "2023-08-10T17:16:34.900352415+08:00",
  "name": "Disk utilization is Too High",
  "enabled": true,
  "resource": {
    "resource_id": "$[[SETUP_RESOURCE_ID]]",
    "resource_name": "$[[SETUP_RESOURCE_NAME]]",
    "type": "elasticsearch",
    "objects": [
      ".infini_metrics*"
    ],
    "filter": {},
    "raw_filter": {
      "bool": {
        "must": [
          {
            "term": {
              "metadata.name": {
                "value": "node_stats"
              }
            }
          },
          {
            "term": {
              "metadata.category": {
                "value": "elasticsearch"
              }
            }
          }
        ]
      }
    },
    "time_field": "timestamp",
    "context": {
      "fields": null
    }
  },
  "metrics": {
    "bucket_size": "1m",
    "groups": [
      {
        "field": "metadata.labels.cluster_id",
        "limit": 5
      },
      {
        "field": "metadata.labels.node_id",
        "limit": 200
      }
    ],
    "formula": "((a-b)/a)*100",
    "items": [
      {
        "name": "a",
        "field": "payload.elasticsearch.node_stats.fs.data.total_in_bytes",
        "statistic": "max"
      },
      {
        "name": "b",
        "field": "payload.elasticsearch.node_stats.fs.data.free_in_bytes",
        "statistic": "max"
      }
    ],
    "format_type": "ratio",
    "bucket_label": {
      "enabled": false
    },
    "expression": "((max(payload.elasticsearch.node_stats.fs.data.total_in_bytes)-max(payload.elasticsearch.node_stats.fs.data.free_in_bytes))/max(payload.elasticsearch.node_stats.fs.data.total_in_bytes))*100"
  },
  "conditions": {
    "operator": "any",
    "items": [
      {
        "minimum_period_match": 5,
        "operator": "gte",
        "values": [
          "80"
        ],
        "priority": "low"
      },
      {
        "minimum_period_match": 5,
        "operator": "gte",
        "values": [
          "90"
        ],
        "priority": "medium"
      },
      {
        "minimum_period_match": 5,
        "operator": "gte",
        "values": [
          "95"
        ],
        "priority": "high"
      }
    ]
  },
  "notification_config": {
    "enabled": true,
    "title": "Disk Usage of Nodes ({{len .results}} nodes in total) >= {{.first_threshold}}%",
    "message": "{{range .results}}\n{{$cn := lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\n{{$nn := lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}\n{{$nu := printf \"%s/#/cluster/monitor/%s/nodes/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0) (index .group_values 1)}}\n{{$cu := printf \"%s/#/cluster/monitor/elasticsearch/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0)}}\nNode: [{{$nn}}]({{$nu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%2C%22cluster_name%22:%22{{$cn | urlquery}}%22%2C%22node_name%22:%22{{$nn}}%22%7D) of Cluster: [{{$cn}}]({{$cu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%7D), Usage: {{.result_value | to_fixed 2}}% / Free: {{.relation_values.b | format_bytes 2}}\n{{end}}",
    "normal": [
      {
        "id": "cgnb2nt3q95nmusjl65g",
        "name": "",
        "type": "webhook",
        "webhook": {
          "header_params": {
            "Content-type": "application/json"
          },
          "method": "POST",
          "body": "{\n  \"blocks\": [\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*{{if eq .priority \"critical\"}} :fire: {{else if eq .priority \"error\"}} :rotating_light: {{else}} :warning: {{end}} Incident <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}|#{{.event_id}}> is ongoing*\\n :point_right: *{{.rule_name}} - {{.title}}*\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*TriggerAt:* {{.timestamp | datetime}}\"\n      }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": {\n        \"type\": \"mrkdwn\",\n        \"text\": \"*Priority:* {{.priority}}\"\n      }\n    },\n    {\n      \"type\": \"divider\"\n    }\n  ]\n  {{if gt (len .results) 0}}\n  ,\"attachments\": [\n    {{range .results}}\n      {\n        \"color\": {{if eq .priority \"critical\"}} \"#C91010\" {{else if eq .priority \"error\"}} \"#EB4C21\" {{else}} \"#FFB449\" {{end}},\n        \"blocks\": [\n          {\n            \"type\": \"section\",\n            \"text\": {\n              \"type\": \"mrkdwn\",\n              \"text\": \"Node: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/overview/{{index .group_values 0}}/nodes/{{index .group_values 1}}?_g={%22cluster_name%22:%22{{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}%22%2C%22node_name%22:%22{{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}%22} | {{lookup \"category=metadata, object=node, property=metadata.node_name, default=N/A\" (index .group_values 1) }}> of Cluster: <{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/cluster/monitor/elasticsearch/{{index .group_values 0}} | {{lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}>, Disk Usage: {{.result_value | to_fixed 2}}%, Free: {{.relation_values.b | format_bytes 2}}\"\n            }\n          }\n        ]\n      },\n    {{end}}\n    {\n      \"blocks\": [\n        {\n          \"type\": \"divider\"\n        },\n        {\n          \"type\": \"actions\",\n          \"elements\": [\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Incident\"   \n              },\n              \"url\": \"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}\"\n            },\n            {\n              \"type\": \"button\",\n              \"text\": {\n                \"type\": \"plain_text\",\n                \"text\": \"View Document\"   \n              },\n              \"style\": \"primary\",\n              \"url\": \"https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-cluster.html#disk-based-shard-allocation\"\n            }\n          ]\n        },\n      ]\n    }\n  ]\n  {{end}}\n}"
        },
        "sub_type": "",
        "enabled": true
      },
      {
        "id": "cgiospt3q95q49k3u00g",
        "enabled": true
      },
      {
        "id": "cj865st3q95rega919ig",
        "enabled": true
      },
      {
        "id": "cgnb2r53q95nmusjl6vg",
        "enabled": true
      },
      {
        "id": "ch1os6t3q95lk6lepkq0",
        "enabled": true
      },
      {
        "id": "cgnb2kt3q95nmusjl64g",
        "enabled": true
      }
    ],
    "throttle_period": "6h",
    "accept_time_range": {
      "start": "00:00",
      "end": "23:59"
    }
  },
  "category": "Platform",
  "recovery_notification_config": {
    "enabled": true,
    "title": "🌈 [{{.rule_name}}] Resolved",
    "message": "EventID: {{.event_id}}  \nTarget: {{.resource_name}}-{{.objects}}  \nTriggerAt: {{.trigger_at | datetime}}  \nResolveAt: {{.timestamp | datetime}}  \nDuration: {{.duration}}  ",
    "normal": [
      {
        "id": "cj8bq8d3q95ogankugqg",
        "enabled": true
      },
      {
        "id": "cj8ctat3q95l9ebbntlg",
        "enabled": true
      },
      {
        "id": "cj8atf53q95lhahebg8g",
        "enabled": true
      },
      {
        "id": "cj8e9s53q95gsdbb054g",
        "enabled": true
      },
      {
        "id": "cj8e9gt3q95gsdbb0170",
        "enabled": true
      },
      {
        "id": "cj86l0l3q95rrpfea6ug",
        "enabled": true
      }
    ],
    "event_enabled": true
  },
  "schedule": {
    "interval": "1m"
  },
  "creator": {
    "name": "$[[SETUP_USERNAME]]",
    "id": "$[[SETUP_USER_ID]]"
  }
}
POST $[[SETUP_INDEX_PREFIX]]alert-rule/$[[SETUP_DOC_TYPE]]/builtin-cujivv5ath26drn6bcl0
{
  "id": "builtin-cujivv5ath26drn6bcl0",
  "created": "2025-02-08T18:20:44.273334+08:00",
  "updated": "2025-02-12T16:31:05.672771+08:00",
  "name": "Cluster Metrics Collection Anomaly",
  "enabled": true,
  "resource": {
    "resource_id": "$[[SETUP_RESOURCE_ID]]",
    "resource_name": "$[[SETUP_RESOURCE_NAME]]",
    "type": "elasticsearch",
    "objects": [
      ".infini_metrics*"
    ],
    "filter": {},
     "raw_filter": {
        "bool": {
          "must": [
            {
              "terms": {
                "metadata.name": [
                  "cluster_health",
                  "cluster_stats",
                  "index_stats",
                  "node_stats",
                  "shard_stats"
                ]
              }
            }
          ]
        }
      },
    "time_field": "timestamp",
    "context": {
      "fields": null
    }
  },
  "metrics": {
    "bucket_size": "1m",
    "groups": [
      {
        "field": "metadata.labels.cluster_id",
        "limit": 5
      },
      {
        "field": "metadata.name",
        "limit": 5
      }
    ],
    "formula": "a",
    "items": [
        {
          "name": "a",
          "field": "agent.id",
          "statistic": "count"
        }
    ],
    "bucket_label": {
      "enabled": false
    },
    "expression": "count(agent.id)"
  },
  "bucket_conditions": {
    "operator": "any",
    "items": [
      {
        "minimum_period_match": 1,
        "operator": "lt",
        "values": [
          "0"
        ],
        "priority": "critical",
        "type": "content",
        "bucket_count": 10
      }
    ]
  },
  "notification_config": {
    "enabled": true,
    "title": "🔥 [{{.rule_name}}] Alerting",
    "message": "{{range .results}}\n{{$cn := lookup \"category=metadata, object=cluster, property=name, default=N/A\" (index .group_values 0) }}\n{{$cu := printf \"%s/#/cluster/monitor/elasticsearch/%s\" $.env.INFINI_CONSOLE_ENDPOINT (index .group_values 0)}}\nCluster [[{{$cn}}]({{$cu}}?_g=%7B%22timeRange%22:%7B%22min%22:%22{{$.min}}%22%2C%22max%22:%22{{$.max}}%22%7D%7D)] ({{index .group_values 1}}) metrics has dropped at {{.issue_timestamp | datetime}};\n{{end}}",
    "normal": [
      {
        "id": "cgnb2nt3q95nmusjl65g",
        "enabled": true
      },
      {
        "id": "cgiospt3q95q49k3u00g",
        "enabled": true
      },
      {
        "id": "cj865st3q95rega919ig",
        "enabled": true
      },
      {
        "id": "cgnb2r53q95nmusjl6vg",
        "enabled": true
      },
      {
        "id": "ch1os6t3q95lk6lepkq0",
        "enabled": true
      },
      {
        "id": "cgnb2kt3q95nmusjl64g",
        "enabled": true
      }
    ],
    "throttle_period": "6h",
    "accept_time_range": {
      "start": "00:00",
      "end": "23:59"
    }
  },
  "category": "Platform",
  "recovery_notification_config": {
    "enabled": true,
    "title": "🌈 [{{.rule_name}}] Resolved",
    "message": "EventID: {{.event_id}}  \nTarget: {{.resource_name}}-{{.objects}}  \nTriggerAt: {{.trigger_at | datetime}}  \nResolveAt: {{.timestamp | datetime}}  \nDuration: {{.duration}}  ",
    "normal": [
      {
        "id": "cj8bq8d3q95ogankugqg",
        "enabled": true
      },
      {
        "id": "cj8ctat3q95l9ebbntlg",
        "enabled": true
      },
      {
        "id": "cj8atf53q95lhahebg8g",
        "enabled": true
      },
      {
        "id": "cj8e9s53q95gsdbb054g",
        "enabled": true
      },
      {
        "id": "cj8e9gt3q95gsdbb0170",
        "enabled": true
      },
      {
        "id": "cj86l0l3q95rrpfea6ug",
        "enabled": true
      }
    ],
    "event_enabled": true
  },
  "schedule": {
    "interval": "1m"
  },
  "creator": {
    "name": "$[[SETUP_USERNAME]]",
    "id": "$[[SETUP_USER_ID]]"
  }
}