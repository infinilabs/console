import React, { forwardRef, useEffect, useRef, useState } from "react";
import { ESPrefix } from "@/services/common";
import Infos from "@/components/Overview/Detail/Infos";
import { Button, Form, Icon, message, Input, Tag, Popconfirm } from 'antd';
import styles from './Edit.scss';
import request from "@/utils/request";
import { formatMessage } from "umi/locale";

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


export default Form.create()((props)=>{
  const id = props.data?._id

  if (!props.data?._id) {
    return null;
  }

  const { getFieldDecorator } = props.form;

  const _source = props.data?._source || {}

  const { name, ip } = _source;

  const tags = _source.tags || []

  const handleSubmit = (e) => {
    e.preventDefault();
    props.form.validateFields(async (err, values) => {
      if (err) {
        return;
      }
      const res = await request(
        `/host/${id}`,
        {
          method: "PUT",
          body: values,
        }
      );
      if (res?.result === "updated") {
        message.success("save succeed");
      }
    });
  };

  useEffect(() => {
    props.form.setFieldsValue({
      name,
      ip,
      tags
    })
  }, [id])
  const onDeleteClick= async ()=>{
    const res = await request(
      `/host/${id}`,
      {
        method: "DELETE",
      }
    );
    if (res?.result === "deleted") {
      if(typeof props.onClose == "function"){
        props.onClose();
      }
      message.success("delete succeed");
    }
  }

  return (
    <div className={styles.hostEditForm} >
       <Form {...formItemLayout} onSubmit={handleSubmit} colon={false}>
        <Form.Item label={formatMessage({id:"host.edit.label.name"})}>
          {getFieldDecorator('name', {
            rules: [
              {
                required: true,
                message: 'Please input host name!',
              },
            ],
          })(<Input />)}
        </Form.Item>
        <Form.Item label={formatMessage({id:"host.edit.label.ip"})}>
          {getFieldDecorator('ip', {
            rules: [
              {
                required: true,
                message: 'Please input host ip!',
              },
            ],
          })(<Input />)}
        </Form.Item>
        <Form.Item label={formatMessage({id:"host.edit.label.tags"})}>
          {getFieldDecorator('tags')(
            <Tags />
          )}
        </Form.Item>
        <Form.Item label=" ">
          <div style={{ textAlign: "right", marginTop: 30}}>
          <Popconfirm
            title="Sure to delete?"
            onConfirm={onDeleteClick}
          >
            <Button style={{marginRight: 15}} type="primary" ghost>
              {formatMessage({id:"form.button.delete"})}
            </Button>
          </Popconfirm>
            <Button type="primary" htmlType="submit" >
            {formatMessage({id:"form.button.save"})}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  )
})

const Tags =  forwardRef((props, ref) => {
  const { value = [], onChange } = props;

  const saveInputRef = useRef(null);
  const [inputVisible, setInputVisible] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const handleClose = removedTag => {
    const newTags = value.filter(tag => tag !== removedTag);
    onChange(newTags);
  };

  const showInput = () => {
    setInputVisible(true);
  };

  const handleInputChange = e => {
    setInputValue(e.target.value)
  };

  const handleInputConfirm = () => {
    if (inputValue && value.indexOf(inputValue) === -1) {
      const newTags = [...value, inputValue];
      onChange(newTags);
      setInputVisible(false)
      setInputValue('')
    }
  };

  useEffect(() => {
    if (inputVisible) {
      saveInputRef.current?.focus();
    }
  }, [inputVisible])

  return (
    <span ref={ref}>
      {value.map((tag) => {
          const isLongTag = tag.length > 20;
          const tagElem = (
            <Tag key={tag} closable={true} onClose={() => handleClose(tag)}>
              {isLongTag ? `${tag.slice(0, 20)}...` : tag}
            </Tag>
          );
          return isLongTag ? (
            <Tooltip title={tag} key={tag}>
              {tagElem}
            </Tooltip>
          ) : (
            tagElem
          );
        })}
      {inputVisible && (
          <Input
            ref={saveInputRef}
            type="text"
            size="small"
            style={{ width: 78 }}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputConfirm}
            onPressEnter={handleInputConfirm}
          />
        )}
        {!inputVisible && (
          <Tag onClick={showInput} style={{ background: '#fff', borderStyle: 'dashed' }}>
            <Icon type="plus" /> Add New
          </Tag>
        )}
    </span>
  )
})
