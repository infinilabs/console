// Copyright (C) INFINI Labs & INFINI LIMITED.
//
// The INFINI Console is offered under the GNU Affero General Public License v3.0
// and as commercial software.
//
// For commercial licensing, contact us at:
//   - Website: infinilabs.com
//   - Email: hello@infini.ltd
//
// Open Source licensed under AGPL V3:
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package common

import (
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"infini.sh/framework/core/credential"
	"infini.sh/framework/core/model"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	configcommon "infini.sh/framework/modules/configs/common"
)

const (
	agentManagerTokenPurpose  = "manager"
	agentAccessTokenPurpose   = "access"
	AgentPendingTokenSourceUI = "manual_registration"
	AgentPendingTokenSourceVM = "install_script"
	defaultPendingTokenTTL    = 24 * time.Hour
	tokenGracePeriod          = time.Hour
)

var rotatedTokenCache = util.NewCacheWithExpireOnAdd(tokenGracePeriod, 1024)

var (
	ErrInvalidManagerToken      = errors.New("invalid agent manager token")
	ErrInvalidManagerBasicAuth  = errors.New("invalid manager basic auth")
	ErrManagerAuthNotConfigured = errors.New("agent manager auth is not configured")
)

type PendingRegistrationToken struct {
	orm.ORMObjectBase
	CredentialID string `json:"credential_id" elastic_mapping:"credential_id:{type:keyword}"`
	TokenHash    string `json:"token_hash" elastic_mapping:"token_hash:{type:keyword}"`
	Purpose      string `json:"purpose" elastic_mapping:"purpose:{type:keyword}"`
	Source       string `json:"source,omitempty" elastic_mapping:"source:{type:keyword}"`
	InstanceID   string `json:"instance_id,omitempty" elastic_mapping:"instance_id:{type:keyword}"`
	Consumed     bool   `json:"consumed" elastic_mapping:"consumed:{type:boolean}"`
	ExpiresAt    int64  `json:"expires_at" elastic_mapping:"expires_at:{type:date,format:epoch_millis}"`
}

func CreatePendingManagerToken(source string) (*PendingRegistrationToken, string, error) {
	tokenValue := util.GenerateRandomString(48)
	credentialID, err := SaveTokenCredential(BuildPendingManagerCredentialName(), []string{"agent", "token", "manager", "pending"}, tokenValue)
	if err != nil {
		return nil, "", err
	}

	record := &PendingRegistrationToken{
		CredentialID: credentialID,
		TokenHash:    HashAgentToken(tokenValue),
		Purpose:      agentManagerTokenPurpose,
		Source:       source,
		Consumed:     false,
		ExpiresAt:    time.Now().Add(defaultPendingTokenTTL).UnixMilli(),
	}
	record.ID = util.GetUUID()
	if err := orm.Create(&orm.Context{Refresh: orm.WaitForRefresh}, record); err != nil {
		return nil, "", err
	}
	return record, tokenValue, nil
}

func GetPendingRegistrationTokenByID(id string) (*PendingRegistrationToken, error) {
	if strings.TrimSpace(id) == "" {
		return nil, nil
	}
	record := &PendingRegistrationToken{ORMObjectBase: orm.ORMObjectBase{ID: id}}
	exists, err := orm.Get(record)
	if err != nil || !exists {
		if err == nil {
			return nil, fmt.Errorf("pending registration token not found")
		}
		return nil, err
	}
	return record, nil
}

func FindPendingManagerTokenByValue(tokenValue string) (*PendingRegistrationToken, error) {
	tokenValue = strings.TrimSpace(tokenValue)
	if tokenValue == "" {
		return nil, nil
	}
	query := orm.Query{
		Size: 1,
		Conds: orm.And(
			orm.Eq("token_hash", HashAgentToken(tokenValue)),
			orm.Eq("purpose", agentManagerTokenPurpose),
			orm.Eq("consumed", false),
		),
	}
	records := []PendingRegistrationToken{}
	if err, _ := orm.SearchWithJSONMapper(&records, &query); err != nil {
		return nil, err
	}
	if len(records) == 0 {
		return nil, nil
	}
	record := records[0]
	if record.ExpiresAt > 0 && time.Now().UnixMilli() > record.ExpiresAt {
		return nil, nil
	}
	return &record, nil
}

func MarkPendingRegistrationTokenConsumed(record *PendingRegistrationToken, instanceID string) error {
	if record == nil {
		return nil
	}
	record.Consumed = true
	record.InstanceID = strings.TrimSpace(instanceID)
	return orm.Update(&orm.Context{Refresh: orm.WaitForRefresh}, record)
}

