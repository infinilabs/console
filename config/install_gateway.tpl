#!/usr/bin/env bash

set -eo pipefail

DEFAULT_DOWNLOAD_URL="{{base_url}}"
DEFAULT_VERSION="{{version}}"

function print_usage() {
  echo "Usage: curl -ksSL http://console.local/instance/_get_gateway_install_script?token | sudo bash -s -- [-u url_for_download_program] [-v version_for_program] [-d target_install_dir] [--no-service]"
  echo "Options:"
  echo "  -u, --url <url>             Install Gateway download URL, supports host, package directory, or direct package file URL"
  echo "  -v, --version <version>     Install Gateway version, default is Console configured version, current Console build version, or the latest version from the download source"
  echo "  -d, --install-dir <dir>     Install Gateway target path, default is /opt/gateway"
  echo "      --no-service           Install without system service (for containers or environments without sudo)"
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
    echo "Now attempting the Gateway installation... "
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

function get_latest_version() {
  local input_url="${1:-$DEFAULT_DOWNLOAD_URL}"
  input_url="${input_url%/}"
  local latest_url
  local latest_version=""

  case "$input_url" in
    *.tar.gz|*.zip)
      echo ""
      return
      ;;
  esac

  for latest_url in "${input_url}/.latest" "${input_url%/gateway/stable}/.latest"; do
    [[ -z "$latest_url" ]] && continue
    latest_version=$(curl -m30 -s "$latest_url" |sed 's/",/"/;s/"//g;s/://1' |grep -Ev '^[{}]' |grep "$program_name" |awk '{print $NF}')
    if [[ -n "$latest_version" ]]; then
      echo "$latest_version"
      return
    fi
  done

  echo ""
}

