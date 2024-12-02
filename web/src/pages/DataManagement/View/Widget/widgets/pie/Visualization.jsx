import { Pie } from "@ant-design/charts";
import { useMemo, useRef } from "react";
import { DEFAULT_OPTIONS, getTooltipOption } from "..";
import { formatFloat } from "../utils";
import ContextMenu, { TYPE_DATA_DRILLING, TYPE_FIELD_FILTER } from "../../../components/ContextMenu";
import { formatMessage } from "umi/locale";
import Fork from "@/components/Icons/Fork";
import { Icon } from "antd";
import { stringify } from "qs";
import moment from "moment";

export default (props) => {

    const { record, result, options, isGroup, onReady, currentQueries = {}, handleContextMenu, isLock, onChartElementClick } = props;

    const { data, unit } = result;

    const { series = [], drilling = {}, format } = record;

    const { metric = {} } = series[0]

    const { groups = [] } = metric;

    const contextMenuRef = useRef(null)

    const formatData = useMemo(() => {
      return result?.data ? result.data.map((item, index) => ({
        ...item, value: item.value
      })) : []
    }, [result.data, format]) 

    const config = {
      ...DEFAULT_OPTIONS,
      ...options,
      ...{
        angleField: 'value',
        colorField: 'group',
        radius: 1,
        label: {
          type: 'inner',
          offset: '-30%',
          content: ({ percent }) => `${(percent * 100).toFixed(0)}%`,
          style: {
            fontSize: 14,
            textAlign: 'center',
          },
        },
        interactions: [
          {
            type: 'element-active',
          },
        ],
      },
      tooltip: getTooltipOption(record, undefined, false),
      data: formatData,
      state: {
        active: {
          style: {
            lineWidth: 0,
            cursor: !isLock && groups.length > 0 ? 'pointer' : 'default'
          },
        },
      }
    }
  
    return (
      <div style={{ width: '100%', height: '100%'}}>
        <Pie {...config} onReady={(plot) => {
          onReady(plot)
          plot.on('element:click', (e) => {
            onChartElementClick(e.data.data, (params) => {
              contextMenuRef.current?.open(params, { x: e.x, y: e.y})
            })
          });
        }}/>
        <ContextMenu ref={contextMenuRef} menu={[
          {
            type: TYPE_FIELD_FILTER,
            name: formatMessage({id: "dashboard.widget.sub.menu.field.filter"}),
            icon: <Icon type="filter" />,
            onClick: (params) => handleContextMenu(params, TYPE_FIELD_FILTER)
          },
          {
            type: TYPE_DATA_DRILLING,
            name: formatMessage({id: "dashboard.widget.sub.menu.data.drilling"}),
            icon: <Fork />,
            onClick: (params) => {
              const { filters = [] } = params;
              const urlParams = {}
              filters.forEach((item) => {
                if (!item.query?.match_phrase) return;
                const fields = Object.keys(item.query.match_phrase)
                fields.forEach((field) => {
                  urlParams[field] = item.query.match_phrase[field]
                })
              })
              handleContextMenu(urlParams, TYPE_DATA_DRILLING)
            },
            disabled: !drilling.url
          },
        ]}/>
      </div>
    )
  }