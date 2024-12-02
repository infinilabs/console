import {
  Button,
  Drawer,
  Dropdown,
  Form,
  Icon,
  Menu,
  Select,
  Upload,
  message,
} from "antd";
import { useEffect, useState } from "react";
import request from "@/utils/request";
import { formatMessage } from "umi/locale";
import ExportAndImportDrawer from "../components/ExportAndImportDrawer";

const FORM_ITEM_LAYOUT = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 4 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 18 },
  },
};

const EXPORT_TYPES = [
  {
    type: "AlertRule",
    name: formatMessage({ id: "app.export.type.alert.rule" }),
  },
  {
    type: "AlertChannel",
    name: formatMessage({ id: "app.export.type.alert.channel" }),
  },
  {
    type: "EmailServer",
    name: formatMessage({ id: "app.export.type.email.server" }),
  },
];

export default Form.create()((props) => {
  const {
    visible = false,
    title,
    types = [],
    form,
    onSuccess,
    onClose,
  } = props;

  const { getFieldDecorator } = form;
  const [loading, setLoading] = useState(false);

  const renderLabel = (key) => {
    if (!key) return "";
    return formatMessage({ id: `app.action.${key}` });
  };

  const onExportSubmit = async (values) => {
    const { associatedTypes } = values;
    const allTypes = types.filter(
      (item) => item.isMain || associatedTypes.includes(item.type)
    );
    setLoading(true);
    const res = await request(`/data/export`, {
      method: "POST",
      body: {
        metadatas: allTypes.map((item) => {
          let newItem = { type: item.type };
          if (item.filter) {
            newItem.filter = item.filter;
          }
          return newItem;
        }),
      },
    });
    if (res && !res.error) {
      const blob = new Blob([JSON.stringify(res, undefined, 2)], {
          type: "text/json",
        }),
        a = document.createElement("a");
      a.download = `console_${title.toLowerCase()}.json`;
      a.href = window.URL.createObjectURL(blob);
      a.dataset.downloadurl = ["text/json", a.download, a.href].join(":");
      a.click();
      a.remove();
      if (onClose) onClose();
    }
    setLoading(false);
  };

  const onSubmit = (key) => {
    form.validateFields((err, values) => {
      if (err) {
        return false;
      }
      onExportSubmit(values);
    });
  };

  const renderExportBody = () => {
    const associatedTypes = types
      .filter((item) => !item.isMain)
      .map((item) => {
        const type = EXPORT_TYPES.find((et) => et.type === item.type);
        return {
          ...item,
          ...(type || {}),
        };
      });
    return (
      <>
        <Form.Item
          label={formatMessage({ id: "app.export.form.associated.data" })}
          help={formatMessage({ id: "app.export.form.associated.data.help" })}
        >
          {getFieldDecorator("associatedTypes", {
            initialValue: associatedTypes.map((item) => item.type),
          })(
            <Select mode="multiple">
              {associatedTypes.map((item) => (
                <Select.Option key={item.type} value={item.type}>
                  {item.name}
                </Select.Option>
              ))}
            </Select>
          )}
        </Form.Item>
      </>
    );
  };

  return (
    <ExportAndImportDrawer
      title={`${renderLabel("export")}${title}`}
      onClose={onClose}
      visible={visible}
      loading={loading}
      onSubmit={onSubmit}
    >
      <Form {...FORM_ITEM_LAYOUT} colon={false}>
        {renderExportBody()}
      </Form>
    </ExportAndImportDrawer>
  );
});
