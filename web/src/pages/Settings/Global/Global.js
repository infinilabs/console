import React, {Component, Fragment} from 'react';
import {connect} from 'dva';
import {Card, Form, Input, Select, Button, message, Divider, Drawer, Descriptions} from 'antd';

const {Option} = Select;
import {formatMessage, FormattedMessage} from 'umi/locale';

const FormItem = Form.Item;
const {TextArea} = Input;
import {Row, Col} from 'antd';

const operationTabList = [
    {
        key: 'tab1',
        tab: '全局设置',
    },
];

@Form.create()
class Global extends Component {
    state = {
        operationkey: 'tab1',
    };

    componentDidMount() {
    }

    onOperationTabChange = key => {
        this.setState({operationkey: key});
    };

    globalSettings = () => {
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
        label = {formatMessage({id: 'app.settings.global.cluster_name'})} >
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
        ( < Input / >)
    }
    </FormItem>
        < Button type = "primary" >
            < FormattedMessage
        id = "app.settings.global.update"
        defaultMessage = "Update Setting" /> </Button>
            < /Form> </div>
        < /Col>
        < Col span = {8} >< /Col>
            < /Row>
            < /div>
    )
        ;
    };

    render() {
        const {operationkey} = this.state;
        const contentList = {
            tab1: ( < div > {this.globalSettings()} < /div>),
    }
        ;
        return (
            < Fragment >
            < Card
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

export default Global;
