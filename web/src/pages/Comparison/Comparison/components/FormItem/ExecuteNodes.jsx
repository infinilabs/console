import { Form, Select } from "antd";
import useFetch from "@/lib/hooks/use_fetch";
import { useCallback, useMemo, useState, useEffect } from "react";
import request from "@/utils/request";
import { HealthStatusCircle } from "@/components/infini/health_status_circle";
import DropdownList from "@/common/src/DropdownList";
import { getLocale } from "umi/locale";
import { formatESSearchResult } from "@/lib/elasticsearch/util";

export default ({ record, form, onChange }) => {
  const { getFieldDecorator } = form;

  const [state, setState] = useState({
    data: [],
    total: 0,
  });
  const [sorter, setSorter] = useState([]);
  const [selectedItem, setSelectedItem] = useState({});
  const [queryParams, setQueryParams] = React.useState({ size: 10, from:0 });
  const onSelectedChange = (value) => {
    setSelectedItem(value);
    if (typeof onChange == "function") {
      onChange(value);
    }
  };
  const { loading, error, value } = useFetch(
    `/instance/_search?application=gateway`,
    {
      queryParams: queryParams,
    },
    [queryParams]
  );
  useEffect(() => {
    if (!value) {
      return;
    }
    const fetchStatus = async () => {
      let {data, total} = formatESSearchResult(value);
      debugger
      if(!data || data.length === 0) {
        return
      }
      const instanceIDs = data.map((inst) => inst.id);
      const statusRes = await request(`/instance/stats`, {
        method: "POST",
        body: instanceIDs,
      });

      if (statusRes && !statusRes.error) {
        data = data.map(item=>{
          let host = "";
          try {
            host = new URL(item.endpoint).host;
          }catch(err){
            console.error(err)
          }
          return {
            host: host,
            id: item.id,
            name: item.name,
            available: statusRes[item.id].system ? true: false,
          }
        }).sort((a, b)=>{
          if (a.available < b.available) {
            return 1;
          }
          if (a.available > b.available) {
            return -1;
          }
          return 0;
        })
        setState(st=>{
          return {
            data,
            total: total.value || total,
          }
        });
      }
    };
    fetchStatus();
  }, [value]);

  const permit = record?.settings?.execution?.nodes?.permit;
  const setCurrentPage = (page)=>{
    setQueryParams(st=>{
      return {
        ...st,
        from: (page - 1) * st.size,
      }
    });
  }
  const onSearch = (keyword)=>{
    setQueryParams(st=>{
     return {
      ...st,
      keyword,
      from: 0,
     }
    })
  }

  const onSorterChange = (sorter)=>{
    setQueryParams(st=>{
      return {
        ...st,
        form: 0,
        sort: sorter.join(":"),
      }
    })
    setSorter(sorter);
  }

  return (
    <Form.Item label="Workers">
      {getFieldDecorator("settings.execution.nodes.permit", {
        initialValue: permit ? permit?.map((item) => item.id) : [],
        rules: [
          {
            required: true,
            message: "Please select execute nodes!",
          },
        ],
      })(
        <DropdownList 
        width="100%"
        dropdownWidth={370}
        locale={getLocale()}
        selectedItem={selectedItem}
        onChange={(value) => {
          if (value) {
            onSelectedChange(value);
          }
        }}
        rowKey="id"
        data={state.data}
        renderItem={(item) => {
          if(!item.name){
            return null
          }
          return (
            <>
              <HealthStatusCircle
                status={item.available ? "available" : "unavailable"}
              />
              <strong style={{ padding: "0 10px" }}>{item.name}</strong>(
              {item.host})
            </>
          )
        }}
        mode="multiple"
        allowClear
        searchKey="name"
        placeholder={"Type keyword to search nodes"}
        onSearchChange={onSearch}
        sorter={sorter}
        onSorterChange={onSorterChange}
        sorterOptions={[
            { label: "Worker Name", key: "name" },
        ]}
        pagination={{
          currentPage: queryParams.from/queryParams.size + 1,
          pageSize: queryParams.size,
          total: state.total,
          onChange: (page) => setCurrentPage(page)
        }}
      />
      )}
    </Form.Item>
  );
};
