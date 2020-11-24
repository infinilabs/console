import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import {
  Row,
  Col,
  Card,
  Form,
  Input,
  Button,
  Modal,
  message,
  Divider,
  Icon,
  DatePicker,
  TimePicker,
  Select,
  Popover,
  Avatar
} from 'antd';
import Link from 'umi/link';
import StandardTable from '@/components/StandardTable';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';

import styles from './Professional.less';

const FormItem = Form.Item;
const { TextArea } = Input;
const fieldLabels = {
    keyword_type: '词典标签'

};
const CreateForm = Form.create()(props => {
    const { modalVisible, form, handleAdd, handleModalVisible } = props;
    const okHandle = () => {
        form.validateFields((err, fieldsValue) => {
            if (err) return;
            form.resetFields();
            handleAdd(fieldsValue);
        });
    };
    return (
        <Modal
    destroyOnClose
    title="新建模板"
    visible={modalVisible}
    width={640}
    onOk={okHandle}
    onCancel={() => handleModalVisible()}>
<FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="关键词">
        {form.getFieldDecorator('name', {
            rules: [{ required: true, message: '请输入至少一个字符的名称！', min: 1 }],
        })(<Input placeholder="请输入关键词" />)}
</FormItem>
    <Form.Item labelCol={{ span: 5 }} wrapperCol={{ span: 15 }}  label='关键词分类'>
        {form.getFieldDecorator('keyword_type', {
            rules: [{ required: true, message: '请选择关键词类型' }],
        })(
        <Select placeholder="请选择关键词类型">
        <Option value="keyun">客运</Option>
        <Option value="huoyun">货运</Option>
        <Option value="xianlu">线路</Option>
        </Select>
)}
</Form.Item>
    </Modal>
);
});

const UpdateForm = Form.create()(props => {
    const { updateModalVisible, handleUpdateModalVisible, handleUpdate,values,form } = props;

    const okHandle = () => {
        form.validateFields((err, fieldsValue) => {
            if (err) return;
            form.resetFields();
            handleUpdate(fieldsValue);
        });
    };

    return (
        <Modal destroyOnClose title="新增关键词" visible={updateModalVisible} width={640} onOk={okHandle}
    onCancel={() => handleUpdateModalVisible()}>

<FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label="关键词">
        {form.getFieldDecorator('keyword', {
            initialValue: values.keyword,
            rules: [{ required: true, message: '请输入至少一个字符的名称！', min: 1 }],
        })(<Input placeholder="请输入关键词" />)}
</FormItem>

    <Form.Item labelCol={{ span: 5 }} wrapperCol={{ span: 15 }} label={fieldLabels.keyword_type}>
    {form.getFieldDecorator('keyword_type', {
        initialValue: values.value,
        rules: [{ required: true, message: '请选择关键词类型' }],
    })(
    <Select placeholder="请选择关键词类型">
        <Option value="keyun">客运</Option>
        <Option value="huoyun">货运</Option>
        <Option value="xianlu">线路</Option>
        </Select>
    )}
    </Form.Item>
    </Modal>
);
});

/* eslint react/no-multi-comp:0 */
@connect(({ pipeline, loading }) => ({
  pipeline,
  loading: loading.models.pipeline,
}))
@Form.create()
class Professional extends PureComponent {
  state = {
    modalVisible: false,
    updateModalVisible: false,
    expandForm: false,
    selectedRows: [],
    formValues: {},
    updateFormValues: {},
  };
  datasource = `
  [
    {
      "keyword" : "验收标准",
      "type" : "客运",
      "value": "keyun"
    },
    {
      "keyword" : "桥梁施工技术规范",
      "type" : "客运",
      "value": "keyun"
    },{
      "keyword" : "路规",
      "type" : "客运",
      "value": "keyun"
    },{
      "keyword" : "遂规",
      "type" : "客运",
      "value": "keyun"
    },
    {
      "keyword" : "铁路技术管理规则",
      "type" : "客运",
      "value": "keyun"
    },{
      "keyword" : "行车组织规则",
      "type" : "客运",
      "value": "keyun"
    },
    {
      "keyword" : "铁路交通事故调查处理规则",
      "type" : "客运",
      "value": "keyun"
    }]`;

