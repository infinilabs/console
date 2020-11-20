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
class Gateway extends Component {

    render() {
        return (
            <Card>Gateway</Card>
        );
    }
}

export default Gateway;