func SaveTokenCredential(name string, tags []string, tokenValue string) (string, error) {
	cred := credential.Credential{
		Name: name,
		Type: credential.Token,
		Tags: normalizeCredentialTags(tags),
		Payload: map[string]interface{}{
			credential.Token: map[string]interface{}{
				"value": strings.TrimSpace(tokenValue),
			},
		},
	}
	cred.ID = util.GetUUID()
	if err := cred.Encode(); err != nil {
		return "", err
	}
	if err := orm.Create(&orm.Context{Refresh: orm.WaitForRefresh}, &cred); err != nil {
		return "", err
	}
	return cred.ID, nil
}

func UpdateTokenCredential(credentialID, name string, tags []string, tokenValue string) error {
	if strings.TrimSpace(credentialID) == "" {
		return fmt.Errorf("credential id is empty")
	}
	cred := credential.Credential{}
	cred.ID = credentialID
	exists, err := orm.Get(&cred)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("credential not found")
	}
	cred.Name = name
	cred.Type = credential.Token
	cred.Tags = normalizeCredentialTags(tags)
	cred.Payload = map[string]interface{}{
		credential.Token: map[string]interface{}{
			"value": strings.TrimSpace(tokenValue),
		},
	}
	if err := cred.Encode(); err != nil {
		return err
	}
	return orm.Update(&orm.Context{Refresh: orm.WaitForRefresh}, &cred)
}

func GetTokenCredentialValue(credentialID string) (string, error) {
	if strings.TrimSpace(credentialID) == "" {
		return "", nil
	}
	cred := credential.Credential{}
	cred.ID = credentialID
	exists, err := orm.Get(&cred)
	if err != nil {
		return "", err
	}
	if !exists {
		return "", fmt.Errorf("credential not found")
	}
	return cred.DecodeToken()
}

func GetPreferredTokenCredentialValue(credentialID string) (string, error) {
	if previous := getRotatedTokenValue(credentialID); previous != "" {
		return previous, nil
	}
	return GetTokenCredentialValue(credentialID)
}

func RememberPreviousToken(credentialID, tokenValue string) {
	credentialID = strings.TrimSpace(credentialID)
	tokenValue = strings.TrimSpace(tokenValue)
	if credentialID == "" || tokenValue == "" {
		return
	}
	rotatedTokenCache.Put(credentialID, tokenValue)
}

func ApplyInstanceRequestAuth(req *util.Request, instance *model.Instance) error {
	if req == nil || instance == nil {
		return nil
	}
	if tokenValue, err := GetPreferredTokenCredentialValue(instance.AccessCredentialID); err != nil {
		return err
	} else if tokenValue != "" {
		req.AddHeader("Authorization", "Bearer "+tokenValue)
		return nil
	}
	if instance.BasicAuth != nil {
		req.SetBasicAuth(instance.BasicAuth.Username, instance.BasicAuth.Password.Get())
	}
	return nil
}

func ApplyBearerToken(req *util.Request, tokenValue string) {
	if req == nil {
		return
	}
	tokenValue = strings.TrimSpace(tokenValue)
	if tokenValue == "" {
		return
	}
	req.AddHeader("Authorization", "Bearer "+tokenValue)
}

func ExtractBearerToken(req *http.Request) string {
	if req == nil {
		return ""
	}
	value := strings.TrimSpace(req.Header.Get("Authorization"))
	if !strings.HasPrefix(strings.ToLower(value), "bearer ") {
		return ""
	}
	return strings.TrimSpace(value[7:])
}

func ExtractAPIToken(req *http.Request) string {
	if req == nil {
		return ""
	}
	return strings.TrimSpace(req.Header.Get(model.API_TOKEN))
}

func ExtractManagerToken(req *http.Request) string {
	if tokenValue := ExtractAPIToken(req); tokenValue != "" {
		return tokenValue
	}
	return ExtractBearerToken(req)
}

func ValidateManagerRequestAuth(req *http.Request, instance *model.Instance, fallbackBasicAuth *model.BasicAuth) error {
	return validateManagerRequestAuth(req, instance, fallbackBasicAuth, ValidateManagerToken, false)
}

func ValidateLegacyCompatibleManagerRequestAuth(req *http.Request, instance *model.Instance, fallbackBasicAuth *model.BasicAuth) error {
	return validateManagerRequestAuth(req, instance, fallbackBasicAuth, ValidateManagerToken, true)
}

func IsManagerAuthFailure(err error) bool {
	return errors.Is(err, ErrInvalidManagerToken) ||
		errors.Is(err, ErrInvalidManagerBasicAuth) ||
		errors.Is(err, ErrManagerAuthNotConfigured)
}

