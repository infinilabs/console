import { useEffect, useState } from 'react';
import { Alert, Button, Form, Icon, Input, Switch, Select } from 'antd';
import request from '@/utils/request';
import { formatMessage } from "umi/locale";
import TrimSpaceInput from '@/components/TrimSpaceInput';
import {
    getClusterConnectErrorMessageFromError,
    getClusterConnectErrorMessageFromResponse,
} from '@/pages/System/Cluster/utils';

const formItemLayout = {
    labelCol: {
        md: { span: 8 },
    },
    wrapperCol: {
        md: { span: 10 },
    },
};

export default ({ onNext, form, formData, onFormDataChange }) => {

    const [testLoading, setTestLoading] = useState(false);
    const [testStatus, setTestStatus] = useState();
    const [testError, setTestError] = useState();
    const [clusterDefaults, setClusterDefaults] = useState({});

    const checkVersion = (version, distribution) => {
        if (!version) return false;
        if(distribution === "easysearch" || distribution === "opensearch"){
            return true
        }
        const base = '5.3';
        const baseSplit = base.split('.').map(x => parseInt(x))
        const versionSplit = version.split('.').map(x => parseInt(x))
        if(baseSplit[0] > versionSplit[0]){
            return false
        }else if(baseSplit[0] < versionSplit[0]){
            return true
        }
        if(baseSplit[1] > versionSplit[1]){
            return false
        }else if(baseSplit[1] < versionSplit[1]){
            return true
        }
        return true
    }

    const getRecommendedPrimaryShards = (res) => {
        const dataNodes = Number(res?.number_of_data_nodes) || 0;
        const totalNodes = Number(res?.number_of_nodes) || 0;
        return Math.max(1, dataNodes || totalNodes || 1);
    }

    const onTest = async (callback) => {
        form.validateFields(async (err, values) => {
            if (err) {
              return false;
            }
            try {
                setTestLoading(true);
                setTestStatus();
                setTestError();
                const { hosts, isTLS, isAuth, username, password } = values;
                const body = {
                    hosts: (hosts || []).map(host=>host.trim()),
                    schema: isTLS === true ? "https" : "http",
                }
                if (isAuth) {
                    body.basic_auth =  {
                        username,
                        password,
                    }
                }

                const res = await request('/elasticsearch/try_connect', {
                    method: "POST",
                    body: body,
                }, undefined, false)
                if (['green', 'yellow'].includes(res?.status)) {
                    if (checkVersion(res?.version, res?.distribution)) {
                        const nextDefaults = {
                            distribution: res?.distribution,
                            version: res?.version,
                            number_of_nodes: res?.number_of_nodes,
                            number_of_data_nodes: res?.number_of_data_nodes,
                            primary_shards: getRecommendedPrimaryShards(res),
                            auto_expand_replicas: formData.auto_expand_replicas || "0-1",
                        };
                        setTestStatus('success')
                        setClusterDefaults(nextDefaults)
                        if (callback) callback(nextDefaults)
                    } else {
                        setTestStatus('error')
                        setTestError(formatMessage({ id: 'guide.cluster.test.connection.error.version'}))
                    }
                } else {
                    setTestStatus('error')
                    setTestError(
                        getClusterConnectErrorMessageFromResponse(
                            res,
                            'guide.cluster.test.connection.failed'
                        )
                    )
                }
                setTestLoading(false);
            } catch (error) {
                setTestStatus('error')
                setTestError(
                    await getClusterConnectErrorMessageFromError(
                        error,
                        'guide.cluster.test.connection.failed'
                    )
                )
                setTestLoading(false);
            }
        });
    }

    const resetTestStatus = () => {
        !!testStatus && setTestStatus()
        !!testError && setTestError()
        setClusterDefaults({})
    }

    const onSubmit = async (e) => {
        e.preventDefault();
        
        if (!testStatus || testStatus === 'error') {
            onTest(onFormDataSave)
            return;
        }

        onFormDataSave();
    }

    const onFormDataSave = (defaults = clusterDefaults) => {
        const values = form.getFieldsValue();
        const { hosts, isTLS, isAuth, username, password } = values;
        onFormDataChange({
            hosts: (hosts || []).map(host=>host.trim()),
            isTLS,
            isAuth,
            username,
            password,
            distribution: defaults?.distribution,
            version: defaults?.version,
            number_of_nodes: defaults?.number_of_nodes,
            number_of_data_nodes: defaults?.number_of_data_nodes,
            primary_shards: formData.primary_shards || defaults?.primary_shards,
            auto_expand_replicas: formData.auto_expand_replicas || defaults?.auto_expand_replicas,
        })
        onNext();
    }
    const validateHostsRule = (rule, value, callback) => {
        let vals = value || [];
        for(let i = 0; i < vals.length; i++) {
            if (!/^[\w\.\-_~%]+(\:\d+)?$/.test(vals[i])) {
                return callback(formatMessage({ id: 'guide.cluster.host.validate'}));
            }
        }
        // validation passed
        callback();
    };

    const { getFieldDecorator } = form;

    return (
        <Form {...formItemLayout} onSubmit={onSubmit} colon={false}>
            <Form.Item label={formatMessage({ id: 'guide.cluster.host'})}>
                {getFieldDecorator("hosts", {
                    initialValue: formData.hosts,
                    rules: [
                        {
                            required: true,
                            message: formatMessage({ id: 'guide.cluster.host.required'}),
                        },
                        {
                            validator: validateHostsRule,
                        }
                    ],
                })(<Select placeholder="127.0.0.1:9200" mode="tags" allowClear={true} onChange={resetTestStatus}/>)}
            </Form.Item>
            <Form.Item label="TLS">
                {getFieldDecorator("isTLS", {
                    initialValue: formData.isTLS,
                    valuePropName: 'checked'
                })(<Switch size="small" onChange={(checked) => {
                    resetTestStatus();
                    onFormDataChange({ isTLS: checked })
                }}/>)}
            </Form.Item>
            <Form.Item label={formatMessage({ id: 'guide.cluster.auth'})}>
                {getFieldDecorator("isAuth", { 
                    initialValue: formData.isAuth,
                    valuePropName: 'checked'
                })(<Switch size="small" onChange={(checked) => {
                    resetTestStatus();
                    onFormDataChange({ isAuth: checked })
                }}/>)}
            </Form.Item>
            {
                formData.isAuth && (
                    <>
                        <Form.Item label={formatMessage({ id: 'guide.username'})}>
                            {getFieldDecorator("username", {
                                initialValue: formData.username,
                                rules: [
                                    {
                                        required: true,
                                        message: formatMessage({ id: 'guide.username.required'}),
                                    }
                                ],
                            })(<Input onChange={resetTestStatus}/>)}
                        </Form.Item>
                        <Form.Item label={formatMessage({ id: 'guide.password'})}>
                            {getFieldDecorator("password", {
                                rules: [{
                                    required: true,
                                    message: formatMessage({ id: 'guide.password.required'}),
                                }],
                            })(<Input.Password onChange={resetTestStatus}/>)}
                        </Form.Item>
                    </>
                )
            }
            {
                testError && (
                    <Form.Item label=" ">
                        <Alert message={testError} type="error" />
                    </Form.Item>
                )
            }
            <Form.Item label=" ">
                <div style={{ display: 'flex', justifyContent: 'space-between'}}>
                    <Button style={{width: '48%'}} loading={testLoading} onClick={() => onTest()}>
                        {
                            testStatus === 'success' && (
                                <Icon style={{ color: '#27b148'}} type="check-circle" theme="filled" />
                            )
                        }
                        {
                            testStatus === 'error' && (
                                <Icon style={{ color: '#ff0000'}} type="close-circle" theme="filled" />
                            )
                        }
                        {formatMessage({ id: 'guide.cluster.test.connection'})}
                    </Button>
                    <Button style={{width: '48%'}} disabled={testLoading} type="primary" htmlType="submit">
                        {formatMessage({ id: 'guide.step.next'})}
                    </Button>
                </div>
            </Form.Item>
        </Form>
    )
}
