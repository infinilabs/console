package server

import (
	"fmt"
	"net/http"
	"strings"

	"infini.sh/framework/core/credential"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	common2 "infini.sh/framework/modules/elastic/common"
	"infini.sh/framework/modules/security/access_token"
)

const instanceAccessTokenKey = "access_token"
const agentAPICredentialIDKey = "agent_api_credential_id"
const managerAPICredentialIDKey = "manager_api_credential_id"

// Keep reading the old key so existing managed instances continue to work
// before their next save migrates the field name.
const legacyManagerSyncCredentialIDKey = "manager_sync_credential_id"

func clearInstanceAccessToken(instance *model.Instance) {
	deleteInstanceSystemString(instance, instanceAccessTokenKey)
}

func getInstanceCredentialName(instance *model.Instance) string {
	if instance == nil {
		return "agent"
	}
	if name := strings.TrimSpace(instance.Name); name != "" {
		return name
	}
	if id := strings.TrimSpace(instance.ID); id != "" {
		return id
	}
	return "agent"
}

func getInstanceSystemString(instance *model.Instance, key string) string {
	if instance == nil || instance.System == nil {
		return ""
	}

	value, ok := instance.GetSystemValue(key)
	if !ok {
		return ""
	}

	text, ok := value.(string)
	if !ok {
		return ""
	}

	return strings.TrimSpace(text)
}

func setInstanceSystemString(instance *model.Instance, key, value string) {
	if instance == nil || strings.TrimSpace(value) == "" {
		return
	}
	instance.SetSystemValue(key, value)
}

func deleteInstanceSystemString(instance *model.Instance, key string) {
	if instance == nil || instance.System == nil {
		return
	}
	delete(instance.System, key)
	if len(instance.System) == 0 {
		instance.System = nil
	}
}

func loadExistingInstance(instanceID string) (*model.Instance, error) {
	if strings.TrimSpace(instanceID) == "" {
		return nil, nil
	}

	instance := &model.Instance{}
	instance.ID = instanceID
	exists, err := orm.Get(instance)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, nil
	}
	return instance, nil
}

func preserveManagedCredentialIDs(instance, oldInst *model.Instance) {
	if instance == nil || oldInst == nil {
		return
	}

	if instance.CredentialID == "" {
		instance.CredentialID = oldInst.CredentialID
	}
	if getAgentAPICredentialID(instance) == "" {
		setAgentAPICredentialID(instance, getAgentAPICredentialID(oldInst))
	}
	if getManagerAPICredentialID(instance) == "" {
		setManagerAPICredentialID(instance, getManagerAPICredentialID(oldInst))
	}
}

func upsertManagedAccessTokenCredential(credentialID, name string, tags []string, accessToken string) (string, error) {
	cred := credential.Credential{}
	exists := false
	if credentialID != "" {
		cred.ID = credentialID
		var err error
		exists, err = orm.Get(&cred)
		if err != nil {
			return "", err
		}
	}

	cred.Name = name
	cred.Type = credential.AccessToken
	cred.Tags = tags
	cred.Payload = map[string]interface{}{
		credential.AccessToken: map[string]interface{}{
			"access_token": accessToken,
		},
	}

	if err := cred.Encode(); err != nil {
		return "", err
	}

	ctx := &orm.Context{Refresh: orm.WaitForRefresh}
	if exists {
		cred.Invalid = false
		if err := orm.Update(ctx, &cred); err != nil {
			return "", err
		}
		return cred.ID, nil
	}

	cred.ID = util.GetUUID()
	if err := orm.Create(ctx, &cred); err != nil {
		return "", err
	}
	return cred.ID, nil
}

func getAgentAPICredentialID(instance *model.Instance) string {
	if instance == nil {
		return ""
	}
	if credentialID := getInstanceSystemString(instance, agentAPICredentialIDKey); credentialID != "" {
		return credentialID
	}
	return instance.CredentialID
}

func setAgentAPICredentialID(instance *model.Instance, credentialID string) {
	setInstanceSystemString(instance, agentAPICredentialIDKey, credentialID)
}

