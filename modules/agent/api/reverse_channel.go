package api

import (
	"bytes"
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	log "github.com/cihub/seelog"
	agent_common "infini.sh/console/modules/agent/common"
	framework_api "infini.sh/framework/core/api"
	framework_ws "infini.sh/framework/core/api/websocket"
	"infini.sh/framework/core/global"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	elastic "infini.sh/framework/modules/elastic"
)

const (
	reverseChannelHeaderInstanceID = "X-INFINI-INSTANCE-ID"
	reverseHelloCommand            = "reverse_hello"
	reverseRequestCommand          = "reverse_request"
	reverseResponseCommand         = "reverse_response"
	reverseDefaultTimeout          = 30 * time.Second
	reverseMaxResponseBytes        = 8 * 1024 * 1024
	reverseReconnectWait           = 6 * time.Second
	reverseReconnectPoll           = 200 * time.Millisecond
)

var (
	errAgentReverseChannelDisconnected = errors.New("agent reverse channel disconnected")
	errAgentReverseChannelNotConnected = errors.New("agent reverse channel is not connected")
)

type agentReverseHelloMessage struct {
	SessionID  string `json:"session_id"`
	InstanceID string `json:"instance_id"`
}

type agentReverseRequestMessage struct {
	RequestID   string `json:"request_id"`
	InstanceID  string `json:"instance_id"`
	Method      string `json:"method"`
	Path        string `json:"path"`
	Body        string `json:"body,omitempty"`
	AccessToken string `json:"access_token,omitempty"`
}

type agentReverseResponseMessage struct {
	RequestID  string `json:"request_id"`
	InstanceID string `json:"instance_id"`
	Chunk      string `json:"chunk,omitempty"`
	Status     int    `json:"status,omitempty"`
	Done       bool   `json:"done,omitempty"`
}

type pendingAgentReverseResponse struct {
	instanceID string
	body       bytes.Buffer
	status     int
	err        error
	done       chan struct{}
	completed  bool
}

type agentReverseChannelManager struct {
	mu                 sync.Mutex
	pendingSessions    map[string]string
	activeSessions     map[string]string
	activeSessionsByID map[string]string
	pendingResponses   map[string]*pendingAgentReverseResponse
}

func newAgentReverseChannelManager() *agentReverseChannelManager {
	return &agentReverseChannelManager{
		pendingSessions:    map[string]string{},
		activeSessions:     map[string]string{},
		activeSessionsByID: map[string]string{},
		pendingResponses:   map[string]*pendingAgentReverseResponse{},
	}
}

var agentReverseChannel = newAgentReverseChannelManager()
var agentReverseChannelRegisterOnce sync.Once

func registerAgentReverseChannel() {
	agentReverseChannelRegisterOnce.Do(func() {
		framework_ws.RegisterConnectCallback(agentReverseChannel.onConnect)
		framework_ws.RegisterDisconnectCallback(agentReverseChannel.onDisconnect)
		framework_api.HandleWebSocketCommand(reverseHelloCommand, "agent reverse hello", agentReverseChannel.handleHelloCommand)
		framework_api.HandleWebSocketCommand(reverseResponseCommand, "agent reverse response", agentReverseChannel.handleResponseCommand)
	})
}

func (m *agentReverseChannelManager) onConnect(sessionID string, w http.ResponseWriter, r *http.Request) error {
	instanceID := strings.TrimSpace(r.Header.Get(reverseChannelHeaderInstanceID))
	if instanceID == "" {
		return nil
	}

	instance := model.Instance{}
	instance.ID = instanceID
	exists, err := orm.Get(&instance)
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

	m.mu.Lock()
	defer m.mu.Unlock()
	m.pendingSessions[sessionID] = instanceID
	return nil
}

func (m *agentReverseChannelManager) onDisconnect(sessionID string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	delete(m.pendingSessions, sessionID)
	instanceID, ok := m.activeSessionsByID[sessionID]
	if !ok {
		return
	}

	delete(m.activeSessionsByID, sessionID)
	if currentSession, exists := m.activeSessions[instanceID]; exists && currentSession == sessionID {
		delete(m.activeSessions, instanceID)
	}
	m.failPendingLocked(instanceID, errAgentReverseChannelDisconnected)
}

