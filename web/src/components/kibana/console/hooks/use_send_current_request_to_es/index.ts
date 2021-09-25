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

import { useCallback } from 'react';
import { sendRequestToES } from './send_request_to_es';
import { instance as registry } from '../../contexts/editor_context/editor_registry';
import { useRequestActionContext } from '../../contexts/request_context';
import { useServicesContext } from '../../contexts/services_context';
import {getCommand} from '../../modules/mappings/mappings';

function buildRawCommonCommandRequest(cmd:any){
  const {requests} = cmd._source;
  const strReqs = requests.map((req: any)=>{
    const {method, path, body} = req;
    return `${method} ${path}\n${body}`;
  })
  return strReqs.join('\n');
}
export const useSendCurrentRequestToES = () => {
  const dispatch = useRequestActionContext();
  const { services: { history }, clusterID } = useServicesContext();

  return useCallback(async () => {
    try {
      const editor = registry.getInputEditor();
      const requests = await editor.getRequestsInRange();
      if (!requests.length) {
        console.log('No request selected. Select a request by placing the cursor inside it.');
        return;
      }
      const {url, method} = requests[0];
      if(method === 'LOAD'){
        const cmd = getCommand(url);
       // const curPostion = editor.currentReqRange //(editor.getCoreEditor().getCurrentPosition());
        const lineNumber = editor.getCoreEditor().getCurrentPosition().lineNumber;
        let crange = await editor.getRequestRange(lineNumber)
        const rawRequest = buildRawCommonCommandRequest(cmd)
        await editor.getCoreEditor().replaceRange(crange as any, rawRequest);
        // await editor.autoIndent();
        // editor.getCoreEditor().getContainer().focus();
        // crange = await editor.getRequestRange(lineNumber)
        
        // editor.getCoreEditor().moveCursorToPosition({
        //   ...crange?.end as any,
        // //  column: editor.getCoreEditor().getLineValue(lineNumber).length + 1,
        // });
      
        return;
      }

      dispatch({ type: 'sendRequest', payload: undefined });

      // @ts-ignore
      const results = await sendRequestToES({ requests, clusterID });

      // let saveToHistoryError: undefined | Error;

      // results.forEach(({ request: { path, method, data } }) => {
      //   try {
      //     history.addToHistory(path, method, data);
      //   } catch (e) {
      //     // Grab only the first error
      //     if (!saveToHistoryError) {
      //       saveToHistoryError = e;
      //     }
      //   }
      // });
      //
      // if (saveToHistoryError) {
      //   console.log('save to history error')
      // }
      //
      dispatch({
        type: 'requestSuccess',
        payload: {
          data: results,
        },
      });
    } catch (e) {
      if (e?.response) {
        dispatch({
          type: 'requestFail',
          payload: e,
        });
      } else {
        dispatch({
          type: 'requestFail',
          payload: undefined,
        });
      }
    }
  }, [dispatch, history]);
};
