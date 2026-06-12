package api

import (
	"fmt"
	"net/http"
	"strings"
	"sync"

	log "github.com/cihub/seelog"
	agent_common "infini.sh/console/modules/agent/common"
	framework_api "infini.sh/framework/core/api"
	framework_ws "infini.sh/framework/core/api/websocket"
	framework_reverse "infini.sh/framework/core/api/websocket/reverse"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	elastic "infini.sh/framework/modules/elastic"
)

var errAgentReverseChannelDisconnected = framework_reverse.ErrDisconnected
var errAgentReverseChannelNotConnected = framework_reverse.ErrNotConnected

var agentReverseChannel = framework_reverse.NewSessionManager(framework_reverse.ManagerOptions{})
var agentReverseChannelRegisterOnce sync.Once

func registerAgentReverseChannel() {
	agentReverseChannelRegisterOnce.Do(func() {
		framework_ws.RegisterConnectCallback(onAgentReverseConnect)
		framework_ws.RegisterDisconnectCallback(onAgentReverseDisconnect)
		framework_api.HandleWebSocketCommand(framework_reverse.HelloCommand, "agent reverse hello", handleAgentReverseHelloCommand)
		framework_api.HandleWebSocketCommand(framework_reverse.ResponseCommand, "agent reverse response", handleAgentReverseResponseCommand)
	})
}

func onAgentReverseConnect(sessionID string, w http.ResponseWriter, r *http.Request) error {
	instanceID := strings.TrimSpace(r.Header.Get(framework_reverse.HeaderPeerID))
	if instanceID == "" {
		return nil
	}

	instance := model.Instance{}
	instance.ID = instanceID
	exists, err := orm.GetV2(orm.NewContext(), &instance)
	if err == elastic.ErrNotFound {
		err = nil
		exists = false
	}
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("instance not registered")
	}
	if !strings.EqualFold(instance.Application.Name, "agent") {
		return fmt.Errorf("instance [%s] is not agent", instanceID)
	}
	if err := agent_common.ValidateManagerRequestAuth(r, &instance, (*model.BasicAuth)(&global.Env().SystemConfig.Configs.ManagerConfig.BasicAuth)); err != nil {
		return err
	}
	agentReverseChannel.RegisterPendingSession(sessionID, instanceID)
	return nil
}

func onAgentReverseDisconnect(sessionID string) {
	agentReverseChannel.OnDisconnect(sessionID)
}

func handleAgentReverseHelloCommand(c *framework_ws.WebsocketConnection, array []string) {
	if len(array) < 2 {
		return
	}
	payload := strings.Join(array[1:], " ")
	if err := agentReverseChannel.HandleHelloPayload(payload); err != nil {
		log.Errorf("failed to activate agent reverse channel: %v", err)
	}
}

func handleAgentReverseResponseCommand(c *framework_ws.WebsocketConnection, array []string) {
	if len(array) < 2 {
		return
	}
	payload := strings.Join(array[1:], " ")
	if err := agentReverseChannel.HandleResponsePayload(payload); err != nil {
		log.Errorf("failed to parse agent reverse response: %v", err)
	}
}

func isAgentReverseChannelRecoverableError(err error) bool {
	return framework_reverse.IsRecoverableError(err)
}

func buildReverseRequestHeaders(instanceID string) (http.Header, error) {
	accessToken, err := loadReverseAccessToken(instanceID)
	if err != nil {
		return nil, err
	}
	headers := http.Header{}
	if accessToken != "" {
		headers.Set("Authorization", "Bearer "+accessToken)
	}
	return headers, nil
}

func ProxyAgentRequestViaChannel(instanceID string, req *util.Request, responseObjectToUnMarshall interface{}) (*util.Result, error) {
	headers, err := buildReverseRequestHeaders(instanceID)
	if err != nil {
		return nil, err
	}
	return agentReverseChannel.ProxyRequest(instanceID, req, headers, framework_ws.SendPrivateMessage, responseObjectToUnMarshall)
}

func IsAgentReverseChannelConnected(instanceID string) bool {
	return agentReverseChannel.IsConnected(instanceID)
}

func loadReverseAccessToken(instanceID string) (string, error) {
	instance := model.Instance{}
	instance.ID = instanceID
	exists, err := orm.GetV2(orm.NewContext(), &instance)
	if err != nil || !exists {
		return "", err
	}
	return agent_common.GetPreferredTokenCredentialValue(instance.AccessCredentialID)
}