func (m *agentReverseChannelManager) activateSession(sessionID, instanceID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if expectedInstanceID, ok := m.pendingSessions[sessionID]; !ok || expectedInstanceID != instanceID {
		return fmt.Errorf("session handshake mismatch")
	}
	delete(m.pendingSessions, sessionID)

	if previousSession, ok := m.activeSessions[instanceID]; ok && previousSession != sessionID {
		delete(m.activeSessionsByID, previousSession)
	}

	m.activeSessions[instanceID] = sessionID
	m.activeSessionsByID[sessionID] = instanceID
	return nil
}

func (m *agentReverseChannelManager) handleHelloCommand(c *framework_ws.WebsocketConnection, array []string) {
	if len(array) < 2 {
		return
	}

	msg := agentReverseHelloMessage{}
	if err := util.FromJSONBytes([]byte(strings.Join(array[1:], " ")), &msg); err != nil {
		log.Errorf("failed to parse agent reverse hello: %v", err)
		return
	}
	if err := m.activateSession(msg.SessionID, msg.InstanceID); err != nil {
		log.Errorf("failed to activate agent reverse channel for instance [%s]: %v", msg.InstanceID, err)
	}
}

func (m *agentReverseChannelManager) handleResponseCommand(c *framework_ws.WebsocketConnection, array []string) {
	if len(array) < 2 {
		return
	}

	msg := agentReverseResponseMessage{}
	if err := util.FromJSONBytes([]byte(strings.Join(array[1:], " ")), &msg); err != nil {
		log.Errorf("failed to parse agent reverse response: %v", err)
		return
	}
	m.acceptResponse(msg)
}

func (m *agentReverseChannelManager) acceptResponse(msg agentReverseResponseMessage) {
	m.mu.Lock()
	defer m.mu.Unlock()

	pending, ok := m.pendingResponses[msg.RequestID]
	if !ok || pending.completed {
		return
	}
	if msg.InstanceID != "" && pending.instanceID != "" && msg.InstanceID != pending.instanceID {
		return
	}

	if msg.Chunk != "" {
		chunk, err := base64.StdEncoding.DecodeString(msg.Chunk)
		if err != nil {
			m.completePendingLocked(msg.RequestID, pending, 0, fmt.Errorf("decode reverse response chunk: %w", err))
			return
		}
		if pending.body.Len()+len(chunk) > reverseMaxResponseBytes {
			m.completePendingLocked(msg.RequestID, pending, 0, fmt.Errorf("agent reverse response exceeds %d bytes", reverseMaxResponseBytes))
			return
		}
		_, _ = pending.body.Write(chunk)
	}

	if msg.Done {
		status := msg.Status
		if status == 0 {
			status = http.StatusOK
		}
		m.completePendingLocked(msg.RequestID, pending, status, nil)
	}
}

func (m *agentReverseChannelManager) completePendingLocked(requestID string, pending *pendingAgentReverseResponse, status int, err error) {
	if pending.completed {
		return
	}
	pending.completed = true
	pending.status = status
	pending.err = err
	close(pending.done)
	delete(m.pendingResponses, requestID)
}

func (m *agentReverseChannelManager) failPendingLocked(instanceID string, err error) {
	for requestID, pending := range m.pendingResponses {
		if pending.instanceID != instanceID {
			continue
		}
		m.completePendingLocked(requestID, pending, 0, err)
	}
}

func (m *agentReverseChannelManager) proxyRequest(instanceID string, req *util.Request, responseObjectToUnMarshall interface{}) (*util.Result, error) {
	ctx := req.Context
	if ctx == nil {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(context.Background(), reverseDefaultTimeout)
		defer cancel()
	} else if _, hasDeadline := ctx.Deadline(); !hasDeadline {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, reverseDefaultTimeout)
		defer cancel()
	}

	var lastErr error
	for attempt := 0; attempt < 2; attempt++ {
		res, err := m.proxyRequestOnce(ctx, instanceID, req, responseObjectToUnMarshall)
		if err == nil {
			return res, nil
		}
		lastErr = err
		if attempt == 0 && isAgentReverseChannelRecoverableError(err) && m.waitForReconnect(ctx, instanceID) {
			continue
		}
		return res, err
	}
	return nil, lastErr
}

