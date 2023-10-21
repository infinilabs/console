#!/usr/bin/env bash

set -eo pipefail

function print_usage() {
  echo "Usage: curl -sSL http://get.infini.cloud/ | sudo bash -s -- [-u url_for_download_program] [-v version_for_program ] [-t target_install_dir] [-p port_for_program]"
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

function __try() {
  if [[ $try_status -eq 0 ]]; then
    ! exception=$( $@ 2>&1 >/dev/null )
    try_status=${PIPESTATUS[0]}
  fi
}

function __catch() {
  _old_try=$try_status
  try_status=0
  [[ $_old_try -ne 0 ]]
}

function confirm() {
  display_str=$1
  default_ans=$2
  if [[ $default_ans == 'y/N' ]]; then
     must_match='[yY]'
  else
     must_match='[nN]'
  fi
  read -p"${display_str} [${default_ans}]:" ans
  [[ $ans == $must_match ]]
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

  if [[ "$(ls -A ${install_dir})" ]]; then
    confirm "RISK WARN: Replace or upgrade exists agent version, Proceed?" 'y/N' && echo || exit 1;
    uninstall_service
    rm -rf ${install_dir}/*
  fi
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

  cd "${install_dir}" && rm -rf "${tmp_dir}" && echo ""
}

function install_certs() {
  ca_crt="{{ca_crt}}"
  client_crt="{{client_crt}}"
  client_key="{{client_key}}"

  mkdir -p ${install_dir}/config
  echo "[agent] waiting generate certs"
  echo -e "${ca_crt}" > ${install_dir}/config/ca.crt
  echo -e "${client_crt}" > ${install_dir}/config/client.crt
  echo -e "${client_key}" > ${install_dir}/config/client.key
}

function install_config() {
  echo "[agent] waiting generate config"
  port={{port}}
  cat <<EOF > ${install_dir}/agent.yml
configs.auto_reload: true

env:
  API_BINDING: "0.0.0.0:${port}"

path.data: data
path.logs: log
path.configs: config

resource_limit.cpu.max_num_of_cpus: 1
resource_limit.memory.max_in_bytes: 533708800

stats:
  include_storage_stats_in_api: false

elastic:
  skip_init_metadata_on_start: true
  health_check:
    enabled: true
    interval: 60s
  availability_check:
    enabled: false
    interval: 60s

disk_queue:
  max_msg_size: 20485760
  max_bytes_per_file: 20485760
  max_used_bytes: 524288000
  retention.max_num_of_local_files: 1
  compress:
    idle_threshold: 0
    num_of_files_decompress_ahead: 0
    segment:
      enabled: true

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
  value_threshold: 1024
  mem_table_size: 1048576
  value_log_max_entries: 1000000
  value_log_file_size: 104857600

configs:
  #for managed client's setting
  managed: true # managed by remote servers
  panic_on_config_error: false #ignore config error
  interval: "10s"
  servers: # config servers
    - "http://localhost:9000"
  max_backup_files: 5
  tls: #for mTLS connection with config servers
    enabled: true
    cert_file: "config/client.crt"
    key_file: "config/client.key"
    ca_file: "config/ca.crt"
    skip_insecure_verify: false

node:
  major_ip_pattern: ".*"
EOF
}

function uninstall_service() {
  agent_svc=${install_dir}/${program_name}-${file_ext%%.*}
  chmod 755 $agent_svc

  macos_svc=/Library/LaunchDaemons/agent.plist
  linux_svc=/etc/systemd/system/agent.service

  if [[ -f "$linux_svc" || -f "$macos_svc" ]]; then
    echo "[agent] waiting service stop & uninstall for exist agent"
    $agent_svc -service stop &>/dev/null
    $agent_svc -service uninstall &>/dev/null
  fi
  sleep 3
}

function install_service() {
  agent_svc=${install_dir}/${program_name}-${file_ext%%.*}
  chmod 755 $agent_svc
  echo "[agent] waiting service install & start"
  $agent_svc -service install &>/dev/null
  $agent_svc -service start &>/dev/null
  sleep 3
}

function register_agent() {
  console_endpoint="{{console_endpoint}}"
  token={{token}}
  echo '[agent] waiting registering to INFINI Console'
  until curl -s -m30 -XPOST "${console_endpoint}/agent/instance?token=${token}";
  do
    echo -n '.'; sleep 3;
  done;
  echo
  #__try curl -s --retry 1 --retry-delay 3 -m30 -XPOST -o ${install_dir}/setup.log "${console_endpoint}/agent/instance?token=${token}"
}

function main() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -u|--url) url_download="$2"; shift 2 ;;
      -v|--version) version="$2"; shift 2 ;;
      -t|--target) target_dir="$2"; shift 2 ;;
      *) print_usage ;;
    esac
  done

  program_name=agent
  location=${url_download:-https://release.infinilabs.com/agent/stable}
  install_dir=${target_dir:-/opt/$program_name}
  latest_version=$(get_latest_version)
  version=${version:-$latest_version}
  file_ext=""

  if [[ -z "${version}" ]]; then
    echo "Error: Could not obtain the latest version number. Please check the network and try again.">&2; exit 1;
  else
    echo "Name: [${program_name}], Version: [${version}], Path: [${install_dir}]"
  fi

  check_dir
  check_platform
  install_binary
  install_certs
  install_config
  uninstall_service
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
