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

import dateMath from "@elastic/datemath";
import classNames from "classnames";
import React, { useState } from "react";

import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiFieldText,
  prettyDuration,
} from "@elastic/eui";
// @ts-ignore
import { EuiSuperUpdateButton, OnRefreshProps } from "@elastic/eui";
import { Toast } from "src/core/public";
import { IIndexPattern, TimeRange, TimeHistoryContract, Query } from "../..";
import { toMountPoint, withKibana } from "../../../../react/public";
import QueryStringInputUI from "./query_string_input";
import { doesKueryExpressionHaveLuceneSyntaxError } from "../../../common";
import { NoDataPopover } from "./no_data_popover";
import { DiscoverHistogram } from "@/components/vendor/discover/public/application/components/histogram/histogram";
import DatePicker from "@/common/src/DatePicker";
import styles from "./query_bar_top_row.less";
import { getLocale } from "umi/locale";

const QueryStringInput = withKibana(QueryStringInputUI);

// @internal
export interface QueryBarTopRowProps {
  query?: Query;
  onSubmit: (payload: { dateRange: TimeRange; query?: Query }) => void;
  onChange: (payload: { dateRange: TimeRange; query?: Query }) => void;
  onRefresh?: (payload: { dateRange: TimeRange }) => void;
  dataTestSubj?: string;
  disableAutoFocus?: boolean;
  screenTitle?: string;
  indexPatterns?: Array<IIndexPattern | string>;
  isLoading?: boolean;
  prepend?: React.ComponentProps<typeof EuiFieldText>["prepend"];
  showQueryInput?: boolean;
  showDatePicker?: boolean;
  dateRangeFrom?: string;
  dateRangeTo?: string;
  isRefreshPaused?: boolean;
  refreshInterval?: number;
  showAutoRefreshOnly?: boolean;
  onRefreshChange?: (options: {
    isPaused: boolean;
    refreshInterval: number;
  }) => void;
  customSubmitButton?: any;
  isDirty: boolean;
  timeHistory?: TimeHistoryContract;
  indicateNoData?: boolean;
}

