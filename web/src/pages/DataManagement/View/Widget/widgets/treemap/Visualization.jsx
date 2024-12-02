import { Pie, Treemap } from "@ant-design/charts";
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

    const config = {
      ...DEFAULT_OPTIONS,
      colorField: 'group',
      tooltip: getTooltipOption(record, undefined, false),
      data: {
        name: 'root',
        children: data.map((item) => ({
          ...item,
          name_tmp: item.name,
          name: item.group, 
        }))
      }
    }
  
    return (
      <div style={{ width: '100%', height: '100%'}}>
        <Treemap {...config} onReady={(plot) => {
          plot.on('element:click', (e) => {
            onChartElementClick(e.data.data, (params) => {
              contextMenuRef.current?.open(params, { x: e.x, y: e.y})
            })
          });
          onReady(plot)
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