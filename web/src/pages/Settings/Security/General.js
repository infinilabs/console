import React, {Component, Fragment} from 'react';
import {connect} from 'dva';
import {Card, Form, Input, Select,Switch, Button, message, Divider, Drawer, Descriptions} from 'antd';
import { Table, Tag } from 'antd';
import { Icon } from 'antd';

const {Option} = Select;
import {formatMessage, FormattedMessage} from 'umi/locale';
import styles from './General.less';
import PhoneView from "../../Account/Settings/PhoneView";

const FormItem = Form.Item;
const {TextArea} = Input;
import {Row, Col} from 'antd';

const operationTabList = [
    {
        key: 'tab1',
        tab: '基本设置',
    },
    {
        key: 'tab2',
        tab: 'SSO 集成',
    },
    {
        key: 'tab3',
        tab: '角色管理',
    },
    {
        key: 'tab4',
        tab: '用户管理',
    },
    {
        key: 'tab5',
        tab: '证书管理',
    }
];

// @connect(({logstash,loading }) => ({
//     data: logstash.logstash,
//     loading: loading.models.logstash,
//     submitting: loading.effects['logstash/submitLogstashConfig'],
// }))

@Form.create()
class General extends Component {
    state = {
        operationkey: 'tab1',
        snapshotVisible: false,
        repVisible: false,
    };

    componentDidMount() {
        // message.loading('数据加载中..', 'initdata');
        // const { dispatch } = this.props;
        // dispatch({
        //   type: 'logstash/queryInitialLogstashConfig',
        // });
    }

    onOperationTabChange = key => {
        this.setState({operationkey: key});
    };

    ssoSettings() {
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
        return (<Table columns={columns} dataSource={data} />);
    }

    userSettings() {
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
        return (<Table columns={columns} dataSource={data} />);
    }

    generalSettings = () => {
        const {
            form: {getFieldDecorator},
        } = this.props;
        return (
            < div >
            < Row
        type = "flex"
        justify = "end" >
            < Col
        span = {16} >
            < div > < Form
        layout = "vertical"
        hideRequiredMark >


        <Form.Item label = {formatMessage({id: 'app.settings.security.auth2factor_enabled'})}>
            {getFieldDecorator('auth2factor_enabled', {
                initialValue: true,
                rules: [
                    {
                        required: true,
                        message: formatMessage({id: 'app.settings.security.auth2factor_enabled-message'}, {}),
                    },
                ],
            })(
                <Switch defaultChecked onChange={()=>{}} />
            )}
        </Form.Item>

        < FormItem
        label = {formatMessage({id: 'app.settings.security.audit_enabled'})} >
            {getFieldDecorator('audit_enabled',
        {
            rules: [
                {
                    required: true,
                    message: formatMessage({id: 'app.settings.security.audit_enabled-message'}, {}),
                },
            ],
        }
    )
            (
                <Switch defaultChecked onChange={()=>{}} />
            )
    }
    </FormItem>


        < Button
        type = "primary" >
            < FormattedMessage
        id = "app.settings.security.update"
        defaultMessage = "Update Setting"
            / >
            < /Button>
            < /Form></
        div >
        < /Col>
        < Col
        span = {8} >

            < /Col>
            < /Row>
            < /div>
    )
        ;
    };

    render() {
        const {operationkey} = this.state;
        const contentList = {
            tab1: ( < div > {this.generalSettings()} < /div>),
            tab2: ( < div > {this.ssoSettings()}< /div>),
        tab3: ( < div > 角色管理 < /div>),
        tab4: ( < div > {this.userSettings()} < /div>),
        tab5: ( < div > 证书管理 < /div>),
    }
        ;
        return (
            < Fragment >
            < Card
        className = {styles.tabsCard}
        bordered = {false}
        tabList = {operationTabList}
        onTabChange = {this.onOperationTabChange}
            >
            {contentList[operationkey]}
            < /Card>
            < /Fragment>
    )
        ;
    }
}

export default General;
