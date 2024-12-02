import WidgetLine from './line';
import WidgetColumn from './column';
import WidgetArea from './area';
import WidgetPie from './pie';
import WidgetBar from './bar';
import WidgetNumber from './number';
import WidgetTable from './table';
import WidgetAggTable from './agg-table';
import WidgetIframe from './iframe';
import WidgetTreemap from './treemap';
import WidgetCalendarHeatmap from './calendar-heatmap';
import WidgetDateHistogram from './date-histogram';
import WidgetDateBar from './date-bar';
import WidgetDateAggTable from './date-agg-table';
import moment from 'moment';
import { formatFloat, formatTime, UNIT_BYTES } from './utils';
import { DataView } from '@antv/data-set';
import numeral, { isNumeral } from "numeral";

const WIDGETS = [
  WidgetLine,
  WidgetArea,
  WidgetColumn,
  WidgetDateHistogram,
  WidgetBar,
  WidgetDateBar,
  WidgetPie,
  WidgetNumber,
  WidgetTable,
  WidgetAggTable,
  WidgetDateAggTable,
  WidgetTreemap,
  WidgetCalendarHeatmap,
  WidgetIframe,
]

export { WIDGETS };

export const DEFAULT_OPTIONS = {
  autoFit: true,
  padding: 'auto',
  smooth: false,
  animation: false,
  legend: {
    label: {
      style: {
        fill: '#343741',
        fontSize: 12
      }
    },
    position: 'top'
  }
}

export const getXYOptions = (result, record, params) => {

  const { isGroup, bucketSize, xyReverse, isTimeSeries, legend } = params

  const { series = [], format } = record;

  const xOptions = getXOptions(record, result, params);
  const yOptions = getYOptions(record, result)

  const options = {
    ...DEFAULT_OPTIONS,
    ...xOptions,
    ...yOptions,
    tooltip: getTooltipOption(record, bucketSize),
    data: result.data,
  }
  
  if (isTimeSeries) {
    options.seriesField = 'name'
    if (!isGroup && series.length === 1) {
      options.legend = false
    }
  } else {
    if (isGroup) {
      options.seriesField = 'name'
    }
    if (series.length === 1) {
      options.legend = false
    }
  }

  if (xyReverse) {
    options.xField = yOptions.yField;
    options.xAxis = yOptions.yAxis;
    options.yField = xOptions.xField
    options.yAxis = xOptions.xAxis;
  }

  if (legend === false) {
    options.legend = false
  }

  return options
}

export const getXOptions = (record, result, params) => {

  const { size } = record;

  const { data } = result;

  const { isGroup, bucketSize = '', isTimeSeries } = params

  const options = {
    xField: isTimeSeries ? 'timestamp' : 'group',
    xAxis: {
      label: {
        autoHide: true,
        formatter: (value) => {
          if (!isTimeSeries) {
            if (!value) return value;
            if (value.length > 20) {
              return `...${value.substr(value.length-20)}`
            }
            return value;
          } else {
            const timeFormatters = {
              'ms': 'HH:mm:ss.SSS',
              's': 'HH:mm:ss',
              'm': 'HH:mm',
              'h': 'HH:mm',
              'd': 'YYYY-MM-DD'
            }
            return formatTime(value, timeFormatters[bucketSize.replace(/\d+/g, '')]);
          }
        },
      },
    },
  }

  const dv = new DataView().source(data);
  let length = dv.rows.length;
  if (isGroup) {
    dv.transform({
      type: 'partition',
      groupBy: ['group'], 
    });
    length = Math.max(...Object.keys(dv.rows).map((key) => dv.rows[key].length))
  }

  if (length > 25) {
    options.xAxis.tickInterval = 3
  }

  return options
}

export const getYOptions = (record, result) => {
  const { format, is_percent } = record;
  const yAxis = {
    autoHide: true,
    autoRotate: false,
    label: {
      formatter: (value) => formatValueByConfig(value, format, is_percent),
    }
  }
  return {
    yField: 'value',
    yAxis,
  }
}

export const getTooltipOption = (record, bucketSize = '', showTitle = true) => {
  const { format, is_percent } = record || {};
  return {
    customContent: (title, items) => {
      const timeFormatters = {
        'ms': 'YYYY-MM-DD HH:mm:ss.SSS',
        's': 'YYYY-MM-DD HH:mm:ss',
        'm': 'YYYY-MM-DD HH:mm',
        'h': 'YYYY-MM-DD HH:mm',
        'd': 'YYYY-MM-DD'
      }
      return (
        <div style={{ padding: 4 }}>
          {
            showTitle && (
              <h5 style={{ marginTop: 12 }}>
                { Number.isInteger(Number(title)) ? formatTime(title, timeFormatters[bucketSize.replace(/\d+/g, '')]) : title}
              </h5>
            )
          }
          <ul style={{ paddingLeft: 0 }}>
            {items?.map((item, index) => {
              const { name, value, color } = item;
              const newValue = formatValueByConfig(value, format, is_percent)

              return (
                <li
                  key={index}
                  className="g2-tooltip-list-item"
                  data-index={index}
                  style={{ marginBottom: 4, display: 'flex', alignItems: 'center' }}
                >
                  <span className="g2-tooltip-marker" style={{ backgroundColor: color }}></span>
                  <span
                    style={{ display: 'inline-flex', flex: 1, justifyContent: 'space-between' }}
                  >
                    <span style={{ marginRight: 16 }}>{name}</span>
                    <span className="g2-tooltip-list-item-value">
                      {newValue}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      );
    },
  }
}

export const formatValueByConfig = (value, format, is_percent) => {
  if (is_percent) return value;
  if (!format || !format.type || format.type === 'default') return value;
  const { type, pattern, input, output, places, unit } = format;
  if (type !== 'duration') {
    if (pattern) {
      const absValue = Math.abs(value)
      let newValue = numeral( type === 'percent' ? absValue/100 : absValue).format(pattern)
      const number = newValue.match(/\d+(\.\d+)?/g);
      let newNumber = number;
      if (`${number}`.indexOf(".") !== -1) {
        newNumber = parseFloat(`${number}`)
      } 
      newValue = `${newValue}`.replace(number, newNumber);
      return value >= 0 ? newValue : `-${newValue}`
    } else {
      return value;
    }
  } else {
    let newValue = value;
    if (!input || input === output) {
      newValue = value
    } else {
      if (output) {
        const time = moment.duration(value, input);
        const func = `as${output.slice(0,1).toUpperCase() + output.slice(1)}`
        newValue = time[func] ? time[func]() : value;
      }
    }
    newValue = Number.isInteger(places) ? formatFloat(newValue, places) : newValue
    return unit ? `${newValue} ${unit}` : newValue;
  }
}