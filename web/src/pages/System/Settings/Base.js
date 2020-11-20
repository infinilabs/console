import router from 'umi/router';
import { connect } from 'dva';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';

import React, {Component, Fragment} from 'react';

import {Col, Divider,Card, Form, Icon, Input, Row, Select, Table} from 'antd';
import {formatMessage} from 'umi/locale';

const {Option} = Select;

const FormItem = Form.Item;
const {TextArea} = Input;



@connect()
class Base extends Component {
    handleTabChange = key => {
        const { match,children } = this.props;
        switch (key) {
            case 'global':
                router.push(`${match.url}/global`);
                break;
            case 'gateway':
                router.push(`${match.url}/gateway`);
                break;
            default:
                break;
        }
    }

    render() {
        const tabList = [
            {
                key: 'global',
                tab: '全局设置',
            },
            {
                key: 'gateway',
                tab: '网关设置',
            },
        ];

        const { match, children, location } = this.props;

        return (
            <PageHeaderWrapper
                tabList={tabList}
                tabActiveKey={location.pathname.replace(`${match.path}/`, '')}
                onTabChange={this.handleTabChange}
            >
                {children}
            </PageHeaderWrapper>
        );
    }
}

export default Base;
