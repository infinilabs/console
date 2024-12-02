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

/* Copyright © INFINI LTD. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package oauth

import (
	"golang.org/x/oauth2"
	rbac "infini.sh/console/core/security"
	"infini.sh/console/modules/security/config"
	"infini.sh/framework/core/api"
)

var (
	oAuthConfig       config.OAuthConfig
	defaultOAuthRoles []rbac.UserRole
	oauthCfg          oauth2.Config
)

// func New(cfg config.OAuthConfig) *OAuthRealm {
func Init(cfg config.OAuthConfig) {

	//init oauth
	if cfg.Enabled {
		api.HandleUIMethod(api.GET, "/sso/login/", apiHandler.AuthHandler)
		api.HandleUIMethod(api.GET, "/sso/callback/", apiHandler.CallbackHandler)

		oAuthConfig = cfg
		oauthCfg = oauth2.Config{
			ClientID:     cfg.ClientID,
			ClientSecret: cfg.ClientSecret,
			Endpoint: oauth2.Endpoint{
				AuthURL:  cfg.AuthorizeUrl,
				TokenURL: cfg.TokenUrl,
			},
			RedirectURL: cfg.RedirectUrl,
			Scopes:      cfg.Scopes,
		}
	}

}
