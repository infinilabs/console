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

import React, { Component } from "react";
import {
  EuiIcon,
  EuiContextMenuPanel,
  EuiContextMenuItem,
  EuiPopover,
} from "@elastic/eui";
import { ESRequestParams } from "../entities/es_request";
import { notification } from "antd";

import CommonCommandModal from "./CommonCommandModal";
import { saveCommonCommand } from "../modules/es";
import { pushCommand } from "../modules/mappings/mappings";
import { formatMessage } from "umi/locale";
import { hasAuthority } from "@/utils/authority";

interface Props {
  getCurl: () => Promise<string>;
  getDocumentation: () => Promise<string | null>;
  autoIndent: (ev?: { preventDefault?: () => void }) => void;
  saveAsCommonCommand: () => Promise<ESRequestParams>;
}

interface State {
  isPopoverOpen: boolean;
  modalVisible: boolean;
}

type ShortcutConfig = {
  bindKey: {
    win: string;
    mac: string;
  };
  label: {
    win: string;
    mac: string;
  };
};

export const CONSOLE_MENU_SHORTCUTS: Record<
  "copyAsCurl" | "autoIndent" | "saveAsCommand",
  ShortcutConfig
> = {
  copyAsCurl: {
    bindKey: { win: "Ctrl-Alt-C", mac: "Command-Option-C" },
    label: { win: "Ctrl+Alt+C", mac: "Cmd+Opt+C" },
  },
  autoIndent: {
    bindKey: { win: "Ctrl-Alt-I", mac: "Command-Option-I" },
    label: { win: "Ctrl+Alt+I", mac: "Cmd+Opt+I" },
  },
  saveAsCommand: {
    bindKey: { win: "Ctrl-Alt-S", mac: "Command-Option-S" },
    label: { win: "Ctrl+Alt+S", mac: "Cmd+Opt+S" },
  },
};

const isMacPlatform = () =>
  typeof window !== "undefined" &&
  /(Mac|iPhone|iPad|iPod)/i.test(window.navigator.platform);

const renderMenuItemContent = (label: string, shortcut: ShortcutConfig["label"]) => (
  <span
    style={{
      display: "flex",
      width: "100%",
      alignItems: "center",
      gap: 16,
    }}
  >
    <span>{label}</span>
    <span style={{ color: "#98A2B3", fontSize: 12, marginLeft: "auto", textAlign: "right" }}>
      {isMacPlatform() ? shortcut.mac : shortcut.win}
    </span>
  </span>
);

export default class ConsoleMenu extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isPopoverOpen: false,
      modalVisible: false,
    };
  }

  copyAsCurl = async () => {
    this.closePopover();
    try {
      const curlCode = await this.props.getCurl();
      await this.copyText(curlCode);
      notification.open({
        message: "Request copied as cURL",
        placement: "bottomRight",
      });
    } catch (e) {
      notification.error({
        message: "Could not copy request as cURL",
        placement: "bottomRight",
      });
    }
  };

  async copyText(text: string) {
    if (window.navigator?.clipboard) {
      await window.navigator.clipboard.writeText(text);
      return;
    }
    throw new Error("Could not copy to clipboard!");
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
    window.open(documentation, "_blank");
  };

  autoIndent = (event?: { preventDefault?: () => void }) => {
    this.closePopover();
    this.props.autoIndent(event);
  };

  saveAsCommonCommand = () => {
    this.setState({
      isPopoverOpen: false,
      modalVisible: true,
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
    if (result.error) {
      notification.error({
        message: result.error,
      });
    } else {
      this.handleClose();
      notification.success({
        message: formatMessage({ id: "app.message.save.success" }),
      });
      pushCommand(result);
    }
  };

  render() {
    const button = (
      <button className="euiButtonIcon--primary" onClick={this.onButtonClick}>
        <EuiIcon type="wrench" />
      </button>
    );

    const items = [
      <EuiContextMenuItem key="Auto indent" onClick={this.autoIndent}>
        {renderMenuItemContent(
          formatMessage({ id: "console.menu.auto_indent" }),
          CONSOLE_MENU_SHORTCUTS.autoIndent.label
        )}
      </EuiContextMenuItem>,
      <EuiContextMenuItem key="Copy as cURL" id="ConCopyAsCurl" onClick={this.copyAsCurl}>
        {renderMenuItemContent(
          formatMessage({ id: "console.menu.copy_as_curl" }),
          CONSOLE_MENU_SHORTCUTS.copyAsCurl.label
        )}
      </EuiContextMenuItem>
    ];
    if(hasAuthority("system.command:all")){
      items.push(<EuiContextMenuItem
        key="Save as common command"
        onClick={this.saveAsCommonCommand}
      >
        {renderMenuItemContent(
          formatMessage({ id: "console.menu.save_as_command" }),
          CONSOLE_MENU_SHORTCUTS.saveAsCommand.label
        )}
      </EuiContextMenuItem>)
    }

    return (
      <span>
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
        {this.state.modalVisible && (
          <CommonCommandModal
            onClose={this.handleClose}
            onConfirm={this.handleConfirm}
          />
        )}
      </span>
    );
  }
}
