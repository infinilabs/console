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
            case 'overview':
                router.push(`${match.url}/overview`);
                break;
            case 'audit':
                router.push(`${match.url}/audit`);
                break;
            case 'query':
                router.push(`${match.url}/query`);
                break;
            case 'slow':
                router.push(`${match.url}/slow`);
                break;
            default:
                break;
        }
    }

    render() {
        const tabList = [
            {
                key: 'overview',
                tab: '日志概要',
            },
            {
                key: 'audit',
                tab: '审计日志',
            },
            {
                key: 'query',
                tab: '查询日志',
            },
            {
                key: 'slow',
                tab: '慢日志',
            }
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
