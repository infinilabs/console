import React, { Component,Fragment } from 'react';
import { connect } from 'dva';
import { Card,Form,Input, Select,Button,message,Upload, Icon,Switch } from 'antd';
const { Option } = Select;
import { formatMessage, FormattedMessage } from 'umi/locale';
import DescriptionList from '@/components/DescriptionList';
const { Description } = DescriptionList;
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
const FormItem = Form.Item;
const { TextArea } = Input;
const { Dragger } = Upload;


@connect(({logstash,loading }) => ({
    data: logstash.logstash,
    loading: loading.models.logstash,
    submitting: loading.effects['logstash/submitLogstashConfig'],
}))

@Form.create()
class AnalyzerTest extends Component {
    state = {
        operationkey: 'tab1',
    };logstash
    componentDidMount() {
        // message.loading('数据加载中..', 'initdata');
        // const { dispatch } = this.props;
        // dispatch({
        //   type: 'logstash/queryInitialLogstashConfig',
        // });
    }
    onOperationTabChange = key => {
        this.setState({ operationkey: key });
    };
    handleSubmit = e => {
        const { dispatch, form } = this.props;
        e.preventDefault();
        form.validateFieldsAndScroll((err, values) => {
            if (!err) {
                let pdata = {
                    jdbc:{
                        type: values.dbtype,
                        config: values.logstash.jdbcconf,
                    },
                };
                if(e.target.name="kafka"){
                    pdata={
                        kafka:{
                            config: values.logstash.kafkaconf,
                        },
                    }
                }
                dispatch({
                    type: 'logstash/submitLogstashConfig',
                    payload: pdata,
                });
            }
        });
    };

    render() {
        const { operationkey } = this.state;
        const { submitting, data, loading } = this.props;
        const {
            form: { getFieldDecorator, getFieldValue },
        } = this.props;
        const formItemLayout = {
            labelCol: {
                xs: { span: 24 },
                sm: { span: 7 },
                md:{span:5},
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: 12 },
                md: { span: 15 },
            },
        };
        const submitFormLayout = {
            wrapperCol: {
                xs: { span: 24, offset: 0 },
                sm: { span: 10, offset: 7 },
            },
        };
        const uploadProps = {
            name: 'file',
            multiple: true,
            action: '',
            onChange(info) {
                const { status } = info.file;
                if (status !== 'uploading') {
                    console.log(info.file, info.fileList);
                }
                if (status === 'done') {
                    message.success(`${info.file.name} file uploaded successfully.`);
                } else if (status === 'error') {
                    message.error(`${info.file.name} file upload failed.`);
                }
            },
        };


        return (
            <Fragment>
            <Card bordered={false}>
            <div>
            <Form onSubmit={this.handleSubmit}  hideRequiredMark style={{ marginTop: 8 }}>
    <FormItem {...formItemLayout} label="选择分词器">
            {getFieldDecorator('index', {
            initialValue: data.index,
                rules: [
                {
                    required: true,
                    message: "请选择分词器",
                },
            ],
        })(
        <Select placeholder="Please select" style={{ width: 150 }}>
    <Option value="blogs">name_analyzer</Option>
            <Option value="logs">text_analyzer</Option>
            <Option value="filebeat">title_analyzer</Option>
            </Select>
    )}
    </FormItem>
        <FormItem {...formItemLayout} label="测试数据">
            {getFieldDecorator('bulk', {
            initialValue: data.bulk,
                rules: [
                {
                    required: true,
                    message: '请输入测试数据',
                },
            ],
        })(
        <TextArea
        style={{ minHeight: 32, width: '100%' }}
        placeholder=''
        rows={12}
        />
    )}
    </FormItem>
        <FormItem {...submitFormLayout} style={{ marginTop: 32 }}>
    <Button type="primary" htmlType="submit" loading={submitting}>
            <FormattedMessage id="form.submit" />
            </Button>
            </FormItem>
            </Form>
            </div>
            </Card>
            </Fragment>
    );
    }
}

export default AnalyzerTest;
