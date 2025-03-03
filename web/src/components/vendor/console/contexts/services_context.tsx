/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

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

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

// @ts-ignore
import React, { createContext, useContext, useEffect } from 'react';
import { History, Storage, Settings } from '../services';
import { ObjectStorageClient } from '../entities/storage';

interface ContextServices {
  history: History;
  storage: Storage;
  objectStorageClient: ObjectStorageClient;
  settings: Settings;
}

export interface ContextValue {
  services: ContextServices;
  clusterID: string;
}

interface ContextProps {
  value: ContextValue;
  children: JSX.Element;
}

const ServicesContext = createContext<ContextValue | null>(null);

export function ServicesContextProvider({ children, value }: ContextProps) {
  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}

export const useServicesContext = () => {
  const context = useContext(ServicesContext);
  if (context == null) {
    throw new Error('useServicesContext must be used inside the ServicesContextProvider.');
  }
  return context!;
};
