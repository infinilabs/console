import { Icon, Input, Modal, Pagination, Popconfirm, Popover, Spin, message } from "antd";
import styles from './index.less';
import request from "@/utils/request";
import { useEffect, useReducer, useRef, useState } from "react";
import { formatMessage } from "umi/locale";
import { formatESSearchResult } from "@/lib/elasticsearch/util";

export default (props) => {
    const { title, result, exclude = [], loading, renderItem, handleAdd, handleAddTo, handleRemove, children } = props;

    const targetRef = useRef(null);

    const [visible, setVisible] = useState(false);

    const [searchText, setSearchText] = useState();

    const [page, setPage] = useState(1);
    const size = 10;

    const filterData = result.data.filter((item) => {
      const isExcluded = exclude.find((ei) => ei.id === item.id)
      return searchText?.trim() ? item.name.includes(searchText?.trim()) && !isExcluded : !isExcluded
    })

    const content = (
      <Spin spinning={loading}>
        <div className={styles.search}>
          <Input.Search 
            allowClear
            size="small" 
            onSearch={(value) => {
              setSearchText(value)
            }}
          />
        </div>
        {
          handleAdd && (
            <div className={`${styles.item} ${styles.new}`} onClick={() => {
              handleAdd();
              targetRef.current?.click()
            }}>
              <Icon type="edit" className={`${styles.left} ${styles.active}`}/>
              <div>{formatMessage({id: "app.action.create.new"})}</div>
            </div>
          )
        }
        {filterData.filter((item, index) => {
          return (index >= (page - 1) * size) && (index < page*size)
        }).map((item) => (
          <div key={item.id} className={styles.item} style={{ cursor: item.is_fixed ? 'default' : 'pointer' }}>
            { handleAddTo && <Icon type="plus" className={`${styles.left} ${item.is_fixed ? '' : styles.active}`} style={{ cursor: item.is_fixed ? 'default' : 'pointer' }} onClick={() => handleAddTo(item)}/> }
            <div className={styles.name} onClick={() => handleAddTo(item)}>
              {renderItem ? renderItem(item) : item.name}
            </div>
            {
              handleRemove && (
                <Popconfirm
                    title={formatMessage({id: "app.message.confirm.delete"})}
                    onConfirm={() => handleRemove(item.id)}
                >
                  <Icon type="delete" className={`${styles.right} ${styles.active}`}/>
                </Popconfirm>
              )
            }
          </div>
        ))}
        <div className={styles.pager}>
          <Pagination 
            simple
            current={page}
            pageSize={size}
            total={filterData.length} 
            onChange={(page) => setPage(page)}
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
          title={title}
          onVisibleChange={(visible) => setVisible(visible)}
        >
            <div ref={targetRef}>{children}</div>
        </Popover>
    )
}