func validateManagerRequestAuth(
	req *http.Request,
	instance *model.Instance,
	fallbackBasicAuth *model.BasicAuth,
	validateToken func(instance *model.Instance, tokenValue string) (bool, error),
	allowLegacyWithoutManagerAuth bool,
) error {
	if instance == nil {
		return fmt.Errorf("instance is nil")
	}
	if strings.TrimSpace(instance.ManagerCredentialID) != "" {
		ok, err := validateToken(instance, ExtractManagerToken(req))
		if err != nil {
			return err
		}
		if !ok {
			return ErrInvalidManagerToken
		}
		return nil
	}
	if fallbackBasicAuth == nil || strings.TrimSpace(fallbackBasicAuth.Username) == "" {
		if allowLegacyWithoutManagerAuth {
			return nil
		}
		return ErrManagerAuthNotConfigured
	}
	if req == nil {
		return ErrInvalidManagerBasicAuth
	}
	user, password, ok := req.BasicAuth()
	if !ok || user != fallbackBasicAuth.Username || password != fallbackBasicAuth.Password.Get() {
		return ErrInvalidManagerBasicAuth
	}
	return nil
}

func ValidateManagerToken(instance *model.Instance, tokenValue string) (bool, error) {
	tokenValue = strings.TrimSpace(tokenValue)
	if instance == nil || tokenValue == "" || strings.TrimSpace(instance.ManagerCredentialID) == "" {
		return false, nil
	}
	expected, err := GetTokenCredentialValue(instance.ManagerCredentialID)
	if err != nil {
		return false, err
	}
	if subtle.ConstantTimeCompare([]byte(expected), []byte(tokenValue)) == 1 {
		return true, nil
	}
	previous := getRotatedTokenValue(instance.ManagerCredentialID)
	if previous == "" {
		return false, nil
	}
	return subtle.ConstantTimeCompare([]byte(previous), []byte(tokenValue)) == 1, nil
}

func getRotatedTokenValue(credentialID string) string {
	credentialID = strings.TrimSpace(credentialID)
	if credentialID == "" {
		return ""
	}
	value := rotatedTokenCache.Get(credentialID)
	if value == nil {
		return ""
	}
	tokenValue, _ := value.(string)
	tokenValue = strings.TrimSpace(tokenValue)
	if tokenValue == "" {
		return ""
	}
	return tokenValue
}

func HashAgentToken(tokenValue string) string {
	sum := sha256.Sum256([]byte(strings.TrimSpace(tokenValue)))
	return hex.EncodeToString(sum[:])
}

func BuildManagerCredentialName(instance *model.Instance) string {
	return fmt.Sprintf("%s (%s)", getAgentCredentialDisplayName(instance), getManagedCredentialProduct(instance))
}

func BuildAccessCredentialName(instance *model.Instance) string {
	return fmt.Sprintf("%s (%s Access)", getAgentCredentialDisplayName(instance), getManagedCredentialProduct(instance))
}

func BuildPendingManagerCredentialName() string {
	return fmt.Sprintf("%s (Managed)", util.PickRandomName())
}

func BuildManagerCredentialTags() []string {
	return []string{"agent", "token", agentManagerTokenPurpose}
}

func BuildAccessCredentialTags() []string {
	return []string{"agent", "token", agentAccessTokenPurpose}
}

func AgentManagerTokenKey() string {
	return configcommon.ManagerTokenKeystoreKey
}

func AgentAccessTokenKey() string {
	return configcommon.AgentAccessTokenKeystoreKey
}

func normalizeCredentialTags(tags []string) []string {
	seen := map[string]struct{}{}
	items := make([]string, 0, len(tags))
	for _, tag := range tags {
		tag = strings.TrimSpace(tag)
		if tag == "" {
			continue
		}
		if _, ok := seen[tag]; ok {
			continue
		}
		seen[tag] = struct{}{}
		items = append(items, tag)
	}
	return items
}

func getInstanceDisplayName(instance *model.Instance) string {
	if instance == nil {
		return ""
	}
	if name := strings.TrimSpace(instance.Name); name != "" {
		return name
	}
	return strings.TrimSpace(instance.ID)
}

func getAgentCredentialDisplayName(instance *model.Instance) string {
	if displayName := getInstanceDisplayName(instance); displayName != "" {
		return displayName
	}
	return util.PickRandomName()
}

func getManagedCredentialProduct(instance *model.Instance) string {
	if instance != nil {
		if name := strings.TrimSpace(instance.Application.Name); name != "" {
			return strings.ToUpper(name[:1]) + name[1:]
		}
	}
	return "Managed"
}
