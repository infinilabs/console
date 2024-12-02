import { message, Icon, Menu, Dropdown } from "antd";
import request from "@/utils/request";
import { useEffect, useMemo, useReducer, useState } from "react";
import { formatMessage } from "umi/locale";
import ImportDashboard from "./ImportDashboard";

export default (props) => {
  const { isAdmin, id, onImportSuccess } = props;

  const [loading, setLoading] = useState(false);

  const onClickExport = () => {
    fetchData(id);
  };

  const handleDownload = (fileName, data) => {
    const blob = new Blob([JSON.stringify(data, undefined, 4)], {
        type: "text/json",
      }),
      a = document.createElement("a");
    a.download = `console_dashboard_config_${fileName}.json`;
    a.href = window.URL.createObjectURL(blob);
    a.dataset.downloadurl = ["text/json", a.download, a.href].join(":");
    a.click();
  };

  const fetchData = async (id) => {
    setLoading(true);
    const res = await request(`/layout/${id}`);
    if (res?.found && res?._source) {
      let data = res._source;
      let fileName = data.name;
      handleDownload(fileName, data);
    } else {
      console.log("Fetch data error, res:", res);
      message.error("Fetch data error");
    }

    setLoading(false);
  };

  const menu = (
    <Menu>
      <Menu.Item key={"export"}>
        <a onClick={onClickExport}>
          <Icon type={"download"} />{" "}
          {formatMessage({ id: "dashboard.workspace.button.export" })}{" "}
          {loading ? <Icon type={"loading"} /> : ""}
        </a>
      </Menu.Item>
      <Menu.Item key={"import"} disabled={!isAdmin}>
          <ImportDashboard
            isAdmin={isAdmin}
            onSubmitSuccess={() => {
              onImportSuccess();
            }}
          />
      </Menu.Item>
      
    </Menu>
  );

  return (
    <Dropdown overlay={menu} placement="bottomRight">
      <Icon type={"select"} />
    </Dropdown>
  );
};
