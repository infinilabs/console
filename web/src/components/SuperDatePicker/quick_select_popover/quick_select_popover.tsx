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

import React, { Component, Fragment } from 'react';

import { EuiQuickSelect } from './quick_select';
import { EuiCommonlyUsedTimeRanges } from './commonly_used_time_ranges';
import { EuiRecentlyUsed } from './recently_used';
import { EuiRefreshInterval } from './refresh_interval';
import { ApplyRefreshInterval, ApplyTime, DurationRange, QuickSelect, QuickSelectPanel } from '@elastic/eui/src/components/date_picker/types';
import { EuiButtonEmpty, EuiHorizontalRule, EuiIcon, EuiPopover, EuiSpacer, EuiText, EuiTitle } from '@elastic/eui';
import { EuiTimeExtends } from './time_extends';

export interface EuiQuickSelectPopoverProps {
  applyRefreshInterval?: ApplyRefreshInterval;
  applyTime: ApplyTime;
  commonlyUsedRanges: DurationRange[];
  customQuickSelectPanels?: QuickSelectPanel[];
  dateFormat: string;
  end: string;
  isAutoRefreshOnly: boolean;
  isDisabled: boolean;
  isPaused: boolean;
  recentlyUsedRanges: DurationRange[];
  refreshInterval: number;
  start: string;

  timeExtends: any;
}

interface EuiQuickSelectPopoverState {
  isOpen: boolean;
  prevQuickSelect?: QuickSelect;
}

export class EuiQuickSelectPopover extends Component<
  EuiQuickSelectPopoverProps,
  EuiQuickSelectPopoverState
> {
  state: EuiQuickSelectPopoverState = {
    isOpen: false,
  };

  closePopover = () => {
    this.setState({ isOpen: false });
  };

  togglePopover = () => {
    this.setState((prevState) => ({
      isOpen: !prevState.isOpen,
    }));
  };

  applyTime: ApplyTime = ({
    start,
    end,
    quickSelect,
    keepPopoverOpen = false,
  }) => {
    this.props.applyTime({
      start,
      end,
    });
    if (quickSelect) {
      this.setState({ prevQuickSelect: quickSelect });
    }
    if (!keepPopoverOpen) {
      this.closePopover();
    }
  };

  renderTimeExtends = () => {
    const {
      timeExtends
    } = this.props;

    return (
      <EuiTimeExtends {...timeExtends}/>
    )
  };

  renderDateTimeSections = () => {
    const {
      commonlyUsedRanges,
      dateFormat,
      end,
      isAutoRefreshOnly,
      recentlyUsedRanges,
      start,
      timeExtends
    } = this.props;

    const { timeField } = timeExtends

    const { prevQuickSelect } = this.state;

    if (isAutoRefreshOnly) {
      return null;
    }

    const showTimeSelect = !!timeField

    return (
      <Fragment>
        {
          showTimeSelect && (
            <>
              <EuiQuickSelect
                applyTime={this.applyTime}
                start={start}
                end={end}
                prevQuickSelect={prevQuickSelect}
              />
              <EuiCommonlyUsedTimeRanges
                applyTime={this.applyTime}
                commonlyUsedRanges={commonlyUsedRanges}
                timeExtends={timeExtends}
              />
              <EuiRecentlyUsed
                applyTime={this.applyTime}
                commonlyUsedRanges={commonlyUsedRanges}
                dateFormat={dateFormat}
                recentlyUsedRanges={recentlyUsedRanges}
              />
              {this.renderCustomQuickSelectPanels()}
            </>
          )
        }
      </Fragment>
    );
  };

  renderCustomQuickSelectPanels = () => {
    const { customQuickSelectPanels } = this.props;
    if (!customQuickSelectPanels) {
      return null;
    }

    return customQuickSelectPanels.map(({ title, content }) => {
      return (
        <Fragment key={title}>
          <EuiTitle size="xxxs">
            <span>{title}</span>
          </EuiTitle>
          <EuiSpacer size="s" />
          <EuiText size="s" className="euiQuickSelectPopover__section">
            {React.cloneElement(content, { applyTime: this.applyTime })}
          </EuiText>
          <EuiHorizontalRule margin="s" />
        </Fragment>
      );
    });
  };

  render() {
    const {
      applyRefreshInterval,
      isAutoRefreshOnly,
      isDisabled,
      isPaused,
      refreshInterval,
    } = this.props;
    const { isOpen } = this.state;

    const quickSelectButton = (
      <EuiButtonEmpty
        className="euiFormControlLayout__prepend"
        textProps={{ className: 'euiQuickSelectPopover__buttonText' }}
        onClick={this.togglePopover}
        aria-label="Date quick select"
        size="xs"
        iconType="arrowDown"
        iconSide="right"
        isDisabled={isDisabled}
        data-test-subj="superDatePickerToggleQuickMenuButton">
        <EuiIcon type={!isAutoRefreshOnly && isPaused ? 'calendar' : 'clock'} />
      </EuiButtonEmpty>
    );

    return (
      <EuiPopover
        button={quickSelectButton}
        isOpen={isOpen}
        closePopover={this.closePopover}
        anchorPosition="downLeft"
        anchorClassName="euiQuickSelectPopover__anchor">
        <div
          className="euiQuickSelectPopover__content"
          data-test-subj="superDatePickerQuickMenu">
          {this.renderTimeExtends()}
          <EuiSpacer size="s" />
          {this.renderDateTimeSections()}
          <EuiRefreshInterval
            applyRefreshInterval={applyRefreshInterval}
            isPaused={isPaused}
            refreshInterval={refreshInterval}
          />
        </div>
      </EuiPopover>
    );
  }
}
