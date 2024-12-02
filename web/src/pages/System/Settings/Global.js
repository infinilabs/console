import React, {Component, Fragment} from 'react';
import {Button, Card, Col, Form, Input, Row, Select, Switch} from 'antd';
import {formatMessage, FormattedMessage} from 'umi/locale';

const {Option} = Select;

const FormItem = Form.Item;
const {TextArea} = Input;

@Form.create()
class Global extends Component {

    componentDidMount() {
    }

    render() {
        const {
            form: {getFieldDecorator},
        } = this.props;
        return (
            <Card>
                <Row
                    type="flex"
                    justify="end">
                    <Col
                        span={16}>
                        <div><Form
                            layout="vertical"
                            hideRequiredMark>

                            <FormItem
                                label={formatMessage({id: 'app.settings.global.site_name'})}>
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
                                (<Input/>)
                                }
                            </FormItem>

                            <FormItem
                                label={formatMessage({id: 'app.settings.global.domain'})}>
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
                                (<Input/>)
                                }
                            </FormItem>
                            <FormItem
                                label={formatMessage({id: 'app.settings.global.listen_addr'})}>
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
                                (<Input/>)
                                }
                            </FormItem>
                            <Form.Item label={formatMessage({id: 'app.settings.global.is_tls'})}>
                                {getFieldDecorator('isTLS', {
                                    initialValue: true,
                                    rules: [
                                        {
                                            required: true,
                                            message: formatMessage({id: 'app.settings.global.is_tls-message'}, {}),
                                        },
                                    ],
                                })(
                                    <Switch defaultChecked onChange={() => {
                                    }}/>
                                )}
                            </Form.Item>


                            <FormItem
                                label={formatMessage({id: 'app.settings.global.data_path'})}>
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
                                (<Input/>)
                                }
                            </FormItem>

                            <FormItem
                                label={formatMessage({id: 'app.settings.global.log_path'})}>
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
                                (<Input/>)
                                }
                            </FormItem>


                            <Button type="primary">
                                <FormattedMessage
                                    id="app.settings.global.update"
                                    defaultMessage="Update Setting"/> </Button>
                        </Form></div>
                    </Col>
                    <Col span={8}></Col>
                </Row>
            </Card>
        );
    }
}

export default Global;