  columns = [
    {
      title: '关键词名称',
      dataIndex: 'keyword',
    },
    {
      title: '关键词分类',
      dataIndex: 'type',
    },
    {
      title: '操作',
      render: (text, record) => (
        <Fragment>
          <a onClick={() => this.handleUpdateModalVisible(true, record)}>修改</a>
          <Divider type="vertical" />
          <a onClick={() => {
            this.state.selectedRows.push(record);
            this.handleDeleteClick();
          }}>删除</a>
        </Fragment>
      ),
    },
  ];

  componentDidMount() {
    const { dispatch } = this.props;
    // dispatch({
    //   type: 'pipeline/fetch',
    // });
  }

  handleStandardTableChange = (pagination, filtersArg, sorter) => {
    const { dispatch } = this.props;
    const { formValues } = this.state;

    const filters = Object.keys(filtersArg).reduce((obj, key) => {
      const newObj = { ...obj };
      newObj[key] = getValue(filtersArg[key]);
      return newObj;
    }, {});

    const params = {
      currentPage: pagination.current,
      pageSize: pagination.pageSize,
      ...formValues,
      ...filters,
    };
    if (sorter.field) {
      params.sorter = `${sorter.field}_${sorter.order}`;
    }

    dispatch({
      type: 'pipeline/fetch',
      payload: params,
    });
  };

  handleFormReset = () => {
    const { form, dispatch } = this.props;
    form.resetFields();
    this.setState({
      formValues: {},
    });
    dispatch({
      type: 'pipeline/fetch',
      payload: {},
    });
  };

  handleDeleteClick = e => {
    const { dispatch } = this.props;
    const { selectedRows } = this.state;

    if (!selectedRows) return;
        dispatch({
          type: 'pipeline/delete',
          payload: {
            key: selectedRows.map(row => row.name),
          },
          callback: () => {
            this.setState({
              selectedRows: [],
            });
          },
        });
  };

  handleSelectRows = rows => {
    this.setState({
      selectedRows: rows,
    });
  };

  handleSearch = e => {
    e.preventDefault();

    const { dispatch, form } = this.props;

    form.validateFields((err, fieldsValue) => {
      if (err) return;

      const values = {
        ...fieldsValue,
        updatedAt: fieldsValue.updatedAt && fieldsValue.updatedAt.valueOf(),
      };

      this.setState({
        formValues: values,
      });

      dispatch({
        type: 'rule/fetch',
        payload: values,
      });
    });
  };

  handleModalVisible = flag => {
    this.setState({
      modalVisible: !!flag,
    });
  };

  handleUpdateModalVisible = (flag, record) => {
    this.setState({
      updateModalVisible: !!flag,
      updateFormValues: record || {},
    });
  };

  handleAdd = fields => {
    const { dispatch } = this.props;
    dispatch({
      type: 'pipeline/add',
      payload: {
        name: fields.name,
        desc: fields.desc,
        processors: fields.processors,
      },
    });

    message.success('添加成功');
    this.handleModalVisible();
  };

  handleUpdate = fields => {
    const { dispatch } = this.props;
    dispatch({
      type: 'pipeline/update',
      payload: {
        name: fields.name,
        desc: fields.desc,
        processors: fields.processors,
      },
    });

    message.success('修改成功');
    this.handleUpdateModalVisible();
  };

  renderSimpleForm() {
    const {
      form: { getFieldDecorator },
    } = this.props;
    return (
      <Form onSubmit={this.handleSearch} layout="inline">
        <Row gutter={{ md: 8, lg: 24, xl: 48 }}>
          <Col lg={6} md={12} sm={24}>
                  <Form.Item label={fieldLabels.keyword_type}>
              {getFieldDecorator('keyword_type', {
                  rules: [{ required: true, message: '请选择关键词类型' }],
              })(
                 <Select placeholder="请选择关键词类型">
                  <Option value="keyun">客运</Option>
                  <Option value="huoyun">货运</Option>
                  <Option value="xianlu">线路</Option>
                  </Select>
              )}
          </Form.Item>
              </Col>
          <Col md={8} sm={24}>
            <FormItem label="词典名称">
              {getFieldDecorator('name')(<Input placeholder="请输入词典名称" />)}
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <span className={styles.submitButtons}>
              <Button type="primary" htmlType="submit">
                查询
              </Button>
              <Button style={{ marginLeft: 8 }} onClick={this.handleFormReset}>
                重置
              </Button>
            </span>
          </Col>
        </Row>
      </Form>
    );
  }

