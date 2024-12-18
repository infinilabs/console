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

import React, { FC } from 'react';
import { unitOfTime } from 'moment';
import moment from 'moment-timezone';

import {
  TooltipValue,
  RectAnnotation,
  RectAnnotationDatum,
  RectAnnotationStyle,
} from '@elastic/charts';
import { EuiFlexGroup, EuiFlexItem, EuiIcon, EuiSpacer } from '@elastic/eui';
import lightEuiTheme from '@elastic/eui/dist/eui_theme_light.json';
import darkEuiTheme from '@elastic/eui/dist/eui_theme_dark.json';


export const Endzones = ({
  isDarkMode,
  domainStart,
  domainEnd,
  interval,
  domainMin,
  domainMax,
  hideTooltips = true,
  isFullBin = false,
}) => {
  const rectAnnotationStyle = {
    stroke: isDarkMode ? darkEuiTheme.euiColorLightShade : lightEuiTheme.euiColorDarkShade,
    strokeWidth: 0,
    opacity: isDarkMode ? 0.6 : 0.2,
    fill: isDarkMode ? darkEuiTheme.euiColorLightShade : lightEuiTheme.euiColorDarkShade,
  };

  const rectAnnotations = [];

  if (domainStart > domainMin) {
    rectAnnotations.push({
      coordinates: {
        x1: isFullBin ? domainMin : domainStart,
      },
    });
  }

  if (domainEnd - interval < domainMax) {
    rectAnnotations.push({
      coordinates: {
        x0: isFullBin ? domainMax : domainEnd,
      },
    });
  }

  return (
    <RectAnnotation
      id="__endzones__"
      hideTooltips={hideTooltips}
      customTooltipDetails={Prompt}
      zIndex={2}
      dataValues={rectAnnotations}
      style={rectAnnotationStyle}
    />
  );
};

const findIntervalFromDuration = (
  dateValue,
  esValue,
  esUnit,
  timeZone
) => {
  const date = moment.tz(dateValue, timeZone);
  const startOfDate = moment.tz(date, timeZone).startOf(esUnit);
  const endOfDate = moment.tz(date, timeZone).startOf(esUnit).add(esValue, esUnit);
  return endOfDate.valueOf() - startOfDate.valueOf();
};

const getIntervalInMs = (
  value,
  esValue,
  esUnit,
  timeZone
) => {
  switch (esUnit) {
    case 's':
      return 1000 * esValue;
    case 'ms':
      return 1 * esValue;
    default:
      return findIntervalFromDuration(value, esValue, esUnit, timeZone);
  }
};

/**
 * Returns the adjusted interval based on the data
 *
 * @param xValues sorted and unquie x values
 * @param esValue
 * @param esUnit
 * @param timeZone
 */
export const getAdjustedInterval = (
  xValues,
  esValue,
  esUnit,
  timeZone
) => {
  const newInterval = xValues.reduce((minInterval, currentXvalue, index) => {
    let currentDiff = minInterval;

    if (index > 0) {
      currentDiff = Math.abs(xValues[index - 1] - currentXvalue);
    }

    const singleUnitInterval = getIntervalInMs(currentXvalue, esValue, esUnit, timeZone);
    return Math.min(minInterval, singleUnitInterval, currentDiff);
  }, Number.MAX_SAFE_INTEGER);

  return newInterval > 0 ? newInterval : moment.duration(esValue, esUnit).asMilliseconds();
};

const partialDataText = 'The selected time range does not include this entire bucket. It might contain partial data.';

const Prompt = () => (
  <EuiFlexGroup
    alignItems="center"
    className="dscHistogram__header--partial"
    responsive={false}
    gutterSize="xs"
  >
    <EuiFlexItem grow={false}>
      <EuiIcon type="iInCircle" />
    </EuiFlexItem>
    <EuiFlexItem>{partialDataText}</EuiFlexItem>
  </EuiFlexGroup>
);

export const renderEndzoneTooltip = (
  xInterval,
  domainStart,
  domainEnd,
  formatter,
  renderValue = true
) => (headerData)=> {
  const headerDataValue = headerData.value;
  const formattedValue = formatter ? formatter(headerDataValue) : headerDataValue;

  if (
    (domainStart !== undefined && domainStart > headerDataValue) ||
    (domainEnd !== undefined && xInterval !== undefined  && domainEnd - xInterval < headerDataValue)
  ) {
    return (
      <>
        <Prompt />
        {renderValue && (
          <>
            <EuiSpacer size="xs" />
            <p>{formattedValue}</p>
          </>
        )}
      </>
    );
  }

  return renderValue ? formattedValue : null;
};
