SHELL=/bin/bash

# APP info
APP_NAME := search-center
APP_VERSION := 1.0.0_SNAPSHOT
APP_CONFIG := $(APP_NAME).yml
APP_EOLDate := "2021-12-31 10:10:10"
APP_STATIC_FOLDER := .public
APP_STATIC_PACKAGE := public
APP_UI_FOLDER := ui
APP_PLUGIN_FOLDER := plugin

# Get release version from environment
ifneq "$(VERSION)" ""
   APP_VERSION := $(VERSION)
endif

ifneq "$(EOL)" ""
   APP_EOLDate := $(EOL)
endif

# Ensure GOPATH is set before running build process.
ifeq "$(GOPATH)" ""
  GOPATH := ~/go
  #$(error Please set the environment variable GOPATH before running `make`)
endif


PATH := $(PATH):$(GOPATH)/bin

# Go environment
CURDIR := $(shell pwd)
OLDGOPATH:= $(GOPATH)

CMD_DIR := $(CURDIR)/cmd
OUTPUT_DIR := $(CURDIR)/bin


# INFINI framework
INFINI_BASE_FOLDER := $(OLDGOPATH)/src/infini.sh/
FRAMEWORK_FOLDER := $(INFINI_BASE_FOLDER)/framework/
FRAMEWORK_REPO := ssh://git@git.infini.ltd:64221/infini/framework.git
FRAMEWORK_BRANCH := master
FRAMEWORK_VENDOR_FOLDER := $(CURDIR)/../vendor/
FRAMEWORK_VENDOR_REPO :=  ssh://git@git.infini.ltd:64221/infini/framework-vendor.git
FRAMEWORK_VENDOR_BRANCH := master


NEWGOPATH:= $(CURDIR):$(FRAMEWORK_VENDOR_FOLDER):$(GOPATH)

GO        := GO15VENDOREXPERIMENT="1" GO111MODULE=off go
GOBUILD  := GOPATH=$(NEWGOPATH) CGO_ENABLED=0 GRPC_GO_REQUIRE_HANDSHAKE=off  $(GO) build -ldflags='-s -w' -gcflags "-m"  --work
GOBUILDNCGO  := GOPATH=$(NEWGOPATH) CGO_ENABLED=1  $(GO) build -ldflags -s
GOTEST   := GOPATH=$(NEWGOPATH) CGO_ENABLED=1  $(GO) test -ldflags -s

ARCH      := "`uname -s`"
LINUX     := "Linux"
MAC       := "Darwin"
GO_FILES=$(find . -iname '*.go' | grep -v /vendor/)
PKGS=$(go list ./... | grep -v /vendor/)

FRAMEWORK_OFFLINE_BUILD := ""
ifneq "$(OFFLINE_BUILD)" ""
   FRAMEWORK_OFFLINE_BUILD := $(OFFLINE_BUILD)
endif

.PHONY: all build update test clean

default: build-race

env:
	@echo OLDGOPATH：$(OLDGOPATH)
	@echo GOPATH：$(GOPATH)
	@echo NEWGOPATH：$(NEWGOPATH)
	@echo INFINI_BASE_FOLDER：$(INFINI_BASE_FOLDER)
	@echo FRAMEWORK_FOLDER：$(FRAMEWORK_FOLDER)
	@echo FRAMEWORK_VENDOR_FOLDER：$(FRAMEWORK_VENDOR_FOLDER)

build: config
	$(GOBUILD) -o $(OUTPUT_DIR)/$(APP_NAME)
	@$(MAKE) restore-generated-file

build-cmd: config
	@for f in $(shell ls ${CMD_DIR}); do (cd $(CMD_DIR)/$${f} && $(GOBUILD) -o $(OUTPUT_DIR)/$${f}); done
	@$(MAKE) restore-generated-file


# used to build the binary for gdb debugging
build-race: clean config update-vfs
	$(GOBUILDNCGO) -gcflags "-m -N -l" -race -o $(OUTPUT_DIR)/$(APP_NAME)
	@$(MAKE) restore-generated-file

tar: build
	cd $(OUTPUT_DIR) && tar cfz $(OUTPUT_DIR)/$(APP_NAME).tar.gz $(APP_NAME) $(APP_CONFIG)

