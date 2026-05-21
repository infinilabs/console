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

package common

import (
	"strings"
	"testing"

	"infini.sh/console/model"
	framework_model "infini.sh/framework/core/model"
	"infini.sh/framework/core/orm"
	ucfg "infini.sh/framework/lib/go-ucfg"
)

func TestGeneratePipelineConfigUsesConsoleSMTP(t *testing.T) {
	cfg, err := GeneratePipelineConfig([]model.EmailServer{
		{
			ORMObjectBase: orm.ORMObjectBase{ID: "srv-1"},
			Host:          "smtp.example.com",
			Port:          465,
			Auth: &framework_model.BasicAuth{
				Username: "user",
				Password: ucfg.SecretString("secret"),
			},
		},
	})
	if err != nil {
		t.Fatalf("GeneratePipelineConfig() error = %v", err)
	}
	if !strings.Contains(cfg, "console_smtp:") {
		t.Fatalf("expected pipeline config to use console_smtp, got %s", cfg)
	}
}
