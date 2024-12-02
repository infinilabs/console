import DropdownList from "@/common/src/DropdownList";
import { useMemo, useState } from "react";
import { getLocale } from "umi/locale";
import { Icon } from "antd";

export default React.memo((props) => {

    const {nodes = [], onChange, mode, placeholder, renderItem, labelField="host", keyField="host", allowClear } = props;
    
    const [sorter, setSorter] = useState([])
    const [value, setValue] = useState([]);

    return (
        <DropdownList
          locale={getLocale()}
          onChange={(value) => {
            setValue(value)
            if(typeof onChange === 'function'){
              onChange(value)
            }
          }}
          allowClear={typeof allowClear !== 'undefined'}
          value={value}
          mode={mode}
          placeholder={placeholder || ''}
          rowKey={keyField}
          data={nodes}
          renderItem={typeof renderItem === 'function'? renderItem: (item) => (
            <>
              <div style={{ marginRight: 4, display: 'inline-block'}}>
                {item.master == "*" ? (
                    <Icon type="star" theme="filled" />
                  ) : (
                    <Icon type="database" />
                )}
              </div>
              {item[labelField]}
            </>
          )}
          renderLabel={(item) => item[labelField]}
          searchKey={labelField}
          sorter={sorter}
          onSorterChange={setSorter}
          sorterOptions={[
            { label: "Host", key: labelField },
          ]}
        />
    )
})