cross-build: clean config update-vfs
	$(GO) test
	GOOS=windows GOARCH=amd64 $(GOBUILD) -o $(OUTPUT_DIR)/$(APP_NAME)-windows-amd64.exe
	GOOS=darwin  GOARCH=amd64 $(GOBUILD) -o $(OUTPUT_DIR)/$(APP_NAME)-mac-amd64
	GOOS=linux  GOARCH=amd64 $(GOBUILD) -o $(OUTPUT_DIR)/$(APP_NAME)-linux-amd64
	@$(MAKE) restore-generated-file


build-win: config
	CC=x86_64-w64-mingw32-gcc CXX=x86_64-w64-mingw32-g++ GOOS=windows GOARCH=amd64     $(GOBUILD) -o $(OUTPUT_DIR)/$(APP_NAME)-windows-amd64.exe
	CC=i686-w64-mingw32-gcc   CXX=i686-w64-mingw32-g++ GOOS=windows GOARCH=386         $(GOBUILD) -o $(OUTPUT_DIR)/$(APP_NAME)-windows-386.exe
	@$(MAKE) restore-generated-file

build-linux: config
	GOOS=linux  GOARCH=amd64  $(GOBUILD) -o $(OUTPUT_DIR)/$(APP_NAME)-linux-amd64
	GOOS=linux  GOARCH=386    $(GOBUILD) -o $(OUTPUT_DIR)/$(APP_NAME)-linux-386
	GOOS=linux  GOARCH=mips    $(GOBUILD) -o $(OUTPUT_DIR)/$(APP_NAME)-linux-mips
	GOOS=linux  GOARCH=mipsle    $(GOBUILD) -o $(OUTPUT_DIR)/$(APP_NAME)-linux-mipsle
	GOOS=linux  GOARCH=mips64    $(GOBUILD) -o $(OUTPUT_DIR)/$(APP_NAME)-linux-mips64
	GOOS=linux  GOARCH=mips64le    $(GOBUILD) -o $(OUTPUT_DIR)/$(APP_NAME)-linux-mips64le
	@$(MAKE) restore-generated-file

build-arm: config
	GOOS=linux  GOARCH=arm64    $(GOBUILD) -o $(OUTPUT_DIR)/$(APP_NAME)-linux-arm64
	GOOS=linux  GOARCH=arm   GOARM=5    $(GOBUILD) -o $(OUTPUT_DIR)/$(APP_NAME)-linux-armv5
	GOOS=linux  GOARCH=arm   GOARM=6    $(GOBUILD) -o $(OUTPUT_DIR)/$(APP_NAME)-linux-armv6
	GOOS=linux  GOARCH=arm   GOARM=7    $(GOBUILD) -o $(OUTPUT_DIR)/$(APP_NAME)-linux-armv7
	@$(MAKE) restore-generated-file

build-darwin: config
	GOOS=darwin  GOARCH=amd64     $(GOBUILD) -o $(OUTPUT_DIR)/$(APP_NAME)-mac-amd64
# 	GOOS=darwin  GOARCH=386       $(GOBUILD) -o $(OUTPUT_DIR)/$(APP_NAME)-mac-386
# 	GOOS=darwin  GOARCH=arm64    $(GOBUILD) -o $(OUTPUT_DIR)/$(APP_NAME)-mac-arm64
	@$(MAKE) restore-generated-file

build-bsd: config
	GOOS=freebsd  GOARCH=amd64    $(GOBUILD) -o $(OUTPUT_DIR)/$(APP_NAME)-freebsd-amd64
	GOOS=freebsd  GOARCH=386      $(GOBUILD) -o $(OUTPUT_DIR)/$(APP_NAME)-freebsd-386
	GOOS=netbsd  GOARCH=amd64     $(GOBUILD) -o $(OUTPUT_DIR)/$(APP_NAME)-netbsd-amd64
	GOOS=netbsd  GOARCH=386       $(GOBUILD) -o $(OUTPUT_DIR)/$(APP_NAME)-netbsd-386
	GOOS=openbsd  GOARCH=amd64    $(GOBUILD) -o $(OUTPUT_DIR)/$(APP_NAME)-openbsd-amd64
	GOOS=openbsd  GOARCH=386      $(GOBUILD) -o $(OUTPUT_DIR)/$(APP_NAME)-openbsd-386
	@$(MAKE) restore-generated-file

all: clean config update-vfs cross-build restore-generated-file

