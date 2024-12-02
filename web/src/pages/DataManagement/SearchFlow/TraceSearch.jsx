import React, { useRef } from "react";
import { Input, Select, Button } from "antd";
import useFetch from "@/lib/hooks/use_fetch";
import { ESPrefix } from "@/services/common";
import { useGlobal } from "@/layouts/GlobalContext";
import { formatESSearchResult } from "@/lib/elasticsearch/util";
import { on } from "@svgdotjs/svg.js";

export default ({ onTraceIDSearch }) => {
  const { selectedCluster } = useGlobal();
  const [queryParams, setQueryParams] = React.useState({ size: 1000 });
  const { loading, error, value } = useFetch(
    `${ESPrefix}/${selectedCluster.id}/trace_template`,
    {
      queryParams: queryParams,
    },
    [selectedCluster, queryParams]
  );
  const [selectedTemplate, setSelectedTemplate] = React.useState();
  const { data: templates, total } = React.useMemo(() => {
    if (!value) {
      return { data: [], total: 0 };
    }
    const res = formatESSearchResult(value);
    return res;
  }, [value]);
  React.useEffect(() => {
    setSelectedTemplate(templates[0]?.id);
  }, [templates]);
  const onTemplateChange = (value) => {
    setSelectedTemplate(value);
  };
  const onTraceSearch = React.useCallback(
    (value) => {
      const template = templates.find((t) => t.id == selectedTemplate);
      if (!template) {
        console.warn("template is not found");
        return;
      }
      onTraceIDSearch(value, template);
    },
    [onTraceIDSearch, selectedTemplate]
  );

  return (
    <div>
      <Input.Group compact>
        <Select
          size="large"
          value={selectedTemplate}
          onChange={onTemplateChange}
          showSearch
          style={{ width: "30%" }}
        >
          {templates.map((t) => (
            <Select.Option key={t.id} value={t.id}>
              {t.name}
            </Select.Option>
          ))}
        </Select>

        <Input.Search
          size="large"
          style={{ width: "60%" }}
          placeholder="Input trace field value"
          enterButton={
            <Button icon="search" type="primary">
              搜索
            </Button>
          }
          onSearch={onTraceSearch}
        />
      </Input.Group>
      {/* <div>
        <div className="trace-setting">
          <div className="trace-col">
            <span className="label">Trace Index</span>
            <div>
              <Input
                key="trace_index"
                ref={traceIndexRef}
                placeholder=".infini_traces"
              />
            </div>
          </div>
          <div className="trace-col">
            <span className="label">Trace Field</span>
            <div>
              <Input
                key="trace_field"
                ref={traceFieldRef}
                placeholder="trace_id"
              />
            </div>
          </div>
          <div className="trace-col">
            <span className="label">Tiemstamp Field</span>
            <div>
              <Input
                key="trace_timestamp"
                ref={traceTimestampRef}
                placeholder="timestamp"
              />
            </div>
          </div>
          <div className="trace-col">
            <span className="label">Agg Field</span>
            <div>
              <Input
                key="agg_field"
                ref={traceAggFieldRef}
                placeholder="_index"
              />
            </div>
          </div>
        </div>
      </div> */}
    </div>
  );
};
