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

import (
	"sync"
	"testing"
)

func TestInvokeSetupCallbackRunsOnlyOnce(t *testing.T) {
	previousCallbacks := setupFinishedCallback
	previousOnce := setupCallbackOnce
	defer func() {
		setupFinishedCallback = previousCallbacks
		setupCallbackOnce = previousOnce
	}()

	setupFinishedCallback = nil
	setupCallbackOnce = sync.Once{}

	count := 0
	RegisterSetupCallback(func() {
		count++
	})
	RegisterSetupCallback(func() {
		count++
	})

	InvokeSetupCallback()
	InvokeSetupCallback()

	if count != 2 {
		t.Fatalf("expected callbacks to run once each, got %d invocations", count)
	}
}

func TestAcquireSetupInitialization(t *testing.T) {
	releaseSetupInitialization()
	defer releaseSetupInitialization()

	if !acquireSetupInitialization() {
		t.Fatal("expected first acquire to succeed")
	}
	if acquireSetupInitialization() {
		t.Fatal("expected second acquire to fail while initialization is running")
	}

	releaseSetupInitialization()

	if !acquireSetupInitialization() {
		t.Fatal("expected acquire to succeed after release")
	}
}