all-platform: clean config update-vfs cross-build-all-platform restore-generated-file

cross-build-all-platform: clean config build-bsd build-linux build-darwin build-win  restore-generated-file

format:
	go fmt $$(go list ./... | grep -v /vendor/)

clean_data:
	rm -rif dist
	rm -rif data
	rm -rif log

clean: clean_data
	rm -rif $(OUTPUT_DIR)
	mkdir $(OUTPUT_DIR)

init:
	@echo building $(APP_NAME) $(APP_VERSION)
	@echo $(CURDIR)
	@mkdir -p $(INFINI_BASE_FOLDER)
	@echo "framework path: " $(FRAMEWORK_FOLDER)
	@if [ ! -d $(FRAMEWORK_FOLDER) ]; then echo "framework does not exist";(cd $(INFINI_BASE_FOLDER)&&git clone -b $(FRAMEWORK_BRANCH) $(FRAMEWORK_REPO) framework ) fi
	@if [ ! -d $(FRAMEWORK_VENDOR_FOLDER) ]; then echo "framework vendor does not exist";(cd $(INFINI_BASE_FOLDER)&&git clone  -b $(FRAMEWORK_VENDOR_BRANCH) $(FRAMEWORK_VENDOR_REPO) vendor) fi
	@if [ "" == $(FRAMEWORK_OFFLINE_BUILD) ]; then (cd $(FRAMEWORK_FOLDER) && git pull origin $(FRAMEWORK_BRANCH)); fi;
	@if [ "" == $(FRAMEWORK_OFFLINE_BUILD) ]; then (cd $(FRAMEWORK_VENDOR_FOLDER) && git pull origin $(FRAMEWORK_VENDOR_BRANCH)); fi;

update-generated-file:
	@echo "update generated info"
	@echo -e "package config\n\nconst LastCommitLog = \""`git log -1 --pretty=format:"%h, %ad, %an, %s"` "\"\nconst BuildDate = \"`date "+%Y-%m-%d %H:%M:%S"`\"" > config/generated.go
	@echo -e "\nconst EOLDate  = \"$(APP_EOLDate)\"" >> config/generated.go
	@echo -e "\nconst Version  = \"$(APP_VERSION)\"" >> config/generated.go


restore-generated-file:
	@echo "restore generated info"
	@echo -e "package config\n\nconst LastCommitLog = \"N/A\"\nconst BuildDate = \"N/A\"" > config/generated.go
	@echo -e "\nconst EOLDate = \"N/A\"" >> config/generated.go
	@echo -e "\nconst Version = \"0.0.1-SNAPSHOT\"" >> config/generated.go


update-vfs:
	cd $(FRAMEWORK_FOLDER) && cd cmd/vfs && $(GO) build && cp vfs ~/
	@if [ -d $(APP_STATIC_FOLDER) ]; then  echo "generate static files";(cd $(APP_STATIC_FOLDER) && ~/vfs -ignore="static.go|.DS_Store" -o static.go -pkg $(APP_STATIC_PACKAGE) . ) fi

config: init update-vfs update-generated-file
	@echo "update configs"
	@# $(GO) env
	@mkdir -p $(OUTPUT_DIR)
	@cp $(APP_CONFIG) $(OUTPUT_DIR)/$(APP_CONFIG)


dist: cross-build package

dist-major-platform: all package

dist-all-platform: all-platform package-all-platform

package:
	@echo "Packaging"
	cd $(OUTPUT_DIR) && tar cfz $(OUTPUT_DIR)/mac-amd64.tar.gz mac-amd64  $(APP_CONFIG)
	cd $(OUTPUT_DIR) && tar cfz $(OUTPUT_DIR)/linux-amd64.tar.gz linux-amd64  $(APP_CONFIG)
	cd $(OUTPUT_DIR) && tar cfz $(OUTPUT_DIR)/windows-amd64.tar.gz windows-amd64  $(APP_CONFIG)

