import { Icon } from "antd";
import { formatMessage } from "umi/locale";
import ElasticImg from "@/assets/elasticsearch.svg";
import EasysearchImg from "@/assets/favicon.ico";
import OpenSearchImg from "@/assets/opensearch.svg";
import "./WelcomeModalContent.scss";

const ElasticIcon = () => <img height="24px" width="24px" src={ElasticImg} />;

const EasysearchIcon = () => (
  <img height="24px" width="24px" src={EasysearchImg} />
);

const OpenSearchIcon = () => (
  <img height="24px" width="24px" src={OpenSearchImg} />
);

const engines = [
  { key: "elasticsearch", label: "Elasticsearch", icon: ElasticIcon },
  { key: "opensearch", label: "Opensearch", icon: OpenSearchIcon },
  { key: "easysearch", label: "Easysearch", icon: EasysearchIcon },
];

export default ({ linkToClusterRegist }) => {
  return (
    <div style={{ textAlign: "center", marginLeft: -38 }}>
      <div style={{ paddingBottom: 10 }}>
        {formatMessage({ id: "guide.startup.modal.subtitle" })}
      </div>
      <div>{formatMessage({ id: "guide.startup.modal.desc" })}</div>
      <div style={{ color: "#027FFE", marginTop: 13 }}>
        {formatMessage({ id: "guide.startup.modal.goto_register" })}
      </div>
      <div style={{ marginTop: 30, display: "flex", gap: 10 }}>
        {engines.map((item) => {
          return (
            <div
              key={item.key}
              className="StartupPopoverItems"
              onClick={() => linkToClusterRegist(item.key)}
            >
              <Icon component={item.icon} />
              <div style={{ paddingBottom: 10 }}>{item.label}</div>
              <Icon
                type="right-circle"
                theme="filled"
                style={{ color: "#027FFE" }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
