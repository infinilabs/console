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

package task

import "testing"

func TestNormalizeRollupRetention(t *testing.T) {
	cases := map[string]string{
		"":       "30d",
		"90d":    "90d",
		" 120d ": "120d",
		"48h":    "48h",
		"0d":     "30d",
		"90":     "30d",
		"90days": "30d",
		"1d\"}}": "30d",
		"-5d":    "30d",
	}
	for in, want := range cases {
		if got := normalizeRollupRetention(in); got != want {
			t.Errorf("normalizeRollupRetention(%q) = %q, want %q", in, got, want)
		}
	}
}
