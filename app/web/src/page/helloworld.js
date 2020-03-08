import {Component}  from 'react';
import {Card} from 'antd';

class Helloworld extends Component {
    render() {
        return (
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
        );
    }
}

export default Helloworld;
