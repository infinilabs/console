import React, {Component, Fragment} from 'react';
import {connect} from 'dva';
import {Card, Form, Input, Select, Button, message, Divider, Drawer, Descriptions} from 'antd';

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

        < FormItem
        label = {formatMessage({id: 'app.settings.security.auth2factor_enabled'})} >
            {getFieldDecorator('profile',
        {
            rules: [
                {
                    required: true,
                    message: formatMessage({id: 'app.settings.basic.profile-message'}, {}),
                },
            ],
        }
    )
        ( < Input   /> )
    }
    </FormItem>

        < FormItem
        label = {formatMessage({id: 'app.settings.basic.email'})} >
            {getFieldDecorator('email',
        {
            rules: [
                {
                    required: true,
                    message: formatMessage({id: 'app.settings.basic.email-message'}, {}),
                },
            ],
        }
    )
        ( < Input / >
    )
    }
    <
        /FormItem>
        < FormItem
        label = {formatMessage({id: 'app.settings.basic.nickname'})} >
            {getFieldDecorator('name',
        {
            rules: [
                {
                    required: true,
                    message: formatMessage({id: 'app.settings.basic.nickname-message'}, {}),
                },
            ],
        }
    )
        ( < Input / >
    )
    }
    <
        /FormItem>
        < FormItem
        label = {formatMessage({id: 'app.settings.basic.profile'})} >
            {getFieldDecorator('profile',
        {
            rules: [
                {
                    required: true,
                    message: formatMessage({id: 'app.settings.basic.profile-message'}, {}),
                },
            ],
        }
    )
        (
        < Input.TextArea
        placeholder = {formatMessage({id: 'app.settings.basic.profile-placeholder'})}
        rows = {4}
        />
    )
    }
    <
        /FormItem>
        < FormItem
        label = {formatMessage({id: 'app.settings.basic.country'})} >
            {getFieldDecorator('country',
        {
            rules: [
                {
                    required: true,
                    message: formatMessage({id: 'app.settings.basic.country-message'}, {}),
                },
            ],
        }
    )
        (
        < Select
        style = {
        {
            maxWidth: 220
        }
    }>
    <
        Option
        value = "China" > 中国 < /Option>
            < /Select>
    )
    }
    <
        /FormItem>

        < FormItem
        label = {formatMessage({id: 'app.settings.basic.address'})} >
            {getFieldDecorator('address',
        {
            rules: [
                {
                    required: true,
                    message: formatMessage({id: 'app.settings.basic.address-message'}, {}),
                },
            ],
        }
    )
        ( < Input / >
    )
    }
    <
        /FormItem>
        < FormItem
        label = {formatMessage({id: 'app.settings.basic.phone'})} >
            {getFieldDecorator('phone',
        {
            rules: [
                {
                    required: true,
                    message: formatMessage({id: 'app.settings.basic.phone-message'}, {}),
                },
                // { validator: validatorPhone },
            ],
        }
    )
        ( < PhoneView / >
    )
    }
    <
        /FormItem>
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
            tab2: ( < div > SSO 集成 < /div>),
        tab3: ( < div > 角色管理 < /div>),
        tab4: ( < div > 用户管理 < /div>),
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
