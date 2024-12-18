/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { QueryStringManager } from "./query_string_manager";
import { Storage } from "../../../../utils/public/storage";
import { StubBrowserStorage } from "test_utils/stub_browser_storage";
import { coreMock } from "../../../../../core/public/mocks";
import { Query } from "../../../common/query";

describe("QueryStringManager", () => {
  let service: QueryStringManager;

  beforeEach(() => {
    service = new QueryStringManager(
      new Storage(new StubBrowserStorage()),
      coreMock.createSetup().uiSettings
    );
  });

  test("getUpdates$ is a cold emits only after query changes", () => {
    const obs$ = service.getUpdates$();
    const emittedValues: Query[] = [];
    obs$.subscribe((v) => {
      emittedValues.push(v);
    });
    expect(emittedValues).toHaveLength(0);

    const newQuery = { query: "new query", language: "kquery" };
    service.setQuery(newQuery);
    expect(emittedValues).toHaveLength(1);
    expect(emittedValues[0]).toEqual(newQuery);

    service.setQuery({ ...newQuery });
    expect(emittedValues).toHaveLength(1);
  });
});
