import React, { useEffect, useMemo, useState } from "react";
import { Button, Divider, Form, Input, Select } from "antd";
import { formatMessage } from "umi/locale";
import useFetch from "@/lib/hooks/use_fetch";
import { formatESSearchResult } from "@/lib/elasticsearch/util";

const MANUAL_VALUE = 'manual'

export default (props) => {

    const { form: { getFieldDecorator }, initialValue = {}, isEdit } = props;

    const [isManual, setIsManual] = useState()

    const { loading, error, value, run } = useFetch(
        "/credential/_search",
        {
          queryParams: {
            from: 0,
            size: 1000,
          },
        },
        []
      );

    const onCredentialChange = (value) => {
        if (value === MANUAL_VALUE) {
            setIsManual(true)
        } else {
            setIsManual(false)
        }
    }   

    const {data, total} = useMemo(() => {
        return formatESSearchResult(value);
    }, [value])

    useEffect(() => {
        setIsManual(initialValue.credential_id === MANUAL_VALUE)
    }, [initialValue.credential_id])

    return (
        <>
            <Form.Item
              label={formatMessage({
                id: "cluster.regist.step.connect.label.credential",
              })}
            >
              {getFieldDecorator("credential_id", {
                initialValue: initialValue?.credential_id ? initialValue?.credential_id : ( initialValue?.username ? MANUAL_VALUE : undefined ),
                rules: [
                  {
                    required: true,
                    message: formatMessage({
                      id: "cluster.regist.form.verify.required.credential",
                    }),
                  },
                ],
              })(
                <Select 
                    loading={loading} 
                    onChange={onCredentialChange}
                >
                    {
                        data.map((item) => <Select.Option value={item.id}>{item.name}</Select.Option>)
                    }
                    <Select.Option value={MANUAL_VALUE}>
                        {
                            formatMessage({
                                id: "cluster.regist.step.connect.credential.manual",
                            })
                        }
                    </Select.Option>
                </Select>
              )}
            </Form.Item>
            {
                isManual && (
                    <>
                        <Form.Item
                            label={formatMessage({
                                id: "cluster.regist.step.connect.label.username",
                            })}
                            >
                            {getFieldDecorator("auth.username", {
                                initialValue: initialValue?.auth?.username || "",
                                rules: [
                                {
                                    required: true,
                                    message: formatMessage({
                                    id: "cluster.regist.form.verify.required.auth_username",
                                    }),
                                },
                                ],
                            })(<Input autoComplete="off" placeholder="Auth user name" />)}
                        </Form.Item>
                        <Form.Item
                            label={formatMessage({
                                id: "cluster.regist.step.connect.label.password",
                            })}
                            hasFeedback
                            >
                            {getFieldDecorator("auth.password", {
                                initialValue: initialValue?.auth?.password || "",
                                rules: [
                                {
                                    required: true,
                                    message: formatMessage({
                                    id: "cluster.regist.form.verify.required.auth_password",
                                    }),
                                },
                                ],
                            })(
                                <Input.Password
                                autoComplete="off"
                                placeholder="Auth user password"
                                />
                            )}
                        </Form.Item>
                        {
                            isEdit && (
                                <>
                                    <Form.Item label={" "} colon={false}>
                                        <div>
                                            {formatMessage({
                                                id: "cluster.regist.form.credential.manual.desc",
                                            })}
                                        </div>
                                    </Form.Item>
                                </>
                            )
                        }
                    </>
                )
            }
            
        </>
    )
}