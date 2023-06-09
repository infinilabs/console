#!/bin/bash
# Agent install script for UNIX-like OS
# Author: INFINI
# BASE_URL : need, download server address，eg: https://release.infinilabs.com/agent/stable
# AGENT_VER : need, Agent version, eg: 0.4.0-126
# INSTALL_PATH : option, download path. eg: /home/user/infini  default: /opt
# ES_NAME
# ES_PWD

printf "\n*    _      ___   __    __  _____ "
printf "\n*   /_\\    / _ \\ /__\\/\\ \\ \\/__   \\"
printf "\n*  //_\\\\  / /_\\//_\\ /  \\/ /  / /\\/"
printf "\n* /  _  \\/ /_\\\\//__/ /\\  /  / /   "
printf "\n* \\_/ \\_/\\____/\\__/\\_\\ \\/  \\/    \n\n"
# detect root user
if [ "$(echo "$UID")" = "0" ]; then
	sudo_cmd=''
else
	sudo_cmd='sudo'
fi

##################
# colors
##################
RED="\033[31m"
CLR="\033[0m"
GREEN="\033[32m"

##################
# validate os & arch
##################

arch=
case $(uname -m) in

	"x86_64")
		arch="amd64"
		;;

	"i386" | "i686")
		arch="386"
		;;

	"aarch64")
		arch="arm64"
		;;

	"arm" | "armv7l")
		arch="arm"
		;;

	"arm64")
		arch="arm64"
		;;

	*)
		# shellcheck disable=SC2059
		printf "${RED}[E] Unsupport arch $(uname -m) ${CLR}\n"
		exit 1
		;;
esac

os="linux"

if [[ "$OSTYPE" == "darwin"* ]]; then
	if [[ $arch != "amd64" ]] && [[ $arch != "arm64" ]]; then # Darwin only support amd64 and arm64
		# shellcheck disable=SC2059
		printf "${RED}[E] Darwin only support amd64/arm64.${CLR}\n"
		exit 1;
	fi

	os="mac"

	# # NOTE: under darwin, for arm64 and amd64, both use amd64
	# arch="arm"
fi

##################
# validate params
##################

base_url="{{base_url}}"
if [ -n "$BASE_URL" ]; then
	base_url=$BASE_URL
fi

agent_ver="{{agent_version}}"
if [ -n "$AGENT_VER" ]; then
	agent_ver=$AGENT_VER
fi

ca_crt="{{ca_crt}}"
client_crt="{{client_crt}}"
client_key="{{client_key}}"

##################
# download agent
##################

suffix="tar.gz"
if [[ "$os" == "mac" ]]; then
	suffix="zip"
fi

download_url="${base_url}/agent-${agent_ver}-${os}-${arch}.${suffix}"

install_path="/opt"
if [ -n "$INSTALL_PATH" ]; then
	install_path=$INSTALL_PATH
fi

file_name="agent-${agent_ver}-${os}-${arch}.${suffix}" #agent在服务器上的文件名
agent="${install_path}/agent/${file_name}" #agent下载后保存的文件
agent_exc="${install_path}/agent/agent-${os}-${arch}" #agent可执行文件

agent_exsit="true"
if [ ! -d "${install_path}/agent" ]; then
	printf "\n* mkdir -p ${install_path}/agent"
	$sudo_cmd mkdir -p "${install_path}/agent"
	agent_exsit="false"
fi

if [ $? -ne 0 ]; then
	exit 1
fi

printf "\n* downloading ${download_url}\n"

printf "\n* save to : ${agent}\n"

cd "$install_path/agent"

sudo curl -O --progress-bar $download_url

if [ $? -ne 0 ]; then
	exit 1
fi

printf "\n* downloaded: ${agent}"

##################
# install agent
##################

printf "\n* start install"

if [[ "${suffix}" == "zip" ]]; then
	printf "\n* uzip ${agent}\n"
	$sudo_cmd unzip $agent
else
	printf "\n* tar -xzvf ${agent}\n"
	$sudo_cmd tar -xzvf $agent
fi

if [ $? -ne 0 ]; then
	exit 1
fi

rm -f ${agent}

##################
# save cert
##################
$sudo_cmd mkdir -p config
$sudo_cmd sh -c "echo '${ca_crt}' > ./config/ca.crt"
$sudo_cmd sh -c "echo '${client_crt}' > ./config/client.crt"
$sudo_cmd sh -c "echo '${client_key}' > ./config/client.key"
if [ $? -ne 0 ]; then
  exit 1
fi

port="{{port}}"

## generate agent.yml
agent_config="path.configs: "config"
configs.auto_reload: true
env:
  API_BINDING: "0.0.0.0:${port}"

path.data: data
path.logs: log

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
"

agent_yml_path="${install_path}/agent/agent.yml"

$sudo_cmd rm $agent_yml_path
$sudo_cmd touch $agent_yml_path
$sudo_cmd sh -c "echo '${agent_config}' > $agent_yml_path"

if [ $? -ne 0 ]; then
	exit 1
fi

$sudo_cmd chmod +x $agent_exc

#try to stop and uninstall service
macos=/Library/LaunchDaemons/agent.plist
linux=/etc/systemd/system/agent.service
if [[ -f "$linux" || -f "$macos" ]]; then
	printf "\n* stop && uninstall service\n"
	$sudo_cmd $agent_exc -service stop &>/dev/null
	$sudo_cmd $agent_exc -service uninstall &>/dev/null
fi

printf "\n* start install service\n"
$sudo_cmd $agent_exc -service install

if [ $? -ne 0 ]; then
	exit 1
fi

printf "\n* service installed\n"
printf "\n* service starting >>>>>>\n"
$sudo_cmd $agent_exc -service start

if [ $? -ne 0 ]; then
	exit 1
fi

printf "\n* agent service started"
console_endpoint="{{console_endpoint}}"
sleep 3
printf "\n* start register\n"
token={{token}}
curl -X POST ${console_endpoint}/agent/instance?token=${token}

if [ $? -ne 0 ]; then
	exit 1
fi
printf "\n* agent registered\n"

printf "\n* ${GREEN}Congratulations, install success!${CLR}\n\n"


