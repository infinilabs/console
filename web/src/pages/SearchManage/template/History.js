import React, { PureComponent } from 'react';
import { findDOMNode } from 'react-dom';
import moment from 'moment';
import { connect } from 'dva';
import {
    List,
    Card,
    Row,
    Col,
    Radio,
    Input,
    Progress,
    Button,
    Icon,
    Dropdown,
    Menu,
    Avatar,
    Modal,
    Form,
    DatePicker,
    Select,
} from 'antd';

import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import Result from '@/components/Result';

import styles from './History.less';

const FormItem = Form.Item;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const SelectOption = Select.Option;
const { Search, TextArea } = Input;

@connect(({ list, loading }) => ({
    list,
    loading: loading.models.list,
}))
@Form.create()
class History extends PureComponent {
    state = { visible: false, done: false };

    formLayout = {
        labelCol: { span: 7 },
        wrapperCol: { span: 13 },
    };

    componentDidMount() {
        const { dispatch } = this.props;
        dispatch({
            type: 'list/fetch',
            payload: {
                count: 5,
            },
        });
    }

    showModal = () => {
        this.setState({
            visible: true,
            current: undefined,
        });
    };

    showEditModal = item => {
        this.setState({
            visible: true,
            current: item,
        });
    };

    handleDone = () => {
        setTimeout(() => this.addBtn.blur(), 0);
        this.setState({
            done: false,
            visible: false,
        });
    };

    handleCancel = () => {
        setTimeout(() => this.addBtn.blur(), 0);
        this.setState({
            visible: false,
        });
    };

    handleSubmit = e => {
        e.preventDefault();
        const { dispatch, form } = this.props;
        const { current } = this.state;
        const id = current ? current.id : '';

        setTimeout(() => this.addBtn.blur(), 0);
        form.validateFields((err, fieldsValue) => {
            if (err) return;
            this.setState({
                done: true,
            });
            dispatch({
                type: 'list/submit',
                payload: { id, ...fieldsValue },
            });
        });
    };

    deleteItem = id => {
        const { dispatch } = this.props;
        dispatch({
            type: 'list/submit',
            payload: { id },
        });
    };

    render() {
        const {
            list: { list },
            loading,
        } = this.props;
        const {
            form: { getFieldDecorator },
        } = this.props;
        const { visible, done, current = {} } = this.state;

        const editAndDelete = (key, currentItem) => {
            if (key === 'edit') this.showEditModal(currentItem);
            else if (key === 'delete') {
                Modal.confirm({
                    title: '删除模板',
                    content: '确定删除该模板吗？',
                    okText: '确认',
                    cancelText: '取消',
                    onOk: () => this.deleteItem(currentItem.id),
                });
            }
        };

        const modalFooter = done
            ? { footer: null, onCancel: this.handleDone }
            : { okText: '保存', onOk: this.handleSubmit, onCancel: this.handleCancel };

        const Info = ({ title, value, bordered }) => (
            <div className={styles.headerInfo}>
    <span>{title}</span>
        <p>{value}</p>
        {bordered && <em />}
    </div>
    );

        const extraContent = (
            <div className={styles.extraContent}>
            <Search className={styles.extraContentSearch} placeholder="请输入模板内容" onSearch={() => ({})} />
        </div>
    );

        const paginationProps = {
            showSizeChanger: true,
            showQuickJumper: true,
            pageSize: 5,
            total: 50,
        };

        const ListContent = ({ data: { owner, createdAt, percent, status } }) => (
            <div className={styles.listContent}>
    <div className={styles.listContentItem}>
    <span>模板名称</span>
        <p>{owner}</p>
        </div>
        <div className={styles.listContentItem}>
    <span>创建时间</span>
        <p>{moment(createdAt).format('YYYY-MM-DD HH:mm')}</p>
        </div>
        <div className={styles.listContentItem}>
    <Progress percent={percent} status={status} strokeWidth={6} style={{ width: 180 }} />
        </div>
        </div>
    );

        const MoreBtn = props => (
            <Dropdown
        overlay={
            <Menu onClick={({ key }) => editAndDelete(key, props.current)}>
    <Menu.Item key="edit">编辑</Menu.Item>
            <Menu.Item key="delete">删除</Menu.Item>
            </Menu>
    }
    >
    <a>
        更多 <Icon type="down" />
            </a>
            </Dropdown>
    );

        const getModalContent = () => {
            if (done) {
                return (
                    <Result
                type="success"
                title="操作成功"
                description="一系列的信息描述，很短同样也可以带标点。"
                actions={
                    <Button type="primary" onClick={this.handleDone}>
                知道了
                </Button>
            }
                className={styles.formResult}
                />
            );
            }
            return (
                <Form onSubmit={this.handleSubmit}>
        <FormItem label="模板名称" {...this.formLayout}>
            {getFieldDecorator('title', {
                rules: [{ required: true, message: '请输入模板名称' }],
                initialValue: current.title,
            })(<Input placeholder="请输入" />)}
        </FormItem>
            <FormItem {...this.formLayout} label="模板内容">
                {getFieldDecorator('subDescription', {
                rules: [{ message: '请输入模板内容', min: 5 }],
                    initialValue: current.subDescription,
            })(<TextArea rows={4} placeholder="请输入模内容" />)}
        </FormItem>
            </Form>
        );
        };
        return (
            <div className={styles.standardList}>
        <Card
        className={styles.listCard}
        bordered={false}
        title="搜索模板"
        style={{ marginTop: 24 }}
        bodyStyle={{ padding: '0 32px 40px 32px' }}
        extra={extraContent}
            >
            <Button
        type="dashed"
        style={{ width: '100%', marginBottom: 8 }}
        icon="plus"
        onClick={this.showModal}
        ref={component => {
            /* eslint-disable */
            this.addBtn = findDOMNode(component);
            /* eslint-enable */
        }}
    >
        添加
        </Button>
        <List
        size="large"
        rowKey="id"
        loading={loading}
        pagination={paginationProps}
        dataSource={list}
        renderItem={item => (
        <List.Item
        actions={[
            <a
        onClick={e => {
            e.preventDefault();
            this.showEditModal(item);
        }}
    >
        编辑
        </a>,
        <MoreBtn current={item} />,
    ]}
    >
    <List.Item.Meta
        avatar={<Avatar src={item.logo} shape="square" size="large" />}
        title={<a href={item.href}>{item.title}</a>}
        description={item.subDescription}
        />
        <ListContent data={item} />
        </List.Item>
    )}
        />
        </Card>
        </div>

    );
    }
}

export default History;
