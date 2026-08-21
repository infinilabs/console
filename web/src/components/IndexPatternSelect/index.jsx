import DropdownList from "@/common/src/DropdownList";
import { useEffect, useMemo, useState } from "react";
import { HealthStatusCircle } from "../infini/health_status_circle";
import { formatMessage, getLocale } from "umi/locale";
import { Icon } from "antd";
import Link from "umi/link";
import styles from "./index.less";
import request from "@/utils/request";
import { ESPrefix } from "@/services/common";

function formatCount(count) {
  if (count == null) return "";
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return `${count}`;
}

export default (props) => {
    const t = (id, defaultMessage) => formatMessage({ id, defaultMessage });

    const { selectedIndexPattern, onIndexPatternChange, views = [], indices = [] } = props;
    
    const [sorter, setSorter] = useState([])
    const [filters, setFilters] = useState({ type: ['view', 'index']})
    const [groups, setGroups] = useState([])
    const [showGroup, setShowGroup] = useState(false)
    const [indexCounts, setIndexCounts] = useState({});

    // Extract clusterID from URL path
    useEffect(() => {
      const match = window.location.hash.match(/\/elasticsearch\/([^/?]+)/);
      if (match && match[1]) {
        const clusterID = match[1];
        request(`${ESPrefix}/${clusterID}/_cat/indices`, { method: "GET" })
          .then((res) => {
            if (res && !res.error) {
              const counts = {};
              Object.keys(res).forEach((key) => {
                counts[key] = res[key].docs_count || 0;
              });
              setIndexCounts(counts);
            }
          })
          .catch(() => {});
      }
    }, [indices]);

    const formatData = useMemo(() => {
      const formatViews = views?.map((item) => ({
        id: item.id,
        title: item.attributes?.title || item.id,
        name: item.attributes?.viewName || item.id,
        type: 'view'
      })) || []
      const formatIndices = indices?.map((item) => ({
        id: item,
        title: item,
        name: item,
        type: item.startsWith(".") ? 'specialIndex' : 'index',
      })) || []
      return formatViews.concat(formatIndices)
    }, [views, indices])

    const filterOptions = useMemo(() => {
      return showGroup ? [] : [{ 
        label: "Type", 
        key: "type", 
        list: [
          {
            label: "View",
            value: 'view',
          },
          {
            label: "Index",
            value: 'index',
          },
          {
            label: "Special Index",
            value: 'specialIndex',
          },
        ]
      }]
    }, [showGroup])

    return (
        <DropdownList
          className={styles.indexPatternSelect}
          locale={getLocale()}
          value={{
            id: selectedIndexPattern.id,
            name: selectedIndexPattern.viewName || selectedIndexPattern.title,
            type: selectedIndexPattern.type
          }}
          onChange={(item) => {
            onIndexPatternChange(item.id, item.type === 'view' ? 'view' : 'index')
          }}
          placeholder="Please select"
          rowKey="id"
          data={formatData}
          renderItem={(item) => (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span>
                <span style={{ marginRight: 4, display: 'inline-block'}}>
                  {item.type === 'view' ? <Icon type="snippets" /> : <Icon type="table" />}
                </span>
                {item.name}
              </span>
              {item.type !== 'view' && indexCounts[item.id] != null && (
                <span style={{ color: indexCounts[item.id] === 0 ? '#999' : '#006BB4', fontSize: 12, marginLeft: 8 }}>
                  {formatCount(indexCounts[item.id])}
                </span>
              )}
            </div>
          )}
          renderLabel={(item) => item.name}
          renderEmptyList={() => {
            let label = "Create Index";
            let link = "/data/index"
            if (showGroup && groups[0]?.value === 'view') {
              label = t("explore.view.btn.create", "Create View");
              link = "/data/views/create"
            } else {
              label = t("explore.index.btn.create", "Create Index");
            } 
            const action = (
              <Link to={link}>
                <span style={{
                  color: '#101010',
                  fontWeight: 500 
                }}>
                  <Icon type="plus-circle" style={{ marginRight: 6 }}/>
                  {label}
                </span>
              </Link>
            )
            return (
              <div style={{ 
                height: '100%',
                width: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
              }}>
                {action}
              </div>
            )
          }}
          searchKey="name"
          sorter={sorter}
          onSorterChange={setSorter}
          sorterOptions={[
            { label: "Name", key: "name" },
          ]}
          filters={filters}
          onFiltersChange={setFilters}
          filterOptions={filterOptions}
          groups={groups}
          onGroupsChange={setGroups}
          groupOptions={[
              {
                  key: 'type',
                  label: 'View',
                  value: 'view'
              },
              {
                  key: 'type',
                  label: 'Index',
                  value: 'index'
              },
              {
                  key: 'type',
                  label: "Special Index",
                  value: 'specialIndex',
              },
          ]}
          onGroupVisibleChange={(visible) => {
            setShowGroup(visible)
            if (visible) {
              setFilters({})
              setGroups([{ key: 'type', value: 'view'}])
            } else {
              setGroups([])
              setFilters({ type: ['view', 'index']})
            }
          }}
        />
    )
}