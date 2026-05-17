#!/usr/bin/env bash

set -eo pipefail

DEFAULT_DOWNLOAD_URL="{{base_url}}"
DEFAULT_VERSION="{{version}}"

function print_usage() {
  echo "Usage: curl -ksSL http://console.local/instance/_get_gateway_install_script?token | sudo bash -s -- [-u url_for_download_program] [-v version_for_program] [-d target_install_dir]"
  echo "Options:"
  echo "  -u, --url <url>             Install Gateway download URL, supports host, package directory, or direct package file URL"
  echo "  -v, --version <version>     Install Gateway version, default is Console configured version or the latest version from the download source"
  echo "  -d, --install-dir <dir>     Install Gateway target path, default is /opt/gateway"
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
    echo "Error: The installation directory ${install_dir} should be clean." >&2; exit 1;
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

function main() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -u|--url) url_download="$2"; shift 2 ;;
      -v|--version) version="$2"; shift 2 ;;
      -d|--install-dir) target_dir="$2"; shift 2 ;;
      *) print_usage ;;
    esac
  done

  program_name=gateway
  location=${url_download:-$DEFAULT_DOWNLOAD_URL}
  install_dir=${target_dir:-/opt/$program_name}
  latest_version=""
  if [[ -z "${version}" && -z "${DEFAULT_VERSION}" ]]; then
    latest_version=$(get_latest_version "$location")
  fi
  version=${version:-${DEFAULT_VERSION:-$latest_version}}
  file_ext=""

  if [[ -z "${version}" ]]; then
    echo "Error: Could not obtain the latest version number. Please check the network and try again.">&2; exit 1;
  else
    echo "Name: [${program_name}], Version: [${version}], Path: [${install_dir}]"
  fi

  check_dir
  check_platform
  install_binary

  echo ""
  echo "Installation complete. [${program_name}] is ready to use!"
  echo ""
  echo ""
  echo "----------------------------------------------------------------"
  echo "cd ${install_dir} && ./gateway-${file_ext%%.*}"
  echo "----------------------------------------------------------------"
  echo ""
  echo ""

  print_footprint
}

print_header

main "$@"
