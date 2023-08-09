#!/usr/bin/env bash

set -eo pipefail

function print_usage() {
  echo "Usage: curl -sSL http://get.infini.sh/agent.html | sudo bash -s -- [-u url_for_download_program] [-v version_for_program ] [-t taget_install_dir] [-p prot_for_program]"
  echo "Options:"
  echo "  -u, --url <url>             Download url of the program to install which default is http://localhost"
  echo "  -v, --version <version>     Version of the program to install which default is latest from "
  echo "  -t, --target <dir>          Target directory of the program install which default is /opt/agent"
  exit 1
}

function print_header() {
    echo "                                            "
    echo "                                 @@@@@@@@@@@"
    echo "                                @@@@@@@@@@@@"
    echo "                                @@@@@@@@@@@@"
    echo "                               @@@@@@@@@&@@@"
    echo "                              #@@@@@@@@@@@@@"
    echo "        @@@                   @@@@@@@@@@@@@ "
    echo "       &@@@@@@@              &@@@@@@@@@@@@@ "
    echo "       @&@@@@@@@&@           @@@&@@@@@@@&@  "
    echo "      @@@@@@@@@@@@@@@@      @@@@@@@@@@@@@@  "
    echo "      @@@@@@@@@@@@@@@@@@&   @@@@@@@@@@@@@   "
    echo "        %@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@   "
    echo "            @@@@@@@@@@@@&@@@@@@@@@@@@@@@    "
    echo "    @@         ,@@@@@@@@@@@@@@@@@@@@@@@&    "
    echo "    @@@@@.         @@@@@&@@@@@@@@@@@@@@     "
    echo "   @@@@@@@@@@          @@@@@@@@@@@@@@@#     "
    echo "   @&@@@&@@@&@@@          &@&@@@&@@@&@      "
    echo "  @@@@@@@@@@@@@.              @@@@@@@*      "
    echo "  @@@@@@@@@@@@@                  %@@@       "
    echo " @@@@@@@@@@@@@                              "
    echo "/@@@@@@@&@@@@@                              "
    echo "@@@@@@@@@@@@@                               "
    echo "@@@@@@@@@@@@@                               "
    echo "@@@@@@@@@@@@        Welcome to INFINI Labs!"
    echo ""
    echo ""
    echo "Now attempting the installation... "
    echo ""
}

function print_footprint() {
		echo "   __ _  __ ____ __ _  __ __     "
		echo "  / // |/ // __// // |/ // /    "
		echo " / // || // _/ / // || // /    "
		echo "/_//_/|_//_/  /_//_/|_//_/   "
		echo ""
		echo "©INFINI.LTD, All Rights Reserved."
		echo ""
}

__try() {
  if [[ $try_status -eq 0 ]]; then
    ! exception=$( $@ 2>&1 >/dev/null )
    try_status=${PIPESTATUS[0]}
  fi
}

__catch() {
  _old_try=$try_status
  try_status=0
  [[ $_old_try -ne 0 ]]
}

function get_latest_version() {
  echo $(curl -m3 -s "https://release.infinilabs.com/.latest" |sed 's/",/"/;s/"//g;s/://1' |grep -Ev '^[{}]' |grep "$program_name" |awk '{print $NF}')
}

function check_dir() {
  if [[ ! -d "${install_dir}" ]]; then
    __try mkdir -p "${install_dir}"
    if __catch e; then
      echo -e "Error: Unable to create installation directory, please manually create and reinstall.\nsudo mkdir -p ${install_dir} && sudo chown -R \$(whoami) ${install_dir}" >&2; exit 1;
    fi
  fi

  owner=$(ls -ld "${install_dir}" |awk '{print $3}')
  if [[ "${owner}" != "$(whoami)" ]]; then
    echo -e "Error: The installation directory ${install_dir} should be owner by current user.\nsudo chown -R \$(whoami) ${install_dir}" >&2; exit 1;
  fi

  #if [[ "$(ls -A ${install_dir})" ]]; then
  #  echo "Error: The installation directory ${install_dir} should be clean." >&2; exit 1;
  #fi
}

