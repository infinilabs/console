import {
  Alert,
  Button,
  Drawer,
  Empty,
  Form,
  Icon,
  Modal,
  Spin,
  Switch,
  Tabs,
  Tooltip,
} from "antd";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import request from "@/utils/request";
import { formatMessage, getLocale } from "umi/locale";
import { formatESSearchResult } from "@/lib/elasticsearch/util";
import styles from "./FormAlertChannelTabs.less";
import { CHANNELS } from "../Channel/Index";
import { Link } from "umi";
import { cloneDeep } from "lodash";
import PopoverList from "./components/PopoverList";
import FormChannel from "../Channel/FormChannel";
import IsEmpty from "@/components/Icons/IsEmpty";

export default (props) => {

  const { form, valueProps = "", value: channels = [], onChange, handleTest, testState } = props;

  const [activeKey, setActiveKey] = useState()
  const [advancedVisible, setAdvancedVisible] = useState(false)
  const [advancedItem, setAdvancedItem] = useState()

  const initialQueryParams = {
    from: 0,
    size: 1000,
  };

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({ total: 0, data: [] });

  function reducer(queryParams, action) {
    switch (action.type) {
        case "search":
            return {
                ...queryParams,
                keyword: action.value,
            };
        case "pagination":
            return {
                ...queryParams,
                from: (action.value - 1) * queryParams.size,
            };
        case "pageSizeChange":
            return {
                ...queryParams,
                size: action.value,
            };
    }
  }

  const [queryParams, dispatch] = useReducer(reducer, initialQueryParams);

  const fetchList = async (queryParams) => {
    setLoading(true)
    const res = await request('/alerting/channel/_search', { 
      queryParams
    })
    setLoading(false)
    if (res) {
      const result = formatESSearchResult(res);
      setResult({
        data: result.data,
        total: result.total?.value ?? result.total
      })
    }
  }

  const handleTabChange = (key, action) => {
    if (action?.type !== 'click') return;
    if (key === "plus") {
      return;
    }
    if (key !== activeKey) {
      const index = channels.findIndex((item) => item.id === key)
      if (index !== -1) {
        handleSetting(channels[index], index)
      }
    }
  }

  const handleTabEdit = (key, action) => {
    if (action !== "remove") return;
    const newChannels = cloneDeep(channels)
    const index = newChannels.findIndex((item) => item.id === key);
    newChannels.splice(index, 1)
    onChange(newChannels)
  }

  const handleSetting = (item, index) => {
    const currentChannel = result.data.find((r) => r.id === item.id) || {}
    let record;
    if (item.type) {
      record = item
    } else {
      const { name, type, sub_type } = currentChannel
      record = {
        ...item,
        name, type, sub_type,
        [type]: item[type] || currentChannel[type]
      }
    }
    setAdvancedItem({
      index,
      record,
      channel: currentChannel
    })
    setAdvancedVisible(true)
  }

  const renderChannelTitle = (item) => {
    const channel = result.data.find((c) => c.id === item.id);
    let name;
    let type;
    if (channel) {
      name = channel.name;
      type = channel.sub_type || channel.type || 'webhook';
    } else {
      name = item.name || 'Unknown';
      type = item.sub_type || item.type || 'webhook';
    }
    const channelPlugin = CHANNELS.find((c) => c.key === type)
    
    return (
      <>
        {channelPlugin?.icon && (
          <Icon style={{fontSize: 16, marginRight: 4}} component={channelPlugin.icon}/>
        )}
        <span>{name}</span>
      </>
    )
  }

  const renderAddAction = (children) => {
    return (
      <PopoverList 
        title={formatMessage({ id: "alert.rule.form.label.alert_channel" })}
        result={result}
        exclude={channels}
        loading={loading}
        queryParams={queryParams}
        dispatch={dispatch}
        renderItem={renderChannelTitle}
        handleAddTo={(item) => {
          const newChannels = cloneDeep(channels)
          newChannels.push(item)
          onChange(newChannels)
        }}
      >
        {children}
      </PopoverList>
    )
  }

  // useEffect(() => {
  //   if (channels.length === 0) {
  //     setActiveKey()
  //     return;
  //   }
  //   const channel = channels.find((item) => item.id === activeKey)
  //   if (!channel) {
  //     setActiveKey(channels[0].id)
  //   }
  // }, [activeKey, JSON.stringify(channels)])

  useEffect(() => {
    fetchList(queryParams)
  }, [JSON.stringify(queryParams)])

  const empty = (
    <Empty
      image={
        <Icon style={{fontSize: 90}} component={IsEmpty}/>
      }
      description={
        renderAddAction(<Button style={{ width: 100 }} type="primary" icon="plus"></Button>)
      }
    >
      <span>
        <span style={{ marginRight: 6, color: '#aaa'}}>{formatMessage({ id: "alert.channel.empty"})}</span>
        <Link to="/alerting/channel">{`${formatMessage({ id: "app.action.create.new" })} >`}</Link>
      </span>
    </Empty>
  )

  return (
    <div className={styles.channelTabs}>
      <Form.Item label=" " colon={false}>
      <Spin spinning={loading} >
        {
          channels.length === 0 ? empty : (
            <Tabs
              hideAdd
              activeKey={activeKey}
              type="editable-card"
              onTabClick={handleTabChange}
              onEdit={handleTabEdit}
            >
              {
                channels.map((item, index) => {
                  return (
                    <Tabs.TabPane tab={(
                      <>
                        <span style={{ marginRight: 12 }}>
                          {renderChannelTitle(item)}
                        </span>
                        <span style={{ marginRight: 12 }} onClick={(e) => {e.stopPropagation()}}>
                          <Switch checked={item.enabled} onChange={(checked) => {
                            const newChannels = cloneDeep(channels)
                            newChannels[index].enabled = checked
                            onChange(newChannels)
                          }} size="small"></Switch>
                        </span>
                        <span onClick={(e) => {e.stopPropagation()}}>
                          <Tooltip title={formatMessage({ id: "app.action.advanced"})}>
                            <Icon style={{ color: 'rgba(0, 0, 0, 0.45)'}} type="setting" onClick={() => {
                              handleSetting(item, index)
                            }}/>
                          </Tooltip>
                        </span>
                      </>
                    )} key={item.id}></Tabs.TabPane>
                  )
                })
              }
              <Tabs.TabPane tab={renderAddAction(<Icon type="plus" />)} key="plus" closable={false}/>
            </Tabs>
          )
        }
      </Spin>
      </Form.Item>
      {
        advancedItem && (
          <AdvancedForm 
            renderChannelTitle={renderChannelTitle}
            advancedItem={advancedItem}
            visible={advancedVisible}
            onVisibleChange={setAdvancedVisible}
            onChange={(values) => {
              const newChannels = cloneDeep(channels);
              if (values.isDefault) {
                const { id, enabled} = newChannels[advancedItem.index];
                newChannels[advancedItem.index] = {id, enabled}
              } else {
                newChannels[advancedItem.index] = {
                  ...newChannels[advancedItem.index],
                  isAdvanced: true,
                  ...values,
                }
              }
              onChange(newChannels)
            }}
            handleTest={handleTest}
          />
        )
      }
    </div>
  );
};

