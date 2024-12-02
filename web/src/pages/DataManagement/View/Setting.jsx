import request from "@/utils/request";
import { Button, Col, Drawer, Form, Icon, Input, message, Row, Select, Spin } from "antd"
import { useEffect, useMemo, useState } from "react"
import { ESPrefix } from '@/services/common';
import { formatMessage } from "umi/locale";
import { KqlFilters } from "./components/FormItems/DataSource/Filters";

const { TextArea } = Input;

const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 3 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 19 },
    },
  }; 

export default Form.create()((props) => {

    const { type, record = {}, clusterList = [], onSave, form } = props;

    const { config = {} } = record

    const { global_queries = {} } = config;

    const { 
        cluster_id, 
        indices, 
        time_field, 
        query, 
        dsl,
        kql_filters,
    } = global_queries;

    const { getFieldDecorator } = form;

    const [visible, setVisible] = useState(false);

    const [loading, setLoading] = useState(false);

    const [selectedClusterId, setSelectedClusterId] = useState();
    const [selectedIndexPattern, setSelectedIndexPattern] = useState();
    const [isFilterAdvanced, setIsFilterAdvanced] = useState(!!dsl || !!query);

    const [indexList, setIndexList] = useState([]);
    const [objectFields, setObjectFields] = useState({});
    const [objectFieldsQueryParams, setObjectFieldsQueryParams] = useState({
        size: 10,
        keyword: "",
    });

    const fetchIndices = async (clusterId) => {
        if (!clusterId) {
          return;
        }
        setLoading(true)
        const res = await request(`/elasticsearch/${clusterId}/internal/view-management/resolve_index/*?expand_wildcards=all`)
        if (res) {
            const newIndices =  [
                ...((res.aliases || []).map((item) => ({ index: item.name }))),
                ...((res.indices || []).map((item) => ({ index: item.name })))
            ]
            setIndexList(newIndices);
        } else {
            setIndexList([]);
        }
        setLoading(false)
    };

    const onSearchObjectFields = (obj) => {
        if (!obj.keyword || obj.keyword.length <= 2) {
            return;
        }
        if (objectFieldsQueryParams.hasOwnProperty("es_type")) {
            delete objectFieldsQueryParams.es_type;
        }
        if (objectFieldsQueryParams.hasOwnProperty("aggregatable")) {
            delete objectFieldsQueryParams.aggregatable;
        }
        fetchObjectFields({ ...objectFieldsQueryParams, ...obj }, selectedClusterId);
    };

    const fetchObjectFields = async (queryParams, selectedClusterId) => {
        if (queryParams.pattern && selectedClusterId) {
            const res = await request(
                `${ESPrefix}/${selectedClusterId}/view/_fields_for_wildcard`,
                {
                  method: "GET",
                  queryParams,
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
          
                objectFields[queryParams.state_key] = res.fields.map((item) => ({
                  name: item.name,
                  label: item.name,
                  type: item.type,
                }));;
                setObjectFields({ ...objectFields });
              }
        }
    };

    const handleSave = () => {
        form.validateFields(async (err, values) => {
            if (err) {
                return false;
            }
            const {
                name, 
                description,
                cluster_id,
                indices,
                time_field,
                query,  
                dsl,
                kql_filters,
                isFilterAdvanced
            } = values;
            const newLayout = { ...record, name, description }
            newLayout.config = {
                ...(newLayout.config || {}),
                global_queries: {
                    cluster_id,
                    indices,
                    time_field,
                    query,
                    dsl: isFilterAdvanced ? dsl : undefined,
                    kql_filters: isFilterAdvanced ? undefined : kql_filters,
                }
            }
            onSave(newLayout)
            setVisible(false)
        });
    }

    useEffect(() => {
        setSelectedClusterId(cluster_id)
    }, [cluster_id])

    useEffect(() => {
        setSelectedIndexPattern(typeof indices === 'string' ? indices?.split(",") : indices)
    }, [indices])

    useEffect(() => {
        fetchIndices(selectedClusterId)
    }, [selectedClusterId])

    useEffect(() => {
        if (selectedIndexPattern) {
            setObjectFieldsQueryParams({
                ...objectFieldsQueryParams,
                pattern: typeof indices === 'selectedIndexPattern' ? selectedIndexPattern : selectedIndexPattern.join(","),
            })
        }
    }, [selectedIndexPattern]);

    useEffect(() => {
        fetchObjectFields({
            ...objectFieldsQueryParams,
            es_type: "date",
            state_key: "metric_date_field",
        }, selectedClusterId);
        fetchObjectFields({
            ...objectFieldsQueryParams,
            aggregatable: true,
            es_type: "keyword",
            state_key: "metric_keyword_field",
        }, selectedClusterId);
    }, [objectFieldsQueryParams, selectedClusterId]);

    useEffect(() => {
        if (!record.id) {
            setVisible(true)
        }
    }, [record])

    return (
        <>
            <div onClick={() => setVisible(true)}><Icon  type="setting"/>{formatMessage({id: "dashboard.action.setting"})}</div>
            <Drawer
                title={formatMessage({id: "dashboard.workspace.setting.title"})}
                placement="right"
                onClose={() => setVisible(false)}
                visible={visible}
                width={750}
                destroyOnClose
            >
                <Spin spinning={loading}>
                    <Form {...formItemLayout} colon={false}>
                        <Form.Item label={formatMessage({id: "dashboard.workspace.setting.name"})}>
                            {getFieldDecorator("name", {
                                initialValue: record?.name,
                                rules: [
                                    {
                                        required: true,
                                        message: "Please input layout name!",
                                    },
                                ],
                            })(<Input placeholder="layout name" maxLength={30}/>)}
                        </Form.Item>
                        <Form.Item label={formatMessage({id: "dashboard.workspace.setting.desc"})}>
                            {getFieldDecorator("description", {
                                initialValue: record?.description,
                            })(<TextArea rows={2} />)}
                        </Form.Item>
                        {
                            type === 'workspace' && (
                                <>
                                    <Row style={{ paddingTop: 15, marginBottom: 12 }}>
                                        <Col xs={24} sm={3}>
                                            <span style={{ color: '#101010', fontWeight: 'bold'}}>
                                                {formatMessage({id: "dashboard.widget.config.tab.source.title"})}
                                            </span>
                                        </Col>
                                        <Col xs={24} sm={19}>
                                            <span style={{ wordBreak: 'break-all', fontSize: 12}}>
                                                {formatMessage({id: "dashboard.widget.config.tab.source.title.desc"})}
                                            </span>
                                        </Col>
                                    </Row>
                                    <Form.Item label={formatMessage({id: "dashboard.widget.config.source.cluster"})}>
                                        {getFieldDecorator("cluster_id", {
                                                initialValue: selectedClusterId,
                                            })(<Select
                                                allowClear
                                                showSearch
                                                optionFilterProp={'name'}
                                                onChange={(value) => {
                                                    setSelectedClusterId(value)
                                                    form.setFieldsValue({ 
                                                        indices: undefined,
                                                        time_field: undefined,
                                                        kql_filters: undefined,
                                                        dsl: undefined
                                                    })
                                                }}
                                            >
                                                {clusterList.map((item, i) => {
                                                    return (
                                                        <Select.Option name={item.name} key={i} value={item.id}>
                                                            {item.name}
                                                        </Select.Option>
                                                    );
                                                })}
                                        </Select>)}
                                    </Form.Item>
                                    <Form.Item label={formatMessage({id: "dashboard.widget.config.source.indices"})}>
                                        {getFieldDecorator("indices", {
                                                initialValue: selectedIndexPattern,
                                            })(<Select
                                                allowClear
                                                showSearch
                                                placeholder="Type to search objects"
                                                mode="tags"
                                                onChange={(value) => {
                                                    setSelectedIndexPattern(value)
                                                    form.setFieldsValue({ 
                                                        time_field: undefined,
                                                        kql_filters: undefined,
                                                        dsl: undefined 
                                                    })
                                                }}
                                            >
                                                {indexList.map((item, i) => {
                                                    return (
                                                        <Select.Option key={i} value={item.index}>
                                                            {item.index}
                                                        </Select.Option>
                                                    );
                                                })}
                                            </Select>)
                                        }
                                    </Form.Item>

                                    <Form.Item label={formatMessage({id: "dashboard.widget.config.source.time.field"})}>
                                        {getFieldDecorator("time_field", {
                                            initialValue: time_field,
                                        })(
                                            <Select
                                                allowClear
                                                showSearch
                                                placeholder="Type to search time field"
                                                onSearch={(value) =>
                                                    onSearchObjectFields({
                                                        keyword: value,
                                                        es_type: "date",
                                                        state_key: "time_field",
                                                    })
                                                }
                                            >
                                                {(
                                                    objectFields?.time_field ||
                                                    objectFields?.metric_date_field
                                                    )?.map((item, i) => {
                                                        return (
                                                            <Select.Option key={i} value={item.name}>
                                                                {item.label}
                                                            </Select.Option>
                                                        );
                                                })}
                                            </Select>
                                        )}
                                    </Form.Item>

                                    <Form.Item label={formatMessage({id: "dashboard.widget.config.source.query"})}>
                                        {
                                            isFilterAdvanced ? (
                                                getFieldDecorator('dsl', {
                                                    initialValue: dsl,
                                                })(
                                                    <Input.TextArea rows={6} placeholder="Please input dsl"/>
                                                )
                                            ) : (
                                                getFieldDecorator('kql_filters', {
                                                    initialValue: kql_filters,
                                                })(
                                                    <KqlFilters indices={indices} clusterId={cluster_id}/>
                                                )
                                            )
                                        }
                                        {getFieldDecorator('isFilterAdvanced', {
                                            initialValue: isFilterAdvanced,
                                        })(
                                            <a onClick={() => setIsFilterAdvanced(!isFilterAdvanced)}>
                                                { isFilterAdvanced ? formatMessage({id: "dashboard.widget.config.source.filters.normal"}) : formatMessage({id: "dashboard.widget.config.source.filters.advanced"})}
                                            </a>
                                        )}
                                    </Form.Item>
                                </>
                            )
                        }

                        <Form.Item label=" ">
                            <div style={{ display: 'flex', justifyContent: 'right'}}>
                                <Button type="primary" onClick={handleSave}>{formatMessage({id: "dashboard.action.save"})}</Button>
                            </div>
                        </Form.Item>
                    </Form>
                </Spin>
            </Drawer>
        </>
    )
})