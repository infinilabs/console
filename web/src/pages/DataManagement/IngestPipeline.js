import React, { Component,Fragment } from 'react';
import { connect } from 'dva';
import { Card,Form,Input, Select,Button } from 'antd';
const { Option } = Select;
import { formatMessage, FormattedMessage } from 'umi/locale';
import DescriptionList from '@/components/DescriptionList';
import styles from '../profile/AdvancedProfile.less';
const { Description } = DescriptionList;
const FormItem = Form.Item;
const { TextArea } = Input;

@connect(({ profile, loading }) => ({
  profile,
  loading: loading.effects['profile/fetchBasic'],
}))

@Form.create()
class IngestPipeline extends Component {
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
    return (
        <Fragment>
            <Card
            className={styles.tabsCard}
            bordered={false}
  
            onTabChange={this.onOperationTabChange}
            >
              <div>unimplement, waiting to do</div>
            </Card>
        </Fragment>
    );
  }
}

export default IngestPipeline;
