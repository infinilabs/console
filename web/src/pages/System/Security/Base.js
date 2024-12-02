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
            case 'general':
                router.push(`${match.url}/general`);
                break;
            case 'sso':
                router.push(`${match.url}/sso`);
                break;
            case 'roles':
                router.push(`${match.url}/roles`);
                break;
            case 'users':
                router.push(`${match.url}/users`);
                break;
            case 'certs':
                router.push(`${match.url}/certs`);
                break;
            default:
                break;
        }
    }

    render() {
        const tabList = [
            {
                key: 'general',
                tab: '基础设置',
            },
            {
                key: 'sso',
                tab: '单点登录',
            },
            {
                key: 'roles',
                tab: '角色管理',
            },
            {
                key: 'users',
                tab: '用户管理',
            },
            {
                key: 'certs',
                tab: '证书管理',
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
