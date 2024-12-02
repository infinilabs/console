import { Icon, Input, Modal, Pagination, Popconfirm, Popover, Spin, message } from "antd";
import styles from './WorkSpaceList.less';
import request from "@/utils/request";
import { useEffect, useReducer, useRef, useState } from "react";
import { formatESSearchResult } from "@/lib/elasticsearch/util";
import { formatMessage } from "umi/locale";

export default (props) => {
    const { handleAdd, onAddToFixedSuccess, onRemoveSuccess } = props;

    const targetRef = useRef(null);

    const initialQueryParams = {
      from: 0,
      size: 10,
      type: "workspace"
    };

    const [visible, setVisible] = useState(false);
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
      const res = await request("/layout/_search", { 
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

    const handleAddToFixed = async (item) => {
      if (item.is_fixed) {
        return;
      }
      setLoading(true)
      const res = await request(`/layout/${item.id}`, {
          method: "PUT",
          body: {
            ...item,
            is_fixed: true
          },
      });
      if (res?.result === "updated") {
          message.success(formatMessage({id: "app.message.add.success"}));
          targetRef.current?.click()
          onAddToFixedSuccess(item)
      } else {
          message.success(formatMessage({id: "app.message.add.failed"}));
      }
      setLoading(false)
    }

    const onRemove = async (id) => {
      setLoading(true);
      const res = await request(`/layout/${id}`, {
        method: "DELETE",
      });
      if (res?.result === "deleted") {
        message.success(formatMessage({id: "app.message.delete.success"}));
        fetchList(queryParams)
        onRemoveSuccess(id)
      } else {
        message.error(formatMessage({id: "app.message.delete.failed"}));
      }
      setLoading(false);
    }

    useEffect(() => {
      if (visible) {
        fetchList(queryParams)
      }
    }, [visible, JSON.stringify(queryParams)])

    const content = (
      <Spin spinning={loading}>
        <div className={styles.search}>
          <Input.Search 
            allowClear
            size="small" 
            onSearch={(value) => {
              dispatch({ type: "search", value: value });
            }}
          />
        </div>
        <div className={`${styles.item} ${styles.new}`} onClick={() => {
          handleAdd();
          targetRef.current?.click()
        }}>
          <Icon type="edit" className={`${styles.left} ${styles.active}`}/>
          <div>{formatMessage({id: "dashboard.workspace.new"})}</div>
        </div>
        {result.data.map((item) => (
          <div key={item.id} className={styles.item} style={{ cursor: item.is_fixed ? 'default' : 'pointer' }}>
            <Icon type="plus" className={`${styles.left} ${item.is_fixed ? '' : styles.active}`} style={{ cursor: item.is_fixed ? 'default' : 'pointer' }} onClick={() => handleAddToFixed(item)}/>
            <div className={styles.name} onClick={() => handleAddToFixed(item)}>{item.name}</div>
            <Popconfirm
                title={formatMessage({id: "dashboard.workspace.delete.confirm"})}
                onConfirm={() => onRemove(item.id)}
            >
              <Icon type="delete" className={`${styles.right} ${styles.active}`}/>
            </Popconfirm>
          </div>
        ))}
        <div className={styles.pager}>
          <Pagination 
            simple
            current={result.total ? Math.floor(queryParams.from / queryParams.size) + 1 : 0}
            pageSize={queryParams.size}
            total={result.total} 
            onChange={(page) => {
              dispatch({ type: "pagination", value: page });
            }}
          />
        </div>
      </Spin>
    );

    return (
        <Popover 
          overlayClassName={styles.list} 
          placement="bottom" 
          content={content} 
          trigger="click"
          title={formatMessage({ id: "dashboard.workspace.list.title" })}
          onVisibleChange={(visible) => setVisible(visible)}
        >
            <div ref={targetRef}><Icon type="plus" /></div>
        </Popover>
    )
}