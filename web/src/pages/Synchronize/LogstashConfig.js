import React, { Component,Fragment } from 'react';
import { connect } from 'dva';
import { Card,Form,Input, Select,Button,message, Drawer, 
  List
} from 'antd';
const { Option } = Select;
import { formatMessage, FormattedMessage } from 'umi/locale';
import DescriptionList from '@/components/DescriptionList';
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
  const configRawData = [
    {
      title: 'schedule',
      content: [`Schedule of when to periodically run statement, in Cron format for example: "* * * * *" (execute query every minute, on the minute)`,
      `There is no schedule by default. If no schedule is given, then the statement is run exactly once.`],
    },
    {
      title: 'jdbc_driver_library',
      content: ['JDBC driver library path to third party driver library. In case of multiple libraries being required you can pass them separated by a comma.'],
    },
    {
      title: 'jdbc_driver_class',
      content: ['JDBC driver class to load, for example, "org.apache.derby.jdbc.ClientDriver"'],
    },
    {
      title: 'jdbc_connection_string',
      content: ['JDBC connection string, for example, "jdbc:oracle:test:@192.168.1.68:1521/testdb"'],
    },{
      title:'jdbc_paging_enabled',
      content: ['This will cause a sql statement to be broken up into multiple queries. Each query will use limits and offsets to collectively retrieve the full result-set. The limit size is set with jdbc_page_size.','Be aware that ordering is not guaranteed between queries.']
    },
  ];

@connect(({logstash,loading }) => ({
    data: logstash.logstash,
    loading: loading.models.logstash,
    submitting: loading.effects['logstash/submitLogstashConfig'],
}))

@Form.create()
class LogstashConfig extends Component {
    state = {
        operationkey: 'tab1',
        drawerVisible: false,
        drawerData: configRawData,
    };
  componentDidMount() {
    message.loading('数据加载中..', 'initdata');
    const { dispatch } = this.props;
    dispatch({
      type: 'logstash/queryInitialLogstashConfig',
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
  
  handleDrawerVisible = () => {
    this.setState(preState=>{
      return {
        drawerVisible: !preState.drawerVisible,
      }
    })
  };
  onCloseDrawer = ()=>{
    this.setState({
      drawerVisible: false,
    });
  };

  onDrawerSearch = (value)=>{
    let data = configRawData.filter((conf)=>{
      return conf.title.includes(value);
    });
    this.setState({
      drawerData: data,
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
    const contentList = {
        tab1: (
        <div style={{position:"relative"}}>    
            <Form onSubmit={this.handleSubmit} name="jdbc" hideRequiredMark style={{ marginTop: 8 }}>
            <FormItem {...formItemLayout} label={<FormattedMessage id="form.dbtype.label" />}>
                {getFieldDecorator('dbtype', {
                 initialValue: data.jdbc.type,
                rules: [
                    {
                    required: true,
                    message: formatMessage({ id: 'validation.dbtype.required' }),
                    },
                ],
                })(
                <Select placeholder="Please select" style={{ width: 150 }}>
                    <Option value="mysql">mysql</Option>
                    <Option value="postgresql">postgresql</Option>
                    <Option value="oracle">oracle</Option>
                    <Option value="sqlserver">sqlserver</Option>
                </Select>
                )}
                </FormItem>
                <a href="javascript:void(0);" onClick={this.handleDrawerVisible} style={{position:"absolute", top:15,right:50}}>配置释义</a>
                <FormItem {...formItemLayout} label={<FormattedMessage id="form.logstash.jdbcconf.label" />}>
                {getFieldDecorator('logstash.jdbcconf', {
                initialValue: data.jdbc.config,
                rules: [
                    {
                    required: true,
                    message: formatMessage({ id: 'validation.logstashconf.required' }),
                    },
                ],
                })(
                <TextArea
                    style={{ minHeight: 32, width: '100%' }}
                    placeholder={formatMessage({ id: 'form.logstash.jdbcconf.placeholder' })}
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
        ),
        tab2: (
            <Form onSubmit={this.handleSubmit} name="kafka" hideRequiredMark style={{ marginTop: 8 }}>
                <FormItem {...formItemLayout} label={<FormattedMessage id="form.logstash.kafkaconf.label" />}>
                {getFieldDecorator('logstash.kafkaconf', {
                initialValue: data.kafka.config,
                rules: [
                    {
                    required: true,
                    message: formatMessage({ id: 'validation.kafkaconf.required' }),
                    },
                ],
                })(
                <TextArea
                    style={{ minHeight: 32 }}
                    placeholder={formatMessage({ id: 'form.logstash.kafkaconf.placeholder' })}
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
        )
      };
    return (
        <Fragment>
            <Card
            className={styles.tabsCard}
            bordered={false}
            tabList={operationTabList}
            onTabChange={this.onOperationTabChange}
            >
            {contentList[operationkey]}
            <Drawer visible={this.state.drawerVisible}
              title="配置释义"
              onClose={this.onCloseDrawer}
              width={720}
            >
              <Input.Search placeholder="input config key" onChange={(e) => {this.onDrawerSearch(e.target.value)}} onSearch={this.onDrawerSearch} enterButton />
               <List
                itemLayout="vertical"
                size="small"
                dataSource={this.state.drawerData}
                renderItem={item => (
                  <List.Item key={item.title}>
                    <List.Item.Meta
                      title={item.title}
                    />
                    <div>
                      {item.content.map((c)=>{
                        return (<p>{c}</p>);
                      })}
                    </div>
                  </List.Item>
                )}
              />
            </Drawer>
            </Card>
        </Fragment>
    );
  }
}

export default LogstashConfig;