  renderForm() {
    return this.renderSimpleForm();
  }

  render() {
    const data = {
      list: JSON.parse(this.datasource),
      pagination: {
        pageSize: 5,
      },
    };
    const { selectedRows, modalVisible, updateModalVisible, updateFormValues } = this.state;
    const parentMethods = {
      handleAdd: this.handleAdd,
      handleModalVisible: this.handleModalVisible,
    };
    const updateMethods = {
      handleUpdateModalVisible: this.handleUpdateModalVisible,
      handleUpdate: this.handleUpdate,
    };

    return (
      <Fragment>
        <Card bordered={false}>
            <div className={styles.tableListForm}>{this.renderForm()}</div>
        </Card>
        <Card className={styles.projectList}
            style={{ marginBottom: 24 }}
            title="专业词典"
            bordered={false}
            extra={<Link to="/">全部词典</Link>}
            bodyStyle={{ padding: 0 }} >
               <Card.Grid className={styles.projectGrid} key="1">
                <Card bodyStyle={{ padding: 0 }} bordered={false}>
                    <Card.Meta
                    title={<div className={styles.cardTitle}>
                        <Avatar size="small" src="https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1606239682187&di=8dcf007d76393225eea97898cb87401e&imgtype=0&src=http%3A%2F%2Fbpic.588ku.com%2Felement_origin_min_pic%2F00%2F16%2F78%2F8756af452585a1b.jpg" />
                            <Link to="">道路词汇大全</Link>
                            </div> }
                    description="词条样例：晨明、作业段、作业标志、左开道岔、左港、遵义南、遵义北、俎上之肉、组合辙叉、阻工、走马岭、纵向间距、纵向轨枕、纵向标线、纵梁桥、纵断面高程、总监代表处、总监办、总概算汇总"/>
                    <div className={styles.projectItemContent}>
                        <span className={styles.datetime} title="2020-10-11">
                          更新时间： 2009-12-28 19:34:26
                    </span>
                </div>
    <span className={styles.submitButtons}>
<Button type="primary" htmlType="submit">
        修改
        </Button>
        <Button style={{ marginLeft: 8 }} onClick={this.handleFormReset}>
    删除
    </Button>
    </span>
            </Card>
            </Card.Grid>

    <Card.Grid className={styles.projectGrid} key="1">
        <Card bodyStyle={{ padding: 0 }} bordered={false}>
        <Card.Meta
    title={<div className={styles.cardTitle}>
<Avatar size="small" src="https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1606239682187&di=8dcf007d76393225eea97898cb87401e&imgtype=0&src=http%3A%2F%2Fbpic.588ku.com%2Felement_origin_min_pic%2F00%2F16%2F78%2F8756af452585a1b.jpg" />
        <Link to="">中国国道省道高速公路名录</Link>
        </div> }
    description="中国国道省道高速公路名录词条样例：京福高速公路、同三高速公路、青银高速公路、日东高速公路、潍莱高速公路、威乌高速公路、济青高速公路、青红高速公路、京珠高速公路、济菏高速公路、沪瑞高速公路、赣粤高速公路、连霍高速公路、丹拉高速公路"/>
        <div className={styles.projectItemContent}>
<span className={styles.datetime} title="2020-10-11">
        更新时间： 2009-12-28 19:34:26
    </span>
    </div>
    <span className={styles.submitButtons}>
<Button type="primary" htmlType="submit">
        修改
        </Button>
        <Button style={{ marginLeft: 8 }} onClick={this.handleFormReset}>
    删除
    </Button>
    </span>
    </Card>
    </Card.Grid>
    <Card.Grid className={styles.projectGrid} key="1">
        <Card bodyStyle={{ padding: 0 }} bordered={false}>
        <Card.Meta
    title={<div className={styles.cardTitle}>
<Avatar size="small" src="https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1606239682187&di=8dcf007d76393225eea97898cb87401e&imgtype=0&src=http%3A%2F%2Fbpic.588ku.com%2Felement_origin_min_pic%2F00%2F16%2F78%2F8756af452585a1b.jpg" />
        <Link to="">物流货运专业术语</Link>
        </div> }
    description="词条样例：物流、物流活动、物流作业、物流模数、物流技术、物流成本、物流管理、物流中心、物流网络、物流信息、物流企业、物流单证、物流联盟、供应物流、生产物流、销售物流、回收物流、废弃物物流、绿色物流"/>
        <div className={styles.projectItemContent}>
<span className={styles.datetime} title="2020-10-11">
        更新时间： 2009-12-28 19:34:26
    </span>
    </div>
    <span className={styles.submitButtons}>
<Button type="primary" htmlType="submit">
        修改
        </Button>
        <Button style={{ marginLeft: 8 }} onClick={this.handleFormReset}>
    删除
    </Button>
    </span>
    </Card>
    </Card.Grid>
    <Card.Grid className={styles.projectGrid} key="1">
        <Card bodyStyle={{ padding: 0 }} bordered={false}>
        <Card.Meta
    title={<div className={styles.cardTitle}>
<Avatar size="small" src="https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1606239682187&di=8dcf007d76393225eea97898cb87401e&imgtype=0&src=http%3A%2F%2Fbpic.588ku.com%2Felement_origin_min_pic%2F00%2F16%2F78%2F8756af452585a1b.jpg" />
        <Link to="">铁路词汇</Link>
        </div> }
    description="铁路词汇词条样例：铁路、铁道、铁道部、铁路局、太原铁路局、北京铁路局、车务段、机务段、工务段、供电段、电务段、列车段、车辆段、铁通、车务、机务、工务、供电、电务"/>
        <div className={styles.projectItemContent}>
            <span className={styles.datetime} title="2020-10-11">
                    更新时间： 2009-12-28 19:34:26
            </span>

    </div>
    <span className={styles.submitButtons}>
    <Button type="primary" htmlType="submit">
            修改
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={this.handleFormReset}>
        删除
        </Button>
        </span>
    </Card>
    </Card.Grid>
    <Card.Grid className={styles.projectGrid} key="1">
        <Card bodyStyle={{ padding: 0 }} bordered={false}>
        <Card.Meta
    title={<div className={styles.cardTitle}>
<Avatar size="small" src="https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1606239682187&di=8dcf007d76393225eea97898cb87401e&imgtype=0&src=http%3A%2F%2Fbpic.588ku.com%2Felement_origin_min_pic%2F00%2F16%2F78%2F8756af452585a1b.jpg" />
        <Link to="">客运专线铁路</Link>
        </div> }
    description="词条样例：验收标准、验标、桥梁施工技术规范、桥规、路规、遂规、铁路技术管理规则、行车组织规则、铁路交通事故调查处理规则、运输组织、铁路安全管理规则、铁路行车操作规则、铁路运用组织规程、区段号、司机号、总重、辆数"/>
        <div className={styles.projectItemContent}>
<span className={styles.datetime} title="2020-10-11">
        更新时间： 2009-12-28 19:34:26
    </span>
    </div>
    <span className={styles.submitButtons}>
<Button type="primary" htmlType="submit">
        修改
        </Button>
        <Button style={{ marginLeft: 8 }} onClick={this.handleFormReset}>
    删除
    </Button>
    </span>
    </Card>
    </Card.Grid>
    <Card.Grid className={styles.projectGrid} key="1">
        <Card bodyStyle={{ padding: 0 }} bordered={false}>
        <Card.Meta
    title={<div className={styles.cardTitle}>
<Avatar size="small" src="https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1606239682187&di=8dcf007d76393225eea97898cb87401e&imgtype=0&src=http%3A%2F%2Fbpic.588ku.com%2Felement_origin_min_pic%2F00%2F16%2F78%2F8756af452585a1b.jpg" />
        <Link to="">民用航空</Link>
        </div> }
    description="词条样例：晨明、作业段、作业标志、左开道岔、左港、遵义南、遵义北、俎上之肉、组合辙叉、阻工、走马岭、纵向间距、纵向轨枕、纵向标线、纵梁桥、纵断面高程、总监代表处、总监办、总概算汇总"/>
        <div className={styles.projectItemContent}>
<span className={styles.datetime} title="2020-10-11">
        更新时间： 2009-12-28 19:34:26
    </span>
    </div>
    <span className={styles.submitButtons}>
<Button type="primary" htmlType="submit">
        修改
        </Button>
        <Button style={{ marginLeft: 8 }} onClick={this.handleFormReset}>
    删除
    </Button>
    </span>
    </Card>
    </Card.Grid>
    <Card.Grid className={styles.projectGrid} key="1">
        <Card bodyStyle={{ padding: 0 }} bordered={false}>
        <Card.Meta
    title={<div className={styles.cardTitle}>
<Avatar size="small" src="https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1606239682187&di=8dcf007d76393225eea97898cb87401e&imgtype=0&src=http%3A%2F%2Fbpic.588ku.com%2Felement_origin_min_pic%2F00%2F16%2F78%2F8756af452585a1b.jpg" />
        <Link to="">物流术语</Link>
        </div> }
    description="词条样例：晨明、作业段、作业标志、左开道岔、左港、遵义南、遵义北、俎上之肉、组合辙叉、阻工、走马岭、纵向间距、纵向轨枕、纵向标线、纵梁桥、纵断面高程、总监代表处、总监办、总概算汇总"/>
        <div className={styles.projectItemContent}>
<span className={styles.datetime} title="2020-10-11">
        更新时间： 2009-12-28 19:34:26
    </span>
    </div>
    <span className={styles.submitButtons}>
<Button type="primary" htmlType="submit">
        修改
        </Button>
        <Button style={{ marginLeft: 8 }} onClick={this.handleFormReset}>
    删除
    </Button>
    </span>
    </Card>
    </Card.Grid>

    <Card.Grid className={styles.projectGrid} key="1">
        <Card bodyStyle={{ padding: 0 }} bordered={false}>
        <Card.Meta
    title={<div className={styles.cardTitle}>
<Avatar size="small" src="https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1606239682187&di=8dcf007d76393225eea97898cb87401e&imgtype=0&src=http%3A%2F%2Fbpic.588ku.com%2Felement_origin_min_pic%2F00%2F16%2F78%2F8756af452585a1b.jpg" />
        <Link to="">民航业词库</Link>
        </div> }
    description="词条样例：晨明、作业段、作业标志、左开道岔、左港、遵义南、遵义北、俎上之肉、组合辙叉、阻工、走马岭、纵向间距、纵向轨枕、纵向标线、纵梁桥、纵断面高程、总监代表处、总监办、总概算汇总"/>
        <div className={styles.projectItemContent}>
<span className={styles.datetime} title="2020-10-11">
        更新时间： 2009-12-28 19:34:26
    </span>
    </div>
    <span className={styles.submitButtons}>
<Button type="primary" htmlType="submit">
        修改
        </Button>
        <Button style={{ marginLeft: 8 }} onClick={this.handleFormReset}>
    删除
    </Button>
    </span>
    </Card>
    </Card.Grid>

    <Card.Grid className={styles.projectGrid} key="1">
        <Card bodyStyle={{ padding: 0 }} bordered={false}>
        <Card.Meta
    title={<div className={styles.cardTitle}>
<Avatar size="small" src="https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1606239682187&di=8dcf007d76393225eea97898cb87401e&imgtype=0&src=http%3A%2F%2Fbpic.588ku.com%2Felement_origin_min_pic%2F00%2F16%2F78%2F8756af452585a1b.jpg" />
        <Link to="">港口列表</Link>
        </div> }
    description="词条样例：阿比让、阿布扎比、阿德莱德、阿尔及尔、阿卡胡特拉、阿拉木图、阿里卡、阿帕帕、阿什杜德、阿什哈巴特、阿特利斯科、埃德蒙顿、安科纳、安特卫普、敖德萨、奥胡斯、奥克兰、奥兰、巴尔的摩"/>
        <div className={styles.projectItemContent}>
<span className={styles.datetime} title="2020-10-11">
        更新时间： 2009-12-28 19:34:26
    </span>
    </div>
    <span className={styles.submitButtons}>
<Button type="primary" htmlType="submit">
        修改
        </Button>
        <Button style={{ marginLeft: 8 }} onClick={this.handleFormReset}>
    删除
    </Button>
    </span>
    </Card>
    </Card.Grid>
        </Card>
      </Fragment>
    );
  }
}

export default Professional;
