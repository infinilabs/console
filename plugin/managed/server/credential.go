package server

import (
	"fmt"
	model2 "infini.sh/console/model"
	"net/http"
	"strings"

	"infini.sh/framework/core/credential"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
)

const instanceAccessTokenKey = "access_token"
const agentAccessTokenKey = "agent_api_credential_id"
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

	//get previous saved credential info
	if id := oldInst.GetSystemString(model.CredentialIDSystemKey); id != "" {
		instance.SetSystemValue(model.CredentialIDSystemKey, id)
	}

	if getAgentAccessToken(instance) == "" {
		setAgentAPICredentialID(instance, getAgentAccessToken(oldInst))
	}

	if getManagerAPICredentialID(instance) == "" {
		setManagerAPICredentialID(instance, getManagerAPICredentialID(oldInst))
	}
}

func upsertAccessToken(credentialID, name string, tags []string, accessToken string) (string, error) {
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
	cred.Payload = map[credential.CredentialType]interface{}{
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

	if err := orm.Create(ctx, &cred); err != nil {
		return "", err
	}
	return cred.ID, nil
}

func upsertAccessTokenToCredential(instance *model.Instance, accessToken string) error {
	cred := credential.Credential{}
	exists := false
	if credentialID := instance.GetSystemString(model.CredentialIDSystemKey); credentialID != "" {
		cred.ID = credentialID
		var err error
		exists, err = orm.Get(&cred)
		if err != nil {
			return err
		}
	}

	cred.Name = fmt.Sprintf("access_token for instance: %v/%v", instance.Name, instance.ID)
	cred.Type = credential.AccessToken

	cred.Payload = map[credential.CredentialType]interface{}{
		credential.AccessToken: map[string]interface{}{
			"access_token": accessToken,
		},
	}

	if err := cred.Encode(); err != nil {
		return err
	}

	ctx := &orm.Context{Refresh: orm.WaitForRefresh}
	if exists {
		cred.Invalid = false
		if err := orm.Update(ctx, &cred); err != nil {
			return err
		}
		instance.SetSystemValue(model.CredentialIDSystemKey, cred.ID)
		return nil
	}

	if err := orm.Create(ctx, &cred); err != nil {
		return err
	}
	instance.SetSystemValue(model.CredentialIDSystemKey, cred.ID)
	return nil
}

func getAgentAccessToken(instance *model.Instance) string {
	if instance == nil {
		return ""
	}
	if accessToken := getInstanceSystemString(instance, agentAccessTokenKey); accessToken != "" {
		return accessToken
	}
	return instance.AccessToken
}

func setAgentAPICredentialID(instance *model.Instance, credentialID string) {
	setInstanceSystemString(instance, agentAccessTokenKey, credentialID)
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

	e := upsertAccessTokenToCredential(instance, accessToken)
	return "", e
}

func upsertInstanceManagerAPICredential(instance *model.Instance, accessToken string) (string, error) {
	if instance == nil {
		return "", fmt.Errorf("instance is nil")
	}
	if strings.TrimSpace(accessToken) == "" {
		return "", fmt.Errorf("access token is empty")
	}

	//return upsertAccessTokenToCredential(
	//	getManagerAPICredentialID(instance),
	//	fmt.Sprintf("%s manager api", getInstanceCredentialName(instance)),
	//	[]string{"agent", "managed", "manager_api", "access_token"},
	//	accessToken,
	//)
	e := upsertAccessTokenToCredential(instance, accessToken)
	return "", e
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

	return model2.ApplyAuthFromInstance(instance, req)
}

func isAuthorizedStatus(code int) bool {
	return code == http.StatusOK
}
