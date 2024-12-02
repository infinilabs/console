import React, { useState,useEffect,useCallback } from 'react';
import useFetch from "@/lib/hooks/use_fetch";
import { Route } from "umi";
import PageHeaderWrapper from "@/components/PageHeaderWrapper";
import { JsonParam, QueryParamProvider, useQueryParam } from "use-query-params";
import { formatMessage } from "umi/locale";
import request from "@/utils/request";
import { Tree, List, Button, message, Popconfirm,Card,Divider } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import FolderTree from './FolderTree';
import FileList from './FileList';
import "./index.scss";

const DiskManager = (props) => {
  const [selectedKey, setSelectedKey] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [queryParams, setQueryParams] = React.useState({});
  const [folders, setFolders] = useState([]);

  const instanceID = props.match.params.instance_id;
  const { loading, error, value } = useFetch(
    `/instance/${instanceID}/_proxy?method=GET&path=/stats/disk`,
    {
      method: "POST",
      queryParams: queryParams,
    },
    [queryParams]
  );

  useEffect(() => {
    if (value && value.disk) {
      if(value.disk.length > 0) {
        setSelectedFolder(value.disk[0]);
      }
    }
  }, [value]);

  const handleFolderSelect = (_, { node }) => {
    if (node && node.props.dataRef) {
        setSelectedFolder(node.props.dataRef);
      }
    };

  const handleDelete = useCallback(async(name) => {
    const resp = await request(
      `/instance/${instanceID}/_proxy?method=DELETE&path=/stats/disk/${name}`,
      {
        method: "POST",
      }
    );
    if(resp.status === 200) {
      message.success('Deleted successfully.');
    }
  },[]);
  
  return (
    <PageHeaderWrapper>
      <Card className="disk-card">
      <div style={{ marginBottom: -5, display: "flex", justifyContent: "end" }} >
        <Button
          icon="redo"
          style={{ marginLeft: 10 }}
          onClick={() => setQueryParams({ ts: new Date().valueOf() })}
        >
          {formatMessage({ id: "form.button.refresh" })}
        </Button>
        <Button
          type="primary"
          onClick={() => props.history.go(-1)}
          style={{ marginLeft: 10 }}
        >
          {formatMessage({ id: "form.button.goback" })}
        </Button>
      </div>
    </Card>
    <div style={{ display: 'flex' }}>
      <Card style={{ flex: '1 0 220px', marginTop: '5px', borderRadius: '3' }}>
        <h1>{formatMessage({ id: "menu.resource.runtime.disk" })}</h1>
        <FolderTree loading={loading} folders={value?.disk || []} selectedKeys={[value?.disk[0]?.name]} onFolderSelect={handleFolderSelect} />
      </Card>
      <Divider type="vertical" style={{ margin: '0 3px' }} />
      <Card style={{ flex: '9', marginTop: '5px', borderRadius: '3' }}>
        {selectedFolder && selectedFolder.children && selectedFolder.children.length > 0 && (
          <>
            <h2>{`Files in ${selectedFolder.name}`}</h2>
            <FileList loading={loading} files={selectedFolder.children} onDelete={handleDelete} />
          </>
        )}
      </Card>
    </div>
    </PageHeaderWrapper>
  );
};

export default (props) => {
  return (
    <QueryParamProvider ReactRouterRoute={Route}>
      <DiskManager {...props} />
    </QueryParamProvider>
  );
};