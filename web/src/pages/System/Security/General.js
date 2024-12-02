import {formatMessage, FormattedMessage} from 'umi/locale';

import React, {Component, Fragment} from 'react';
import {connect} from 'dva';
import {Card, Form, Input, Select,Switch, Button,Row, message,Col, Divider, Drawer, Descriptions} from 'antd';
import { Table, Tag } from 'antd';
import { Icon } from 'antd';

import router from 'umi/router';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import styles from './General.less';


const {Option} = Select;

const FormItem = Form.Item;
const {TextArea} = Input;

@connect()
class General extends Component {

    render() {
        const {
            form: {getFieldDecorator},
        } = this.props;

        return (
            <Card>
                <div>
                <Row
                    type = "flex"
                    justify = "end" >
                    <Col
                        span = {16} >
                        <div>
                            <Form layout = "vertical"
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

                                <FormItem label = {formatMessage({id: 'app.settings.security.audit_enabled'})} >
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


                                <Button
                                    type = "primary" >
                                    <FormattedMessage
                                        id = "app.settings.security.update"
                                        defaultMessage = "Update Setting" />
                                </Button>
                            </Form>
                        </div>
                    </Col>
                    <Col span = {8} ></Col>
                </Row>
            </div></Card>
        );
    }
}

export default Form.create()(General);