func isAgentReverseChannelRecoverableError(err error) bool {
	return errors.Is(err, errAgentReverseChannelDisconnected) || errors.Is(err, errAgentReverseChannelNotConnected)
}

func (m *agentReverseChannelManager) proxyRequestOnce(ctx context.Context, instanceID string, req *util.Request, responseObjectToUnMarshall interface{}) (*util.Result, error) {
	requestID := util.GetUUID()
	requestMsg := agentReverseRequestMessage{
		RequestID:  requestID,
		InstanceID: instanceID,
		Method:     req.Method,
		Path:       req.Path,
	}
	if len(req.Body) > 0 {
		requestMsg.Body = base64.StdEncoding.EncodeToString(req.Body)
	}
	accessToken, err := loadReverseAccessToken(instanceID)
	if err != nil {
		return nil, err
	}
	requestMsg.AccessToken = accessToken

	payload := string(util.MustToJSONBytes(requestMsg))
	pending := &pendingAgentReverseResponse{
		instanceID: instanceID,
		done:       make(chan struct{}),
	}

	m.mu.Lock()
	sessionID, ok := m.activeSessions[instanceID]
	if !ok || sessionID == "" {
		m.mu.Unlock()
		return nil, fmt.Errorf("%w for instance [%s]", errAgentReverseChannelNotConnected, instanceID)
	}
	m.pendingResponses[requestID] = pending
	m.mu.Unlock()

	if err := framework_ws.SendPrivateMessage(sessionID, reverseRequestCommand+" "+payload); err != nil {
		m.mu.Lock()
		delete(m.pendingResponses, requestID)
		m.mu.Unlock()
		return nil, err
	}

	select {
	case <-pending.done:
	case <-ctx.Done():
		m.mu.Lock()
		delete(m.pendingResponses, requestID)
		m.mu.Unlock()
		return nil, ctx.Err()
	}

	if pending.err != nil {
		return nil, pending.err
	}

	res := &util.Result{
		Body:       pending.body.Bytes(),
		StatusCode: pending.status,
	}
	if res.StatusCode != http.StatusOK {
		return res, fmt.Errorf("request error: %v, %v", nil, string(res.Body))
	}
	if responseObjectToUnMarshall != nil && len(res.Body) > 0 {
		return res, util.FromJSONBytes(res.Body, responseObjectToUnMarshall)
	}
	return res, nil
}

func (m *agentReverseChannelManager) waitForReconnect(ctx context.Context, instanceID string) bool {
	waitCtx, cancel := context.WithTimeout(ctx, reverseReconnectWait)
	defer cancel()

	if m.isConnected(instanceID) {
		return true
	}

	ticker := time.NewTicker(reverseReconnectPoll)
	defer ticker.Stop()

	for {
		select {
		case <-waitCtx.Done():
			return false
		case <-ticker.C:
			if m.isConnected(instanceID) {
				return true
			}
		}
	}
}

func (m *agentReverseChannelManager) isConnected(instanceID string) bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	sessionID, ok := m.activeSessions[instanceID]
	return ok && sessionID != ""
}

func ProxyAgentRequestViaChannel(instanceID string, req *util.Request, responseObjectToUnMarshall interface{}) (*util.Result, error) {
	return agentReverseChannel.proxyRequest(instanceID, req, responseObjectToUnMarshall)
}

func IsAgentReverseChannelConnected(instanceID string) bool {
	return agentReverseChannel.isConnected(instanceID)
}

func loadReverseAccessToken(instanceID string) (string, error) {
	instance := model.Instance{}
	instance.ID = instanceID
	exists, err := orm.Get(&instance)
	if err != nil || !exists {
		return "", err
	}
	return agent_common.GetPreferredTokenCredentialValue(instance.AccessCredentialID)
}
