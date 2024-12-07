import { Button, Card, Icon, message } from "antd";
import MessageIcon from "../../../Overview/components/Quick/icons/MessageIcon";
import { formatMessage } from "umi/locale";
import { Link } from "umi";
import { getDocPathByLang, getWebsitePathByLang } from "@/utils/utils";
import ExportAndImport from "../../components/ExportAndImport";
import Import from "../../components/Import";
import { useState } from "react";
import { hasAuthority } from "@/utils/authority";

export default ({ onSuccess }) => {
  const [importVisible, setImportVisible] = useState(false);

  return (
    <Card>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          justifyContent: "center",
          textAlign: "center",
          height: "calc(75vh)",
        }}
      >
        <Icon style={{ fontSize: 96 }} component={MessageIcon} />
        <div>
          {formatMessage({ id: "alert.rule.nodata.label.p1" })}
          <br />
          {formatMessage({ id: "alert.rule.nodata.label.p2" })}
        </div>

        {hasAuthority("alerting.rule:all") ? (
          <div
            style={{
              display: "flex",
              gap: 16,
              justifyContent: "center",
            }}
          >
            <Button
              type={"primary"}
              icon="upload"
              onClick={() => {
                setImportVisible(true);
              }}
            >
              {formatMessage({ id: "app.action.import" })}
            </Button>
            <Import
              title={formatMessage({ id: "alert.rule.export-import.label" })}
              visible={importVisible}
              onSuccess={onSuccess}
              onClose={() => setImportVisible(false)}
            />

            <Link to="/alerting/rule/new">
              <Button type="primary">
                {formatMessage({ id: "alert.rule.nodata.button.create" })}
              </Button>
            </Link>
          </div>
        ) : null}

        <a
          href={`${getDocPathByLang()}/reference/alerting/rule/`}
          target="_blank"
        >
          <Icon type="file-text" theme="twoTone" />{" "}
          {formatMessage({ id: "alert.rule.nodata.link.how_to_configure" })}
        </a>
      </div>
    </Card>
  );
};
