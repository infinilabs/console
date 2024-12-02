import {
  Form,
  Input,
  Switch,
  Select,
  InputNumber,
  Card,
  Button,
  Row,
  Col,
} from "antd";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import "./form.scss";
import { useCallback, useMemo } from "react";
import "@/assets/headercontent.scss";
import useFetch from "@/lib/hooks/use_fetch";

const EntryForm = (props) => {
  const editValue = props.value || { network: {}, tls: {} };
  const { getFieldDecorator } = props.form;
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      props.form.validateFields((err, values) => {
        if (err) {
          return false;
        }
        if (typeof props.onSaveClick == "function") {
          props.onSaveClick(values);
        }
      });
    },
    [props.form]
  );
  const { value: routerRes } = useFetch(
    `/gateway/router/_search`,
    { queryParams: { size: 10000 } },
    []
  );
  const routers = useMemo(() => {
    if (!routerRes) {
      return [];
    }
    return (routerRes.hits?.hits || []).map((hit) => {
      return {
        id: hit._id,
        name: hit._source.name,
      };
    });
  }, [routerRes]);

  return (
    <PageHeaderWrapper>
      <Card>
        <Form
          // onSubmit={handleSubmit}
          layout="vertical"
          style={{ marginLeft: 50 }}
        >
          <Row gutter={16}>
            <Col lg={8} md={12} sm={24}>
              <Form.Item label="Entry Name">
                {getFieldDecorator("name", {
                  initialValue: editValue.name,
                  rules: [
                    {
                      required: true,
                      message: "Please input entry name!",
                    },
                  ],
                })(<Input />)}
              </Form.Item>
            </Col>
            <Col lg={8} md={12} sm={24}>
              <Form.Item label="Router">
                {getFieldDecorator("router", {
                  initialValue: editValue.router,
                  rules: [
                    {
                      required: true,
                      message: "Please select router!",
                    },
                  ],
                })(
                  <Select
                    showSearch
                    filterOption={(input, option) =>
                      option.props.children
                        .toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {routers.map((r) => {
                      return (
                        <Select.Option key={r.id} value={r.id}>
                          {r.name}
                        </Select.Option>
                      );
                    })}
                  </Select>
                )}
              </Form.Item>
            </Col>
            <Col lg={8} md={12} sm={24}>
              <Form.Item label="Enabled">
                {getFieldDecorator("enabled", {
                  initialValue: editValue.enabled,
                  rules: [],
                  valuePropName: "checked",
                })(<Switch />)}
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col lg={8} md={12} sm={24}>
              <Form.Item label="Max Concurrency">
                {getFieldDecorator("max_concurrency", {
                  initialValue: editValue.max_concurrency,
                  rules: [],
                })(<InputNumber />)}
              </Form.Item>
            </Col>
            <Col lg={8} md={12} sm={24}>
              <Form.Item label="Read Timeout">
                {getFieldDecorator("read_timeout", {
                  initialValue: editValue.read_timeout,
                  rules: [],
                })(<InputNumber />)}
              </Form.Item>
            </Col>
            <Col lg={8} md={12} sm={24}>
              <Form.Item label="Write Timeout">
                {getFieldDecorator("write_timeout", {
                  initialValue: editValue.write_timeout,
                  rules: [],
                })(<InputNumber />)}
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col lg={8} md={12} sm={24}>
              <Form.Item label="Idle Timeout">
                {getFieldDecorator("idle_timeout", {
                  initialValue: editValue.idle_timeout,
                  rules: [],
                })(<InputNumber />)}
              </Form.Item>
            </Col>
            <Col lg={8} md={12} sm={24}>
              <Form.Item label="Read Buffer Size">
                {getFieldDecorator("read_buffer_size", {
                  initialValue: editValue.read_buffer_size,
                  rules: [],
                })(<InputNumber />)}
              </Form.Item>
            </Col>
            <Col lg={8} md={12} sm={24}>
              <Form.Item label="Write Buffer Size">
                {getFieldDecorator("write_buffer_size", {
                  initialValue: editValue.write_buffer_size,
                  rules: [],
                })(<InputNumber />)}
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col lg={8} md={12} sm={24}>
              <Form.Item label="TCP Keepalive">
                {getFieldDecorator("tcp_keepalive", {
                  initialValue: editValue.tcp_keepalive,
                  rules: [],
                  valuePropName: "checked",
                })(<Switch />)}
              </Form.Item>
            </Col>
            <Col lg={8} md={12} sm={24}>
              <Form.Item label="Tcp Keepalive In Seconds">
                {getFieldDecorator("tcp_keepalive_in_seconds", {
                  initialValue: editValue.tcp_keepalive_in_seconds,
                  rules: [],
                })(<InputNumber />)}
              </Form.Item>
            </Col>
            <Col lg={8} md={12} sm={24}>
              <Form.Item label="Max Request Body Size">
                {getFieldDecorator("max_request_body_size", {
                  initialValue: editValue.max_request_body_size,
                  rules: [],
                })(<InputNumber />)}
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Reduce Memory Usage">
            {getFieldDecorator("reduce_memory_usage", {
              initialValue: editValue.reduce_memory_usage,
              rules: [],
              valuePropName: "checked",
            })(<Switch />)}
          </Form.Item>
          <h3>Network</h3>
          <div className="field-group">
            <Row gutter={16}>
              <Col lg={8} md={12} sm={24}>
                <Form.Item label="Binding">
                  {getFieldDecorator("network.binding", {
                    initialValue: editValue.network.binding,
                    rules: [
                      {
                        required: true,
                        message: "Please input network binding address!",
                      },
                    ],
                  })(<Input />)}
                </Form.Item>
              </Col>
              <Col lg={8} md={12} sm={24}>
                <Form.Item label="Host">
                  {getFieldDecorator("network.host", {
                    initialValue: editValue.network.host,
                    rules: [],
                  })(<Input />)}
                </Form.Item>
              </Col>
              <Col lg={8} md={12} sm={24}>
                <Form.Item label="Port">
                  {getFieldDecorator("network.port", {
                    initialValue: editValue.network.port,
                    rules: [],
                  })(<InputNumber />)}
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col lg={8} md={12} sm={24}>
                <Form.Item label="Publish">
                  {getFieldDecorator("network.publish", {
                    initialValue: editValue.network.publish,
                    rules: [],
                  })(<Input />)}
                </Form.Item>
              </Col>
              <Col lg={8} md={12} sm={24}>
                <Form.Item label="Skip Occupied Port">
                  {getFieldDecorator("network.skip_occupied_port", {
                    initialValue: editValue.network.skip_occupied_port,
                    rules: [],
                    valuePropName: "checked",
                  })(<Switch />)}
                </Form.Item>
              </Col>
              <Col lg={8} md={12} sm={24}>
                <Form.Item label="Reuse Port">
                  {getFieldDecorator("network.reuse_port", {
                    initialValue: editValue.network.reuse_port,
                    rules: [],
                    valuePropName: "checked",
                  })(<Switch />)}
                </Form.Item>
              </Col>
            </Row>
          </div>
          <Form.Item label="TLS Enabled">
            {getFieldDecorator("tls.enabled", {
              initialValue: editValue.tls.enabled,
              rules: [],
              valuePropName: "checked",
            })(<Switch />)}
          </Form.Item>
        </Form>
        <Form.Item style={{ marginLeft: 50 }}>
          <Button type="primary" onClick={handleSubmit}>
            Save
          </Button>
        </Form.Item>
      </Card>
    </PageHeaderWrapper>
  );
};

export default EntryForm;
