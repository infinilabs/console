import { Heatmap, Pie, Treemap } from "@ant-design/charts";
import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_OPTIONS } from "..";
import { formatFloat } from "../utils";
import ContextMenu, { TYPE_DATA_DRILLING, TYPE_FIELD_FILTER } from "../../../components/ContextMenu";
import { formatMessage } from "umi/locale";
import Fork from "@/components/Icons/Fork";
import { Icon } from "antd";
import { stringify } from "qs";
import moment from "moment";
import { calculateBounds } from '@/components/vendor/data/common/query/timefilter/get_time';
import { getForceNow } from '@/components/vendor/data/public/query/timefilter/lib/get_force_now';
import { cloneDeep } from "lodash";

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default (props) => {

    const { record, result, options, isGroup, onReady, currentQueries = {}, handleContextMenu, isLock, onChartElementClick, bucketSize } = props;

    const { data, unit } = result;

    const { series = [], drilling = {}, format, color } = record;

    const { metric = {} } = series[0]

    const { groups = [] } = metric;

    const { range = {} } = currentQueries;

    const weekToMonthRef = useRef();

    const pushDataInRange = (data, range) => {
      if (!data || data.length === 0) return [];
      if (!range || !range.from || !range.to) return data
      let from;
      let to;
      const bounds = calculateBounds(range, { forceNow: getForceNow() });
      if (bounds) {
        from = bounds.min;
        to = bounds.max;
      }
      if (!from || !to) return data
      const newData = cloneDeep(data.sort((a, b) => a.timestamp - b.timestamp))
      const fromTimestamp = moment(from).valueOf();
      const toTimestamp = moment(to).valueOf();
      let start = newData[0].timestamp;
      let end = newData[newData.length - 1].timestamp;
      const number = bucketSize.match(/\d+/g); 
      const bucketSizeUnit = bucketSize.replace()
      while(start > fromTimestamp) {
        start = moment(start).subtract(number, bucketSize.replace(/\d+/g, '')).valueOf()
        newData.unshift({
          timestamp: start,
          value: 0
        })
      }
      while(end < toTimestamp) {
        end = moment(end).add(number, bucketSize.replace(/\d+/g, '')).valueOf()
        newData.push({
          timestamp: end,
          value: 0
        })
      }
      return newData;
    }

    const formatData = useMemo(() => {
      if (!data || data.length === 0) return [];
      const newData = pushDataInRange(data, range);
      const startDate = moment(newData[0].timestamp)
      let week = Math.ceil(startDate.date() / 7);
      let weekCache;
      weekToMonthRef.current = {}
      return newData.map((item, index) => {
        const date = moment(item.timestamp)
        const weekDay = date.day();
        const month = date.month();
        const day = date.date();
        if (day === 1 && index !== 0) {
          let prevIndex = index - 1;
          let count = 7;
          let lastDay = true;
          while(prevIndex >= 0 && count > 0) {
            newData[prevIndex].lastWeek = true;
            newData[prevIndex].lastDay = lastDay;
            lastDay = false;
            count--;
            prevIndex--;
          }
          if ((week - 2) % 2 === 0) {
            weekToMonthRef.current[week - 2] = month - 1
          } else {
            weekToMonthRef.current[week - 1] = month - 1
          }
        }
        if (index !== 0 && weekDay === 0) {
          week += 1;
        }
        return {
          ...item,
          date: date.format('YYYY-MM-DD'),
          month: month,
          day: weekDay,
          week: `${week}`,
        }
      })
    }, [JSON.stringify(data), JSON.stringify(format), JSON.stringify(range)])

    const config = {
      ...DEFAULT_OPTIONS,
      data: formatData,
      xField: 'week',
      yField: 'day',
      colorField: 'value',
      reflect: 'y',
      shape: 'boundary-polygon',
      meta: {
        day: {
          type: 'cat',
          values: ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'],
        },
        week: {
          type: 'cat',
        },
        commits: {
          sync: true,
        },
        date: {
          type: 'cat',
        },
      },
      yAxis: {
        grid: null,
      },
      tooltip: {
        title: 'date',
        showMarkers: false,
        formatter: (datum) => {
          return { name: 'value', value: unit ? `${datum.value}${unit}` : datum.value };
        },
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
      xAxis: {
        position: 'top',
        tickLine: null,
        line: null,
        label: {
          offset: 12,
          style: {
            fontSize: 12,
            fill: '#666',
            textBaseline: 'top',
          },
          formatter: (val) => {
            const monthIndex = weekToMonthRef.current[val];
            return MONTHS[monthIndex]
          },
        },
      },
      legend: false
    };

    if (color) {
      config.color = color
    }
  
    return (
      <div style={{ width: '100%', height: '100%'}}>
        <Heatmap {...config} onReady={(plot) => {
          onReady(plot)
        }}/>
      </div>
    )
  }