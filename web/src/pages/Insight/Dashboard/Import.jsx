import { formatESSearchResult } from "@/lib/elasticsearch/util";
import request from "@/utils/request";
import { Button, Drawer, Input, Popconfirm, Table } from "antd"
import moment from "moment";
import { useEffect, useMemo, useReducer, useState } from "react"
import { formatMessage } from "umi/locale";

export default (props) => {

    const { onImport } = props;

    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);

    const initialQueryParams = {
        from: 0,
        size: 10,
        type: "view"
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

    const fetchData = async (queryParams) => {
      setLoading(true)
      const res = await request("/layout/_search", { 
        queryParams
      })
      if (res) {
        const result = formatESSearchResult(res);
        setData(result.data)
      }
      setLoading(false)
    }

    useEffect(() => {
      if (visible) {
        fetchData(queryParams)
      }
    }, [queryParams, visible])

    return (
        <>
            <Button type="primary" size="small" onClick={() => setVisible(true)}>
              {formatMessage({id: "dashboard.action.import.widget"})}
            </Button>
            <Drawer
                title={formatMessage({id: "dashboard.widget.import.title"})}
                placement="right"
                onClose={() => setVisible(false)}
                visible={visible}
                width={700}
                destroyOnClose
            >
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
                        enterButton={formatMessage({ id: "form.button.search" })}
                        onSearch={(value) => {
                          dispatch({ type: "search", value });
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
                      <Button icon="redo" onClick={() => run()}>
                        {formatMessage({ id: "form.button.refresh" })}
                      </Button>
                    </div>
                  </div>
                  <Table
                    size={"small"}
                    loading={loading}
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
                    columns={[
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
                          return (
                              <Popconfirm
                                  title={formatMessage({id: "dashboard.widget.import.confirm"})}
                                  onConfirm={() => onImport(record, () => setVisible(false))}
                              >
                                <a >{formatMessage({id: "dashboard.widget.action.add"})}</a>
                              </Popconfirm>
                            )
                        }
                      },
                  ]}
                  />
            </Drawer>
        </>
    )
}