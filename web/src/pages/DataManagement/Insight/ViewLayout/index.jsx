import { formatESSearchResult } from "@/lib/elasticsearch/util";
import useFetch from "@/lib/hooks/use_fetch";
import request from "@/utils/request";
import { Drawer, Icon, Table } from "antd";
import moment from "moment";
import { useEffect, useMemo, useReducer, useState } from "react";
import LayoutList from "../../View/LayoutList";
import styles from './index.less';

export default (props) => {

    const { layout, indexPattern, clusterId, onChange } = props;
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    return (
      <>
        <Icon 
          type={"layout"}
          title={"Select View's Layout"}
          onClick={() => setVisible(true)}
        />
        <Drawer
          title="Select Layout"
          placement="right"
          onClose={() => setVisible(false)}
          visible={visible}
          width={700}
          destroyOnClose
          loading={loading}
        >
          <LayoutList layout={layout} indexPattern={indexPattern} clusterId={clusterId} isView={true} onRowSelect={onChange}/>
        </Drawer>
      </>
    )
}