func getManagerAPICredentialID(instance *model.Instance) string {
	if credentialID := getInstanceSystemString(instance, managerAPICredentialIDKey); credentialID != "" {
		return credentialID
	}
	return getInstanceSystemString(instance, legacyManagerSyncCredentialIDKey)
}

func setManagerAPICredentialID(instance *model.Instance, credentialID string) {
	setInstanceSystemString(instance, managerAPICredentialIDKey, credentialID)
	deleteInstanceSystemString(instance, legacyManagerSyncCredentialIDKey)
}

func upsertInstanceAgentAPICredential(instance *model.Instance, accessToken string) (string, error) {
	if instance == nil {
		return "", fmt.Errorf("instance is nil")
	}
	if strings.TrimSpace(accessToken) == "" {
		return "", fmt.Errorf("access token is empty")
	}

	return upsertManagedAccessTokenCredential(
		getAgentAPICredentialID(instance),
		fmt.Sprintf("%s agent api", getInstanceCredentialName(instance)),
		[]string{"agent", "managed", "agent_api", "access_token"},
		accessToken,
	)
}

func upsertInstanceManagerAPICredential(instance *model.Instance, accessToken string) (string, error) {
	if instance == nil {
		return "", fmt.Errorf("instance is nil")
	}
	if strings.TrimSpace(accessToken) == "" {
		return "", fmt.Errorf("access token is empty")
	}

	return upsertManagedAccessTokenCredential(
		getManagerAPICredentialID(instance),
		fmt.Sprintf("%s manager api", getInstanceCredentialName(instance)),
		[]string{"agent", "managed", "manager_api", "access_token"},
		accessToken,
	)
}

func applyCredentialRequestAuth(req *util.Request, credentialID string) error {
	if req == nil || strings.TrimSpace(credentialID) == "" {
		return nil
	}

	cred, err := common2.GetCredential(credentialID)
	if err != nil {
		return err
	}

	switch cred.Type {
	case credential.BasicAuth:
		auth, err := cred.DecodeBasicAuth()
		if err != nil {
			return err
		}
		req.SetBasicAuth(auth.Username, auth.Password.Get())
	case credential.AccessToken:
		token, err := cred.DecodeAccessToken()
		if err != nil {
			return err
		}
		req.AddHeader(access_token.HeaderAPIToken, token.AccessToken.Get())
	default:
		return fmt.Errorf("unsupported credential type [%s]", cred.Type)
	}

	return nil
}

func applyInstanceRequestAuth(req *util.Request, instance *model.Instance) error {
	if req == nil || instance == nil {
		return nil
	}

	if credentialID := getAgentAPICredentialID(instance); credentialID != "" {
		return applyCredentialRequestAuth(req, credentialID)
	}

	if instance.BasicAuth != nil && instance.BasicAuth.Username != "" {
		req.SetBasicAuth(instance.BasicAuth.Username, instance.BasicAuth.Password.Get())
	}

	return nil
}

func getInstanceByEndpoint(endpoint string) (*model.Instance, error) {
	if strings.TrimSpace(endpoint) == "" {
		return nil, nil
	}

	queryDSL := util.MapStr{
		"size": 1,
		"query": util.MapStr{
			"bool": util.MapStr{
				"must": []util.MapStr{
					{
						"term": util.MapStr{
							"endpoint": endpoint,
						},
					},
				},
			},
		},
	}

	q := orm.Query{RawQuery: util.MustToJSONBytes(queryDSL)}
	err, res := orm.Search(&model.Instance{}, &q)
	if err != nil {
		return nil, err
	}
	if len(res.Result) == 0 {
		return nil, nil
	}

	obj := &model.Instance{}
	util.MustFromJSONBytes(util.MustToJSONBytes(res.Result[0]), obj)
	return obj, nil
}

func prepareProxyAgentRequest(endpoint string, req *util.Request) error {
	instance, err := getInstanceByEndpoint(endpoint)
	if err != nil || instance == nil {
		return err
	}
	return applyInstanceRequestAuth(req, instance)
}

func isAuthorizedStatus(code int) bool {
	return code == http.StatusOK
}
