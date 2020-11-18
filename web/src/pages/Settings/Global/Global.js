import React, {Component, Fragment} from 'react';
import {connect} from 'dva';
import {Card, Form, Input,Switch, Select, Button, message, Divider, Drawer, Descriptions} from 'antd';

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
            label = {formatMessage({id: 'app.settings.global.site_name'})} >
            {getFieldDecorator('site_name',
                {
                    rules: [
                        {
                            required: true,
                            message: formatMessage({id: 'app.settings.global.site_name-message'}, {}),
                        },
                    ],
                }
            )
            ( < Input / >)
            }
        </FormItem>

        < FormItem
        label = {formatMessage({id: 'app.settings.global.domain'})} >
            {getFieldDecorator('domain',
            {
                rules: [
                    {
                        required: true,
                        message: formatMessage({id: 'app.settings.global.domain-message'}, {}),
                    },
                ],
            }
        )
            ( < Input / >)
        }
        </FormItem>
                < FormItem
                label = {formatMessage({id: 'app.settings.global.listen_addr'})} >
                {getFieldDecorator('listen_addr',
                {
                rules: [
                {
                required: true,
                message: formatMessage({id: 'app.settings.global.listen_addr-message'}, {}),
                },
                ],
                }
                )
                ( < Input / >)
                }
        </FormItem>
                <Form.Item label = {formatMessage({id: 'app.settings.global.is_tls'})}>
                {getFieldDecorator('isTLS', {
                initialValue: true,
                rules: [
                {
                required: true,
                message: formatMessage({id: 'app.settings.global.is_tls-message'}, {}),
                },
                ],
                })(
                <Switch defaultChecked onChange={()=>{}} />
                )}
                </Form.Item>


        < FormItem
        label = {formatMessage({id: 'app.settings.global.data_path'})} >
        {getFieldDecorator('work_dir',
        {
        rules: [
        {
        required: true,
        message: formatMessage({id: 'app.settings.global.data_path-message'}, {}),
        },
        ],
        }
        )
        ( < Input / >)
        }
        </FormItem>

        < FormItem
        label = {formatMessage({id: 'app.settings.global.log_path'})} >
        {getFieldDecorator('work_dir',
        {
        rules: [
        {
        required: true,
        message: formatMessage({id: 'app.settings.global.log_path-message'}, {}),
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
