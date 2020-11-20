import router from 'umi/router';
import { connect } from 'dva';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';

import React, {Component, Fragment} from 'react';

import {Col, Divider,Card, Form, Icon, Input, Row, Select, Table} from 'antd';
import {formatMessage} from 'umi/locale';

const {Option} = Select;

const FormItem = Form.Item;
const {TextArea} = Input;

const columns = [
    {
        title: 'ID',
        dataIndex: 'key',
        key: 'key',
        render: text => <a>{text}</a>,
    },
    {
        title: '用户名',
        dataIndex: 'username',
        key: 'username',
    },
    {
        title: '消息日志',
        dataIndex: 'message',
        key: 'message',
    }, {
        title: '时间',
        key: 'time',
        dataIndex: 'time',
    },
    {
        title: '操作',
        key: 'action',
        render: (text, record) => (
            <span>
                        <a>详情</a>
                    </span>
        ),
    },
];

const data = [
    {
        key: '1',
        username: 'admin',
        enabled: true,
        message: "User Login Success",
        time: "Oct 19, 2019",

    }, {
        key: '2',
        username: 'user',
        enabled: true,
        message: "User Login Failed",
        time: "Oct 19, 2019",
    },
];

@connect()
class Audit extends Component {

    render() {
        return (
            <Card><Table columns={columns} dataSource={data} /></Card>
        );
    }
}

export default Audit;
