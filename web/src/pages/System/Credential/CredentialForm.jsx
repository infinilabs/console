import { Spin, Form, Input, Select, Button, Tag, Icon, Tooltip } from "antd";
import { formatMessage } from "umi/locale";
import { forwardRef, useEffect, useRef, useState } from "react";

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 4 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 18 },
  },
};

const TYPES = [
  {
    type: "basic_auth",
    name: "basic_auth",
  },
  {
    type: "token",
    name: "token",
  },
];

export default Form.create()((props) => {
  const { form, record, onSubmit, submitLoading } = props;
  const { getFieldDecorator } = form;

  const { payload = {} } = record || {};
  const isEdit = !!record?.id;

  const [type, setType] = useState(record?.type);

  const getRequiredMessage = (id, defaultMessage) =>
    formatMessage({ id, defaultMessage });

  const getRequiredRule = (id, defaultMessage) => ({
    validator: (_, value, callback) => {
      if (typeof value === "string") {
        if (value.trim() === "") {
          callback(getRequiredMessage(id, defaultMessage));
          return;
        }
      } else if (value === undefined || value === null || value === "") {
        callback(getRequiredMessage(id, defaultMessage));
        return;
      }
      callback();
    },
  });

  const handleSubmit = async () => {
    if (submitLoading) {
      return;
    }
    form.validateFields(async (err, values) => {
      if (err) return;
      await onSubmit(values);
    });
  };

  const renderAuth = (type) => {
    if (type === "basic_auth") {
      return (
        <>
          <Form.Item
            label={formatMessage({
              id: "credential.manage.form.username",
            })}
          >
            {getFieldDecorator("username", {
              initialValue: payload[type]?.username,
              rules: [
                getRequiredRule(
                  "credential.manage.form.username.required",
                  "Please input username!"
                ),
              ],
            })(<Input />)}
          </Form.Item>
          <Form.Item
            label={formatMessage({
              id: "credential.manage.form.password",
            })}
          >
            {getFieldDecorator("password", {
              initialValue: payload[type]?.password,
              rules: [
                ...(isEdit
                  ? []
                  : [
                      getRequiredRule(
                        "credential.manage.form.password.required",
                        "Please input password!"
                      ),
                    ]),
              ],
            })(
              <Input.Password
                placeholder={
                  isEdit
                    ? formatMessage({
                        id: "credential.manage.form.password.placeholder.edit",
                        defaultMessage: "Original password is not displayed",
                      })
                    : ""
                }
              />
            )}
          </Form.Item>
        </>
      );
    }
    if (type === "token") {
      return (
        <Form.Item
          label={formatMessage({
            id: "credential.manage.form.token",
          })}
        >
          {getFieldDecorator("token_value", {
            initialValue: payload[type]?.value,
            rules: [
              ...(isEdit
                ? []
                : [
                    getRequiredRule(
                      "credential.manage.form.token.required",
                      "Please input token!"
                    ),
                  ]),
            ],
          })(
            <Input.Password
              placeholder={formatMessage({
                id: record?.id
                  ? "credential.manage.form.token.placeholder.edit"
                  : "credential.manage.form.token.placeholder",
              })}
            />
          )}
        </Form.Item>
      );
    }
  };

  useEffect(() => {
    setType(record?.type);
  }, [record?.type]);

  return (
    <Spin spinning={!!submitLoading}>
      <Form {...formItemLayout} colon={false}>
        <Form.Item 
          label={formatMessage({
            id: "credential.manage.form.type",
          })}
        >
          {getFieldDecorator("type", {
            initialValue: record?.type,
            rules: [
              getRequiredRule(
                "credential.manage.form.type.required",
                "Please select type!"
              ),
            ],
          })(
            <Select
              key={`cred-${record?.type}`}
              onChange={(value) => setType(value)}
              disabled={isEdit}
            >
              {TYPES.map((item) => (
                <Select.Option key={`opt-${item.type}`} value={item.type}>{item.name}</Select.Option>
              ))}
            </Select>
          )}
        </Form.Item>
        <Form.Item
          label={formatMessage({
            id: "credential.manage.form.name",
          })}
        >
          {getFieldDecorator("name", {
            initialValue: record?.name,
            rules: [
              getRequiredRule(
                "credential.manage.form.name.required",
                "Please input name!"
              ),
            ],
          })(<Input />)}
        </Form.Item>
        {renderAuth(type)}
        <Form.Item
          label={formatMessage({
            id: "credential.manage.form.tags",
          })}
        >
          {getFieldDecorator("tags", {
            initialValue: record?.tags || [],
          })(<Tags />)}
        </Form.Item>
        <Form.Item label=" ">
          <div style={{ textAlign: "right" }}>
            <Button type="primary" onClick={handleSubmit} loading={!!submitLoading} disabled={!!submitLoading}>
              {formatMessage({
                id: record ? "form.button.save" : "form.button.submit",
              })}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Spin>
  );
});

const Tags = forwardRef((props, ref) => {
  const { value = [], onChange } = props;

  const saveInputRef = useRef(null);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleClose = (removedTag) => {
    const newTags = value.filter((tag) => tag !== removedTag);
    onChange(newTags);
  };

  const showInput = () => {
    setInputVisible(true);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleInputConfirm = () => {
    if (inputValue && value.indexOf(inputValue) === -1) {
      const newTags = [...value, inputValue];
      onChange(newTags);
      setInputVisible(false);
      setInputValue("");
    }
  };

  useEffect(() => {
    if (inputVisible) {
      saveInputRef.current?.focus();
    }
  }, [inputVisible]);

  return (
    <span ref={ref}>
      {value.map((tag) => {
        const isLongTag = tag.length > 20;
        const tagElem = (
          <Tag key={tag} closable={true} onClose={() => handleClose(tag)}>
            {isLongTag ? `${tag.slice(0, 20)}...` : tag}
          </Tag>
        );
        return isLongTag ? (
          <Tooltip title={tag} key={tag}>
            {tagElem}
          </Tooltip>
        ) : (
          tagElem
        );
      })}
      {inputVisible && (
        <Input
          ref={saveInputRef}
          type="text"
          size="small"
          style={{ width: 78 }}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputConfirm}
          onPressEnter={handleInputConfirm}
        />
      )}
      {!inputVisible && (
        <Tag
          onClick={showInput}
          style={{ background: "#fff", borderStyle: "dashed" }}
        >
          <Icon type="plus" /> Add New
        </Tag>
      )}
    </span>
  );
});
