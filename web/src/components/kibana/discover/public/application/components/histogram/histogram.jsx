import moment, { unitOfTime } from 'moment-timezone';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import {
  Axis,
  Chart,
  HistogramBarSeries,
  Position,
  ScaleType,
  Settings,
  TooltipType,
  ElementClickListener,
  XYChartElementEvent,
  BrushEndListener,
  Theme,
  LIGHT_THEME,
} from '@elastic/charts';
import lightEuiTheme from '@elastic/eui/dist/eui_theme_light.json';
import darkEuiTheme from '@elastic/eui/dist/eui_theme_dark.json';
import "@elastic/charts/dist/theme_light.css";

import { Subscription, combineLatest } from 'rxjs';
import {CurrentTime} from './current_time';
import {
  Endzones,
  getAdjustedInterval,
  renderEndzoneTooltip,
} from './endzones';


function getTimezone() {
  const detectedTimezone = moment.tz.guess();
  if (detectedTimezone) return detectedTimezone;
  else return moment().format('Z');
}

export class DiscoverHistogram extends Component{
   static propTypes = {
    chartData: PropTypes.object,
    timefilterUpdateHandler: PropTypes.func,
  };

  subscription;
  state = {
    // chartsTheme: getServices().theme.chartsDefaultTheme,
    // chartsBaseTheme: getServices().theme.chartsDefaultBaseTheme,
  };

  componentDidMount() {
    // this.subscription = combineLatest([
    //   getServices().theme.chartsTheme$,
    //   getServices().theme.chartsBaseTheme$,
    // ]).subscribe(([chartsTheme, chartsBaseTheme]) =>
    //   this.setState({ chartsTheme, chartsBaseTheme })
    // );
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

   onBrushEnd = ({ x }) => {
    if (!x) {
      return;
    }
    const [from, to] = x;
    this.props.timefilterUpdateHandler({ from, to });
  };

  onElementClick = (xInterval) => ([elementData]) => {
    const startRange = (elementData)[0].x;

    const range = {
      from: startRange,
      to: startRange + xInterval,
    };

    this.props.timefilterUpdateHandler(range);
  };

  formatXValue = (val) => {
    const xAxisFormat = this.props.chartData.xAxisFormat.params?.pattern;

    return moment(val).format(xAxisFormat);
  };

  render() {
    const timeZone = getTimezone();
    const { chartData } = this.props;
    const { chartsTheme, chartsBaseTheme } = this.state;

    if (!chartData) {
      return null;
    }

    const data = chartData.values;
    const isDarkMode = false;

    /*
     * Deprecation: [interval] on [date_histogram] is deprecated, use [fixed_interval] or [calendar_interval].
     * see https://github.com/elastic/kibana/issues/27410
     * TODO: Once the Discover query has been update, we should change the below to use the new field
     */
    const { intervalESValue, intervalESUnit, interval } = chartData.ordered;
    const xInterval = interval.asMilliseconds();
    //console.log(interval,intervalESUnit,intervalESValue)
    //const xInterval = interval * 1000;

    const xValues = chartData.xAxisOrderedValues;
    const lastXValue = xValues[xValues.length - 1];

    const domain = chartData.ordered;
    const domainStart = domain.min.valueOf();
    const domainEnd = domain.max.valueOf();

    const domainMin = Math.min(data[0]?.x, domainStart);
    const domainMax = Math.max(domainEnd - xInterval, lastXValue);

    const xDomain = {
      min: domainMin,
      max: domainMax,
      minInterval: getAdjustedInterval(
        xValues,
        intervalESValue,
        intervalESUnit,
        timeZone
      ),
    };
    const tooltipProps = {
      headerFormatter: renderEndzoneTooltip(xInterval, domainStart, domainEnd, this.formatXValue),
      type: TooltipType.VerticalCursor,
    };
    // const xAxisFormatter = getServices().data.fieldFormats.deserialize(
    //   this.props.chartData.yAxisFormat
    // );
    const xAxisFormatter = {
      convert: (value)=>{
        return value;
      }
    }
    //console.log(data)

    return (
      <Chart size="100%" size={{height:200}}>
        <Settings
          xDomain={xDomain}
          onBrushEnd={this.onBrushEnd}
          onElementClick={this.onElementClick(xInterval)}
          tooltip={tooltipProps}
          theme={LIGHT_THEME}
         // baseTheme={chartsBaseTheme}
        />
        <Axis
          id="discover-histogram-left-axis"
          position={Position.Left}
          ticks={5}
          title={chartData.yAxisLabel}
          integersOnly
          tickFormat={(value) => {return xAxisFormatter.convert(value)}}
          showGridLines
        />
        <Axis
          id="discover-histogram-bottom-axis"
          position={Position.Bottom}
          title={chartData.xAxisLabel}
          tickFormat={this.formatXValue}
          ticks={10}
          //showGridLines
        />
        <CurrentTime isDarkMode={isDarkMode} domainEnd={domainEnd} />
        <Endzones
          isDarkMode={isDarkMode}
          domainStart={domainStart}
          domainEnd={domainEnd}
          interval={xDomain.minInterval}
          domainMin={xDomain.min}
          domainMax={xDomain.max}
        />
        <HistogramBarSeries
          id="discover-histogram"
          minBarHeight={2}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          data={data}
          timeZone={timeZone}
          name={chartData.yAxisLabel}
        />
        
      </Chart>
    );
  }
}