function check_dir() {
  if [[ "${install_dir}" != /* ]]; then
    install_dir="$(pwd)/${install_dir}"
  fi
  if [[ ! -d "${install_dir}" ]]; then
    __try mkdir -p "${install_dir}"
    if __catch e; then
      echo -e "Error: Unable to create installation directory, please manually create and reinstall.\nsudo mkdir -p ${install_dir} && sudo chown -R \$(whoami) ${install_dir}" >&2; exit 1;
    fi
  fi
  install_dir=$(realpath "${install_dir}")
  owner=$(ls -ld "${install_dir}" |awk '{print $3}')
  if [[ "${owner}" != "$(whoami)" ]]; then
    echo -e "Error: The installation directory ${install_dir} should be owner by current user.\nsudo chown -R \$(whoami) ${install_dir}" >&2; exit 1;
  fi

  if [[ "$(ls -A ${install_dir})" ]]; then
    echo "[gateway] found existing files in ${install_dir}, cleaning up"
    if [[ "${install_dir}" == "/" ]]; then
      echo "Error: refusing to clean root directory /" >&2; exit 1;
    fi
    find "${install_dir}" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
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
                "loong64"|"loongarch64")
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

function resolve_download_url() {
  local input_url="${1:-$DEFAULT_DOWNLOAD_URL}"
  input_url="${input_url%/}"
  local archive_name="$2"

  case "$input_url" in
    *.tar.gz|*.zip)
      echo "$input_url"
      return
      ;;
  esac

  if [[ "$input_url" =~ ^[a-zA-Z][a-zA-Z0-9+.-]*://[^/]+$ ]]; then
    echo "${input_url}/gateway/stable/${archive_name}"
    return
  fi

  echo "${input_url}/${archive_name}"
}

function install_binary() {
  local archive_name="${program_name}-${version}-${file_ext}"
  local download_url=$(resolve_download_url "$location" "$archive_name")
  local downloaded_file="${download_url##*/}"
  downloaded_file="${downloaded_file%%\?*}"
  echo "File: [$download_url]"

  tmp_dir="$(mktemp -d)"
  cd "$tmp_dir"

  if command -v curl >/dev/null 2>&1; then
    curl -k -# -LO "$download_url"
  elif command -v wget >/dev/null 2>&1; then
    wget --no-check-certificate -q -nc --show-progress --progress=bar:force:noscroll "$download_url"
  else
    echo "Error: Could not find curl or wget, Please install wget or curl in advance." >&2; exit 1;
  fi

  if [[ "${file_ext}" == *".tar.gz" ]]; then
      tar -xzf "${downloaded_file}" -C "$install_dir"
  else
      unzip -q "${downloaded_file}" -d "$install_dir"
  fi

  cd "${install_dir}" && rm -rf "${tmp_dir}" && echo ""
}

function install_certs() {
  ca_crt="{{ca_crt}}"
  client_crt="{{client_crt}}"
  client_key="{{client_key}}"
  relay_server_crt="{{relay_server_crt}}"
  relay_server_key="{{relay_server_key}}"

  mkdir -p ${install_dir}/config
  echo "[gateway] waiting generate certs"
  echo -e "${ca_crt}" > ${install_dir}/config/ca.crt
  echo -e "${client_crt}" > ${install_dir}/config/client.crt
  echo -e "${client_key}" > ${install_dir}/config/client.key
  echo -e "${relay_server_crt}" > ${install_dir}/config/relay_server.crt
  echo -e "${relay_server_key}" > ${install_dir}/config/relay_server.key
}

function install_config() {
  echo "[gateway] waiting generate config"
  port={{port}}
  console_endpoint="{{console_endpoint}}"
  service_type="{{service_type}}"
  relay_role="{{relay_role}}"
  config_manager_server=${register_server:-$console_endpoint}
  echo "[gateway] gateway api listening port $port"
  echo "[gateway] relay config manager upstream: ${config_manager_server}"
  echo "[gateway] service type: ${service_type}"
  echo "[gateway] relay role: ${relay_role:-unset}"
  cat <<EOF > ${install_dir}/gateway.yml
configs.auto_reload: true

env:
  API_BINDING: "0.0.0.0:${port}"
  SECURITY_ENABLED: true
  CONFIG_MANAGER_SERVERS: ["${config_manager_server}"]

path.data: "${install_dir}/data"
path.logs: "${install_dir}/log"
path.configs: "${install_dir}/config"

api:
  enabled: true
  network:
    binding: \$[[env.API_BINDING]]
  websocket:
    enabled: true
    base_path: /ws
    skip_host_verify: true
  security:
    enabled: \$[[env.SECURITY_ENABLED]]
    username: '\$[[keystore.API_SECURITY_USERNAME]]'
    password: '\$[[keystore.API_SECURITY_PASSWORD]]'

web:
  access_log_enabled: false

badger:
  mem_table_size: 10485760
  memory_mode: false
  num_level0_tables: 1
  num_level0_tables_stall: 2
  num_mem_tables: 1
  path: ""
  single_bucket_mode: true
  sync_writes: false
  value_log_file_size: 536870912
  value_log_max_entries: 1000000
  value_threshold: 1048576

disk_queue:
  auto_skip_corrupted_file: true
  cleanup_files_on_init: true
  compress:
    delete_after_compress: true
    idle_threshold: 5
    message:
      enabled: true
    num_of_files_decompress_ahead: 3
    segment:
      enabled: false
  eof_retry_delay_in_ms: 500
  prepare_files_to_read: true
  read_chan_buffer_size: 1000
  retention:
    max_num_of_local_files: 2
  write_chan_buffer_size: 1000

elastic:
  enabled: true
  remote_configs: false
  skip_init_metadata_on_start: false
  availability_check:
    enabled: true
    interval: 30s
  cluster_settings_check:
    enabled: false
    interval: 60s
  health_check:
    enabled: true
    interval: 30s
  metadata_refresh:
    enabled: true
    interval: 60s

configs:
  managed: true
  panic_on_config_error: false
  interval: "10s"
  servers: \$[[env.CONFIG_MANAGER_SERVERS]]
  manager:
    access_token: '\$[[keystore.CONFIGS_MANAGER_ACCESS_TOKEN]]'
  max_backup_files: 5
  soft_delete: false
  tls:
    enabled: true
    cert_file: "config/client.crt"
    key_file: "config/client.key"
    ca_file: "config/ca.crt"
    default_domain: "{{console_domain}}"
    skip_insecure_verify: false

node:
  major_ip_pattern: ".*"
  labels:
    service_type: "${service_type}"
    relay_role: "${relay_role}"
EOF
}

function install_manager_token() {
  access_token="{{access_token}}"
  gateway_svc=${install_dir}/${program_name}-${file_ext%%.*}

  if [[ -z "${access_token}" ]]; then
    echo "Error: access token is empty." >&2
    exit 1
  fi

  echo "[gateway] waiting save console manager access token"
  echo -n "${access_token}" | ${gateway_svc} keystore add "CONFIGS_MANAGER_ACCESS_TOKEN" --stdin --force >/dev/null
  echo -n "${access_token}" | ${gateway_svc} keystore add "configs_manager_bootstrap_token" --stdin --force >/dev/null
}

function install_api_security_credentials() {
  api_security_username="{{api_security_username}}"
  api_security_password="{{api_security_password}}"
  gateway_svc=${install_dir}/${program_name}-${file_ext%%.*}

  if [[ -z "${api_security_username}" ]]; then
    echo "Error: api security username is empty." >&2
    exit 1
  fi
  if [[ -z "${api_security_password}" ]]; then
    echo "Error: api security password is empty." >&2
    exit 1
  fi

  echo "[gateway] waiting save local api security credentials"
  echo -n "${api_security_username}" | ${gateway_svc} keystore add "API_SECURITY_USERNAME" --stdin --force >/dev/null
  echo -n "${api_security_password}" | ${gateway_svc} keystore add "API_SECURITY_PASSWORD" --stdin --force >/dev/null
}

function uninstall_service() {
  gateway_svc=${install_dir}/${program_name}-${file_ext%%.*}
  if [[ ! -f "$gateway_svc" ]]; then
    return
  fi
  chmod 755 $gateway_svc

  macos_svc=/Library/LaunchDaemons/${service_name}.plist
  linux_svc=/etc/systemd/system/${service_name}.service

  if [[ -f "$linux_svc" || -f "$macos_svc" ]]; then
    echo "[gateway] waiting service stop & uninstall for exist ${service_name}"
    (cd "${install_dir}" && SERVICE_NAME="${service_name}" $gateway_svc -service stop &>/dev/null || true)
    (cd "${install_dir}" && SERVICE_NAME="${service_name}" $gateway_svc -service uninstall &>/dev/null || true)
  fi
}

function install_service() {
  gateway_svc=${install_dir}/${program_name}-${file_ext%%.*}
  chmod 755 $gateway_svc
  echo "[gateway] waiting service install & start"
  if ! (cd "${install_dir}" && SERVICE_NAME="${service_name}" $gateway_svc -service install &>/dev/null); then
    echo "[gateway] failed to install service" >&2
    exit 1
  fi
  if ! (cd "${install_dir}" && SERVICE_NAME="${service_name}" $gateway_svc -service start &>/dev/null); then
    echo "[gateway] failed to start service" >&2
    exit 1
  fi
}

function print_no_service_notice() {
  gateway_svc=${install_dir}/${program_name}-${file_ext%%.*}
  chmod 755 $gateway_svc
  echo "[gateway] skip service install because --no-service is enabled"
  echo "[gateway] start Gateway in foreground after installation:"
  echo "cd \"${install_dir}\" && ./$(basename "${gateway_svc}") -config gateway.yml"
}

function main() {
  no_service="false"
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -u|--url) url_download="$2"; shift 2 ;;
      -v|--version) version="$2"; shift 2 ;;
      -d|--install-dir) target_dir="$2"; shift 2 ;;
      --no-service) no_service="true"; shift ;;
      *) print_usage ;;
    esac
  done

  program_name=gateway
  service_name="{{service_name}}"
  location=${url_download:-$DEFAULT_DOWNLOAD_URL}
  install_dir=${target_dir:-{{install_dir}}}
  latest_version=""
  if [[ -z "${version}" && -z "${DEFAULT_VERSION}" ]]; then
    latest_version=$(get_latest_version "$location")
  fi
  version=${version:-${DEFAULT_VERSION:-$latest_version}}
  file_ext=""
  if [[ -z "${service_name}" ]]; then
    service_name="${program_name}"
  fi

  if [[ -z "${version}" ]]; then
    echo "Error: Could not obtain the latest version number. Please check the network and try again.">&2; exit 1;
  else
    echo "Name: [${program_name}], Service: [${service_name}], Version: [${version}], Path: [${install_dir}]"
  fi

  check_platform
  if [[ "$no_service" != "true" ]]; then
    uninstall_service
  fi
  check_dir
  install_binary
  install_certs
  install_config
  install_manager_token
  install_api_security_credentials
  if [[ "$no_service" != "true" ]]; then
    install_service
  else
    print_no_service_notice
  fi

  echo ""
  echo ""
  echo "----------------------------------------------------------------"
  echo "Congratulations, gateway install success!"
  echo "----------------------------------------------------------------"
  echo ""
  echo ""

  print_footprint
}

print_header

main "$@"
