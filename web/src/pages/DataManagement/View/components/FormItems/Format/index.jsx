import { Form, Icon, Input, InputNumber, Select } from "antd";
import { useState } from "react";
import { formatMessage } from "umi/locale";

const Format = (props) => {

    const { value = {}, onChange } = props;

    const formatters = [
        {"type":"number","label":"Number"},
        {"type":"percent","label":"Percent"},
        {"type":"bytes","label":"Bytes"},
        {"type":"duration","label":"Duration"},
    ]

    const durations = [
        {"type":"milliseconds","label":"Milliseconds", unit: 'ms'},
        {"type":"seconds","label":"Seconds", unit: 's'},
        {"type":"minutes","label":"Minutes", unit: 'm'},
        {"type":"hours","label":"Hours", unit: 'h'},
    ]

    return (
        <Input.Group key={value.type} compact>
            <Input
                style={{
                    width: 80,
                    textAlign: "center",
                    pointerEvents: "none",
                    backgroundColor: "#fafafa",
                    color: "rgba(0, 0, 0, 0.65)",
                }}
                defaultValue={'Format'}
                disabled
            />
            <Select allowClear style={{ width: 100 }} value={value.type} onChange={(type) => {
                onChange({ 
                    ...value, 
                    type,
                    pattern: type === 'duration' ? undefined : value.pattern,
                    input: type !== 'duration' ? undefined : value.input,
                    output: type !== 'duration' ? undefined : value.output, 
                    places: type !== 'duration' ? undefined : value.places, 
                })
            }}>
                {
                    formatters.map((item) => (
                        <Select.Option key={item.type} value={item.type}>{item.label}</Select.Option>
                    ))
                }
            </Select>
            {
                value.type !== 'duration' ? (
                    <>
                        <div style={{
                                width: 200,
                                textAlign: "center",
                                backgroundColor: "#fafafa",
                                color: "rgba(0, 0, 0, 0.65)",
                                height: '32px',
                                lineHeight: '32px',
                                border: '1px solid #d9d9d9'
                        }}>
                             Numeral.js Format Pattern <a href="http://numeraljs.com/" target="_blank"><Icon type="question-circle" /></a>
                        </div>
                        <Input value={value.pattern} style={{ width: 'calc(100% - 80px - 100px - 200px - 22px' }}  onChange={(e) => {
                            onChange({ ...value, pattern: e.target.value })
                        }}/>
                    </>
                ) : (
                    <>
                        <Input
                            style={{
                                width: 60,
                                textAlign: "center",
                                pointerEvents: "none",
                                backgroundColor: "#fafafa",
                                color: "rgba(0, 0, 0, 0.65)",
                            }}
                            defaultValue={'Input'}
                            disabled
                        />
                        <Select style={{ width: 100 }} value={value.input} onChange={(input, option) => {
                            const unit = option?.props?.unit
                            onChange({ 
                                ...value, 
                                input,
                                unit: value.output ? value.unit : unit
                            })
                        }}>
                            {
                                durations.map((item) => (
                                    <Select.Option key={item.type} value={item.type} unit={item.unit}>{item.label}</Select.Option>
                                ))
                            }
                        </Select>
                        <Input
                            style={{
                                width: 70,
                                textAlign: "center",
                                pointerEvents: "none",
                                backgroundColor: "#fafafa",
                                color: "rgba(0, 0, 0, 0.65)",
                            }}
                            defaultValue={'Output'}
                            disabled
                        />
                        <Select style={{ width: 100 }} value={value.output} onChange={(output, option) => {
                            const unit = option?.props?.unit
                            onChange({ ...value, output, unit })
                        }}>
                            {
                                durations.map((item) => (
                                    <Select.Option key={item.type} value={item.type} unit={item.unit}>{item.label}</Select.Option>
                                ))
                            }
                        </Select>
                        <Input
                            style={{
                                width: 120,
                                textAlign: "center",
                                pointerEvents: "none",
                                backgroundColor: "#fafafa",
                                color: "rgba(0, 0, 0, 0.65)",
                            }}
                            defaultValue={'Decimal places'}
                            disabled
                        />
                        <InputNumber 
                            value={value.places} min={0} 
                            style={{ width: 'calc(100% - 80px - 100px - 445px - 22px' }}
                            onChange={(places) => onChange({ ...value, places })}
                        />
                    </>
                )
            }
            
        </Input.Group>
    )
}

export default (props) => {

    const { form, record, label } = props;
    const { getFieldDecorator } = form;
    const { format = {} } = record;

    return (
        <Form.Item label={label || "Formatter"}>
            {getFieldDecorator("format", {
                initialValue: format || { type: 'default' },
            })(
                <Format />
            )}
        </Form.Item>
    )
}