const AdvancedForm = Form.create()((props) => {

  const { form, renderChannelTitle, advancedItem, visible, onVisibleChange, onChange, handleTest } = props;

  const { getFieldDecorator } = form;

  if (!advancedItem) return null;

  const handleSubmit = (params) => {
    form.validateFields((errors, values) => {
      if (errors) {
        return;
      }
      if (params.is_test) {
        const { type } = advancedItem.record
        handleTest({
          ...params,
          channel: {
            ...advancedItem.record,
            [type]: {
              ...advancedItem.record[type],
              ...values[type]
            },
            isAdvanced: true,
          }
        })
      } else {
        onChange(values);
        onVisibleChange(false)
      }
    })
  }

  return (
    <Drawer
      title={formatMessage({ id: "app.action.advanced"})}
      width={720}
      onClose={() => {
        onVisibleChange(false)
      }}
      visible={visible}
      bodyStyle={{ paddingBottom: 80 }}
      destroyOnClose
    >
      {
        <Form {...{
          labelCol: {
            xs: { span: 24 },
            sm: { span: 4 },
          },
          wrapperCol: {
            xs: { span: 24 },
            sm: { span: 20 },
          },
        }}>
          <Form.Item
            label={formatMessage({ id: "alert.channel.table.columns.name" })}
          >
            
            {renderChannelTitle(advancedItem.record)}
            {advancedItem.record.isAdvanced ? ` ${formatMessage({ id: "alert.channel.form.advanced.custom"})}` : ' '}
          </Form.Item>
          <FormChannel 
            form={form} 
            value={advancedItem.record}
            isAdvanced={true}
            handleTest={() => {
              handleSubmit({
                  is_test: true,
                  channel_index: advancedItem.index,
              })
            }}
          />
          {
            advancedItem.channel?.type && (
              <Form.Item
                label=" "
                colon={false}
              >
                <a onClick={() => {
                    const { channel } = advancedItem;
                    form.setFieldsValue({ 
                      [channel.type]: channel[channel.type]
                    })
                  }}>{formatMessage({ id: "alert.channel.form.advanced.load.default"})}</a>
              </Form.Item>
            )
          }
        </Form>
      }
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
        <Button onClick={() => {
          onVisibleChange(false)
        }} style={{ marginRight: 8 }}>
          {formatMessage({ id: "form.button.cancel"})}
        </Button>
        {
          advancedItem.channel?.type && (
            <Button onClick={() => {
              const { channel } = advancedItem;
              onChange({
                [channel.type]: channel[channel.type],
                isDefault: true
              });
              onVisibleChange(false)
            }} style={{ marginRight: 8 }}>
              {formatMessage({ id: "form.button.reset"})}
            </Button>
          )
        }
        <Button onClick={handleSubmit} type="primary">
          {formatMessage({ id: "form.button.submit"})}
        </Button>
      </div>
    </Drawer>
  )
})
