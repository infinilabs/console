import {Component}  from 'react';
import {Card} from 'antd';
import { Steps } from 'antd';
import {LoadingOutlined} from '@ant-design/icons';
    
const { Step } = Steps;

class Helloworld extends Component {
    render() {
        return ( 
            <div>
                <Card>
                    <Card.Meta
                        avatar={<img 
                            alt=""
                            style={{ width: '64px', height: '64px', borderRadius: '32px' }}
                            src="https://gw.alipayobjects.com/zos/rmsportal/WdGqmHpayyMjiEhcKoVE.png"
                        />}
                        title="Alipay"
                        description="在中台产品的研发过程中，会出现不同的设计规范和实现方式，但其中往往存在很多类似的页面和组件，这些类似的组件会被抽离成一套标准规范。"
                      />
                </Card>

                <Steps style={{margin:'50px auto', backgroundColor:'#fff', padding:'50px 0'}} direction="horizontal" labelPlacement="vertical" size="small" current={1}>
                  <Step title="校验参数" description="This is a description." />
                  <Step title="安装或更新" icon={<LoadingOutlined />} description="This is a description." />
                  <Step title="初始化项目" description="This is a description." />
                  <Step title="安装依赖" description="This is a description." />
                  <Step title="项目创建成功" description="This is a description." />
                </Steps>
            </div>
        );
    }
}

export default Helloworld;
