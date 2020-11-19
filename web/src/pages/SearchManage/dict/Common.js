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
} from 'antd';
import StandardTable from '@/components/StandardTable';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';

import styles from '../../List/TableList.less';

const FormItem = Form.Item;
const { TextArea } = Input;
const fieldLabels = {
keyword_type: '关键词分类'

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
    <Select labelCol={{ span: 5 }} wrapperCol={{ span: 15 }}  placeholder="请选择关键词类型">
        <Option value="keyun">敏感词</Option>
        <Option value="huoyun">提示词</Option>
        <Option value="xianlu1">同义词</Option>
        <Option value="xianlu2">过滤词</Option>
        <Option value="xianlu3">停用词</Option>
        <Option value="xianlu4">保留词</Option>
        <Option value="xianlu5">纠错词</Option>
        <Option value="xianlu6">相关搜索</Option>
        <Option value="xianlu7">热点词管理</Option>
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
            <Option value="keyun">敏感词</Option>
            <Option value="huoyun">提示词</Option>
            <Option value="xianlu">同义词</Option>
            <Option value="xianlu">过滤词</Option>
            <Option value="xianlu">停用词</Option>
            <Option value="xianlu">保留词</Option>
            <Option value="xianlu">纠错词</Option>
            <Option value="xianlu">相关搜索</Option>
            <Option value="xianlu">热点词管理</Option>
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
class Common extends PureComponent {
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
          "type" : "停用词",
          "value": "keyun"
          },
          {
          "keyword" : "桥梁施工技术规范",
          "type" : "停用词",
          "value": "keyun"
          },{
          "keyword" : "路规",
          "type" : "停用词",
          "value": "keyun"
          },{
          "keyword" : "遂规",
          "type" : "热点词",
          "value": "keyun"
          },
          {
          "keyword" : "铁路技术管理规则",
          "type" : "热点词",
          "value": "keyun"
          },{
          "keyword" : "行车组织规则",
          "type" : "热点词",
          "value": "keyun"
          },
          {
          "keyword" : "铁路交通事故调查处理规则",
          "type" : "热点词",
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
                <Option value="keyun">敏感词</Option>
                <Option value="huoyun">提示词</Option>
                <Option value="xianlu">同义词</Option>
                <Option value="xianlu">过滤词</Option>
                <Option value="xianlu">停用词</Option>
                <Option value="xianlu">保留词</Option>
                <Option value="xianlu">纠错词</Option>
                <Option value="xianlu">相关搜索</Option>
                <Option value="xianlu">热点词管理</Option>
                </Select>
            )}
        </Form.Item>
            </Col>
            <Col md={8} sm={24}>
                <FormItem label="关键词">
                {getFieldDecorator('name')(<Input placeholder="请输入关键词" />)}
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
        <div className={styles.tableList}>
        <div className={styles.tableListForm}>{this.renderForm()}</div>
            <div className={styles.tableListOperator}>
        <Button icon="plus" type="primary" onClick={() => this.handleModalVisible(true)}>
            新增关键词
            </Button>
            {selectedRows.length > 0 && (
            <span>
            <Button onClick={() => this.handleDeleteClick()}>删除</Button>
            </span>
            )}
        </div>
            <StandardTable
            selectedRows={selectedRows}
            data={data}
            columns={this.columns}
            onSelectRow={this.handleSelectRows}
            onChange={this.handleStandardTableChange}
            />
            </div>
            </Card>
            <CreateForm {...parentMethods} modalVisible={modalVisible} />
            {updateFormValues && Object.keys(updateFormValues).length ? (
                <UpdateForm
                {...updateMethods}
                updateModalVisible={updateModalVisible}
                values={updateFormValues}
                />
            ) : null}
        </Fragment>
        );
    }
}
export default Common;