function check_platform() {
    local platform=$(uname)
    local arch=$(uname -m)

    case $platform in
        "Linux")
            case $arch in
                "i386"|"i686"|"x86")
                    file_ext="linux-386.tar.gz"
                    ;;
                "x86_64"|"amd64")
                    file_ext="linux-amd64.tar.gz"
                    ;;
                "aarch64"|"arm64")
                    file_ext="linux-arm64.tar.gz"
                    ;;
                "armv5tel")
                    file_ext="linux-armv5.tar.gz"
                    ;;
                "armv6l")
                    file_ext="linux-armv6.tar.gz"
                    ;;
                "armv7"|"armv7l")
                    file_ext="linux-armv7.tar.gz"
                    ;;
                "mips"|"mipsel")
                    file_ext="linux-mips.tar.gz"
                    ;;
                "mips64")
                    file_ext="linux-mips64.tar.gz"
                    ;;
                "mips64el")
                    file_ext="linux-mips64le.tar.gz"
                    ;;
                "loong64")
                    file_ext="linux-loong64.tar.gz"
                    ;;
                "sw_64")
                    file_ext="linux-sw64.tar.gz"
                    ;;
                "riscv64")
                    file_ext="linux-riscv64.tar.gz"
                    ;;
                *)
                    echo "Unsupported architecture: ${arch}" >&2
                    exit 1
                    ;;
            esac
            ;;
        "Darwin")
            case $arch in
                "x86_64"|"amd64")
                    file_ext="mac-amd64.zip"
                    ;;
                "arm64")
                    file_ext="mac-arm64.zip"
                    ;;
                *)
                    echo "Unsupported architecture: ${arch}" >&2
                    exit 1
                    ;;
            esac
            ;;
        "MINGW"*|"WSL"*|"Cygwin")
            case $arch in
                "i386"|"i686")
                    file_ext="windows-386.zip"
                    ;;
                "x86_64"|"amd64")
                    file_ext="windows-amd64.zip"
                    ;;
                *)
                    echo "Unsupported architecture: ${arch}" >&2
                    exit 1
                    ;;
            esac
            ;;
        *)
            echo "Unsupported platform: ${platform}" >&2
            exit 1
            ;;
    esac
}

function install_binary() {
  local download_url="$location/${program_name}-${version}-${file_ext}"
  echo "File: [$download_url]"

  tmp_dir="$(mktemp -d)"
  cd "$tmp_dir"

  if command -v curl >/dev/null 2>&1; then
    curl -# -LO "$download_url"
  elif command -v wget >/dev/null 2>&1; then
    wget -q -nc --show-progress --progress=bar:force:noscroll "$download_url"
  else
    echo "Error: Could not find curl or wget, Please install wget or curl in advance." >&2; exit 1;
  fi

  if [[ "${file_ext}" == *".tar.gz" ]]; then
      tar -xzf "${program_name}-${version}-${file_ext}" -C "$install_dir"
  else
      unzip -q "${program_name}-${version}-${file_ext}" -d "$install_dir"
  fi

  cd "${install_dir}" && rm -rf "${tmp_dir}"
}

function install_certs() {
  ca_crt="{{ca_crt}}"
  client_crt="{{client_crt}}"
  client_key="{{client_key}}"

  mkdir -p ${install_dir}/config
  sh -c "echo '${ca_crt}' > ${install_dir}/config/ca.crt"
  sh -c "echo '${client_crt}' > ${install_dir}/config/client.crt"
  sh -c "echo '${client_key}' > ${install_dir}/config/client.key"
}

function install_config() {
  port={{port}}
  cat <<EOF > ${install_dir}/agent.yml
configs.auto_reload: true

env:
  API_BINDING: "0.0.0.0:${port}"

path.data: data
path.logs: log
path.configs: config

api:
  enabled: true
  tls:
    enabled: true
    cert_file: "config/client.crt"
    key_file: "config/client.key"
    ca_file: "config/ca.crt"
    skip_insecure_verify: false
  network:
    binding: \$[[env.API_BINDING]]

badger:
  value_log_max_entries: 1000000
  value_log_file_size: 104857600
  value_threshold: 1024

agent:
  major_ip_pattern: ".*"
EOF
}

function install_service() {
  agent_svc=${install_dir}/${program_name}-${file_ext%%.*}
  chmod 755 $agent_svc

  macos_svc=/Library/LaunchDaemons/agent.plist
  linux_svc=/etc/systemd/system/agent.service

  if [[ -f "$linux_svc" || -f "$macos_svc" ]]; then
    echo "service stop & uninstall for existing agent"
    $agent_svc -service stop &>/dev/null
    $agent_svc -service uninstall &>/dev/null
  fi

  echo "seriver install & start"
  $agent_svc -service install
  $agent_svc -service start
  sleep 5
}

function register_agent() {
  echo "Registration to INFINI Console"
  console_endpoint="{{console_endpoint}}"
  token={{token}}
  curl -XPOST -m9 -s ${console_endpoint}/agent/instance?token=${token}
}

function main() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -u|--url) location="$2"; shift 2 ;;
      -v|--version) version="$2"; shift 2 ;;
      -t|--target) target_dir="$2"; shift 2 ;;
      -p|--port) port="$2"; shift 2 ;;
      *) print_usage ;;
    esac
  done

  program_name=agent
  install_dir=${target_dir:-/opt/$program_name}
  latest_version=$(get_latest_version)
  version=${version:-$latest_version}
  file_ext=""

  if [[ -z "${version}" ]]; then
    echo "Error: Could not obtain the latest version number. Please check the network and try again.">&2; exit 1;
  else
    echo "Name: [${program_name}], Version: [${version}], Path: [${install_dir}]]"
  fi

  check_dir
  check_platform
  install_binary
  install_certs
  install_config
  install_service
  register_agent

  echo ""
  echo ""
  echo "----------------------------------------------------------------"
  echo "Congratulations, agent install success!"
  echo "----------------------------------------------------------------"
  echo ""
  echo ""
  
  print_footprint
}

print_header

main "$@"
