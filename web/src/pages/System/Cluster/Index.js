import React from "react";
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Row,
  Table,
  Switch,
  Icon,
  Popconfirm,
  message,
} from "antd";
import Link from "umi/link";
import { connect } from "dva";
import { HealthStatusCircle } from "@/components/infini/health_status_circle";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import styles from "./step.less";
import clusterBg from "@/assets/cluster_bg.png";
import { formatMessage } from "umi/locale";

const content = (
  <div className={styles.pageHeaderContent}>
    <p>
      {formatMessage({
        id: "cluster.manage.description",
      })}
    </p>
  </div>
);

const extraContent = (
  <div className={styles.extraImg}>
    <img src={clusterBg} />
  </div>
);

@Form.create()
@connect(({ clusterConfig, global }) => ({
  clusterConfig,
  clusterStatus: global.clusterStatus,
}))
class Index extends React.Component {
  columns = [
    {
      title: formatMessage({
        id: "cluster.manage.table.column.name",
      }),
      dataIndex: "name",
      key: "name",
    },
    {
      title: formatMessage({
        id: "cluster.manage.table.column.health",
      }),
      dataIndex: "id",
      key: "health_status",
      render: (val) => {
        const { clusterStatus } = this.props;
        if (!clusterStatus || !clusterStatus[val]) {
          return;
        }
        const isAvailable = clusterStatus[val].available;
        if (!isAvailable) {
          return (
            <Icon
              type="close-circle"
              style={{
                width: 14,
                height: 14,
                color: "red",
                borderRadius: 14,
                boxShadow: "0px 0px 5px #555",
              }}
            />
          );
        }
        const status = clusterStatus[val].health?.status;
        return <HealthStatusCircle status={status} />;
      },
    },
    // {
    //   title: "所属业务",
    //   dataIndex: "business",
    //   key: "business",
    //   render: () => {
    //     return "eu-de-1";
    //   },
    // },
    // {
    //   title: "所属部门",
    //   dataIndex: "business_department",
    //   key: "business_department",
    //   render: () => {
    //     return "部门X";
    //   },
    // },
    // {
    //   title: "部署环境",
    //   dataIndex: "deploy_env",
    //   key: "deploy_env",
    //   render: () => {
    //     return "PROD";
    //   },
    // },
    {
      title: formatMessage({
        id: "cluster.manage.table.column.version",
      }),
      dataIndex: "version",
      key: "elasticsearch_version",
      // render: (data)=>{
      //   return
      // }
    },
    {
      title: formatMessage({
        id: "cluster.manage.table.column.node_count",
      }),
      dataIndex: "id",
      key: "number_of_nodes",
      render: (val) => {
        const { clusterStatus } = this.props;
        if (!clusterStatus || !clusterStatus[val]) {
          return;
        }
        return clusterStatus[val].health?.number_of_nodes;
      },
    },
    {
      title: formatMessage({
        id: "cluster.manage.table.column.endpoint",
      }),
      dataIndex: "host",
      key: "host",
    },
    {
      title: formatMessage({
        id: "cluster.manage.table.column.monitored",
      }),
      dataIndex: "monitored",
      key: "monitored",
      render: (val) => {
        return formatMessage({
          id: val
            ? "cluster.manage.monitored.on"
            : "cluster.manage.monitored.off",
        });
      },
    },
    // {
    //   title: '是否需要身份验证',
    //   dataIndex: 'basic_auth',
    //   key: 'username',
    //   render: (val) => {
    //     //console.log(val)
    //     return (val && typeof val.username !=='undefined' && val.username !== '')? '是': '否';
    //   }
    // },
    // {
    //   title: '描述',
    //   dataIndex: 'description',
    //   key: 'description',
    // },{
    //   title: '是否启用',
    //   dataIndex: 'enabled',
    //   key: 'enabled',
    //   render: (val) =>{
    //     return val === true ? '是': '否';
    //   }
    // },
    {
      title: formatMessage({
        id: "cluster.manage.table.column.operation",
      }),
      render: (text, record) => (
        <div>
          <Link
            to="/system/cluster/edit"
            onClick={() => {
              this.handleEditClick(record);
            }}
          >
            {formatMessage({
              id: "form.button.edit",
            })}
          </Link>
          <span>
            <Divider type="vertical" />
            <Popconfirm
              title="Sure to delete?"
              onConfirm={() => this.handleDeleteClick(record)}
            >
              <a key="delete">
                {" "}
                {formatMessage({
                  id: "form.button.delete",
                })}
              </a>
            </Popconfirm>
          </span>
        </div>
      ),
    },
  ];

