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

import React, { Component } from 'react';
import { EuiIcon, EuiContextMenuPanel, EuiContextMenuItem, EuiPopover } from '@elastic/eui';
import { ESRequestParams } from '../entities/es_request';
import {notification} from 'antd';

import CommonCommandModal from './CommonCommandModal';
import {saveCommonCommand} from '../modules/es';
import {pushCommand} from '../modules/mappings/mappings';

interface Props {
  getCurl: () => Promise<string>;
  getDocumentation: () => Promise<string | null>;
  autoIndent: (ev: React.MouseEvent) => void;
  saveAsCommonCommand: () => Promise<ESRequestParams>;
}

interface State {
  isPopoverOpen: boolean;
  curlCode: string;
  modalVisible: boolean;
}

export default class ConsoleMenu extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      curlCode: '',
      isPopoverOpen: false,
      modalVisible: false,
    };
  }

  mouseEnter = () => {
    if (this.state.isPopoverOpen) return;
    this.props.getCurl().then((text) => {
      this.setState({ curlCode: text });
    });
  };

  async copyAsCurl() {
    try {
      await this.copyText(this.state.curlCode);
      notification.open({
       message: 'Request copied as cURL',
       placement: 'bottomRight'
      });
    } catch (e) {
      notification.error({
        message: 'Could not copy request as cURL',
        placement: 'bottomRight'
       });
    }
  }

  async copyText(text: string) {
    if (window.navigator?.clipboard) {
      await window.navigator.clipboard.writeText(text);
      return;
    }
    throw new Error('Could not copy to clipboard!');
  }

  onButtonClick = () => {
    this.setState((prevState) => ({
      isPopoverOpen: !prevState.isPopoverOpen,
    }));
  };

  closePopover = () => {
    this.setState({
      isPopoverOpen: false,
    });
  };

  openDocs = async () => {
    this.closePopover();
    const documentation = await this.props.getDocumentation();
    if (!documentation) {
      return;
    }
    window.open(documentation, '_blank');
  };

  autoIndent = (event: React.MouseEvent) => {
    this.closePopover();
    this.props.autoIndent(event);
  };

  saveAsCommonCommand = () => {
    this.setState({
      isPopoverOpen: false,
      modalVisible: true
    });
  };

  handleClose = () => {
    this.setState({ modalVisible: false });
  };

  handleConfirm = async (params: Record<string, any>) => {
    const requests = await this.props.saveAsCommonCommand();
    const reqBody = {
      ...params,
      requests,
    };
    const result = await (await saveCommonCommand(reqBody))?.json();
    if(result.error){
      notification.error({
        message: result.error
      });
    }else{
      this.handleClose();
      notification.success({
        message:'保存成功'
      });
      pushCommand(result);
    }
  };

  render() {
    const button = (
      <button
        className="euiButtonIcon--primary"
        onClick={this.onButtonClick}
      >
        <EuiIcon type="wrench" />
      </button>
    );

    const items = [
      <EuiContextMenuItem
        key="Copy as cURL"
        id="ConCopyAsCurl"
        disabled={!window.navigator?.clipboard}
        onClick={() => {
          this.closePopover();
          this.copyAsCurl();
        }}
      >
        复制为curl命令
      </EuiContextMenuItem>,
      <EuiContextMenuItem
        key="Auto indent"
        onClick={this.autoIndent}
      >
        自动缩进
      </EuiContextMenuItem>,
      <EuiContextMenuItem
        key="Save as common command"
        onClick={this.saveAsCommonCommand}
      >
        保存为常用命令
      </EuiContextMenuItem>,
    ];

    return (
      <span onMouseEnter={this.mouseEnter}>
        <EuiPopover
          id="contextMenu"
          button={button}
          isOpen={this.state.isPopoverOpen}
          closePopover={this.closePopover}
          panelPaddingSize="none"
          anchorPosition="downLeft"
        >
          <EuiContextMenuPanel items={items} />
        </EuiPopover>
        {this.state.modalVisible && <CommonCommandModal onClose={this.handleClose} onConfirm={this.handleConfirm} />}
      </span>
    );
  }
}
