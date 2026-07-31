# Makefile for Upbound Documentation
# This Makefile provides commands for building, testing, and linting documentation

# Variables
VALE_VERSION := 3.7.1
VALE_CONFIG := utils/vale/.vale.ini
VALE_STYLES := utils/vale/styles
DOCS_DIR := docs
VALE_URL := https://github.com/errata-ai/vale/releases/download/v$(VALE_VERSION)

# Determine OS and architecture for Vale binary
UNAME_S := $(shell uname -s)
UNAME_M := $(shell uname -m)

ifeq ($(UNAME_S),Linux)
	VALE_OS := Linux
endif
ifeq ($(UNAME_S),Darwin)
	VALE_OS := macOS
endif

ifeq ($(UNAME_M),x86_64)
	VALE_ARCH := 64-bit
endif
ifeq ($(UNAME_M),arm64)
	VALE_ARCH := arm64
endif
ifeq ($(UNAME_M),aarch64)
        VALE_ARCH := arm64
endif

VALE_BINARY := vale_$(VALE_VERSION)_$(VALE_OS)_$(VALE_ARCH).tar.gz
VALE_INSTALL_DIR := ./bin
VALE_EXEC := $(VALE_INSTALL_DIR)/vale

.PHONY: help install-vale vale vale-docs vale-file vale-summary clean build start serve

# Default target
help: ## Show this help message
	@echo "Upbound Documentation Makefile"
	@echo ""
	@echo "Available targets:"
	@awk 'BEGIN {FS = ":.*##"; printf "\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  %-20s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

# Documentation build commands
install: ## Install dependencies
	npm install

build: ## Build the documentation site
	npm run build

start: ## Start local development server
	npm start

serve: ## Serve built documentation
	npm run serve

# Vale installation and linting commands
install-vale: ## Install Vale binary locally
	@echo "Installing Vale $(VALE_VERSION) for $(VALE_OS) $(VALE_ARCH)..."
	@mkdir -p $(VALE_INSTALL_DIR)
	@if [ ! -f $(VALE_EXEC) ]; then \
		curl -L $(VALE_URL)/$(VALE_BINARY) -o /tmp/$(VALE_BINARY) && \
		tar -xzf /tmp/$(VALE_BINARY) -C $(VALE_INSTALL_DIR) && \
		chmod +x $(VALE_EXEC) && \
		rm /tmp/$(VALE_BINARY) && \
		echo "Vale installed successfully at $(VALE_EXEC)"; \
	else \
		echo "Vale already installed at $(VALE_EXEC)"; \
	fi

vale: install-vale ## Run Vale linting on all markdown files
	@echo "Running Vale linting on all documentation..."
	@cd $(DOCS_DIR) && ../$(VALE_EXEC) --config=../$(VALE_CONFIG) --glob='*.md' .

vale-docs: install-vale ## Run Vale linting on docs directory only
	@echo "Running Vale linting on docs directory..."
	@cd $(DOCS_DIR) && ../$(VALE_EXEC) --config=../$(VALE_CONFIG) --glob='**/*.md' .

vale-file: install-vale ## Run Vale linting on a specific file (usage: make vale-file FILE=path/to/file.md)
	@if [ -z "$(FILE)" ]; then \
		echo "Usage: make vale-file FILE=path/to/file.md"; \
		exit 1; \
	fi
	@echo "Running Vale linting on $(FILE)..."
	@$(VALE_EXEC) --config=$(VALE_CONFIG) $(FILE)

vale-summary: install-vale ## Run Vale linting with summary output
	@echo "Running Vale linting with summary..."
	@cd $(DOCS_DIR) && ../$(VALE_EXEC) --config=../$(VALE_CONFIG) --glob='**/*.md' --output=summary .

vale-json: install-vale ## Run Vale linting with JSON output
	@echo "Running Vale linting with JSON output..."
	@cd $(DOCS_DIR) && ../$(VALE_EXEC) --config=../$(VALE_CONFIG) --glob='**/*.md' --output=JSON .

# Utility commands
clean: ## Clean build artifacts and installed binaries
	@echo "Cleaning build artifacts..."
	@rm -rf build/
	@rm -rf .docusaurus/
	@rm -rf $(VALE_INSTALL_DIR)/
	@echo "Clean completed"

check-vale-config: ## Check Vale configuration
	@echo "Vale configuration file: $(VALE_CONFIG)"
	@echo "Vale styles directory: $(VALE_STYLES)"
	@if [ -f $(VALE_CONFIG) ]; then \
		echo "✓ Vale configuration found"; \
	else \
		echo "✗ Vale configuration not found"; \
	fi
	@if [ -d $(VALE_STYLES) ]; then \
		echo "✓ Vale styles directory found"; \
		echo "Available styles:"; \
		ls -la $(VALE_STYLES)/; \
	else \
		echo "✗ Vale styles directory not found"; \
	fi

# Combined commands
lint: vale ## Alias for vale target
lint-summary: vale-summary ## Alias for vale-summary target
lint-file: vale-file ## Alias for vale-file target

# Development workflow
dev: install start ## Install dependencies and start development server

# CI/CD targets
ci-lint: install-vale vale-summary ## Run linting for CI/CD pipeline
ci-build: install build ## Build for CI/CD pipeline

# Version info
version: ## Show versions of tools
	@echo "Documentation toolchain versions:"
	@echo "Node.js: $(shell node --version 2>/dev/null || echo 'not installed')"
	@echo "npm: $(shell npm --version 2>/dev/null || echo 'not installed')"
	@if [ -f $(VALE_EXEC) ]; then \
		echo "Vale: $(shell $(VALE_EXEC) --version 2>/dev/null || echo 'not installed')"; \
	else \
		echo "Vale: not installed (run 'make install-vale')"; \
	fi