  fetchData = (params) => {
    const { dispatch } = this.props;
    dispatch({
      type: "clusterConfig/fetchClusterList",
      payload: params,
    });
  };
  componentDidMount() {
    const { pageSize } = this.props.clusterConfig;
    this.fetchData({
      size: pageSize,
    });
  }

  handleSearchClick = () => {
    const { form } = this.props;
    this.fetchData({
      name: form.getFieldValue("name"),
      current: 1,
    });
  };

  handleDeleteClick = (record) => {
    const { dispatch } = this.props;
    return dispatch({
      type: "clusterConfig/deleteCluster",
      payload: {
        id: record.id,
      },
    }).then((result) => {
      if (result) {
        message.success("删除成功");
      }
    });
  };

  saveData = (payload) => {
    const { dispatch } = this.props;
    return dispatch({
      type: "clusterConfig/saveData",
      payload: {
        ...payload,
      },
    });
  };
  handleNewClick = () => {
    this.saveData({
      editMode: "NEW",
      editValue: { basic_auth: {} },
    });
  };
  handleEditClick = (record) => {
    this.saveData({
      editMode: "UPDATE",
      editValue: record,
    });
  };

  handleEnabledChange = (enabled) => {
    const { form } = this.props;
    this.fetchData({
      name: form.getFieldValue("name"),
      enabled: enabled,
    });
  };

  handleTableChange = (pagination, filters, sorter, extra) => {
    const { form } = this.props;
    const { pageSize, current } = pagination;
    this.fetchData({
      from: (current - 1) * pageSize,
      size: pageSize,
      name: form.getFieldValue("name"),
      current,
    });
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: { span: 10 },
      wrapperCol: { span: 14 },
      style: { marginBottom: 0 },
    };
    const { total, data, pageSize, current } = this.props.clusterConfig;
    return (
      <PageHeaderWrapper
        title={formatMessage({ id: "cluster.manage.title" })}
        content={content}
        extraContent={extraContent}
      >
        <Card>
          <div
            style={{
              display: "flex",
              marginBottom: 10,
              flex: "1 1 auto",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <Form>
                <Row gutter={{ md: 24, sm: 16 }}>
                  <Col md={16} sm={20}>
                    <Form.Item
                      {...formItemLayout}
                      label={formatMessage({
                        id: "cluster.manage.label.cluster_name",
                      })}
                    >
                      {getFieldDecorator("name")(
                        <Input placeholder="please input cluster name" />
                      )}
                    </Form.Item>
                  </Col>
                  <Col md={8} sm={16}>
                    <div style={{ paddingTop: 4 }}>
                      <Button
                        type="primary"
                        icon="search"
                        onClick={this.handleSearchClick}
                      >
                        {formatMessage({ id: "form.button.search" })}
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Form>
            </div>
            <div>
              {/* <span style={{marginRight:24}}><Switch
                  checkedChildren={<Icon type="check" />}
                  unCheckedChildren={<Icon type="close" />}
                  onChange={this.handleEnabledChange}
                  defaultChecked
                />是否启用</span> */}
              <Link to="/system/cluster/regist" onClick={this.handleNewClick}>
                {" "}
                <Button type="primary" icon="plus">
                  {formatMessage({
                    id: "cluster.manage.btn.regist",
                  })}
                </Button>
              </Link>
            </div>
          </div>
          <Table
            bordered
            columns={this.columns}
            dataSource={data}
            onChange={this.handleTableChange}
            rowKey="id"
            pagination={{
              pageSize: pageSize,
              total: total?.value || total,
              current: current,
            }}
          />
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default Index;
