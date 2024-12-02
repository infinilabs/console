import { Button, Divider, Modal, Popconfirm, Input, Table, message } from "antd";
import { Fragment, useState, useEffect, useReducer, useMemo } from "react";
import moment from "moment";
import Link from "umi/link";
import useFetch from "@/lib/hooks/use_fetch";
import { formatESSearchResult } from "@/lib/elasticsearch/util";
import { formatMessage } from "umi/locale";
import request from "@/utils/request";
import styles from './LayoutList.less';
import { withRouter } from "react-router-dom";

export default withRouter((props) => {
  const { layout, indexPattern, clusterId, isView, onRowSelect } = props;

  const viewId = indexPattern.id;

  const initialQueryParams = {
    from: 0,
    size: 10,
    view_id: viewId
  };

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
  const [searchValue, setSearchValue] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState();

  const { loading, error, value, run: runLayouts } = useFetch(
    "/layout/_search",
    {
      queryParams,
    },
    [queryParams]
  );

  const { loading: viewLoading, value: view, run: runView } = useFetch(
    `/elasticsearch/${clusterId}/saved_objects/view/${viewId}`,
    {},
    [clusterId, viewId]
  );

  const onRemove = async (id) => {
    setActionLoading(true);
    const res = await request(`/layout/${id}`, {
      method: "DELETE",
    });
    if (res?.result == "deleted") {
      message.success("delete succeed");
      onRefresh()
    } else {
      message.error(`delete failed`);
    }
    setActionLoading(false);
  }

  const onSelect = (record) => {
    setSelectedRow(record)
  }

  const handleDefault = async (id) => {
    setActionLoading(true);
    const res = await request(`/elasticsearch/${clusterId}/view/${viewId}/_set_default_layout`, {
      method: "POST",
      body: {
        default_layout_id: id
      },
    })
    const handleName = `${ id ? "set" : "reset"}`
    if (res?.success) {
      message.success(`${handleName} succeed`);
      onRefresh()
    } else {
      message.error(`${handleName} failed`);
    }
    setActionLoading(false);
  }

  const onRefresh = () => {
    runLayouts();
    runView()
  }
  
  const columns = [
      {
        title: 'Name',
        dataIndex: 'name',
      },
      {
        title: 'Description',
        dataIndex: 'description',
      },
      {
        title: 'Creator',
        dataIndex: 'creator.name',
      },
      {
        title: 'Updated',
        dataIndex: 'updated',
        render: (value) => moment(value).format('YYYY-MM-DD HH:mm:ss')
      },
      {
        title: 'Actions',
        render: (value, record) => {
          const resetDefaultAction = (
            <Popconfirm
                title={"Sure to reset the default layout?"}
                onConfirm={() => handleDefault("")}
            >
              <a >Reset Default</a>
            </Popconfirm>
          )
          const setDefaultAction = (
            <Popconfirm
                title={"Sure to set this layout as the default?"}
                onConfirm={() => handleDefault(record.id)}
            >
              <a >Set Default</a>
            </Popconfirm>
          )

          const defaultAction = view?._source?.default_layout_id === record.id ? resetDefaultAction : setDefaultAction

          return (
            isView ? (
              <Fragment>
                  {
                    selectedRow?.id !== record.id && (
                      <a onClick={() => {
                        onRowSelect(record);
                      }}>Preview</a>
                    )
                  }
                  <Divider type="vertical" />
                  { defaultAction }
              </Fragment>
            ) : (
              <Fragment>
                  <Link to={`patterns/${viewId}/layout/${record.id}/edit`}>
                    Edit
                  </Link>
                  <Divider type="vertical" />
                  <Popconfirm
                      title={"Sure to delete?"}
                      onConfirm={() => onRemove(record.id)}
                  >
                      <a>Delete</a>
                  </Popconfirm>
                  <Divider type="vertical" />
                  { defaultAction }
              </Fragment>
            )
          )
        }
      },
  ];

  useEffect(() => {
    setSelectedRow(layout)
  }, [layout])

  const data = useMemo(() => {
    const result = formatESSearchResult(value);
    return result.data
  }, [value])

  return (
    <div style={{ padding: '20px 0'}}>
      
      <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 15,
          }}
        >
          <div style={{ maxWidth: 500, flex: "1 1 auto" }}>
            <Input.Search
              allowClear
              placeholder="Type keyword to search"
              enterButton="Search"
              onSearch={(value) => {
                dispatch({ type: "search", value });
              }}
              onChange={(e) => {
                setSearchValue(e.currentTarget.value);
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Button icon="redo" onClick={onRefresh}>
              {formatMessage({ id: "form.button.refresh" })}
            </Button>
            {
              !isView && (
                <Link to={`patterns/${viewId}/layout/create`}>
                  <Button type="primary" icon="plus">
                    New
                  </Button>
                </Link>
              )
            }
          </div>
        </div>
      <Table
        size={"small"}
        loading={loading || actionLoading || viewLoading}
        bordered
        dataSource={data}
        rowKey={"id"}
        pagination={{
          size: "small",
          pageSize: 20,
          total: data.length,
          onChange: (page) => {},
          showSizeChanger: true,
          onShowSizeChange: (_, size) => {},
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
        }}
        columns={columns}
        rowClassName={(record) => record.id === selectedRow?.id ? styles.selected : ""}
      />
    </div>
  )
})