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

import { useCallback } from "react";
import { sendRequestToES } from "./send_request_to_es";
import { instance as registry } from "../../contexts/editor_context/editor_registry";
import { useRequestActionContext } from "../../contexts/request_context";
import { useServicesContext } from "../../contexts/services_context";
import { getCommand } from "../../modules/mappings/mappings";
import { useEditorReadContext } from "../../contexts/editor_context";

function buildRawCommonCommandRequest(cmd: any) {
  const { requests } = cmd._source;
  const strReqs = requests.map((req: any) => {
    const { method, path, body } = req;
    return `${method} ${path}\n${body}`;
  });
  return strReqs.join("\n");
}
export const useSendCurrentRequestToES = () => {
  const dispatch = useRequestActionContext();
  const {
    services: { history },
    clusterID,
  } = useServicesContext();
  const { sensorEditor: editor } = useEditorReadContext();

  return useCallback(async () => {
    let requestMethod = "";
    try {
      // const editor = registry.getInputEditor();
      if (!editor) return;
      const requests = await editor.getRequestsInRange();
      if (!requests.length) {
        console.log(
          "No request selected. Select a request by placing the cursor inside it."
        );
        return;
      }
      for(let i=0; i< requests.length; i++){
        const { url, method, data } = requests[i];
        switch(method?.toUpperCase()){
          case "LOAD":
            requestMethod = "LOAD";
            const rawUrl = data[0] ? data[0].slice(4).trim() : url;
            const cmd = getCommand(rawUrl);
            // const curPostion = editor.currentReqRange //(editor.getCoreEditor().getCurrentPosition());
            const lineNumber = editor.getCoreEditor().getCurrentPosition()
              .lineNumber;
            let crange = await editor.getRequestRange(lineNumber);
            const rawRequest = buildRawCommonCommandRequest(cmd);
            await editor.getCoreEditor().replaceRange(crange as any, rawRequest);
            // await editor.autoIndent();
            // editor.getCoreEditor().getContainer().focus();
            // crange = await editor.getRequestRange(lineNumber)

            // editor.getCoreEditor().moveCursorToPosition({
            //   ...crange?.end as any,
            // //  column: editor.getCoreEditor().getLineValue(lineNumber).length + 1,
            // });
            continue;
          case "CONFIG":
            const configKey = url;
            let configValue = 0;
            if (data && data.length > 0) {
              const cmdStr = data[0];
              const parts = cmdStr.split(" ");
              if (parts.length >= 3) {
                configValue = parseInt(parts[2]);
                if (isNaN(configValue)) {
                  dispatch({
                    type: "requestSuccess",
                    payload: {
                      data: {
                        success: false,
                        error: "wrong config value: " + parts[2],
                      },
                    },
                  });
                  continue;
                }
              }
            }
            if (configKey == "MaxTokenCount") {
              localStorage.setItem("editor:" + configKey, configValue + "");
            }
            dispatch({
              type: "requestSuccess",
              payload: {
                data: {
                  success: true,
                },
              },
            });
            continue;
          case "FROM":
            requests[i].url = "_sql";
            requests[i].method = "POST";
            requests[i].rawRequest = requests[i].data[0];
            let queryStr = requests[i].data[0] || '';
            //find select
            const idx = queryStr.search(/\s+(select)\s+/i);
            if(idx == -1) {
              const err =  Error('invalid FROM request');
              err.name = "FRONT_ERROR";
              throw err;
              
            }
            const fromPart = queryStr.slice(0, idx);
            queryStr = queryStr.slice(idx);
            const firstKeywordIdx = queryStr.search(/\s+(order|where|limit)\s+/i);
            if(firstKeywordIdx > -1){
              const selectPart = queryStr.slice(0, firstKeywordIdx);
              queryStr = selectPart +' ' + fromPart + queryStr.slice(firstKeywordIdx)
            }else {
              queryStr = queryStr + ' ' + fromPart
            }
          
            let queryObj = {
              "query": queryStr.trim(),
            }
            requests[i].data[0] = JSON.stringify(queryObj)
            break
          case "SELECT":
            requests[i].url = "_sql"
            requests[i].method = "POST"
            requests[i].rawRequest = requests[i].data[0];
            let query = {
              "query": requests[i].data[0]
            }
            requests[i].data[0] = JSON.stringify(query)
            break
        }
    }

      dispatch({ type: "sendRequest", payload: undefined });

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
        type: "requestSuccess",
        payload: {
          data: results,
        },
      });
    } catch (e) {
      if (requestMethod === "LOAD") {
        return;
      }
      if (e) {
        let payload = {data:[e]};
        if(e.name === "FRONT_ERROR"){
          payload = { data: [{response:{value:e?.message || e, contentType:"plain/text"}}] }
        }
        dispatch({
          type: "requestSuccess",
          payload: payload,
        });
      } else {
        dispatch({
          type: "requestFail",
          payload: undefined,
        });
      }
    }
  }, [dispatch, history, clusterID, editor]);
};
