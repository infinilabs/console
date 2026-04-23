import {
  Modal,
  Button,
  message,
  Drawer,
  Form,
  Input,
  Select,
  DatePicker,
  Icon,
} from "antd";
import { useState } from "react";
import request from "@/utils/request";
import { ESPrefix } from "@/services/common";
import { Editor } from "@/components/monaco-editor";

const InputGroup = Input.Group;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default Form.create({ name: "data_filter" })((props) => {
  const { clusterID, record, onChange } = props;
  const indexName = record?.source?.name;
  const indexType = record?.source?.doc_type;

  const { getFieldDecorator } = props.form;

  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 6 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 16 },
    },
  };

  const [filterVisible, setFilterVisible] = useState(false);
  const [state, setState] = React.useState({
    isAdvancedMode:
      record?.raw_filter && Object.keys(record?.raw_filter) > 0 ? true : false,
    hasError: false,
    errorMessage: "",
    field_type: "date",
    filter_mode: 0,
    field_options: [],
    rangeIndexDocs: record?.source?.docs || 0,
  });
  const [indexFields, setIndexFields] = React.useState({
    date: [],
    number: [],
  });

  const checkIndexDocs = async (values) => {
    if (!indexName) {
      return 0;
    }
    let filter = values.filter;
    if (Object.keys(filter).length == 0) {
      let initDocs = record.source.init_docs;
      setState({ ...state, rangeIndexDocs: initDocs });
      return initDocs;
    }
    if (indexType) {
      filter = {
        bool: {
          must: [
            filter,
            {
              term: {
                _type: {
                  value: indexType,
                },
              },
            },
          ],
        },
      };
    }

    const res = await request(
      `${ESPrefix}/${clusterID}/index/${indexName}/_count`,
      {
        method: "POST",
        body: { filter: filter },
      }
    );
    if (!res.error) {
      setState({ ...state, rangeIndexDocs: res.count });
      if (res.count == 0) {
        message.warning(
          `There are ${res.count} documents in the current range！Please re-edit filter`
        );
      }
      return res.count;
    } else {
      message.error(`Get index docs count failed;${res.error.reason}`);
      console.log("Get index docs count failed,", res);
      return 0;
    }
  };

  const onFieldTypeChange = (value) => {
    setState({
      ...state,
      field_type: value,
      field_options: indexFields[value],
    });
    props.form.setFieldsValue({ field_name: "" });
  };

  const formFiledToDSLFilter = (values) => {
    let obj = {};
    let raw_filter = {};
    let rangeValue = {};
    if (values.field_type == "date") {
      rangeValue[values.field_name] = {
        gte: new Date(values.range_time[0]).getTime(),
        lte: new Date(values.range_time[1]).getTime(),
      };
    } else {
      rangeValue[values.field_name] = {
        gte: values.range_number[0],
        lte: values.range_number[1],
      };
    }

    raw_filter["range"] = rangeValue;
    obj["raw_filter"] = raw_filter;
    return obj;
  };

  const checkJSONSyntax = (value) => {
    let checkObj = {};
    let raw_filter = {};
    try {
      raw_filter = JSON.parse(value);
      let raw_filter_str_new = JSON.stringify(raw_filter);
      checkObj = { hasError: false, errorMessage: "" };
    } catch (e) {
      checkObj = { hasError: true, errorMessage: e.message };
    }
    setState({ ...state, ...checkObj });
    return checkObj;
  };

  const handleCheck = () => {
    if (state.isAdvancedMode) {
      let raw_filter_str = state.editor.getValue();
      let checkObj = checkJSONSyntax(raw_filter_str);
      if (checkObj.hasError) {
        return false;
      }
      let raw_filter = JSON.parse(raw_filter_str);
      checkIndexDocs({ filter: raw_filter });
    } else {
      props.form.validateFields((err, values) => {
        if (err) {
          return false;
        }
        const newValues = formFiledToDSLFilter(values);
        checkIndexDocs({ filter: newValues.raw_filter });
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (state.isAdvancedMode) {
      let raw_filter_str = state.editor.getValue();
      let checkObj = checkJSONSyntax(raw_filter_str);
      if (checkObj.hasError) {
        return false;
      }
      let raw_filter = JSON.parse(raw_filter_str);
      onChangeSave(raw_filter);
    } else {
      props.form.validateFields((err, values) => {
        if (err) {
          return false;
        }

        const newValues = formFiledToDSLFilter(values);
        onChangeSave(newValues.raw_filter);
      });
    }
  };

  const onChangeSave = async (raw_filter) => {
    const recordNew = { ...record };
    let initDocs = record.source.init_docs;
    let range = "";
    if (Object.keys(raw_filter).length == 0) {
      recordNew.source.docs = initDocs;
    } else {
      let checkDocsResult = await checkIndexDocs({ filter: raw_filter });
      if (checkDocsResult == 0) {
        return;
      }
      if (checkDocsResult != initDocs) {
        range = "partial";
        recordNew.source.docs = checkDocsResult;
      }
    }

    onChange({
      ...recordNew,
      raw_filter: raw_filter,
      range: range,
    });

    onClose();
  };

  const onClose = () => {
    setFilterVisible(false);
  };

  const onFilterModeChange = () => {
    setState({ ...state, isAdvancedMode: !state.isAdvancedMode });
  };
  const onEditorDidMount = (editor) => {
    setState({ ...state, editor });
  };

  const fetchIndexFields = async () => {
    let queryParams = {
      pattern: indexName,
    };
    const res = await request(
      `${ESPrefix}/${clusterID}/view/_fields_for_wildcard`,
      {
        method: "GET",
        queryParams: queryParams,
      }
    );
    if (res?.fields) {
      let dateFields = [];
      let numberFields = [];
      res.fields.map((item) => {
        if (item.type == "date") {
          dateFields.push(item.name);
        } else if (item.type == "number") {
          numberFields.push(item.name);
        }
      });

      let typeFields = { date: dateFields, number: numberFields };
      setIndexFields(typeFields);
      setState({
        ...state,
        field_options: typeFields[state.field_type],
      });
    }
  };

  React.useEffect(() => {
    fetchIndexFields();
  }, [clusterID, indexName]);

  React.useMemo(() => {
    if (record?.raw_filter) {
      setState({ ...state, isAdvancedMode: true });
    }
  }, [record]);

  return (
    <>
      <a
        onClick={() => {
          setFilterVisible(true);
        }}
      >
        <Icon type="filter" theme="filled" style={{ marginLeft: 12 }} />
      </a>
      <Drawer
        title={`Data filter`}
        visible={filterVisible}
        onClose={onClose}
        width={720}
      >
        <Form {...formItemLayout} onSubmit={handleSubmit} colon={false}>
          <Form.Item label=" ">
            <div style={{ textAlign: "right" }}>
              <Button type="link" onClick={onFilterModeChange}>
                {state.isAdvancedMode ? "Normal" : "Advanced"} Mode
              </Button>
            </div>
          </Form.Item>
          {state.isAdvancedMode ? (
            <Form.Item
              label="Filter DSL:"
              className={state.hasError ? "has-error" : ""}
            >
              <div style={{ border: "1px solid rgb(232, 232, 232)" }}>
                <Editor
                  height="300px"
                  language="json"
                  theme="light"
                  value={JSON.stringify(record?.raw_filter || {}, null, 2)}
                  options={{
                    minimap: {
                      enabled: false,
                    },
                    wordBasedSuggestions: true,
                  }}
                  onMount={onEditorDidMount}
                  onChange={(value) => {
                    checkJSONSyntax(value);
                  }}
                />
              </div>
              {state.hasError ? (
                <div className="ant-form-explain">{state.errorMessage}</div>
              ) : null}
            </Form.Item>
          ) : (
            <>
              <Form.Item label="Field type">
                {getFieldDecorator("field_type", {
                  initialValue: state?.field_type || "date",
                  rules: [
                    {
                      required: true,
                      message: "Please select field type!",
                    },
                  ],
                })(
                  <Select onChange={onFieldTypeChange}>
                    {["date", "number"].map((item) => (
                      <Select.Option key={item} value={item}>
                        {item}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              </Form.Item>
              <Form.Item label="Field Name">
                {getFieldDecorator("field_name", {
                  initialValue: "",
                  rules: [
                    {
                      required: true,
                      message: "Please select field name!",
                    },
                  ],
                })(
                  <Select
                    showSearch
                    placeholder="field name"
                    filterOption={(input, option) =>
                      option.props.children
                        .toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {state.field_options.map((item) => {
                      return (
                        <Option key={item} value={item}>
                          {item}
                        </Option>
                      );
                    })}
                  </Select>
                )}
              </Form.Item>
              {state.field_type == "date" ? (
                <Form.Item label="Range value">
                  {getFieldDecorator("range_time", {
                    rules: [
                      {
                        required: true,
                        message: "Please select range time!",
                      },
                    ],
                  })(
                    <RangePicker
                      showTime
                      format="YYYY-MM-DD HH:mm:ss"
                      style={{ width: 450 }}
                      placeholder={["Start time", "End time"]}
                    />
                  )}
                </Form.Item>
              ) : (
                <Form.Item label="Range value" style={{ marginBottom: 0 }}>
                  <Form.Item
                    style={{
                      display: "inline-block",
                      width: "calc(50% - 12px)",
                    }}
                  >
                    {getFieldDecorator("range_number[0]", {
                      rules: [
                        {
                          required: true,
                          message: "Please input field value1!",
                        },
                      ],
                    })(<Input />)}
                  </Form.Item>
                  <span
                    style={{
                      display: "inline-block",
                      width: "24px",
                      textAlign: "center",
                    }}
                  >
                    -
                  </span>
                  <Form.Item
                    style={{
                      display: "inline-block",
                      width: "calc(50% - 12px)",
                    }}
                  >
                    {getFieldDecorator("range_number[1]", {
                      rules: [
                        {
                          required: true,
                          message: "Please input field value2!",
                        },
                      ],
                    })(<Input />)}
                  </Form.Item>
                </Form.Item>
              )}
            </>
          )}

          <Form.Item label=" ">
            <div
              style={{
                textAlign: "right",
              }}
            >
              <div>
                There are <strong>{state.rangeIndexDocs}</strong> documents in
                the current range
              </div>
            </div>
          </Form.Item>

          <Form.Item label=" ">
            <div style={{ textAlign: "right" }}>
              <Button onClick={handleCheck}>Check</Button>
              <Button
                style={{ marginLeft: 12 }}
                type="primary"
                htmlType="submit"
              >
                Save
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
});
