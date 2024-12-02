import { Input } from "antd";
export default () => {
  return (
    <div>
      <div>
        Search DSL
        <Input.TextArea style={{ height: 200 }} />
      </div>
      <div>
        Overview DSL
        <Input.TextArea style={{ height: 200 }} />
      </div>
    </div>
  );
};
