import { useEffect, useState } from 'react';
import { Alert, Button, Form, Icon, Input, Switch } from 'antd';
import request from '@/utils/request';
import { formatMessage } from "umi/locale";
import TrimSpaceInput from '@/components/TrimSpaceInput';

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

    const onTest = async (callback) => {
        form.validateFields(async (err, values) => {
            if (err) {
              return false;
            }
            try {
                setTestLoading(true);
                setTestStatus();
                setTestError();
                const { host, isTLS, isAuth, username, password } = values;
                const body = {
                    host: host.trim(),
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
                        setTestStatus('success')
                        if (callback) callback()
                    } else {
                        setTestStatus('error')
                        setTestError(formatMessage({ id: 'guide.cluster.test.connection.error.version'}))
                    }
                } else {
                    setTestStatus('error')
                    setTestError(formatMessage({ id: 'guide.cluster.test.connection.failed'}))
                }
                setTestLoading(false);
            } catch (error) {
                console.log(error);
                setTestStatus('error')
                setTestLoading(false);
            }
        });
    }

    const resetTestStatus = () => {
        !!testStatus && setTestStatus()
        !!testError && setTestError()
    }

    const onSubmit = async (e) => {
        e.preventDefault();
        
        if (!testStatus || testStatus === 'error') {
            onTest(onFormDataSave)
            return;
        }

        onFormDataSave();
    }

    const onFormDataSave = () => {
        const values = form.getFieldsValue();
        const { host, isAuth, username, password } = form.getFieldsValue();
        onFormDataChange({
            host: host.trim(), isAuth, username, password
        })
        onNext();
    }

    const { getFieldDecorator } = form;

    return (
        <Form {...formItemLayout} onSubmit={onSubmit} colon={false}>
            <Form.Item label={formatMessage({ id: 'guide.cluster.host'})}>
                {getFieldDecorator("host", {
                    initialValue: formData.host,
                    rules: [
                        {
                            required: true,
                            message: formatMessage({ id: 'guide.cluster.host.required'}),
                        },
                        {
                            type: "string",
                            pattern: /^[\w\.\-_~%]+(\:\d+)?$/,
                            message: formatMessage({ id: 'guide.cluster.host.validate'}),
                        },
                    ],
                })(<TrimSpaceInput placeholder="127.0.0.1:9200" onChange={resetTestStatus}/>)}
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