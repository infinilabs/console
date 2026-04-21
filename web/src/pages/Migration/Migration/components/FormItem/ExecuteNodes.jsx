import { Form, Select } from "antd";
import useFetch from "@/lib/hooks/use_fetch";
import { useCallback, useMemo, useState, useEffect } from "react";
import request from "@/utils/request";
import { HealthStatusCircle } from "@/components/infini/health_status_circle";

export default ({ record, form, onChange }) => {
  const { getFieldDecorator } = form;

  const onSelectedChange = (value, name) => {
    if (typeof onChange == "function") {
      onChange(value, name);
    }
  };

  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState([]);
  const [nodesDefault, setNodesDefault] = useState([]);

  const fetchNodes = async (keyword) => {
    setLoading(true);
    const res = await request(`/_platform/nodes`, {
      method: "GET",
      queryParams: { keyword },
    });
    if (res && res?.length > 0) {
      let availabeList = [];
      let unavailabeList = [];

      res.map((item) => {
        if (item.available) {
          availabeList.push(item);
        } else {
          unavailabeList.push(item);
        }
      });
      let newList = [...availabeList, ...unavailabeList];
      if (nodesDefault.length == 0) {
        setNodesDefault(newList);
      }

      setNodes(newList);
    } else {
      setNodes(nodesDefault);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNodes();
  }, []);

  const permit = record?.settings?.execution?.nodes?.permit

  return (
    <Form.Item label="Workers">
      {getFieldDecorator("settings.execution.nodes.permit", {
        initialValue: permit ? permit?.map((item) => item.id) : [],
        rules: [
          {
            required: true,
            message: "Please select execute nodes!",
          },
        ],
      })(
        <Select
          allowClear
          showSearch
          loading={loading}
          placeholder={"Type keyword to search nodes"}
          mode="multiple"
          onSearch={(value) => {
            if (value.length > 2) {
              fetchNodes(value);
            }
          }}
          onChange={(value, option) => {
            if (value) {
              onSelectedChange(value, option.map((item) => item.props.name));
            } else {
              setNodes(nodesDefault);
            }
          }}
          filterOption={false}
        >
          {(nodes || []).map((item) => (
            <Select.Option key={item.id} value={item.id} name={item.name}>
              <HealthStatusCircle
                status={item.available ? "available" : "unavailable"}
              />
              <strong style={{ padding: "0 10px" }}>{item.name}</strong>(
              {item.host})
            </Select.Option>
          ))}
        </Select>
      )}
    </Form.Item>
  );
};
