import { Drawer, Icon, Input, List, Popconfirm, Select, Tag } from "antd";
import { useMemo, useState } from "react";
import { IRecord } from "../InsightBar";
import styles from "./index.less";

interface IProps {
  tags: string[];
  data: IRecord[];
  loading: boolean;
  onSelect: (item: IRecord) => void;
  onDelete: (id: string) => void;
}

export default (props: IProps) => {
  const { tags, data, loading, onSelect, onDelete } = props;

  const [visible, setVisible] = useState(false);
  const [searchTitle, setSearchTitle] = useState<string>();
  const [searchTag, setSearchTag] = useState<string>();

  const filterData = useMemo(() => {
    if (!searchTitle?.trim() && !searchTag) return data;
    let tmpData = data;
    if (searchTitle?.trim()) {
      tmpData = tmpData.filter((item) => item.title.toLowerCase().includes(searchTitle))
    }
    if (searchTag) {
      tmpData = tmpData.filter((item) => item.tags.includes(searchTag))
    }
    return tmpData
  }, [searchTitle, searchTag, data])

  return (
    <>
      <Icon type="folder-open" title="Load Queries" onClick={() => setVisible(true)}/>
      <Drawer
        title="Load Queries"
        placement="right"
        onClose={() => setVisible(false)}
        visible={visible}
        width={'50%'}
      >
        <div className={styles.list}>
          <div className={styles.filters}>
            <Input.Search
              placeholder="Please input queries title"
              onChange={(e) => {
                const {value} = e.target;
                setTimeout(() => {
                  setSearchTitle(value)
                }, 500)
              }}
              style={{ width: 300, marginRight: 8 }}
            />
            <Select 
              placeholder="Please select a tag"
              style={{ width: 300 }}
              onChange={value => setSearchTag(value as string)}
              allowClear
            >
                {
                    tags.map((item) => (
                        <Select.Option key={item}>
                            {item}
                        </Select.Option>
                    ))
                }
            </Select>
          </div>
          <List
            size="small"
            loading={loading}
            bordered
            dataSource={filterData}
            pagination={{ position: "bottom" }}
            renderItem={(item) => (
              <List.Item
                onClick={() => {
                  onSelect({ ...item, timefilter: {from: "now-15m", to: "now"} })//change by hardy
                  setVisible(false)
                }}
                actions={[
                  <Popconfirm
                    placement="topRight"
                    title="Sure to delete?"
                    onConfirm={(e) => {
                      e.stopPropagation();
                      item.id && onDelete(item.id)
                    }}
                    okText="Yes"
                    cancelText="No"
                  >
                    <a key="delete" onClick={(e) => e.stopPropagation()}>delete</a>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={item.title}
                  description={`${item.description}, Updated at ${item.updated}`}
                />
                <div>
                  {(item.tags || []).map((item) => (
                    <Tag color="blue" key={item}>{item}</Tag>
                  ))}
                </div>
              </List.Item>
            )}
          />
        </div>
      </Drawer>
    </>
  )
};
