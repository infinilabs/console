import styles from './index.less';
import { Button, Col, Divider, Form, Input, Row, Select } from "antd";
import FormAlertMetricGroups from '@/pages/Alerting/Rule/FormAlertMetricGroups';
import FormAlertMetric from '@/pages/Alerting/Rule/FormAlertMetric';
import Chart from '../WidgetBody/Chart';
import { useEffect, useState } from 'react';
import { IMeta } from '../..';
import { ESPrefix } from '@/services/common';
import request from "@/utils/request";

interface IProps {
    queries: {
        indexPattern: string;
        clusterId: string;
        timeField: string;
        getFilters: () => any;
        getBucketSize: () => string;
    };
    record: IMeta;
    onCancel: () => void;
    onUpdate: (record: IMeta) => void;
}

export default Form.create()((props: IProps) => {

    const { queries, record, onCancel, onUpdate } = props;

    const { indexPattern, clusterId, getBucketSize } = queries;

    const [changedRecord, setChangedRecord] = useState(record);

    const { type, metric } = changedRecord.series[0];

    const { groups, items = [] } = metric;

    const [changedTitle, setChangedTitle] = useState<string>(changedRecord.title);
    const [changedType, setChangedType] = useState<string>(type);

    const [objectFields, setObjectFields] = useState({});

    const [objectFieldsQueryParams, setObjectFieldsQueryParams] = useState({
        pattern: indexPattern,
        size: 10,
        keyword: "",
    });

    const onSearchObjectFields = (obj: any) => {
        if (obj.keyword && obj.keyword.length <= 2) {
        return;
        }
        if (objectFieldsQueryParams.hasOwnProperty("es_type")) {
        delete objectFieldsQueryParams.es_type;
        }
        if (objectFieldsQueryParams.hasOwnProperty("aggregatable")) {
        delete objectFieldsQueryParams.aggregatable;
        }
        setObjectFieldsQueryParams({ ...objectFieldsQueryParams, ...obj });
    };

    const fetchObjectFields = async (obj: any = {}) => {
        let queryParams = {
            ...objectFieldsQueryParams,
            ...obj,
        };
        const res = await request(
          `${ESPrefix}/${clusterId}/view/_fields_for_wildcard`,
          {
            method: "GET",
            queryParams: queryParams,
          }
        );
        if (res?.fields) {
          let selectFields = [];
          res.fields.map((item) => {
            selectFields.push({
              name: item.name,
              label: item.name,
              type: item.type,
            });
          });
    
          objectFields[queryParams.state_key] = selectFields;
          setObjectFields({ ...objectFields });
        }
      };

      const onApply = () => {
        props.form.validateFields((err, values) => {
            if (err) {
              return false;
            }
            onUpdate(getNewRecord(values))
        });
      }

      const getNewRecord = (values: any) => {
        const newSeries = {
            ...changedRecord.series[0],
            type: changedType,
        }
        const { alert_objects = [] } = values;
        if (alert_objects.length !== 0) {
            const { metrics: { groups, items } } = alert_objects[0]
            let newMetric = { items }
            if (groups.filter((item) => !!item.field).length !== 0) {
                newMetric.groups =  groups;
            }
            return {
                ...changedRecord,
                title: changedTitle,
                series: [
                    {
                        ...newSeries,
                        metric: newMetric
                    },
                    ...changedRecord.series.slice(1),
                ]
            }
        }
        return {
            ...changedRecord,
            title: changedTitle,
            series: [
                newSeries,
                ...changedRecord.series.slice(1),
            ]
        }
      }

      const onPreviewChartChange = () => {
        setTimeout(() => {
            props.form.validateFields((err, values) => {
                if (err) {
                  return false;
                }
                const newRecord = getNewRecord(values);
                setChangedRecord(newRecord)
            });
        }, 1000)
      }

      useEffect(() => {
        fetchObjectFields();
      }, [objectFieldsQueryParams]);

      useEffect(() => {
        fetchObjectFields({
          es_type: "date",
          state_key: "metric_date_field",
        });
        fetchObjectFields({
          aggregatable: true,
          es_type: "keyword",
          state_key: "metric_keyword_field",
        });
      }, [indexPattern]);

      useEffect(() => {
        if (JSON.stringify(record) !== JSON.stringify(changedRecord)) {
            setChangedRecord(record)
        }
      }, [record])

    return (
        <>
            <div style={{ height: 'calc(100vh - 120px)'}}>
                <div style={{ height: '30%', width: '100%', padding: '24px'}}>
                    <Chart 
                        queries={queries} 
                        record={{
                            ...changedRecord,
                            series: [
                                {...changedRecord.series[0], type: changedType},
                                ...changedRecord.series.slice(1),
                            ]
                        }} 
                    />
                </div>
                <div style={{ width: '100%', height: '70%', overflow: 'hidden', padding: '0 24px'}}>
                    <Form layout="inline" style={{ height: 'calc(100% - 57px)', overflowY: 'auto', overflowX: 'hidden'}}>
                        <Row gutter={16}>
                            <Divider orientation="left">
                                Visualization
                            </Divider>
                            <Col span={20} offset={2} className={styles.settingItem}>
                                <Form.Item label="Title">
                                    <Input style={{ width: 750 }} defaultValue={changedTitle} onChange={(e) => setChangedTitle(e.target.value)}/>
                                </Form.Item>
                            </Col>
                            <Col span={20} offset={2} className={styles.settingItem}>
                                <Form.Item label="Type">
                                    <Select style={{ width: 750 }} defaultValue={changedType} onChange={setChangedType}>
                                        <Select.Option value="line">Line</Select.Option>
                                        <Select.Option value="column">Column</Select.Option>
                                        <Select.Option value="area">Area</Select.Option>
                                        <Select.Option value="pie">Pie</Select.Option>
                                        <Select.Option value="number">Number</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Divider orientation="left">
                                Data
                            </Divider>
                            <Col span={20} offset={2} className={styles.settingItem}>
                                <Form.Item label="Groups">
                                    <FormAlertMetricGroups
                                        form={props.form}
                                        objectFields={objectFields}
                                        metrics={{groups}}
                                        onSearchObjectFields={onSearchObjectFields}
                                        onPreviewChartChange={onPreviewChartChange}
                                    />
                                </Form.Item>
                                <Form.Item label="Metrics">
                                    <FormAlertMetric
                                        form={props.form}
                                        objectFields={objectFields}
                                        metrics={{items}}
                                        statPeriod={getBucketSize() || '1m'}
                                        onSearchObjectFields={onSearchObjectFields}
                                        onPreviewChartChange={onPreviewChartChange}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </div>
            </div>
            <div
                style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: '100%',
                borderTop: '1px solid #e9e9e9',
                padding: '10px 16px',
                background: '#fff',
                textAlign: 'right',
                }}
            >
                <Button style={{ marginRight: 8 }} onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="primary" onClick={onApply}>
                    Apply
                </Button>
            </div>
        </>
    )
})