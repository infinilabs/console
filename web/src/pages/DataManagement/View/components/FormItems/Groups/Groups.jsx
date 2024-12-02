import {
    Form,
    InputNumber,
    Input,
    Select,
    Button,
    Divider,
    Icon,
    Row,
    Col,
    Tree,
} from "antd";
import { FunctionOutlined } from "@ant-design/icons";
import { useCallback, useMemo, useState } from "react";
import { formatMessage } from "umi/locale";
import { cloneDeep } from "lodash";
import CopyTextIcon from "../../CopyTextIcon";
import Group from "@/components/Icons/Group";
  
  const { Option } = Select;
  const InputGroup = Input.Group;
  const { TreeNode } = Tree;
  
  export default (props) => {
    const { value = [], onChange, alertObjectIndex=0 } = props;
  
    const [searchValue, setSearchValue] = useState();
  
    const handleChange = (v, n, i) => {
      const newValue = cloneDeep(value)
      newValue[ i][n] = v;
      onChange(newValue)
    }
  
    const onRemove = (index) => {
      const newValue = cloneDeep(value)
      newValue.splice(index, 1)
      onChange(newValue)
    }
  
    return (
      <div className="group-wrapper">
        {value.map((group, i) => {
          return (
            <div key={i}>
              <InputGroup compact>
                {i > 0 ? (
                  <Form.Item>
                    <span
                        style={{
                        fontSize: 18,
                        width: 30,
                        textAlign: "center",
                            marginLeft: (i - 1) * 30,
                        }}
                    >
                        <Icon style={{ fontSize: 30, position: 'relative', left: 4, top: '-14px'}} component={Group} />
                    </span>
                  </Form.Item>
                ) : null}
  
                <Form.Item>
                  <Input
                    style={{
                      width: 90,
                      textAlign: "center",
                      pointerEvents: "none",
                      backgroundColor: "#fafafa",
                      color: "rgba(0, 0, 0, 0.65)",
                    }}
                    defaultValue={"Group by"}
                    disabled
                  />
                </Form.Item>
                <Form.Item>
                  <Select
                    allowClear
                    showSearch
                    style={{ width: `calc(672px - 90px - 60px - 80px - 60px - 100px - ${i > 0 ? 30 : 0}px - ${i > 1 ? 30 * (i - 1) : 0}px - 22px)` }}
                    dropdownClassName={"dropdownStyleWidth"}
                    dropdownMatchSelectWidth={false}
                    placeholder={"everything"}
                    onSearch={(value) =>{
                      setSearchValue(value)
                      props.onSearchObjectFields({
                        keyword: value,
                        aggregatable: true,
                        es_type: "keyword",
                        state_key: `metrics_keyword_${alertObjectIndex}_${i}`,
                      })
                    }}
                    onChange={(value) => {
                      setSearchValue()
                      handleChange(value, 'field', i)
                    }}
                    value={group.field}
                    onBlur={() => {
                      if (searchValue) {
                        handleChange(searchValue, 'field', i)
                      }
                    }}
                    clearIcon={<CopyTextIcon text={group.field} />}
                  >
                    {(
                      props?.objectFields?.[
                        `metrics_keyword_${alertObjectIndex}_${i}`
                      ] || props?.objectFields?.metric_keyword_field
                    )?.map((item, i) => {
                      return (
                        <Option key={i} value={item.name}>
                          {item.label}
                        </Option>
                      );
                    })}
                  </Select>
                </Form.Item>
                <Form.Item>
                  <Input
                    style={{
                      width: 60,
                      textAlign: "center",
                      pointerEvents: "none",
                      backgroundColor: "#fafafa",
                      color: "rgba(0, 0, 0, 0.65)",
                    }}
                    defaultValue={"Limit"}
                    disabled
                  />
                </Form.Item>
                <Form.Item>
                    <InputNumber
                      style={{
                        width: 80,
                      }}
                      min={1}
                      max={1000}
                      placeholder={"limit"}
                      onChange={(value) => {
                        handleChange(value, 'limit', i)
                      }}
                      value={group.limit}
                    />
                </Form.Item>
                <Form.Item>
                  <Input
                    style={{
                      width: 60,
                      textAlign: "center",
                      pointerEvents: "none",
                      backgroundColor: "#fafafa",
                      color: "rgba(0, 0, 0, 0.65)",
                    }}
                    defaultValue={"Alias"}
                    disabled
                  />
                </Form.Item>
                <Form.Item>
                    <Input
                      style={{
                        width: 100,
                      }}
                      onChange={(e) => {
                        handleChange(e.target.value, 'name', i)
                      }}
                      value={group.name}
                    />
                </Form.Item>
  
                {value.length > 0 && (
                  <Icon
                    type="close-circle"
                    style={{ 
                      marginRight: 0, 
                      cursor: 'pointer', 
                      fontSize: 16, 
                      marginLeft: 6,
                      position: 'relative',
                      top: 11 
                    }}
                    onClick={() => {
                      onRemove(i);
                    }}
                  />
                )}
              </InputGroup>
            </div>
          );
        })}
  
        <Form.Item>
          <Button
            type="primary"
            icon="plus"
            onClick={() => {
              if (value.length >= 5) {
                return;
              }
              onChange([...value, { limit: 5 }])
            }}
            size="small"
            disabled={value.length >= 5 ? true : false}
          >
            {formatMessage({
              id: "alert.rule.form.label.alert_metric.button.add_group",
            })}
          </Button>
        </Form.Item>
      </div>
    );
  };
  