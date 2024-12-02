import { Form, Input, InputNumber, Select, Switch, Divider } from "antd";
import styles from './index.less';
import { useMemo, useState } from "react";

const InputGroup = Input.Group;
const { Option } = Select;
interface IProps {
   trackTotalHits: boolean;
   timeout: number;
   onChange: (value: any, name: string) => void;
   whetherToSample: boolean;
   sampleSize: number;
   topNumber: number;
   sampleRecords: string;
}

const timeIntervals = [
  { label: 'Seconds', value: 's' },
  { label: 'Minutes', value: 'm' },
  { label: 'Hours', value: 'h' },
  { label: 'Days', value: 'd' },
];

export default (props: IProps) => {

    const { trackTotalHits, timeout, onChange, whetherToSample, sampleSize, topNumber, sampleRecords } = props;

    const timeoutObject = useMemo(() => {
      const value = parseInt(timeout);
      return {
        value,
        unit: timeout.replace(`${value}`, ''),
      }
    }, [timeout])
    
    return (
      <Form 
        labelCol={{
          sm: { span: 6 },
        }}
        wrapperCol={{
          sm: { span: 18 },
        }} 
        className={styles.form}
        colon={false}
      >
        <Form.Item label="Track Total Hits">
            <Switch 
                size="small"
                checked={trackTotalHits} 
                onChange={(checked) => onChange(checked, 'track_total_hits')} 
            />
        </Form.Item>
        <Form.Item label="TimeOut">
          <div style={{ display: 'flex'}}>
            <Input.Group compact>
              <InputNumber
                value={timeoutObject.value}
                onChange={(value) => onChange(`${value}${timeoutObject.unit}`, 'time_out')}
                min={1}
                style={{ 
                  borderTopRightRadius:0,
                  borderBottomRightRadius:0,
                  width: 100
                }}
              />
              <Select value={timeoutObject.unit} onChange={(value) => onChange(`${timeoutObject.value}${value}`, 'time_out')} style={{ width: 100 }}>
                {timeIntervals.map((item) => (
                    <Select.Option key={item.value} value={item.value}>
                      {item.label}
                    </Select.Option>
                  ))}
              </Select>
            </Input.Group>
          </div>
        </Form.Item>
        <Divider orientation="left">Field Summary</Divider>
        <Form.Item label="Whether to sample">
            <Switch 
                size="small"
                checked={whetherToSample!==undefined ? whetherToSample : true} 
                onChange={(checked) => onChange(checked, 'whether_to_sample')} 
            />
        </Form.Item>
        <Form.Item label="Sample records">
        <InputGroup compact>
          <Select
            style={{ width: '30%' }}
            defaultValue={sampleRecords || 'manual'}
            onChange={(value) => onChange(value, 'sample_records')}>
            <Option key="all" value="all">all records</Option>
            <Option key="manual" value="manual">manual setting</Option>
          </Select>
          {sampleRecords==='manual'?<InputNumber
            min={1000}
            max={1000000}
            step={1000}
            defaultValue={sampleSize || 5000}
            onChange={(value) => onChange(value, 'sample_size')} />:null}
        </InputGroup>
        </Form.Item>
        <Form.Item label="Top number">
          <InputNumber
            min={5}
            max={100}
            step={5}
            defaultValue={topNumber || 5}
            onChange={(value) => onChange(value, 'top_number')} />
        </Form.Item>
      </Form>
    )
}