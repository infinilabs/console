import Drawer, { IDrawerRef } from "@/components/Overview/Drawer";
import { Button, message, Table } from "antd";
import { useRef, useState } from "react";
import useFetch from "@/lib/hooks/use_fetch";
import request from "@/utils/request";
import { formatMessage } from "umi/locale";

interface IRecord {
  node_name: string;
  node_uuid: string;
  agent_host: string;
  agent_id: string;
  host_name: string;
  ip: string;
  os_name: string;
  source: string;
}

const Content = (props: { onAdd: (rows: IRecord[]) => void }) => {
    const [selectedRows, setSelectedRows] = useState<IRecord[]>([]);

    const { run, loading, value } = useFetch(`/host/_discover`);

    const onAdd = async () => {
      if (selectedRows.length > 0) {
        try {
          const res = await request(`/host/_enroll`, {
            method: "POST",
            body: selectedRows,
          }) as any;
          if (res?.success) {
            message.success("add successfully");
            props.onAdd(selectedRows)
            run()
            setSelectedRows([]);
          } else {
            throw new Error(JSON.stringify(res?.errors || ''))
          }
        } catch (error) {
          message.error(`add failed: ${error}`);
        }
      }
    }

    const columns = [
      {
        title: formatMessage({id:"host.new.table.column.name"}),
        dataIndex: "host_name",
        key: 'host_name'
      },
      {
        title: formatMessage({id:"host.new.table.column.os"}),
        dataIndex: "os_name",
        key: 'os_name'
      },
      {
        title: formatMessage({id:"host.new.table.column.ip"}),
        dataIndex: "ip",
        key: 'ip'
      },
      {
        title: formatMessage({id:"host.new.table.column.origin"}),
        dataIndex: "source",
        key: 'source'
      },
    ];

    return (
      <>
        <Table
            bordered
            size={"small"}
            loading={loading}
            rowSelection={{
                selectedRowKeys: selectedRows.map((item) => item.ip),
                onChange: (keys, rows) => setSelectedRows(rows),
            }}
            columns={columns}
            rowKey="ip"
            dataSource={value || []}
        />
        <div style={{ textAlign: "right", marginTop: "1em" }}>
            <Button type="primary" onClick={onAdd} disabled={selectedRows.length === 0}>
            {formatMessage({id:"host.new.button.add"})}
            </Button>
        </div>
      </>
    );
};

export default  (props: { onAdd: (rows: IRecord[]) => void }) => {

    const drawRef = useRef<IDrawerRef>(null);

    return (
        <>
            <Button type="primary" onClick={() => drawRef.current?.open()}>
            {formatMessage({id:"host.button.discover"})}
            </Button>
            <Drawer 
                ref={drawRef}
                title={formatMessage({id:"host.new.title"})}
                content={<Content onAdd={props.onAdd}/>}
            />
        </>
    )
}


  