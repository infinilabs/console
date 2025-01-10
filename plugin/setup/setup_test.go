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

func TestCompareVersions(t *testing.T) {
	testCases := []struct {
		v1       string
		v2       string
		expected int
		desc     string
	}{
		{"1.10.0", "1.9.2", 1, "v1 > v2"},
		{"1.9.2", "1.10.0", -1, "v1 < v2"},
		{"1.9.2", "1.9.2", 0, "v1 == v2"},
		{"1.1.0", "1.01.0", 0, "前导零"},
		{"1.2", "1.2.3", -1, "不同长度，v1 < v2"},
		{"1.2.3", "1.2", 1, "不同长度，v1 > v2"},
		{"1.0.0", "1.0", 0, "不同长度，等于"},
		{"2", "1.0.0", 1, "不同长度，v1 > v2, v1只有一位"},
		{"1.0.0", "2", -1, "不同长度，v1 < v2, v2只有一位"},
		{"1.2", "1.2.0", 0, "v1 == v2 不同长度末尾补零"},
	}
	for _, tc := range testCases {
		t.Run(tc.desc, func(t *testing.T) {
			got := compareVersions(tc.v1, tc.v2)
			if got != tc.expected {
				t.Errorf("compareVersions(%q, %q) = %d; want %d", tc.v1, tc.v2, got, tc.expected)
			}
		})
	}
}
