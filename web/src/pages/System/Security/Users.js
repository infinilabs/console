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
        dataIndex: 'user_name',
        key: 'user_name',
    },
    {
        title: '电子邮件地址',
        dataIndex: 'email',
        key: 'email',
    },
    {
        title: '已激活',
        key: 'enabled',
        dataIndex: 'enabled',
        render: text => <Icon type="check-square" />,
    }, {
        title: '管理员',
        key: 'is_admin',
        dataIndex: 'is_admin',
        render: (text, record) => {
            if (record.is_admin){
                return <Icon type="check-square" />
            }else{
                return <Icon type="border" />
            }
        },
    }, {
        title: '创建时间',
        key: 'create_time',
        dataIndex: 'create_time',
    },{
        title: '上次登录',
        key: 'last_login_time',
        dataIndex: 'last_login_time',
    },
    {
        title: '操作',
        key: 'action',
        render: (text, record) => (
            <span>
        <a>修改</a>
        <Divider type="vertical" />
        <a>删除</a>
      </span>
        ),
    },
];

const data = [
    {
        key: '1',
        user_name: 'admin',
        email: "admin@infini.ltd",
        enabled: true,
        is_admin: true,
        create_time: "Oct 19, 2019",
        last_login_time: "Mar 01, 2020",

    }, {
        key: '2',
        user_name: 'user',
        email: "user@infini.ltd",
        enabled: true,
        is_admin: false,
        create_time: "Oct 19, 2019",
        last_login_time: "Mar 01, 2020",

    },
];

@connect()
class Users extends Component {

    render() {
        return (
            <Card><Table columns={columns} dataSource={data} /></Card>
        );
    }
}

export default Users;
