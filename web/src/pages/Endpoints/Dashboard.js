import React, { PureComponent } from 'react';
import { Button, Table, Row, Col, Card, Input, Badge , List  } from 'antd';
import {
  EyeFilled,EyeInvisibleFilled,
  LeftOutlined, RightOutlined,EllipsisOutlined
} from '@ant-design/icons';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import styles from './Dashboard.less';

class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      count: 5,
    };
  }

  increase = () => {
    const count = this.state.count + 1;
    this.setState({ count });
    console.log('increase count:', count);
  };

  decline = () => {
    let count = this.state.count - 1;
    if (count < 0) {
      count = 0;
    }
    this.setState({ count });
    console.log('decline count:', count);
  };

  render() {
    const dataSource = [
      {
        os: 'Windows',
        name: "LENOVO",
        ip: '192.168.3.1',
        status: "active", //active/inactive/unmonitored
        last_active: "2020-03-21 11:12:33",
        tag: ["win10"],
      },
      {
        os: "Linux",
        name: 'RaspberryPi',
        ip: '192.168.3.81',
        last_active: "2020-03-21 11:12:33",
        status: "inactive", //active/inactive/unmonitored
        tag: ["win10"],
        credentials:{
          user: "pi",
          password: "elastic"
        }
      },
    ];

    const columns = [
      {
        title: '终端名称',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: 'IP地址',
        dataIndex: 'ip',
        key: 'ip',
      },
      {
        title: 'OS',
        dataIndex: 'os',
        key: 'os',
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
      },
      {
        title: '最近活跃时间',
        dataIndex: 'last_active',
        key: 'last_active',
      },
    ];
    const style = { background: '#ffffff'};
    const { Search } = Input;
    const ButtonGroup = Button.Group;

    const groupExtra = (
      <ButtonGroup size="small">
        <Button onClick={this.decline}>
          <LeftOutlined />
        </Button>
        <Button onClick={this.increase}>
          <RightOutlined />
        </Button>
      </ButtonGroup>
    );
    return (
      <PageHeaderWrapper title="终端管理">
        <div style={{"padding":"15px 0","backgroundColor":"white"}}>
          <div className={styles.panel}>
            <div className={styles.item}>
              <div className={styles.wrap}>
                <div className={styles.val}>
                  {52}
                </div>
                <div className={styles.name}>
                  {'all'}
                </div>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.wrap}>
                <div className={styles.val}>
                  {27}
                </div>
                <div className={styles.name}>
                  {'windows'}
                </div>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.wrap}>
                <div className={styles.val}>
                  {15}
                </div>
                <div className={styles.name}>
                  {'linux'}
                </div>
              </div>
            </div>
          </div>
          <div className={styles.subPanel}>
            <div className={styles.item}>
              <div className={styles.wrap}>
                <div className={styles.val}>
                  {52}
                </div>
                <div className={styles.name}>
                  {'total'}
                </div>
                <EyeFilled />
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.wrap}>
                <div className={styles.val}>
                  {37}
                </div>
                <div className={styles.name}>
                  {'active'}
                </div>
                <EyeInvisibleFilled />
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.wrap}>
                <div className={styles.val}>
                  {13}
                </div>
                <div className={styles.name}>
                  {'inactive'}
                </div>
                <EyeInvisibleFilled />
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.wrap}>
                <div className={styles.val}>
                  {2}
                </div>
                <div className={styles.name}>
                  {'unmonitored'}
                </div>
                <EyeInvisibleFilled />
              </div>
            </div>
            <div className={styles.item}>
              <div className={[styles.wrap, styles.wrapBorderLeft].join(' ')}>
                <div className={styles.val}>
                  {0}
                </div>
                <div className={styles.name}>
                  {'isolated'}
                </div>
                <EyeInvisibleFilled />
              </div>
            </div>
          </div>
        </div>

        <br />
        <Row gutter={[16, 24]}>
          <Col  xs={24} sm={24} md={24} lg={6} xl={6} >
            <div style={style}>
              <Card title="GROUPS" extra={groupExtra}>
                <div>
                  <Search
                    placeholder="搜索"
                    onSearch={value => console.log(value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div className={styles.groupSection}>
                  <div className={styles.content}>
                    <div className={styles.item}>
                      <div className={styles.itemContent}>
                        <span className={styles.text}>Demo</span>
                        <Badge className={styles.badge} count={25} style={{ backgroundColor: '#188FFE', 'padding': '0 12px' }} />
                      </div>
                      <span className={styles.itemOption}>
                        <EllipsisOutlined />
                      </span>
                    </div>
                    <div className={styles.item}>
                      <div className={styles.itemContent}>
                        <span className={styles.text}>Windows</span>
                        <Badge className={styles.badge} count={17} style={{ backgroundColor: '#188FFE', 'padding': '0 12px' }} />
                      </div>
                      <span className={styles.itemOption}>
                        <EllipsisOutlined />
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </Col>
          <Col xs={24} sm={24} md={24} lg={18} xl={18} >
            <div style={style}>
              <Table
                rowSelection={{
                  type: 'checkbox'
                }}
                dataSource={dataSource}
                columns={columns}
                size="small"
              />
            </div>
          </Col>
        </Row>

      </PageHeaderWrapper>
    );
  }
}

export default Dashboard;
