import React, { Component } from 'react';
import { connect } from 'dva';
import { Card,Form,Input, Select,Button } from 'antd';
const { Option } = Select;
import { formatMessage, FormattedMessage } from 'umi/locale';
import DescriptionList from '@/components/DescriptionList';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import styles from '../profile/AdvancedProfile.less';
const { Description } = DescriptionList;
const FormItem = Form.Item;
const { TextArea } = Input;
const operationTabList = [
    {
      key: 'tab1',
      tab: '对接JDBC',
    },
    {
      key: 'tab2',
      tab: '对接Kafka',
    }
  ];

@connect(({ profile, loading }) => ({
  profile,
  loading: loading.effects['profile/fetchBasic'],
}))

@Form.create()
class LogstashConfig extends Component {
    state = {
        operationkey: 'tab1'
    };
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'profile/fetchBasic',
    });
  }
  onOperationTabChange = key => {
    this.setState({ operationkey: key });
  };
  handleSubmit = e => {
    const { dispatch, form } = this.props;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        dispatch({
          type: 'form/submitRegularForm',
          payload: values,
        });
      }
    });
  };

  render() {
    const { operationkey } = this.state;
    const { submitting } = this.props;
    const {
      form: { getFieldDecorator, getFieldValue },
    } = this.props;
    const formItemLayout = {
        labelCol: {
          xs: { span: 24 },
          sm: { span: 7 },
        },
        wrapperCol: {
          xs: { span: 24 },
          sm: { span: 12 },
          md: { span: 10 },
        },
      };
      const submitFormLayout = {
        wrapperCol: {
          xs: { span: 24, offset: 0 },
          sm: { span: 10, offset: 7 },
        },
      };
    const contentList = {
        tab1: (
        <div>    
            <Form onSubmit={this.handleSubmit} hideRequiredMark style={{ marginTop: 8 }}>
            <FormItem {...formItemLayout} label={<FormattedMessage id="form.goal.label" />}>
                {getFieldDecorator('goal', {
                rules: [
                    {
                    required: true,
                    message: formatMessage({ id: 'validation.goal.required' }),
                    },
                ],
                })(
                <Select defaultValue="mysql" style={{ width: 150 }}>
                    <Option value="mysql">mysql</Option>
                    <Option value="postgresql">postgresql</Option>
                    <Option value="oracle">oracle</Option>
                    <Option value="sqlserver">sqlserver</Option>
                </Select>
                )}
                </FormItem>
                <FormItem {...formItemLayout} label={<FormattedMessage id="form.goal.label" />}>
                {getFieldDecorator('goal', {
                rules: [
                    {
                    required: true,
                    message: formatMessage({ id: 'validation.goal.required' }),
                    },
                ],
                })(
                <TextArea
                    style={{ minHeight: 32 }}
                    placeholder={formatMessage({ id: 'form.goal.placeholder' })}
                    rows={4}
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
        ),
        tab2: (
            <Form onSubmit={this.handleSubmit} hideRequiredMark style={{ marginTop: 8 }}>
                <FormItem {...formItemLayout} label={<FormattedMessage id="form.goal.label" />}>
                {getFieldDecorator('goal', {
                rules: [
                    {
                    required: true,
                    message: formatMessage({ id: 'validation.goal.required' }),
                    },
                ],
                })(
                <TextArea
                    style={{ minHeight: 32 }}
                    placeholder={formatMessage({ id: 'form.goal.placeholder' })}
                    rows={4}
                />
                )}
            </FormItem>
        </Form>
        )
      };
    return (
      <PageHeaderWrapper >
        <Card
          className={styles.tabsCard}
          bordered={false}
          tabList={operationTabList}
          onTabChange={this.onOperationTabChange}
        >
          {contentList[operationkey]}
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default LogstashConfig;
