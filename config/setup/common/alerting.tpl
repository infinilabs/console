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
    "body": "{\n  \"msgtype\": \"markdown\",\n  \"markdown\": {\n    \"title\": \"{{.title}}\",\n    \"text\": \"![INFINI Platform Alerting](https://infinilabs.com/img/email/alert-header.png)\\n\\n🔥 Incident [{{.event_id}}]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}) is ongoing\\n\\n**{{.title}}**\\n\\nPriority: {{.priority}}\\n\\nEventID: {{.event_id}}\\n\\nTarget: {{.resource_name}}-{{.objects}}\\n\\nTriggerAt: {{.trigger_at | datetime}}\\n\\n---\\n\\n{{.message}}\"\n  }\n}"
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
    "body": "{\n  \"msgtype\": \"markdown\",\n  \"markdown\": {\n    \"title\": \"{{.title}}\",\n    \"text\": \"![INFINI Platform Alerting](https://infinilabs.com/img/email/recovery-header.png)\\n\\n**{{.title}}**\\n\\n{{.message}}\\n\\n> [View Incident]({{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}})\"\n  }\n}\n"
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
    "body": "<html xmlns=\"http://www.w3.org/1999/xhtml\" xmlns:o=\"urn:schemas-microsoft-com:office:office\" xmlns:v=\"urn:schemas-microsoft-com:vml\" lang=\"en\"><head>\n      <title></title>\n      <meta property=\"og:title\" content=\"\">\n      <meta name=\"twitter:title\" content=\"\">\n  <meta name=\"x-apple-disable-message-reformatting\">\n  <meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\">\n  <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n      <!--[if gte mso 9]>\n    <xml>\n        <o:OfficeDocumentSettings>\n        <o:AllowPNG/>\n        <o:PixelsPerInch>96</o:PixelsPerInch>\n        </o:OfficeDocumentSettings>\n    </xml>\n    <style>\n      ul > li {\n        text-indent: -1em;\n      }\n    </style>\n  <![endif]-->\n  <!--[if mso]>\n  <style type=\"text/css\">\n   body, td {font-family: Arial, Helvetica, sans-serif;} \n   .hse-body-wrapper-table {background-color: #EAF0F6;padding: 20px 0 !important}\n  </style>\n  <![endif]-->\n    <meta name=\"generator\" content=\"HubSpot\">\n    <style type=\"text/css\">.moz-text-html .hse-column-container{max-width:600px !important;width:600px !important}\n  .moz-text-html .hse-column{display:table-cell;vertical-align:top}.moz-text-html .hse-section .hse-size-12{max-width:600px !important;width:600px !important}\n  [owa] .hse-column-container{max-width:600px !important;width:600px !important}[owa] .hse-column{display:table-cell;vertical-align:top}\n  [owa] .hse-section .hse-size-12{max-width:600px !important;width:600px !important}\n  @media only screen and (min-width:640px){.hse-column-container{max-width:600px !important;width:600px !important}\n  .hse-column{display:table-cell;vertical-align:top}.hse-section .hse-size-12{max-width:600px !important;width:600px !important}\n  }@media only screen and (max-width:639px){img.stretch-on-mobile,.hs_rss_email_entries_table img,.hs-stretch-cta .hs-cta-img{height:auto !important;width:100% !important}\n  .display_block_on_small_screens{display:block}.hs_padded{padding-left:20px !important;padding-right:20px !important}\n  }</style><!--<![endif]--><style type=\"text/css\">body[data-outlook-cycle] img.stretch-on-mobile,body[data-outlook-cycle] .hs_rss_email_entries_table img{height:auto !important;width:100% !important}\n  body[data-outlook-cycle] .hs_padded{padding-left:20px !important;padding-right:20px !important}\n  a[x-apple-data-detectors]{color:inherit !important;text-decoration:none !important;font-size:inherit !important;font-family:inherit !important;font-weight:inherit !important;line-height:inherit !important}\n  #outlook a{padding:0}.yshortcuts a{border-bottom:none !important}a{text-decoration:underline}\n  .ExternalClass{width:100%}.ExternalClass,.ExternalClass p,.ExternalClass td,.ExternalClass div,.ExternalClass span,.ExternalClass font{line-height:100%}\n  p{margin:0}body{-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;-webkit-font-smoothing:antialiased;moz-osx-font-smoothing:grayscale}</style>\n  </head>\n  <body bgcolor=\"#EAF0F6\"\n    style=\"margin:0 !important; padding:0 !important; font-family:Arial, sans-serif; font-size:15px; color:#23496d; word-break:break-word\">\n    <!--[if gte mso 9]>\n  <v:background xmlns:v=\"urn:schemas-microsoft-com:vml\" fill=\"t\">\n      <v:fill type=\"tile\" size=\"100%,100%\"  color=\"#ffffff\"/>\n  </v:background>\n  <![endif]-->\n    <div class=\"hse-body-background\" style=\"background-color:#eaf0f6\" bgcolor=\"#eaf0f6\">\n      <table role=\"presentation\" class=\"hse-body-wrapper-table\" cellpadding=\"0\" cellspacing=\"0\"\n        style=\"border-spacing:0 !important; border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; margin:0; padding:0; width:100% !important; min-width:200px !important; height:100% !important\"\n        width=\"100%\" height=\"100%\">\n        <tbody>\n          <tr>\n            <td class=\"hse-body-wrapper-td\" valign=\"top\"\n              style=\"border-collapse:collapse; mso-line-height-rule:exactly; font-family:Arial, sans-serif; font-size:15px; color:#23496d; word-break:break-word\">\n              <div id=\"hs_cos_wrapper_main\" class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_dnd_area\"\n                style=\"color: inherit; font-size: inherit; line-height: inherit;\" data-hs-cos-general-type=\"widget\"\n                data-hs-cos-type=\"dnd_area\">\n                <div id=\"section-1\" class=\"hse-section hse-section-first\"\n                  style=\"padding-left:10px; padding-right:10px; padding-top:20px\">\n                  <!--[if !((mso)|(IE))]><!-- -->\n                  <div class=\"hse-column-container\"\n                    style=\"min-width:200px; max-width:600px; margin-left:auto; margin-right:auto; border-collapse:collapse; border-spacing:0; background-color:#ffffff; padding-bottom:30px;\"\n                    bgcolor=\"#ffffff\">\n                    <!--<![endif]-->\n                    <!--[if (mso)|(IE)]>\n        <div class=\"hse-column-container\" style=\"min-width:200px;max-width:600px;width:100%;Margin-left:auto;Margin-right:auto;border-collapse:collapse;border-spacing:0;\">\n        <table align=\"center\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px;\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\" width=\"600\" bgcolor=\"#ffffff\">\n        <tr style=\"background-color:#ffffff;\">\n      <![endif]-->\n                    <!--[if (mso)|(IE)]>\n    <td valign=\"top\" style=\"width:600px;padding-bottom:30px;\">\n  <![endif]-->\n                    <!--[if gte mso 9]>\n    <table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px\">\n  <![endif]-->\n                    <div id=\"column-1-0\" class=\"hse-column hse-size-12\">\n                      <div id=\"hs_cos_wrapper_module_16873376536522\"\n                        class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module\"\n                        style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                        data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"module\">\n                        <table class=\"hse-image-wrapper\" role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"\n                          style=\"border-spacing:0 !important; border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt\">\n                          <tbody>\n                            <tr>\n                              <td align=\"center\" valign=\"top\"\n                                style=\"border-collapse:collapse; mso-line-height-rule:exactly; font-family:Arial, sans-serif; color:#23496d; word-break:break-word; text-align:center;  font-size:0px\">\n                                <img alt=\"email-header\" src=\"https://infinilabs.com/img/email/alert-header.png\"\n                                  style=\"outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; max-width:100%; font-size:16px\"\n                                  width=\"600\" align=\"middle\">\n                              </td>\n                            </tr>\n                          </tbody>\n                        </table>\n                      </div>\n                      <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\"\n                        style=\"border-spacing:0 !important; border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt\">\n                        <tbody>\n                          <tr>\n                            <td class=\"hs_padded\"\n                              style=\"border-collapse:collapse; mso-line-height-rule:exactly; font-family:Arial, sans-serif; font-size:15px; color:#23496d; word-break:break-word; padding:10px 20px\">\n                              <div id=\"hs_cos_wrapper_module-1-0-0\"\n                                class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module\"\n                                style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                                data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"module\">\n                                <div id=\"hs_cos_wrapper_module-1-0-0_\"\n                                  class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_rich_text\"\n                                  style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                                  data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"rich_text\">\n                                  <p\n                                    style=\"mso-line-height-rule:exactly; margin-top: 20px;margin-bottom: 20px;font-size: 24px;font-weight: 600;line-height: 29px;letter-spacing: -0.6px;color: #FF4D4F;\">{{.title}}\n                                  </p>\n                                  <div\n                                    style=\"mso-line-height-rule:exactly; line-height:175%; margin-bottom:20px;font-size: 14px;color: #666666;white-space: normal;font-family: PingFang SC;\">\n                                    <p>Priority: {{.priority}}</p>\n                                    <p>EventID: {{.event_id}}</p>\n                                    <p>Target: {{.resource_name}}-{{.objects}}</p>\n                                    <p style=\"margin-bottom: 20px;\">TriggerAt: {{.trigger_at | datetime}}</p>\n                                    {{.message | md_to_html}}\n                                  </div>\n                                  <p>\n                                  <div\n                                    style=\"width: 120px;height: 32px;border-radius: 5px;background-color: #1677FF;line-height: 32px;text-align: center;margin-top:0px;margin-bottom: 20px;\">\n                                    <a style=\"font-size: 14px;color: #ffffff;text-decoration: none;\" href=\"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}\"}}\"\n                                      target=\"_blank\">\n                                      View Detail\n                                    </a>\n                                  </div>\n                                  <div\n                                    style=\"width: 100%;height: 0px;opacity: 1;border: 1px solid #EEEEEE;margin-top: 20px;margin-bottom: 20px;\">\n                                  </div>\n                                  <div style=\"margin-top: 20px;margin-bottom: 20px;\">\n                                    <ul style=\"list-style:none;padding:0px; margin:0px;\">\n                                      <li\n                                        style=\"list-style:none;padding:0px; margin:0px;display:inline;color: #999999;\">\n                                        💡 <a style=\"font-size: 10px;color: #999999;text-decoration: none; \"\n                                          href=\"https://infinilabs.com/en/docs/latest/console/tutorials/cluster_node_jvm_usage/\"\n                                          target=\"_blank\">How to monitor the JVM usage of cluster nodes </a></li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;color: #999999; \">\n                                        | <a style=\"font-size: 10px;color: #999999;text-decoration: none; \"\n                                          href=\"https://infinilabs.com/en/docs/latest/console/tutorials/cluster_health_change/\"\n                                          target=\"_blank\">How to monitor cluster health status </a>\n                                      </li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;color: #999999; \">\n                                        | <a style=\"font-size: 10px;color: #999999;text-decoration: none; \"\n                                          href=\"https://infinilabs.com/en/docs/latest/console/\"\n                                          target=\"_blank\">Learn more ... </a>\n                                      </li>\n                                    </ul>\n                                  </div>\n                                  <p />\n                                  <p\n                                    style=\"mso-line-height-rule:exactly; line-height:175%; margin-top:30px;margin-bottom:30px;position: relative;\">\n                                  <div style=\"float: left;\">\n                                    <img alt=\"INFINI Labs\" src=\"https://www.infinilabs.com/img/header/logo.svg\"\n                                      style=\"outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; max-width:100%; \"\n                                      width=\"160\" height=\"28\" align=\"middle\">\n                                  </div>\n                                  <div style=\"float: right;\">\n                                    <ul style=\"list-style:none;padding:0px; margin:0px;\">\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;\">\n                                        <a title=\"Website\" href=\"https://infinilabs.com\" target=\"_blank\"\n                                          style=\"padding-left: 10;text-decoration:none; \">\n                                          <img alt=\"tips\" src=\"http://www.infinilabs.com/img/email/website.svg\"\n                                            style=\"outline:none; -ms-interpolation-mode:bicubic; max-width:100%;\"\n                                            width=\"28\" height=\"28\" align=\"middle\">\n                                        </a>\n                                      </li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;\">\n                                        <a title=\"Discord\" href=\"https://discord.com/invite/4tKTMkkvVX\" target=\"_blank\"\n                                          style=\"padding-left: 10;text-decoration:none; \">\n                                          <img alt=\"tips\" src=\"http://www.infinilabs.com/img/email/discord.svg\"\n                                            style=\"outline:none; -ms-interpolation-mode:bicubic; max-width:100%;;\"\n                                            width=\"28\" height=\"28\" align=\"middle\">\n                                        </a>\n                                      </li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;\">\n                                        <a title=\"Github\" href=\"https://github.com/infinilabs\" target=\"_blank\"\n                                          style=\"padding-left: 10;text-decoration:none; \">\n                                          <img alt=\"tips\" src=\"https://infinilabs.com/img/email/github.svg\"\n                                            style=\"outline:none; -ms-interpolation-mode:bicubic; max-width:100%;\"\n                                            width=\"28\" height=\"28\" align=\"middle\">\n                                        </a>\n                                      </li>\n                                    </ul>\n                                  </div>\n                                  </p>\n                                </div>\n                              </div>\n                            </td>\n                          </tr>\n                        </tbody>\n                      </table>\n                    </div>\n                    <!--[if gte mso 9]></table><![endif]-->\n                    <!--[if (mso)|(IE)]></td><![endif]-->\n                    <!--[if (mso)|(IE)]></tr></table><![endif]-->\n                  </div>\n                </div>\n                <div id=\"section-2\" class=\"hse-section\" style=\"padding-left:10px; padding-right:10px\">\n                  <!--[if !((mso)|(IE))]><!-- -->\n                  <div class=\"hse-column-container\"\n                    style=\"min-width:200px; max-width:600px; width:100%; Margin-left:auto; Margin-right:auto; border-collapse:collapse; border-spacing:0; padding-bottom:20px; padding-top:20px\">\n                    <!--<![endif]-->\n                    <!--[if (mso)|(IE)]>\n        <div class=\"hse-column-container\" style=\"min-width:280px;max-width:600px;width:100%;Margin-left:auto;Margin-right:auto;border-collapse:collapse;border-spacing:0;\">\n        <table align=\"center\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px;\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\">\n        <tr>\n      <![endif]-->\n                    <!--[if (mso)|(IE)]>\n    <td valign=\"top\" style=\"width:600px;padding-bottom:20px; padding-top:20px;\">\n  <![endif]-->\n                    <!--[if gte mso 9]>\n    <table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px\">\n  <![endif]-->\n                    <div id=\"column-2-0\" class=\"hse-column hse-size-12\">\n                      <div id=\"hs_cos_wrapper_module-2-0-0\"\n                        class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module\"\n                        style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                        data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"module\">\n                      </div>\n                    </div>\n                    <!--[if gte mso 9]></table><![endif]-->\n                    <!--[if (mso)|(IE)]></td><![endif]-->\n                    <!--[if (mso)|(IE)]></tr></table><![endif]-->\n                  </div>\n                </div>\n                <!--[if (mso)|(IE)]></td></tr></table><![endif]-->\n              </div>\n    </div>\n    </div>\n    </td>\n    </tr>\n    </tbody>\n    </table>\n    </div>\n  </body>\n  </html>",
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
    "body": "<html xmlns=\"http://www.w3.org/1999/xhtml\" xmlns:o=\"urn:schemas-microsoft-com:office:office\" xmlns:v=\"urn:schemas-microsoft-com:vml\" lang=\"en\"><head>\n      <title></title>\n      <meta property=\"og:title\" content=\"\">\n      <meta name=\"twitter:title\" content=\"\">\n  <meta name=\"x-apple-disable-message-reformatting\">\n  <meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\">\n  <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n      <!--[if gte mso 9]>\n    <xml>\n        <o:OfficeDocumentSettings>\n        <o:AllowPNG/>\n        <o:PixelsPerInch>96</o:PixelsPerInch>\n        </o:OfficeDocumentSettings>\n    </xml>\n    <style>\n      ul > li {\n        text-indent: -1em;\n      }\n    </style>\n  <![endif]-->\n  <!--[if mso]>\n  <style type=\"text/css\">\n   body, td {font-family: Arial, Helvetica, sans-serif;} \n   .hse-body-wrapper-table {background-color: #EAF0F6;padding: 20px 0 !important}\n  </style>\n  <![endif]-->\n    <meta name=\"generator\" content=\"HubSpot\">\n    <style type=\"text/css\">.moz-text-html .hse-column-container{max-width:600px !important;width:600px !important}\n  .moz-text-html .hse-column{display:table-cell;vertical-align:top}.moz-text-html .hse-section .hse-size-12{max-width:600px !important;width:600px !important}\n  [owa] .hse-column-container{max-width:600px !important;width:600px !important}[owa] .hse-column{display:table-cell;vertical-align:top}\n  [owa] .hse-section .hse-size-12{max-width:600px !important;width:600px !important}\n  @media only screen and (min-width:640px){.hse-column-container{max-width:600px !important;width:600px !important}\n  .hse-column{display:table-cell;vertical-align:top}.hse-section .hse-size-12{max-width:600px !important;width:600px !important}\n  }@media only screen and (max-width:639px){img.stretch-on-mobile,.hs_rss_email_entries_table img,.hs-stretch-cta .hs-cta-img{height:auto !important;width:100% !important}\n  .display_block_on_small_screens{display:block}.hs_padded{padding-left:20px !important;padding-right:20px !important}\n  }</style><!--<![endif]--><style type=\"text/css\">body[data-outlook-cycle] img.stretch-on-mobile,body[data-outlook-cycle] .hs_rss_email_entries_table img{height:auto !important;width:100% !important}\n  body[data-outlook-cycle] .hs_padded{padding-left:20px !important;padding-right:20px !important}\n  a[x-apple-data-detectors]{color:inherit !important;text-decoration:none !important;font-size:inherit !important;font-family:inherit !important;font-weight:inherit !important;line-height:inherit !important}\n  #outlook a{padding:0}.yshortcuts a{border-bottom:none !important}a{text-decoration:underline}\n  .ExternalClass{width:100%}.ExternalClass,.ExternalClass p,.ExternalClass td,.ExternalClass div,.ExternalClass span,.ExternalClass font{line-height:100%}\n  p{margin:0}body{-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;-webkit-font-smoothing:antialiased;moz-osx-font-smoothing:grayscale}</style>\n  </head>\n  <body bgcolor=\"#EAF0F6\"\n    style=\"margin:0 !important; padding:0 !important; font-family:Arial, sans-serif; font-size:15px; color:#23496d; word-break:break-word\">\n    <!--[if gte mso 9]>\n  <v:background xmlns:v=\"urn:schemas-microsoft-com:vml\" fill=\"t\">\n      <v:fill type=\"tile\" size=\"100%,100%\"  color=\"#ffffff\"/>\n  </v:background>\n  <![endif]-->\n    <div class=\"hse-body-background\" style=\"background-color:#eaf0f6\" bgcolor=\"#eaf0f6\">\n      <table role=\"presentation\" class=\"hse-body-wrapper-table\" cellpadding=\"0\" cellspacing=\"0\"\n        style=\"border-spacing:0 !important; border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; margin:0; padding:0; width:100% !important; min-width:200px !important; height:100% !important\"\n        width=\"100%\" height=\"100%\">\n        <tbody>\n          <tr>\n            <td class=\"hse-body-wrapper-td\" valign=\"top\"\n              style=\"border-collapse:collapse; mso-line-height-rule:exactly; font-family:Arial, sans-serif; font-size:15px; color:#23496d; word-break:break-word\">\n              <div id=\"hs_cos_wrapper_main\" class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_dnd_area\"\n                style=\"color: inherit; font-size: inherit; line-height: inherit;\" data-hs-cos-general-type=\"widget\"\n                data-hs-cos-type=\"dnd_area\">\n                <div id=\"section-1\" class=\"hse-section hse-section-first\"\n                  style=\"padding-left:10px; padding-right:10px; padding-top:20px\">\n                  <!--[if !((mso)|(IE))]><!-- -->\n                  <div class=\"hse-column-container\"\n                    style=\"min-width:200px; max-width:600px; margin-left:auto; margin-right:auto; border-collapse:collapse; border-spacing:0; background-color:#ffffff; padding-bottom:30px;\"\n                    bgcolor=\"#ffffff\">\n                    <!--<![endif]-->\n                    <!--[if (mso)|(IE)]>\n        <div class=\"hse-column-container\" style=\"min-width:200px;max-width:600px;width:100%;Margin-left:auto;Margin-right:auto;border-collapse:collapse;border-spacing:0;\">\n        <table align=\"center\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px;\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\" width=\"600\" bgcolor=\"#ffffff\">\n        <tr style=\"background-color:#ffffff;\">\n      <![endif]-->\n                    <!--[if (mso)|(IE)]>\n    <td valign=\"top\" style=\"width:600px;padding-bottom:30px;\">\n  <![endif]-->\n                    <!--[if gte mso 9]>\n    <table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px\">\n  <![endif]-->\n                    <div id=\"column-1-0\" class=\"hse-column hse-size-12\">\n                      <div id=\"hs_cos_wrapper_module_16873376536522\"\n                        class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module\"\n                        style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                        data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"module\">\n                        <table class=\"hse-image-wrapper\" role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"\n                          style=\"border-spacing:0 !important; border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt\">\n                          <tbody>\n                            <tr>\n                              <td align=\"center\" valign=\"top\"\n                                style=\"border-collapse:collapse; mso-line-height-rule:exactly; font-family:Arial, sans-serif; color:#23496d; word-break:break-word; text-align:center;  font-size:0px\">\n                                <img alt=\"email-header\" src=\"https://infinilabs.com/img/email/recovery-header.png\"\n                                  style=\"outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; max-width:100%; font-size:16px\"\n                                  width=\"600\" align=\"middle\">\n                              </td>\n                            </tr>\n                          </tbody>\n                        </table>\n                      </div>\n                      <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\"\n                        style=\"border-spacing:0 !important; border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt\">\n                        <tbody>\n                          <tr>\n                            <td class=\"hs_padded\"\n                              style=\"border-collapse:collapse; mso-line-height-rule:exactly; font-family:Arial, sans-serif; font-size:15px; color:#23496d; word-break:break-word; padding:10px 20px\">\n                              <div id=\"hs_cos_wrapper_module-1-0-0\"\n                                class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module\"\n                                style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                                data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"module\">\n                                <div id=\"hs_cos_wrapper_module-1-0-0_\"\n                                  class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_rich_text\"\n                                  style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                                  data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"rich_text\">\n                                  <p\n                                    style=\"mso-line-height-rule:exactly; margin-top: 20px;margin-bottom: 20px;font-size: 24px;font-weight: 600;line-height: 29px;letter-spacing: -0.6px;color: #52C41A;\">{{.title}}\n                                  </p>\n                                  <div\n                                    style=\"mso-line-height-rule:exactly; line-height:175%; margin-bottom:20px;font-size: 14px;color: #666666;white-space: normal;font-family: PingFang SC;\">{{.message | md_to_html}}\n                                  </div>\n                                  <p>\n                                  <div\n                                    style=\"width: 120px;height: 32px;border-radius: 5px;background-color: #1677FF;line-height: 32px;text-align: center;margin-top:0px;margin-bottom: 20px;\">\n                                    <a style=\"font-size: 14px;color: #ffffff;text-decoration: none;\" href=\"{{$.env.INFINI_CONSOLE_ENDPOINT}}/#/alerting/message/{{.event_id}}\"}}\"\n                                      target=\"_blank\">\n                                      View Detail\n                                    </a>\n                                  </div>\n                                  <div\n                                    style=\"width: 100%;height: 0px;opacity: 1;border: 1px solid #EEEEEE;margin-top: 20px;margin-bottom: 20px;\">\n                                  </div>\n                                  <div style=\"margin-top: 20px;margin-bottom: 20px;\">\n                                    <ul style=\"list-style:none;padding:0px; margin:0px;\">\n                                      <li\n                                        style=\"list-style:none;padding:0px; margin:0px;display:inline;color: #999999;\">\n                                        💡 <a style=\"font-size: 10px;color: #999999;text-decoration: none; \"\n                                          href=\"https://infinilabs.com/en/docs/latest/console/tutorials/cluster_node_jvm_usage/\"\n                                          target=\"_blank\">How to monitor the JVM usage of cluster nodes </a></li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;color: #999999; \">\n                                        | <a style=\"font-size: 10px;color: #999999;text-decoration: none; \"\n                                          href=\"https://infinilabs.com/en/docs/latest/console/tutorials/cluster_health_change/\"\n                                          target=\"_blank\">How to monitor cluster health status </a>\n                                      </li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;color: #999999; \">\n                                        | <a style=\"font-size: 10px;color: #999999;text-decoration: none; \"\n                                          href=\"https://infinilabs.com/en/docs/latest/console/\"\n                                          target=\"_blank\">Learn more ... </a>\n                                      </li>\n                                    </ul>\n                                  </div>\n                                  <p />\n                                  <p\n                                    style=\"mso-line-height-rule:exactly; line-height:175%; margin-top:30px;margin-bottom:30px;position: relative;\">\n                                  <div style=\"float: left;\">\n                                    <img alt=\"INFINI Labs\" src=\"https://www.infinilabs.com/img/header/logo.svg\"\n                                      style=\"outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; max-width:100%; \"\n                                      width=\"160\" height=\"28\" align=\"middle\">\n                                  </div>\n                                  <div style=\"float: right;\">\n                                    <ul style=\"list-style:none;padding:0px; margin:0px;\">\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;\">\n                                        <a title=\"Website\" href=\"https://infinilabs.com\" target=\"_blank\"\n                                          style=\"padding-left: 10;text-decoration:none; \">\n                                          <img alt=\"tips\" src=\"http://www.infinilabs.com/img/email/website.svg\"\n                                            style=\"outline:none; -ms-interpolation-mode:bicubic; max-width:100%;\"\n                                            width=\"28\" height=\"28\" align=\"middle\">\n                                        </a>\n                                      </li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;\">\n                                        <a title=\"Discord\" href=\"https://discord.com/invite/4tKTMkkvVX\" target=\"_blank\"\n                                          style=\"padding-left: 10;text-decoration:none; \">\n                                          <img alt=\"tips\" src=\"http://www.infinilabs.com/img/email/discord.svg\"\n                                            style=\"outline:none; -ms-interpolation-mode:bicubic; max-width:100%;;\"\n                                            width=\"28\" height=\"28\" align=\"middle\">\n                                        </a>\n                                      </li>\n                                      <li style=\"list-style:none;padding:0px; margin:0px;display:inline;\">\n                                        <a title=\"Github\" href=\"https://github.com/infinilabs\" target=\"_blank\"\n                                          style=\"padding-left: 10;text-decoration:none; \">\n                                          <img alt=\"tips\" src=\"https://infinilabs.com/img/email/github.svg\"\n                                            style=\"outline:none; -ms-interpolation-mode:bicubic; max-width:100%;\"\n                                            width=\"28\" height=\"28\" align=\"middle\">\n                                        </a>\n                                      </li>\n                                    </ul>\n                                  </div>\n                                  </p>\n                                </div>\n                              </div>\n                            </td>\n                          </tr>\n                        </tbody>\n                      </table>\n                    </div>\n                    <!--[if gte mso 9]></table><![endif]-->\n                    <!--[if (mso)|(IE)]></td><![endif]-->\n                    <!--[if (mso)|(IE)]></tr></table><![endif]-->\n                  </div>\n                </div>\n                <div id=\"section-2\" class=\"hse-section\" style=\"padding-left:10px; padding-right:10px\">\n                  <!--[if !((mso)|(IE))]><!-- -->\n                  <div class=\"hse-column-container\"\n                    style=\"min-width:200px; max-width:600px; width:100%; Margin-left:auto; Margin-right:auto; border-collapse:collapse; border-spacing:0; padding-bottom:20px; padding-top:20px\">\n                    <!--<![endif]-->\n                    <!--[if (mso)|(IE)]>\n        <div class=\"hse-column-container\" style=\"min-width:280px;max-width:600px;width:100%;Margin-left:auto;Margin-right:auto;border-collapse:collapse;border-spacing:0;\">\n        <table align=\"center\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px;\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\">\n        <tr>\n      <![endif]-->\n                    <!--[if (mso)|(IE)]>\n    <td valign=\"top\" style=\"width:600px;padding-bottom:20px; padding-top:20px;\">\n  <![endif]-->\n                    <!--[if gte mso 9]>\n    <table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px\">\n  <![endif]-->\n                    <div id=\"column-2-0\" class=\"hse-column hse-size-12\">\n                      <div id=\"hs_cos_wrapper_module-2-0-0\"\n                        class=\"hs_cos_wrapper hs_cos_wrapper_widget hs_cos_wrapper_type_module\"\n                        style=\"color: inherit; font-size: inherit; line-height: inherit;\"\n                        data-hs-cos-general-type=\"widget\" data-hs-cos-type=\"module\">\n                      </div>\n                    </div>\n                    <!--[if gte mso 9]></table><![endif]-->\n                    <!--[if (mso)|(IE)]></td><![endif]-->\n                    <!--[if (mso)|(IE)]></tr></table><![endif]-->\n                  </div>\n                </div>\n                <!--[if (mso)|(IE)]></td></tr></table><![endif]-->\n              </div>\n    </div>\n    </div>\n    </td>\n    </tr>\n    </tbody>\n    </table>\n    </div>\n  </body>\n  </html>",
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