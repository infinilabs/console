import {List, Avatar, Button, Skeleton, Divider,Row,Col} from 'antd';
import { Icon,Input } from 'antd';
const { Search } = Input;
import { Badge } from 'antd';
import style from './LoadMoreList.css'
import reqwest from 'reqwest';
const count = 3;
const fakeDataUrl = `https://randomuser.me/api/?results=${count}&inc=name,gender,email,nat&noinfo`;

class LoadMoreList extends React.Component {
    state = {
        initLoading: true,
        loading: false,
        data: [],
        list: [],
    };

    componentDidMount() {
        this.getData(res => {
            this.setState({
                initLoading: false,
                data: res.results,
                list: res.results,
            });
        });
    }

    getData = callback => {
        reqwest({
            url: fakeDataUrl,
            type: 'json',
            method: 'get',
            contentType: 'application/json',
            success: res => {
                callback(res);
            },
        });
    };

    onLoadMore = () => {
        this.setState({
            loading: true,
            list: this.state.data.concat([...new Array(count)].map(() => ({ loading: true, name: {} }))),
        });
        this.getData(res => {
            const data = this.state.data.concat(res.results);
            this.setState(
                {
                    data,
                    list: data,
                    loading: false,
                },
                () => {
                    // Resetting window's offsetTop so as to display react-virtualized demo underfloor.
                    // In real scene, you can using public method of react-virtualized:
                    // https://stackoverflow.com/questions/46700726/how-to-use-public-method-updateposition-of-react-virtualized
                    window.dispatchEvent(new Event('resize'));
                },
            );
        });
    };

    render() {
        const { initLoading, loading, list } = this.state;
        const loadMore =
            !initLoading && !loading ? (
                <div
                    style={{
                        textAlign: 'center',
                        marginTop: 12,
                        height: 32,
                        lineHeight: '32px',
                    }}
                >
                    <Button onClick={this.onLoadMore}>Loading more</Button>
                </div>
            ) : null;

        return (
            <dvi>

                <div className={style.header}>
                    <Row type="flex" justify="space-between" align="bottom">
                        <Col >
                            <a href="#" className="head-example" >Elasticsearch 集群</a>
                            &nbsp;
                            <Badge
                                count={4}
                                style={{ backgroundColor: '#fff', color: '#999', boxShadow: '0 0 0 1px #d9d9d9 inset' }}
                            />
                        </Col>
                        <Col >
                            <a href={'#'}>
                                <Icon type="plus" />
                            </a>
                        </Col>
                    </Row>

                </div>

                <Search className={style.searchbox} placeholder="input search text" onSearch={value => console.log(value)} enterButton />


                <List
                    className="demo-loadmore-list"
                    loading={initLoading}
                    itemLayout="horizontal"
                    loadMore={loadMore}
                    dataSource={list}
                    renderItem={item => (
                        <List.Item
                            actions={[<a key="list-loadmore-edit"><Icon type="setting" /></a>]}
                        >
                            <Skeleton avatar title={false} loading={item.loading} active>
                                <List.Item.Meta
                                    avatar={
                                        <Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />
                                    }
                                    title={<a href="https://ant.design">{item.name.last}</a>}
                                />
                                <div>

                                    <Icon type="check-circle" theme="twoTone" twoToneColor="#52c41a" title={'Green'} />

                                </div>
                            </Skeleton>
                        </List.Item>
                    )}
                />
            </dvi>
        );
    }
}

export default LoadMoreList;