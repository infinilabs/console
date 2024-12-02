import { Breadcrumb } from "antd";

export const BreadcrumbList = (props) => {
  const list = props.data || [];
  return (
    <div style={{ margin: "-10px -10px 10px -10px" }}>
      <div
        style={{
          background: "#fff",
          padding: "16px 32px",
          borderBottom: "1px solid #e8e8e8",
        }}
      >
        <Breadcrumb>
          {list.map((item, index) => {
            return (
              <Breadcrumb.Item key={index}>
                {item.href ? <a href={item.href}>{item.title}</a> : item.title}
              </Breadcrumb.Item>
            );
          })}
        </Breadcrumb>
      </div>
    </div>
  );
};

export default BreadcrumbList;
