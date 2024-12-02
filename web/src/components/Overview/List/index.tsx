import { List } from "antd";

interface IProps {
  dataSource: any[];
  total: number;
  from: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  renderItem: (item: any) => React.ReactNode;
}

export default (props: IProps) => {
  const {
    dataSource,
    total,
    from,
    pageSize,
    loading,
    onPageChange,
    onPageSizeChange,
    renderItem,
  } = props;

  return (
    <List
      itemLayout="vertical"
      size="small"
      bordered={false}
      loading={loading}
      pagination={{
        onChange: onPageChange,
        size: "small",
        showSizeChanger: true,
        pageSizeOptions: ["5", "10", "20"],
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} of ${total} items`,
        onShowSizeChange: (_, size) => {
          onPageSizeChange(size);
        },
        total,
        pageSize,
        current: Math.round(from / pageSize + 1),
      }}
      dataSource={dataSource}
      renderItem={(item) => (
        <List.Item style={{ paddingBottom: 0 }} key={item?._id}>
          {renderItem(item)}
        </List.Item>
      )}
    />
  );
};
