export default {
  "guide.header.title": "Configuration Guide",
  "guide.initialization.step.configuration": "Configuration",
  "guide.initialization.step.configuration.desc":
    "Connecting to system cluster (elasticsearch required version 5.3 or above).",
  "guide.initialization.step.initialization": "Initialization",
  "guide.initialization.step.initialization.desc":
    "Initializing basic settings for system indices and templates.",
  "guide.initialization.step.settings": "Settings",
  "guide.initialization.step.settings.desc":
    "Set the default user for login and credential secret.",
  "guide.initialization.step.finish": "Finish",
  "guide.initialization.step.finish.desc": `Configuration completed, Start the journey of ${APP_DOMAIN} Console.`,
  "guide.cluster.host": "Host",
  "guide.cluster.host.required": "Please input host!",
  "guide.cluster.host.validate": "Please input IP address and port number!",
  "guide.cluster.auth": "Auth",
  "guide.cluster.test.connection": "Test Connection",
  "guide.cluster.test.connection.error.version":
    "Elasticsearch required version 5.3 or above.",
  "guide.cluster.test.connection.failed": "Cluster connection failed.",
  "guide.cluster.validate.elasticsearch_version_too_old":
    "Elasticsearch version is too old.",
  "guide.cluster.validate.elasticsearch_indices_exists":
    "Some related indices are already exists in the target cluster.",
  "guide.cluster.validate.elasticsearch_template_exists":
    "Some related templates are already exists in the target cluster.",
  "guide.cluster.validate.default":
    "Some related data are already exists in the target cluster.",
  "guide.cluster.validate.sub":
    "Perform the following requests in other terminal tools can delete the existing data, but you may lost data.",
  "guide.cluster.validate.sub.strong": "[DO IT AT YOUR OWN RISK!]",
  "guide.cluster.skip": "Skip",
  "guide.cluster.skip.desc":
    "You can also skip this step and reuse the existing data.",
  "guide.user.title": "Creating a default user",
  "guide.step.next": "Next",
  "guide.step.prev": "Previous",
  "guide.step.refresh": "Refresh",
  "guide.shell.copy": "Successfully copied to clipboard!",
  "guide.username": "Username",
  "guide.username.required": "Please input username!",
  "guide.password": "Password",
  "guide.password.required": "Please input password!",
  "guide.confirm.password": "Confirm Password",
  "guide.confirm.password.required": "Please input confirm password!",
  "guide.confirm.password.validate":
    "Two passwords that you enter is inconsistent!",
  "guide.credential_secret": "Secret Key",
  "guide.credential_secret.required": "Please input credential secret key!",
  "guide.credential_secret.tips":
    "The credential key is used to encrypt and decrypt the credential information. If the key is lost, the encrypted credential information cannot be decrypted and needs to be kept properly!",
  "guide.credential_secret.generate": "Generate Key",

  "guide.configuration.title": "Configuration",
  "guide.configuration.cluster": "Cluster",
  "guide.configuration.cluster_username": "Cluster Username",
  "guide.configuration.cluster_password": "Cluster Password",
  "guide.configuration.console_username": "Console Username",
  "guide.configuration.console_password": "Console Password",
  "guide.configuration.credential_secret": "Credential Secret Key",
  "guide.configuration.tips":
    "Please download the configuration and keep it properly.",

  "guide.completed": "Initialization completed!",
  "guide.enter.console": `Enter ${APP_DOMAIN} Console`,

  "health.modal.title": "Services are limited",
  "health.modal.desc": `Please check the status of the ${APP_DOMAIN} Console related services to ensure that the ${APP_DOMAIN} Console can work correctly.`,
  "health.modal.services.title": "Services Health",

  "guide.startup.modal.title": `Welcome to ${APP_DOMAIN} Console`,
  "guide.startup.modal.subtitle": "All-in-one search center",
  "guide.startup.modal.desc": `With ${APP_DOMAIN} Console, administrators can effortlessly manage indices, data, configure alert rules, enforce unified security policies, and gain insights easily.`,
  "guide.startup.modal.goto_register":
    "Go to registration to easily manage clusters",
  "guide.settings.reset_user.desc": "Reset the admin user",
  "guide.settings.verify_secret.empty_tip": "Secret can not be empty!",
  "guide.settings.verify_secret.confirm.title": "You input a invalid credential key",
  "guide.settings.verify_secret.confirm.desc": "Previous credential information will be invalid. And you must update the credential information manually to avoid affecting the use of the system!",
  "guide.settings.verify_secret.notification.desc": "Because you have used a new secret key, the credentials are no longer valid. Please update the credential information manually.",
};
