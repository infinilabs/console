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

import { EuiButtonIcon, EuiContextMenu, EuiPopover, EuiPopoverTitle } from '@elastic/eui';
import { Component } from 'react';
import React from 'react';

interface Props {
  onEnableAll: () => void;
  onDisableAll: () => void;
  onPinAll: () => void;
  onUnpinAll: () => void;
  onToggleAllNegated: () => void;
  onToggleAllDisabled: () => void;
  onRemoveAll: () => void;
  intl: InjectedIntl;
}

interface State {
  isPopoverOpen: boolean;
}

class FilterOptionsUI extends Component<Props, State> {
  public state: State = {
    isPopoverOpen: false,
  };

  public togglePopover = () => {
    this.setState((prevState) => ({
      isPopoverOpen: !prevState.isPopoverOpen,
    }));
  };

  public closePopover = () => {
    this.setState({ isPopoverOpen: false });
  };

  public render() {
    const panelTree = {
      id: 0,
      items: [
        {
          name: 'Enable all',
          icon: 'eye',
          onClick: () => {
            this.closePopover();
            this.props.onEnableAll();
          },
          'data-test-subj': 'enableAllFilters',
        },
        {
          name: 'Disable all',
          icon: 'eyeClosed',
          onClick: () => {
            this.closePopover();
            this.props.onDisableAll();
          },
          'data-test-subj': 'disableAllFilters',
        },
        {
          name: 'Pin all',
          icon: 'pin',
          onClick: () => {
            this.closePopover();
            this.props.onPinAll();
          },
          'data-test-subj': 'pinAllFilters',
        },
        {
          name: 'Unpin all',
          icon: 'pin',
          onClick: () => {
            this.closePopover();
            this.props.onUnpinAll();
          },
          'data-test-subj': 'unpinAllFilters',
        },
        {
          name: 'Invert inclusion',
          icon: 'invert',
          onClick: () => {
            this.closePopover();
            this.props.onToggleAllNegated();
          },
          'data-test-subj': 'invertInclusionAllFilters',
        },
        {
          name: 'Invert enabled/disabled',
          icon: 'eye',
          onClick: () => {
            this.closePopover();
            this.props.onToggleAllDisabled();
          },
          'data-test-subj': 'invertEnableDisableAllFilters',
        },
        {
          name: 'Remove all',
          icon: 'trash',
          onClick: () => {
            this.closePopover();
            this.props.onRemoveAll();
          },
          'data-test-subj': 'removeAllFilters',
        },
      ],
    };

    return (
      <EuiPopover
        id="popoverForAllFilters"
        className="globalFilterGroup__allFiltersPopover"
        isOpen={this.state.isPopoverOpen}
        closePopover={this.closePopover}
        button={
          <EuiButtonIcon
            onClick={this.togglePopover}
            iconType="filter"
            aria-label={ 'Change all filters'}
            title={ 'Change all filters'}
            data-test-subj="showFilterActions"
          />
        }
        anchorPosition="rightUp"
        panelPaddingSize="none"
        // withTitle
        repositionOnScroll
      >
        <EuiPopoverTitle>
          Change all filters
        </EuiPopoverTitle>
        <EuiContextMenu initialPanelId={0} panels={[panelTree]} />
      </EuiPopover>
    );
  }
}

export const FilterOptions = (FilterOptionsUI);
