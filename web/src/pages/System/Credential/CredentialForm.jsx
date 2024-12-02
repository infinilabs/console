import { Form, Input, Select, Button, Drawer, Tag, Icon } from "antd";
import { formatMessage } from "umi/locale";
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import request from "@/utils/request";

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
];

export default Form.create()((props) => {
  const { form, record, onSubmit } = props;
  const { getFieldDecorator } = form;

  const { payload = {} } = record || {};

  const [type, setType] = useState(record?.type);
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    form.validateFields(async (err, values) => {
      if (err) return;
      onSubmit(values);
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
                {
                  required: true,
                  message: "Please inpurt username!",
                },
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
                {
                  required: record?.id ? false : true,
                  message: "Please inpurt password!",
                },
              ],
            })(
              <Input.Password
                placeholder={
                  record?.id ? "original password is not displayed" : ""
                }
              />
            )}
          </Form.Item>
        </>
      );
    }
  };

  useEffect(() => {
    setType(record?.type);
  }, [record?.type]);

  return (
    <Form {...formItemLayout} colon={false} loading={true}>
      <Form.Item
        label={formatMessage({
          id: "credential.manage.form.type",
        })}
      >
        {getFieldDecorator("type", {
          initialValue: record?.type,
          rules: [
            {
              required: true,
              message: "Please select type!",
            },
          ],
        })(
          <Select onChange={(value) => setType(value)}>
            {TYPES.map((item) => (
              <Select.Option value={item.type}>{item.name}</Select.Option>
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
            {
              required: true,
              message: "Please input name!",
            },
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
          <Button type="primary" onClick={handleSubmit}>
            {formatMessage({
              id: record ? "form.button.save" : "form.button.submit",
            })}
          </Button>
        </div>
      </Form.Item>
    </Form>
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
