export default {
  "settings.email.server.empty.label1": "You can add email servers here",
  "settings.email.server.empty.label2":
    "The alert center can send notifications to recipients through the designated mail server.",
  "settings.email.server.empty.button.new": "Add email server",
  "settings.email.server.form.name": "Name",
  "settings.email.server.form.host": "Host",
  "settings.email.server.form.port": "Port",
  "settings.email.server.form.tls_min_version": "TLS Min Version",
  "settings.email.server.form.tls": "TLS",
  "settings.email.server.form.sender": "Sender",
  "settings.email.server.form.enabled": "Enabled",
  "settings.email.server.form.recipient": "Recipient",
  "settings.email.server.form.recipient.placeholder": "Please input recipient",
  "settings.email.server.form.test.button": "Send a Test Email",
  "settings.email.server.form.validation.name": "Please input name!",
  "settings.email.server.form.validation.host":
    "Please input SMTP server host!",
  "settings.email.server.form.validation.port":
    "Please input SMTP server port!",
  "settings.email.server.form.validation.recipient":
    "Recipient email is invalid",
  "settings.email.server.form.temp_name": "New Config Name",
  "settings.email.server.message.test.success": "Sent successfully",
  "settings.email.server.message.test.error.auth_required":
    "SMTP credentials are required. Please check the username and password.",
  "settings.email.server.message.test.error.smtp_auth_failed":
    "SMTP authentication failed. Check the username, password, or provider-specific authorization code.",
  "settings.email.server.message.test.error.sender_mismatch":
    "SMTP authentication failed. Some providers require the sender address to match the authenticated account or an approved alias.",
  "settings.email.server.message.test.error.tls_required":
    "The SMTP server requires TLS or STARTTLS before authentication. Check the TLS setting and port.",
  "settings.email.server.message.test.error.send_failed":
    "Failed to send the test email. Check the sender, recipient, SMTP settings, and provider restrictions.",
  "settings.system.tab.general": "General",
  "settings.system.tab.email": "Email Server",
  "settings.system.retention.title": "Data Retention",
  "settings.system.retention.description":
    "Update how many days system-managed data is retained before ILM deletes it.",
  "settings.system.retention.help":
    "The default retention is 30 days and the default rollover size is 50 GB. Saving this setting updates the system ILM retention policy for managed system indices.",
  "settings.system.retention.unit": "days",
  "settings.system.retention.size.label": "Rollover size",
  "settings.system.retention.size.unit": "GB",
  "settings.system.retention.save": "Save",
  "settings.system.retention.update.success":
    "Data retention updated successfully",
  "settings.system.retention.validation.days":
    "Please enter a valid retention days value",
  "settings.system.retention.validation.max_size":
    "Please enter a valid rollover size in GB, such as 50",
  "settings.system.rollup.title": "Rollup",
  "settings.system.rollup.description":
    "Enable or stop the system cluster rollup jobs from Console system settings.",
  "settings.system.rollup.enabled": "On",
  "settings.system.rollup.disabled": "Off",
  "settings.system.rollup.help":
    "Turning Rollup off will stop rollup jobs and disable rollup search in cluster settings.",
  "settings.system.rollup.update.success": "Rollup setting updated successfully",
  "settings.system.advanced.title": "Advanced settings",
  "settings.system.local_templates.title": "Local template refresh",
  "settings.system.local_templates.description":
    "Refresh the built-in local configuration templates in the system cluster after a binary upgrade.",
  "settings.system.local_templates.refresh": "Refresh templates",
  "settings.system.local_templates.help":
    "This overwrites system_ingest_config.yml, task_config.tpl, relay.yml, and migration.yml in the system cluster and triggers instances to sync them again.",
  "settings.system.local_templates.update.success":
    "Local templates updated successfully",
};
