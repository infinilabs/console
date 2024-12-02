import { Column } from "@ant-design/charts";
import { getXYOptions } from "..";
import { useEffect, useRef, useState } from "react";
import { BRUSH_NAME, getHighlightAnnotations, registerRangeBrush } from "../G2Interaction";
import ContextMenu, { TYPE_DATA_DRILLING, TYPE_FIELD_FILTER, TYPE_HIGHLIGHT_MARK, TYPE_RANGE_FILTER } from "../../../components/ContextMenu";
import { formatMessage } from "umi/locale";
import Mark from "@/components/Icons/Mark";
import SelectAndZoom from "@/components/Icons/SelectAndZoom";
import Fork from "@/components/Icons/Fork";
import moment from "moment";
import { Icon } from "antd";

export default (props) => {

    const { record, result, options, isGroup, isLock, onReady, bucketSize, isTimeSeries, highlightRange, currentQueries = {}, handleContextMenu, onChartElementClick } = props;

    const { id, is_stack, is_percent, drilling = {}, series, legend } = record;

    const { metric = {} } = series[0]

    const { groups = [] } = metric;

    const { range } = currentQueries;

    const brushMenuRef = useRef(null)

    const clickMenuRef = useRef(null)

    const [refresh, setRefresh] = useState((new Date()).valueOf())

    const onRefresh = () => {
      setRefresh((new Date().valueOf()))
    }

    useEffect(() => {
      if (id) {
        registerRangeBrush(id, {
          onStart: () => {
            brushMenuRef.current.close()
          },
          onEnd: (params, position) => {
            brushMenuRef.current?.open({
              ...currentQueries,
              range: {
                ...(currentQueries.range || {}),
                ...(params.range || {})
              }
            }, position)
          },
        })
      }
    }, [id])

    const config = {
      ...getXYOptions(result, record, { isGroup, bucketSize, isTimeSeries, legend }),
      maxColumnWidth: 40,
      isGroup: true,
      isStack: false,
      isPercent: false,
      interactions: [
        {
          type: 'active-region', 
          cfg: {
              start: [{ trigger: 'plot:mousemove', action: 'active-region:show' }],
          }
        },
        { 
          type: `${BRUSH_NAME}-${id}`, 
          enable: !isLock && isTimeSeries && result.data.length > 0 
        },
      ],
      columnStyle: {
        cursor: !isLock && groups.length > 0 ? 'pointer' : 'default'
      },
      annotations: getHighlightAnnotations(highlightRange, result.data)
    }
    
    if (is_stack) {
      config.isStack = true;
      config.isGroup = false;
      if (is_percent) {
        config.isPercent = true;
        config.yAxis.label.formatter = (value) => `${value * 100}%`
      }
    }

    const dataDrillingMenuItem = {
      type: TYPE_DATA_DRILLING,
      name: formatMessage({id: "dashboard.widget.sub.menu.data.drilling"}),
      icon: <Fork />,
      onClick: (params) => {
        const { range = {}, filters = [] } = params;
        const urlParams = {}
        filters.forEach((item) => {
          if (!item.query?.match_phrase) return;
          const fields = Object.keys(item.query.match_phrase)
          fields.forEach((field) => {
            urlParams[field] = item.query.match_phrase[field]
          })
        })
        if (range.from && range.to) {
          urlParams.from = moment(range.from).toISOString()
          urlParams.to = moment(range.to).toISOString()
        }
        handleContextMenu(urlParams, TYPE_DATA_DRILLING)
      },
      disabled: !drilling.url
    }

    return (
      <div key={refresh} style={{ width: '100%', height: '100%'}}>
        <Column {...config} onReady={(plot) => {
          onReady(plot)
          plot.on('element:click', (e) => {
            onChartElementClick(e.data.data, (params) => {
              clickMenuRef.current?.open(params, { x: e.x, y: e.y})
            })
          });
        }}/>
        <ContextMenu ref={brushMenuRef} menu={[
          {
            type: TYPE_HIGHLIGHT_MARK,
            name: formatMessage({id: "dashboard.widget.sub.menu.highlight.mark"}),
            icon: <Mark />,
            onClick: (params) => handleContextMenu(params, TYPE_HIGHLIGHT_MARK),
          },
          {
            type: TYPE_RANGE_FILTER,
            name: formatMessage({id: "dashboard.widget.sub.menu.range.filter"}),
            icon: <SelectAndZoom />,
            onClick: (params) => handleContextMenu(params, TYPE_RANGE_FILTER),
          },
          dataDrillingMenuItem
        ]} onClose={onRefresh}/>
        <ContextMenu ref={clickMenuRef} menu={[
          {
            type: TYPE_FIELD_FILTER,
            name: formatMessage({id: "dashboard.widget.sub.menu.field.filter"}),
            icon: <Icon type="filter" />,
            onClick: (params) => handleContextMenu(params, TYPE_FIELD_FILTER),
          },
          dataDrillingMenuItem,
        ]} onClose={onRefresh}/>
      </div>
    )
}