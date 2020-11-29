import React, { Component } from 'react';
import { connect } from 'dva';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import { Col, Form, Row,Select, Input, Card,Icon,List, Descriptions } from 'antd';

const {Option} = Select;

@Form.create()
class Query extends React.Component {
    state={
        bodyDisplay: 'none',
        data: [{
            index: 'blogs-001',
            id: 'dpOsA3YBCjFOm54VZoNF',
            source: `{
                "title" : "elastic search test title",
                "content": "如默认结构不满足需求，可以自定义该模板，但是自定义模板时必须包含各个 dom 节点的 class，样式可以自定义。",
                "created_at" : "2020-11-23"
              }`
          },
          {
            index: 'blogs-002',
            id: "dpOsA3YBCjFOm54VZoNB",
            source: `{
                "title" : "elastic search test title",
                "created_at" : "2020-11-23",
                "content": "如默认结构不满足需求，可以自定义该模板，但是自定义模板时必须包含各个 dom 节点的 class，样式可以自定义。"
              }`
          },
          {
            index: 'blogs-002',
            id: "dpOsA3YBCjFOm54VZoNC",
            source: `{
                "title" : "elastic search test title",
                "created_at" : "2020-11-23",
                "content":"如默认结构不满足需求，可以自定义该模板，但是自定义模板时必须包含各个 dom 节点的 class，样式可以自定义。"
              }`
          },
          {
            index: 'blogs-001',
            id:"dpOsA3YBCjFOm54VZoNG",
            source: `{
                "title" : "elastic search test title",
                "content":"如默认结构不满足需求，可以自定义该模板，但是自定义模板时必须包含各个 dom 节点的 class，样式可以自定义。",
                "created_at" : "2020-11-23"
              }`
          }, {
            index: 'blogs-001',
            id:"dpOsA3YBCjFOm54VZoNG",
            source: `{
                "title" : "elastic search test title",
                "content":"如默认结构不满足需求，可以自定义该模板，但是自定义模板时必须包含各个 dom 节点的 class，样式可以自定义。",
                "created_at" : "2020-11-23"
              }`
          }]
    }
   
    render(){
        // const {getFieldDecorator} = this.props.form;
        return (
            <div>
                <Card>
                    <Row gutter={[16, { xs: 8, sm: 16, md: 24, lg: 32 }]}>
                        <Col span={20}>
                        <Input.Group compact>
                            <Select
                                defaultValue="GET"
                                style={{ width: 80 }}
                                >
                                <Option value="GET">GET</Option>
                                <Option value="POST">POST</Option>
                                <Option value="PUT">PUT</Option>
                            </Select>
                            <Input.Search
                                style={{width:"80%"}}
                                placeholder="input query url"
                                enterButton="execute"     
                                onSearch={value => console.log(value)}
                            />
                        </Input.Group>
                        </Col>
                        <Col span={4}>
                            <a style={{marginTop:5,display:'block'}} onClick={(e)=>{
                                this.setState((preState)=>{
                                    if(preState.bodyDisplay == 'none') {
                                        return {
                                            bodyDisplay: 'block',
                                        };
                                    }else{
                                        return {
                                            bodyDisplay: 'none'
                                        };
                                    }
                                });
                            }}>{this.state.bodyDisplay == 'none' ? '展开':'收起'}<Icon type="down" /></a>
                        </Col>
                    </Row>
                    <Row style={{display: this.state.bodyDisplay}} gutter={[16, { xs: 8, sm: 16, md: 24, lg: 32 }]}>
                        <Col span={20}>
                            <Input.TextArea placeholder="query body" rows={8}/>
                        </Col>
                    </Row>

                    <List
                        grid={{ gutter: 16, column: 2}}
                        dataSource={this.state.data}
                        pagination={{
                            onChange: page => {
                              console.log(page);
                            },
                            pageSize: 4,
                            total: 50
                        }}
                        renderItem={item => (
                        <List.Item>
                            <Card title={`${item.index} ${item.id}`}
                            extra={<a onClick={()=>{}}>More</a>}
                             actions={[
                                <Icon type="edit" key="edit" onClick={(e)=>{}} />,
                                <Icon type="delete" key="delete" />,
                              ]}>
                                <Descriptions bordered column={1}>
                                    {/* <Descriptions.Item label="ID">
                                        {item.id}
                                    </Descriptions.Item> */}
                                    <Descriptions.Item label="Source">
                                        {item.source}
                                    </Descriptions.Item>
                                </Descriptions>
                            </Card>
                        </List.Item>
                        )}
                    />
                </Card>
            </div>
        )
    }
    
}

export default Query;