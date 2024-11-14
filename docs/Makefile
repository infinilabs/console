SHELL=/bin/bash

# Basic info
PRODUCT?= $(shell basename "$(shell cd .. && pwd)")
BRANCH?= main
VERSION?= $(shell [[ "$(BRANCH)" == "main" ]] && echo "latest" || echo "$(BRANCH)")
CURRENT_VERSION?= $(VERSION)
VERSIONS?= "latest"
OUTPUT?= "/tmp/docs"

.PHONY: docs-build

default: docs-build

docs-env:
	@echo "Debugging Variables:"
	@echo "PRODUCT: $(PRODUCT)"
	@echo "BRANCH: $(BRANCH)"
	@echo "VERSION: $(VERSION)"
	@echo "CURRENT_VERSION: $(CURRENT_VERSION)"
	@echo "VERSIONS: $(VERSIONS)"
	@echo "OUTPUT: $(OUTPUT)"

docs-config:
	cp config.yaml config.bak
	# Detect OS and apply the appropriate sed command
	@if [ "$$(uname)" = "Darwin" ]; then \
		echo "Running on macOS"; \
		sed -i '' "s/BRANCH/$(VERSION)/g" config.yaml; \
	else \
		echo "Running on Linux"; \
		sed -i 's/BRANCH/$(VERSION)/g' config.yaml; \
	fi

docs-build: docs-config
	hugo --minify --theme book --destination="$(OUTPUT)/$(PRODUCT)/$(VERSION)" \
        --baseURL="/$(PRODUCT)/$(VERSION)"
	@$(MAKE) docs-restore-generated-file

docs-restore-generated-file:
	mv config.bak config.yaml