package-all-platform: package-darwin-platform package-linux-platform package-windows-platform
	@echo "Packaging all"
	cd $(OUTPUT_DIR) && tar cfz $(OUTPUT_DIR)/freebsd-amd64.tar.gz     $(APP_NAME)-freebsd-amd64  $(APP_CONFIG)
	cd $(OUTPUT_DIR) && tar cfz $(OUTPUT_DIR)/freebsd-386.tar.gz     $(APP_NAME)-freebsd-386  $(APP_CONFIG)
	cd $(OUTPUT_DIR) && tar cfz $(OUTPUT_DIR)/netbsd-amd64.tar.gz      $(APP_NAME)-netbsd-amd64  $(APP_CONFIG)
	cd $(OUTPUT_DIR) && tar cfz $(OUTPUT_DIR)/netbsd-386.tar.gz      $(APP_NAME)-netbsd-386  $(APP_CONFIG)
	cd $(OUTPUT_DIR) && tar cfz $(OUTPUT_DIR)/openbsd-amd64.tar.gz     $(APP_NAME)-openbsd-amd64  $(APP_CONFIG)
	cd $(OUTPUT_DIR) && tar cfz $(OUTPUT_DIR)/openbsd-386.tar.gz     $(APP_NAME)-openbsd-386  $(APP_CONFIG)

package-darwin-platform:
	@echo "Packaging Darwin"
	cd $(OUTPUT_DIR) && tar cfz $(OUTPUT_DIR)/mac-amd64.tar.gz      $(APP_NAME)-mac-amd64 $(APP_CONFIG)
# 	cd $(OUTPUT_DIR) && tar cfz $(OUTPUT_DIR)/mac-386.tar.gz      $(APP_NAME)-mac-386 $(APP_CONFIG)
# 	cd $(OUTPUT_DIR) && tar cfz $(OUTPUT_DIR)/mac-arm64.tar.gz      $(APP_NAME)-mac-arm64 $(APP_CONFIG)

package-linux-platform:
	@echo "Packaging Linux"
	cd $(OUTPUT_DIR) && tar cfz $(OUTPUT_DIR)/linux-amd64.tar.gz     $(APP_NAME)-linux-amd64 $(APP_CONFIG)
	cd $(OUTPUT_DIR) && tar cfz $(OUTPUT_DIR)/linux-mips.tar.gz     $(APP_NAME)-linux-mips $(APP_CONFIG)
	cd $(OUTPUT_DIR) && tar cfz $(OUTPUT_DIR)/linux-mipsle.tar.gz     $(APP_NAME)-linux-mipsle $(APP_CONFIG)
	cd $(OUTPUT_DIR) && tar cfz $(OUTPUT_DIR)/linux-mips64.tar.gz     $(APP_NAME)-linux-mips64 $(APP_CONFIG)
	cd $(OUTPUT_DIR) && tar cfz $(OUTPUT_DIR)/linux-mips64le.tar.gz     $(APP_NAME)-linux-mips64le $(APP_CONFIG)
	cd $(OUTPUT_DIR) && tar cfz $(OUTPUT_DIR)/linux-386.tar.gz     $(APP_NAME)-linux-386 $(APP_CONFIG)

package-linux-arm-platform:
	@echo "Packaging Linux (ARM)"
	cd $(OUTPUT_DIR) && tar cfz $(OUTPUT_DIR)/linux-arm64.tar.gz       $(APP_NAME)-linux-arm64   $(APP_CONFIG)
	cd $(OUTPUT_DIR) && tar cfz $(OUTPUT_DIR)/linux-armv5.tar.gz       $(APP_NAME)-linux-armv5   $(APP_CONFIG)
	cd $(OUTPUT_DIR) && tar cfz $(OUTPUT_DIR)/linux-armv6.tar.gz       $(APP_NAME)-linux-armv6   $(APP_CONFIG)
	cd $(OUTPUT_DIR) && tar cfz $(OUTPUT_DIR)/linux-armv7.tar.gz       $(APP_NAME)-linux-armv7   $(APP_CONFIG)

package-windows-platform:
	@echo "Packaging Windows"
	cd $(OUTPUT_DIR) && tar cfz $(OUTPUT_DIR)/windows-amd64.tar.gz   $(APP_NAME)-windows-amd64.exe $(APP_CONFIG)
	cd $(OUTPUT_DIR) && tar cfz $(OUTPUT_DIR)/windows-386.tar.gz   $(APP_NAME)-windows-386.exe $(APP_CONFIG)

test:
	go get -u github.com/kardianos/govendor
	go get github.com/stretchr/testify/assert
	govendor test +local
	go test -timeout 60s ./...
	#GORACE="halt_on_error=1" go test ./... -race -timeout 120s  --ignore ./vendor
	#go test -bench=. -benchmem
