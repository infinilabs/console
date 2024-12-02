// @ts-ignore
import React, { useState, useCallback } from "react";
import { Modal, Form, Input, Tag, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { formatMessage } from "umi/locale";

interface ITagGeneratorProps {
  value?: Array<string>;
  onChange?: (val: Array<string>) => void;
}

export const TagGenerator = ({ value = [], onChange }: ITagGeneratorProps) => {
  const [inputVisible, setInputVisible] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const showInput = () => {
    setInputVisible(true);
  };

  const handleInputConfirm = useCallback(
    (e) => {
      if (e.target.value.length == 0) {
        return message.warning(
          formatMessage({ id: "command.message.invalid.tag" })
        );
      }
      onChange([...(value || []), e.target.value]);
      setInputVisible(false);
      setInputValue("");
    },
    [value]
  );

  const handleRemove = useCallback(
    (index) => {
      const newValue = [...value];
      newValue.splice(index, 1);
      onChange(newValue);
    },
    [value]
  );

  return (
    <div>
      {value.map((tag, index) => (
        <Tag
          key={index}
          closable
          style={{ padding: "0 5px", fontSize: 14, margin: "5px 10px 5px 0" }}
          onClose={() => handleRemove(index)}
        >
          {tag}
        </Tag>
      ))}
      {inputVisible && (
        <Input
          value={inputValue}
          onChange={handleInputChange}
          style={{ width: 100 }}
          onBlur={handleInputConfirm}
          onPressEnter={handleInputConfirm}
        />
      )}
      {!inputVisible && (
        <Tag onClick={showInput} style={{ padding: "0 5px", fontSize: 14 }}>
          <PlusOutlined /> {formatMessage({ id: "command.btn.newtag" })}
        </Tag>
      )}
    </div>
  );
};

interface ICommonCommandModalProps {
  onClose: () => void;
  onConfirm: (params: Record<string, any>) => void;
  form: any;
}

const CommonCommandModal = Form.create()((props: ICommonCommandModalProps) => {
  const { form } = props;

  const handleConfirm = async () => {
    try {
      const values = await form.validateFields();
      props.onConfirm(values);
    } catch (e) {}
  };

  return (
    <Modal
      title={formatMessage({ id: "command.manage.save.title" })}
      visible={true}
      onCancel={props.onClose}
      onOk={handleConfirm}
      zIndex={1003}
      cancelText={formatMessage({ id: "form.button.cancel" })}
      okText={formatMessage({ id: "form.button.save" })}
    >
      <Form layout="vertical">
        <Form.Item label={formatMessage({ id: "command.table.field.name" })}>
          {form.getFieldDecorator("title", {
            rules: [{ required: true, message: "请输入标题" }],
          })(<Input />)}
        </Form.Item>
        <Form.Item label={formatMessage({ id: "command.table.field.tag" })}>
          {form.getFieldDecorator("tag")(<TagGenerator />)}
        </Form.Item>
      </Form>
    </Modal>
  );
});

export default CommonCommandModal;
