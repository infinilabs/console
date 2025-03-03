import moment, { Moment } from 'moment';
import React, { FC } from 'react';

import { LineAnnotation, AnnotationDomainTypes, LineAnnotationStyle } from '@elastic/charts';
import lightEuiTheme from '@elastic/eui/dist/eui_theme_light.json';
import darkEuiTheme from '@elastic/eui/dist/eui_theme_dark.json';

/**
 * Render current time line annotation on @elastic/charts `Chart`
 */
export const CurrentTime = ({ isDarkMode, domainEnd }) => {
  const lineAnnotationStyle = {
    line: {
      strokeWidth: 2,
      stroke: isDarkMode ? darkEuiTheme.euiColorDanger : lightEuiTheme.euiColorDanger,
      opacity: 0.7,
    },
  };

  // Domain end of 'now' will be milliseconds behind current time, so we extend time by 1 minute and check if
  // the annotation is within this range; if so, the line annotation uses the domainEnd as its value
  const now = moment();
  const isAnnotationAtEdge = domainEnd
    ? moment(domainEnd).add(1, 'm').isAfter(now) && now.isAfter(domainEnd)
    : false;
  const lineAnnotationData = [
    {
      dataValue: isAnnotationAtEdge ? domainEnd : now.valueOf(),
    },
  ];
  return (
    <LineAnnotation
      id="__current-time__"
      hideTooltips
      domainType={AnnotationDomainTypes.XDomain}
      dataValues={lineAnnotationData}
      style={lineAnnotationStyle}
    />
  );
};
