import { Empty, Button } from "antd";
import EmailServer from "@/components/Icons/EmailServer";
import { formatMessage } from "umi/locale";
import { hasAuthority } from "@/utils/authority";

export default ({ onAddClick }) => {
  const onClick = () => {
    if (typeof onAddClick === "function") {
      onAddClick();
    }
  };
  return (
    <Empty
      image={<EmailServer />}
      imageStyle={{
        fontSize: 90,
      }}
      description={
        <div>
          <span>
            {formatMessage({ id: "settings.email.server.empty.label1" })}
          </span>
          <p>{formatMessage({ id: "settings.email.server.empty.label2" })}</p>
        </div>
      }
    >
      {
        hasAuthority("system.smtp_server:all") && (
          <Button type="primary" onClick={onClick}>
            {formatMessage({ id: "settings.email.server.empty.button.new" })}
          </Button>
        )
      }
    </Empty>
  );
};
