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

import React, { FunctionComponent } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiBadge, EuiText, EuiToolTip,EuiCodeBlock } from '@elastic/eui';
import {HealthStatusCircle} from '@/components/infini/health_status_circle';
import './request_status_bar.scss';
import {Drawer, Tabs, Button} from 'antd';

export interface Props {
  requestInProgress: boolean;
  requestResult?: {
    // Status code of the request, e.g., 200
    statusCode: number;

    // Status text of the request, e.g., OK
    statusText: string;

    // Method of the request, e.g., GET
    method: string;

    // The path of endpoint that was called, e.g., /_search
    endpoint: string;

    // The time, in milliseconds, that the last request took
    timeElapsedMs: number;
    responseHeader: string;
    requestHeader: string;
  };
}

const mapStatusCodeToBadgeColor = (statusCode: number) => {
  if (statusCode <= 199) {
    return 'default';
  }

  if (statusCode <= 299) {
    return 'secondary';
  }

  if (statusCode <= 399) {
    return 'primary';
  }

  if (statusCode <= 499) {
    return 'warning';
  }

  return 'danger';
};

// export const RequestStatusBar: FunctionComponent<Props> = ({
//   requestInProgress,
//   requestResult,
//   selectedCluster,
// }) => {
//   let content: React.ReactNode = null;
//   const clusterContent = (<EuiFlexItem grow={false} style={{marginRight:'auto'}}>
//   <EuiBadge style={{position:'relative', paddingLeft: 20}}>
//     <i style={{marginRight:3, position:'absolute', top: 1, left:3}}><HealthStatusCircle status={selectedCluster.status}/></i>{selectedCluster.host}&nbsp;-&nbsp;{selectedCluster.version}
//   </EuiBadge>
// </EuiFlexItem>);

//   if (requestInProgress) {
//     content = (
//       <EuiFlexItem grow={false}>
//         <EuiBadge color="hollow">
//            Request in progress
//         </EuiBadge>
//       </EuiFlexItem>
//     );
//   } else if (requestResult) {
//     const { endpoint, method, statusCode, statusText, timeElapsedMs } = requestResult;

//     content = (
//       <>
//         <EuiFlexItem grow={false}>
//           <EuiToolTip
//             position="top"
//             content={
//               <EuiText size="s">{`${method} ${
//                 endpoint.startsWith('/') ? endpoint : '/' + endpoint
//               }`}</EuiText>
//             }
//           >
//             <EuiBadge color={mapStatusCodeToBadgeColor(statusCode)}>
//               {/*  Use &nbsp; to ensure that no matter the width we don't allow line breaks */}
//               {statusCode}&nbsp;-&nbsp;{statusText}
//             </EuiBadge>
//           </EuiToolTip>
//         </EuiFlexItem>
//         <EuiFlexItem grow={false}>
//           <EuiToolTip
//             position="top"
//             content={
//               <EuiText size="s">
//                 Time Elapsed
//               </EuiText>
//             }
//           >
//             <EuiText size="s">
//               <EuiBadge color="default">
//                 {timeElapsedMs}&nbsp;{'ms'}
//               </EuiBadge>
//             </EuiText>
//           </EuiToolTip>
//         </EuiFlexItem>
//       </>
//     );
//   }

//   return (
//     <EuiFlexGroup
//       justifyContent="flexEnd"
//       alignItems="center"
//       direction="row"
//       gutterSize="s"
//       responsive={false}
//     >
//       {clusterContent}
//       {content}
//     </EuiFlexGroup>
//   );
// };

export const RequestStatusBar = ({
  requestInProgress,
  requestResult,
  selectedCluster,
  container,
}:Props) => {
  let content: React.ReactNode = null;
  const clusterContent = (<div className="base-info">
      <div className="info-item health">
        <span>健康状态：</span>
        <i style={{position:'absolute', top: 1, right:0}}>
        <HealthStatusCircle status={selectedCluster.status}/>
        </i>
      </div>
      <div className="info-item">
        <span>集群地址：</span>
        <EuiBadge color="default">{selectedCluster.host}</EuiBadge>
      </div>
      <div className="info-item">
        <span>版本：</span>
        <EuiBadge color="default"> {selectedCluster.version}</EuiBadge>
      </div> 
</div>);
const [headerInfoVisible, setHeaderInfoVisible] = React.useState(false)

  if (requestInProgress) {
    content = (
      <EuiFlexItem grow={false}>
        <EuiBadge color="hollow">
           Request in progress
        </EuiBadge>
      </EuiFlexItem>
    );
  } else if (requestResult) {
    const { endpoint, method, statusCode, statusText, timeElapsedMs } = requestResult;

    content = (
      <>
      <div className="status_info">
        <div className="info-item">
          <span>响应状态：</span>
          <EuiToolTip
            position="top"
            content={
              <EuiText size="s">{`${method} ${
                endpoint.startsWith('/') ? endpoint : '/' + endpoint
              }`}</EuiText>
            }
          >
            <EuiBadge color={mapStatusCodeToBadgeColor(statusCode)}>
              {/*  Use &nbsp; to ensure that no matter the width we don't allow line breaks */}
              {statusCode}&nbsp;-&nbsp;{statusText}
            </EuiBadge>
          </EuiToolTip>
        </div>
        <div className="info-item">
          <span>时延：</span>
          <EuiToolTip
            position="top"
            content={
              <EuiText size="s">
                Time Elapsed
              </EuiText>
            }
          >
            <EuiText size="s">
              <EuiBadge color="default">
                {timeElapsedMs}&nbsp;{'ms'}
              </EuiBadge>
            </EuiText>
          </EuiToolTip>
        </div>
        <div className="info-item">
          <EuiText size="s">
            <Button type="link" onClick={()=>{setHeaderInfoVisible(true)}}>
              Headers
            </Button>
          </EuiText>
        </div>
        </div>
      </>
    );
  }

  return (
    <div className="request-status-bar">
      <div className="bar-item">{clusterContent}</div>
      <div className="bar-item">{content}</div>
      <Drawer title="Request header info" 
        style={{zIndex:1004}}
        width={520}
        mask={false}
        // getContainer={container.current}
        destroyOnClose={true}
        visible={headerInfoVisible}
        onClose={()=>{setHeaderInfoVisible(false)}}
      >
        <Tabs>
        <Tabs.TabPane tab="Request" key="1">
          <div>
          <EuiCodeBlock language="text" isCopyable paddingSize="s">
            {requestResult?.requestHeader}
          </EuiCodeBlock>
            
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Response" key="2">
          <EuiCodeBlock language="text" isCopyable paddingSize="s">
            {requestResult?.responseHeader}
          </EuiCodeBlock>
        </Tabs.TabPane>
        </Tabs>
        </Drawer>
    </div>
    
  );
};
