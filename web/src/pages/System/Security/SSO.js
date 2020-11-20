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
        title: '名称',
        dataIndex: 'name',
        key: 'name',
    },
    {
        title: '类型',
        dataIndex: 'type',
        key: 'type',
    },
    {
        title: '启用',
        key: 'enabled',
        dataIndex: 'enabled',
        render: text => <Icon type="check-square" />,
    }, {
        title: '最后更新时间',
        key: 'modify_time',
        dataIndex: 'modify_time',
    }, {
        title: '创建时间',
        key: 'create_time',
        dataIndex: 'create_time',
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
        name: 'github',
        type: "OAuth2",
        enabled: true,
        modify_time: "Mar 01, 2020",
        create_time: "Oct 19, 2019",
    },{
        key: '2',
        name: 'okta',
        type: "OAuth2",
        enabled: true,
        modify_time: "Mar 02, 2020",
        create_time: "Oct 29, 2019",
    },
];

@connect()
class SSO extends Component {

    render() {
        return (
            <Card><Table columns={columns} dataSource={data} /></Card>
        );
    }
}

export default SSO;
