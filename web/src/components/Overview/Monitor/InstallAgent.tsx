import { Button } from "antd";
import { formatMessage } from "umi/locale";
import { getDocPathByLang, getWebsitePathByLang } from "@/utils/utils";

interface IProps {
  height?: string | number;
  desc: string;
}

export default (props: IProps) => {
  const { height = "100%", desc } = props;

  return (
    <div
      style={{
        height,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <div style={{ marginBottom: 12, textAlign: "center" }}>{desc}</div>
      <Button
        style={{ width: 120 }}
        type="primary"
        onClick={() =>
          window.open(
            `${getDocPathByLang()}/reference/agent/install/`
          )
        }
      >
        {formatMessage({ id: "infini.console.install_agent" })}
      </Button>
    </div>
  );
};
