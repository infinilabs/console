SHELL=/bin/bash

# APP info
APP_NAME := console
APP_VERSION := 1.0.0_SNAPSHOT
APP_CONFIG := $(APP_NAME).yml
APP_EOLDate ?= "2025-12-31T10:10:10Z"
APP_STATIC_FOLDER := .public
APP_STATIC_PACKAGE := public
APP_UI_FOLDER := ui
APP_PLUGIN_FOLDER := plugin
GOMODULE := false

# GO15VENDOREXPERIMENT="1" GO111MODULE=off easyjson -all domain.go
include ../framework/Makefile


NVM_VERSION=0.39.3
NODE_VERSION=16.20.2
NVM_INSTALL_URL=https://raw.githubusercontent.com/nvm-sh/nvm/v$(NVM_VERSION)/install.sh

# Initialize the web development environment
init-web-dev:
	@if ! command -v nvm > /dev/null 2>&1; then \
		echo "nvm not found. Installing..."; \
		curl -o- $(NVM_INSTALL_URL) | bash; \
		export NVM_DIR="$$(echo ~/.nvm)"; \
		[ -s "$$NVM_DIR/nvm.sh" ] && \. "$$NVM_DIR/nvm.sh"; \
	fi; \
	export NVM_DIR="$$(echo ~/.nvm)"; \
	[ -s "$$NVM_DIR/nvm.sh" ] && \. "$$NVM_DIR/nvm.sh"; \
	nvm install $(NODE_VERSION); \
	nvm use $(NODE_VERSION); \
	echo "Using Node.js version: $$(node -v)"; \
	(cd web && npm install)

# Clean node_modules
clean-web-dev:
	@echo "Cleaning node_modules..."
	@(cd web && rm -rf node_modules)
	@echo "Done."

# Lint the code
web-lint:
	@echo "Running lint..."
	@(cd web && npx eslint . --ext .js,.jsx,.ts,.tsx)
	@echo "Linting complete."

# Build the web app
build-web:
	@echo "Building the web app..."
	@(cd web && npm run build)
	@echo "Build complete."

# Run the development server
dev-web:
	@echo "Starting the development server..."
	@(cd web && npm run dev)