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
import React, { createContext, Dispatch, useReducer } from 'react';
import * as editor from '../../stores/editor';
import { createUseContext } from '../create_use_context';

const EditorReadContext = createContext<editor.Store>(editor.initialValue);
const EditorActionContext = createContext<Dispatch<editor.Action>>(() => {});

export interface EditorContextArgs {
  children: JSX.Element;
}

export function EditorContextProvider({ children }: EditorContextArgs) {
  const [state, dispatch] = useReducer(editor.reducer, editor.initialValue, (value) => ({
    ...value,
  }));
  return (
    <EditorReadContext.Provider value={state}>
      <EditorActionContext.Provider value={dispatch}>{children}</EditorActionContext.Provider>
    </EditorReadContext.Provider>
  );
}

export const useEditorReadContext = createUseContext(EditorReadContext, 'EditorReadContext');
export const useEditorActionContext = createUseContext(EditorActionContext, 'EditorActionContext');
