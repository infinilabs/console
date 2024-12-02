import React from 'react';
import { Table, message, Popconfirm } from 'antd';
import { FolderFilled, FileFilled } from '@ant-design/icons';
import { formatMessage } from "umi/locale";
import moment from "moment";
import { formatter } from "@/lib/format";

const FileList = ({ loading, files, onDelete }) => {
  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        type === 1 ? <FolderFilled style={{ color: '#1890ff' }} /> : <FileFilled style={{ color: '#52c41a' }} /> 
      ),
    },
    {
      title: 'File Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (text, record) => {
        if (!text) {
          return 0;
        }
        const byteFormatted = formatter.bytes(text);
        return byteFormatted.size + byteFormatted.unit;
      },
    },
    {
      title: 'Create Time',
      dataIndex: 'create_time',
      key: 'create_time',
      render: (text, record) => {
        if (!text) {
          return null;
        }
        return moment(text).format('YYYY-MM-DD HH:mm:ss Z');
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (text, record) => null
      // (
      //   <Popconfirm
      //     title="Are you sure to delete this file?"
      //     onConfirm={() => onDelete(record.name)}
      //     okText="Yes"
      //     cancelText="No"
      //   >
      //   <a>{formatMessage({ id: "form.button.delete" })}</a>
      //   </Popconfirm>
      // ),
    },
  ];

  return <Table loading={loading} dataSource={files} columns={columns} rowKey="name" />;
};


export default FileList;