// Needed for React.lazy
// eslint-disable-next-line import/no-default-export
export default function QueryBarTopRow(props: QueryBarTopRowProps) {
  const [isDateRangeInvalid, setIsDateRangeInvalid] = useState(false);
  const [isQueryInputFocused, setIsQueryInputFocused] = useState(false);

  // const kibana = useKibana<IDataPluginServices>();
  // const { uiSettings, notifications, storage, appName, docLinks } = kibana.services;
  const { storage } = props;
  const appName = "discover";

  // const kueryQuerySyntaxLink: string = docLinks!.links.query.kueryQuerySyntax;

  const queryLanguage = props.query && props.query.language;
  // const persistedLog: PersistedLog | undefined = React.useMemo(
  //   () =>
  //     queryLanguage && uiSettings && storage && appName
  //       ? getQueryLog(uiSettings!, storage, appName, queryLanguage)
  //       : undefined,
  //   [appName, queryLanguage, uiSettings, storage]
  // );

  function onClickSubmitButton(event: React.MouseEvent<HTMLButtonElement>) {
    // if (persistedLog && props.query) {
    //   persistedLog.add(props.query.query);
    // }
    event.preventDefault();
    onSubmit({ query: props.query, dateRange: getDateRange() });
  }

  function getDateRange() {
    // const defaultTimeSetting = uiSettings!.get(UI_SETTINGS.TIMEPICKER_TIME_DEFAULTS);
    const defaultTimeSetting = {
      from: "",
      to: "",
    };
    return {
      from: props.dateRangeFrom || defaultTimeSetting.from,
      to: props.dateRangeTo || defaultTimeSetting.to,
    };
  }

  function onQueryChange(query: Query) {
    props.onChange({
      query,
      dateRange: getDateRange(),
    });
  }

  function onChangeQueryInputFocus(isFocused: boolean) {
    setIsQueryInputFocused(isFocused);
  }

  function onTimeChange({
    start,
    end,
    isInvalid,
    isQuickSelection,
  }: {
    start: string;
    end: string;
    isInvalid: boolean;
    isQuickSelection: boolean;
  }) {
    setIsDateRangeInvalid(isInvalid);
    const retVal = {
      query: props.query,
      dateRange: {
        from: start,
        to: end,
      },
    };

    if (isQuickSelection) {
      props.onSubmit(retVal);
    } else {
      props.onChange(retVal);
    }
  }

  function onRefresh({ start, end }: OnRefreshProps) {
    const retVal = {
      dateRange: {
        from: start,
        to: end,
      },
    };
    if (props.onRefresh) {
      props.onRefresh(retVal);
    }
  }

  function onSubmit({
    query,
    dateRange,
  }: {
    query?: Query;
    dateRange: TimeRange;
  }) {
    // handleLuceneSyntaxWarning();

    if (props.timeHistory) {
      props.timeHistory.add(dateRange);
    }

    props.onSubmit({ query, dateRange });
  }

  function onInputSubmit(query: Query) {
    onSubmit({
      query,
      dateRange: getDateRange(),
    });
  }

  function toAbsoluteString(value: string, roundUp = false) {
    const valueAsMoment = dateMath.parse(value, { roundUp });
    if (!valueAsMoment) {
      return value;
    }
    return valueAsMoment.toISOString();
  }

  function renderQueryInput() {
    if (!shouldRenderQueryInput()) return;
    return (
      <EuiFlexItem>
        <QueryStringInput
          disableAutoFocus={props.disableAutoFocus}
          indexPatterns={props.indexPatterns!}
          prepend={props.prepend}
          query={props.query!}
          screenTitle={props.screenTitle}
          onChange={onQueryChange}
          onChangeQueryInputFocus={onChangeQueryInputFocus}
          onSubmit={onInputSubmit}
          // persistedLog={persistedLog}
          dataTestSubj={props.dataTestSubj}
          services={props.services}
        />
      </EuiFlexItem>
    );
  }

  function renderSharingMetaFields() {
    const { from, to } = getDateRange();
    const dateRangePretty = prettyDuration(
      toAbsoluteString(from),
      toAbsoluteString(to),
      [],
      // uiSettings.get('dateFormat')
      "YYYY-MM-DD"
    );
    return (
      <div
        data-shared-timefilter-duration={dateRangePretty}
        data-test-subj="dataSharedTimefilterDuration"
      />
    );
  }

  function shouldRenderDatePicker(): boolean {
    return Boolean(props.showDatePicker || props.showAutoRefreshOnly);
  }

  function shouldRenderQueryInput(): boolean {
    return Boolean(
      props.showQueryInput && props.indexPatterns && props.query && storage
    );
  }

  function renderUpdateButton() {
    const button = props.customSubmitButton ? (
      React.cloneElement(props.customSubmitButton, {
        onClick: onClickSubmitButton,
        className: styles.euiButtonRefresh,
      })
    ) : (
      <EuiSuperUpdateButton
        needsUpdate={props.isDirty}
        isDisabled={isDateRangeInvalid}
        isLoading={props.isLoading}
        onClick={onClickSubmitButton}
        data-test-subj="querySubmitButton"
        className={styles.euiButtonRefresh}
      />
    );

    return (
      <NoDataPopover storage={storage} showNoDataPopover={props.indicateNoData}>
        <EuiFlexGroup responsive={false} gutterSize="s">
          {renderHistogram()}
          {renderDatePicker()}
          <EuiFlexItem grow={false}>{button}</EuiFlexItem>
        </EuiFlexGroup>
      </NoDataPopover>
    );
  }

  function renderHistogram() {
    if (!shouldRenderDatePicker() || !props.histogramData) {
      return null;
    }

    return (
      <EuiFlexItem
        style={{
          display: isQueryInputFocused ? "none" : "flex",
          minWidth: 240,
          maxWidth: 340,
          height: 32,
          background: "#fbfcfd",
          boxShadow:
            "0 1px 1px -1px rgba(152,162,179,0.2), 0 3px 2px -2px rgba(152,162,179,0.2), inset 0 0 0 1px rgba(15,39,118,0.1)",
        }}
      >
        <DiscoverHistogram
          chartData={props.histogramData}
          timefilterUpdateHandler={props.timefilterUpdateHandler}
        />
      </EuiFlexItem>
    );
  }

  function renderDatePicker() {
    const wrapperClasses = classNames("kbnQueryBar__datePickerWrapper", {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "kbnQueryBar__datePickerWrapper-isHidden": isQueryInputFocused,
    });

    return (
      <EuiFlexItem className={wrapperClasses} style={{ marginRight: 6 }}>
        <DatePicker
          className={styles.datePicker}
          locale={getLocale()}
          start={props.dateRangeFrom}
          end={props.dateRangeTo}
          onRangeChange={({ start, end }) => {
            onTimeChange({ start, end });
          }}
          isRefreshPaused={props.isRefreshPaused}
          refreshInterval={props.refreshInterval}
          onRefreshChange={({ isRefreshPaused, refreshInterval }) =>
            props.onRefreshChange({
              isPaused: isRefreshPaused,
              refreshInterval,
            })
          }
          showTimeSetting={true}
          {...(props.timeSetting || {})}
          recentlyUsedRangesKey={"discover"}
        />
      </EuiFlexItem>
    );
  }

  function handleLuceneSyntaxWarning() {
    if (!props.query) return;
    const { query, language } = props.query;
    if (
      language === "kuery" &&
      typeof query === "string" &&
      (!storage || !storage.get("kibana.luceneSyntaxWarningOptOut")) &&
      doesKueryExpressionHaveLuceneSyntaxError(query)
    ) {
      const toast = notifications!.toasts.addWarning({
        title: "Lucene syntax warning",
        text: toMountPoint(
          <div>
            <p>
              It looks like you may be trying to use Lucene query syntax,
              although you have Kibana Query Language (KQL) selected. Please
              review the KQL docs{" "}
              <EuiLink href={kueryQuerySyntaxLink} target="_blank">
                here
              </EuiLink>
              .
            </p>
            <EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
              <EuiFlexItem grow={false}>
                <EuiButton
                  size="s"
                  onClick={() => onLuceneSyntaxWarningOptOut(toast)}
                >
                  Don't show again
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </div>
        ),
      });
    }
  }

  function onLuceneSyntaxWarningOptOut(toast: Toast) {
    if (!storage) return;
    storage.set("kibana.luceneSyntaxWarningOptOut", true);
    notifications!.toasts.remove(toast);
  }

  const classes = classNames("kbnQueryBar", {
    "kbnQueryBar--withDatePicker": props.showDatePicker,
  });

  return (
    <EuiFlexGroup
      className={classes}
      responsive={!!props.showDatePicker}
      gutterSize="s"
      justifyContent="flexEnd"
    >
      {renderQueryInput()}
      {renderSharingMetaFields()}
      <EuiFlexItem grow={false}>{renderUpdateButton()}</EuiFlexItem>
    </EuiFlexGroup>
  );
}

QueryBarTopRow.defaultProps = {
  showQueryInput: true,
  showDatePicker: true,
  showAutoRefreshOnly: false,
};
