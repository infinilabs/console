import request from "@/utils/request"
import { Badge, Button, Card, Drawer, Empty, Icon, Input, List, message, Modal, Popconfirm, Select, Table, Tabs, Tag } from "antd"
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react"
import styles from "./Dashboard.less"
import moment from "moment"
import useFetch from "@/lib/hooks/use_fetch"
import { formatESSearchResult } from "@/lib/elasticsearch/util"
import { generateId } from "@/utils/utils"
import LayoutGrid from "@/pages/DataManagement/View/LayoutGrid"
import Import from "./Import"
import { Prompt, useHistory } from "react-router-dom";
import { router } from "umi"
import Save from "./Save"
import DropdownOptions from "./DropdownOptions"
import { hasAuthority } from "@/utils/authority"
import WorkSpaceList from "./WorkSpaceList"
import { formatMessage } from "umi/locale";
import dateMath from '@elastic/datemath';
import SearchMenu from "@/components/Icons/SearchMenu"
import _, { isEqual } from "lodash"
import { generateFilter } from "@/pages/DataManagement/View/components/QueriesBar/generate_filters"
import FullScreenDropdown from "./FullScreenDropdown"

export default (props) => {

    const { 
      clusterList, clusterStatus, selectedCluster, location, 
      dashboards, fetchList, 
      actionType, setActionType, 
      loading, setLoading,
      currentDashboard, setCurrentDashboard,
      isFullScreen, onFullScreen, onCarousel,
      onUrlParamsChange,
      showQueriesBar, setShowQueriesBar
    } = props;
    const { query } = location
    const { id, from, to, ...restParams } = query
    const history = useHistory();
    const layoutRef = useRef();
    const [refresh, setRefresh] = useState();
    const [showQueriesBarIconDot, setShowQueriesBarIconDot] = useState(false);
    const [queriesBarParams, setQueriesBarParams] = useState({
      range: {
        isPaused: true,
        refreshInterval: 10000,
        from: "now-15m",
        to: "now",
      }
    })
    const { range } = queriesBarParams;
    const intervalRef = useRef()

    const isRangeInvalid = (start, end) => {
      if (start === 'now' && end === 'now') {
        return true;
      }
    
      const startMoment = dateMath.parse(start);
      const endMoment = dateMath.parse(end, { roundUp: true });
    
      const isInvalid =
        !startMoment ||
        !endMoment ||
        !startMoment.isValid() ||
        !endMoment.isValid() ||
        !moment(startMoment).isValid() ||
        !moment(endMoment).isValid() ||
        startMoment.isAfter(endMoment);

      return isInvalid;
    }

    const handleAdd = () => {
      if (actionType === 'create') {
        return;
      }
      setActionType('create')
      onUrlParamsChange({ id: undefined })
    }

    const onRemove = async (id) => {
      if (id === 'create') {
        setActionType()
        onUrlParamsChange({ id: undefined })
        return;
      }
      const dashboard = dashboards.find((item) => item.id === id);
      if (!dashboard) return;
      setLoading(true);
      const res = await request(`/layout/${id}`, {
        method: "PUT",
        body: {
          ...dashboard,
          is_fixed: false
        }
      });
      if (res?.result === "updated") {
        message.success(formatMessage({id: "app.message.remove.success"}));
        if (id === currentDashboard?.id) {
          setActionType()
          onUrlParamsChange({ id: undefined })
        }
        fetchList()
      } else {
        setLoading(false);
        message.error(formatMessage({id: "app.message.remove.failed"}));
      }
    }

    const handleTabChange = (key, action) => {
        if (action?.type !== 'click') return;
        if (key === "plus") {

          return;
        }
        if (actionType && (key === 'create' || key !== currentDashboard?.id)) {
          showUnsavedConfirm(() => {
            setActionType();
            changeLayout(key)
          })
        } else {
          changeLayout(key)
        }
    }

    const changeLayout = (id) => {
      const dashboard = dashboards.find((tab) => tab.id === id);
      if (dashboard) {
        onUrlParamsChange({ id: dashboard.id })
      }
    }

    const handleTabEdit = (key, action) => {
      if (action !== "remove") return;
      Modal.confirm({
        title: formatMessage({id: "dashboard.tab.delete.confirm.title"}),
        content: formatMessage({id: "dashboard.tab.delete.confirm.content"}),
        okText: formatMessage({id: "dashboard.tab.delete.confirm.ok"}),
        cancelText: formatMessage({id: "dashboard.tab.delete.confirm.cancel"}),
        onOk: () => onRemove(key)
      });
    }

    const handleAddLayout = (layout, callback) => {
      if (layout?.config?.widgets?.length !== 0) {
        layoutRef?.current?.onWidgetsAdd(layout.config.widgets)
        if (callback) callback()
      }
    }

    const handlePrompt = (location) => {
      if (location.pathname === '/insight/dashboard' && !location.search) {
        return promptConfirm(location)
      }

      if (!actionType || location.pathname === '/insight/dashboard') {
        return true;
      }
      return promptConfirm(location)
    };

    const promptConfirm = (location) => {
      showUnsavedConfirm(() => {
        setActionType()
        setCurrentDashboard()
        setTimeout(() => {
          history.push(location.pathname);
        });
      })
      return false;
    }

    const handleCancel = () => {
      if (actionType === 'create') {
        setActionType()
        const newDashboard = dashboards[0]
        onUrlParamsChange({ id: newDashboard?.id})
      }
      setActionType()
    }

    const handleSave = () => {
      if (actionType) {
        layoutRef.current?.onLayoutSave()
      }
    }

    const showUnsavedConfirm = (onOk) => {
      Modal.confirm({
        title: formatMessage({id: "dashboard.unsaved.confirm.title"}),
        content: formatMessage({id: "dashboard.unsaved.confirm.content"}),
        okText: formatMessage({id: "dashboard.unsaved.confirm.ok"}),
        cancelText: formatMessage({id: "dashboard.unsaved.confirm.cancel"}),
        onOk
      });
    }

    const isAdmin = hasAuthority("insight.dashboard:all");

    const isCreate = actionType === 'create';

    const showAdd = isAdmin && !actionType;

    const globalQueries = {
      ...(currentDashboard?.config?.global_queries || {}),
      ...queriesBarParams,
    };

    useEffect(() => {
      setQueriesBarParams({
        range: {
          isPaused: true,
          refreshInterval: 10000,
          from: "now-15m",
          to: "now",
        }
      })
    }, [currentDashboard?.id])

    useEffect(() => {
      if (from && to && !isRangeInvalid(from, to)) {
        setQueriesBarParams({
          range: {
            ...range,
            from,
            to
          }
        })
      }
    }, [from, to])
    
    useEffect(() => {
      if (globalQueries?.indices?.length > 0) {
        const fields = Object.keys(restParams);
        let newFilters = []
        fields.forEach((field, index) => {
          newFilters = generateFilter(
            newFilters,
            field,
            restParams[field],
            '+',
            globalQueries?.indices[0]
          )
        })
        setQueriesBarParams({
          ...queriesBarParams,
          filters: newFilters
        })
      }
    }, [JSON.stringify(restParams), JSON.stringify(globalQueries?.indices)])

    useEffect(() => {
      if (range.isPaused === true || intervalRef.current) {
        clearInterval(intervalRef.current)
        return;
      }
      if (range.isPaused === false) {
        intervalRef.current = setInterval(() => {
          setRefresh(new Date().getTime())
        }, [range.refreshInterval || 10000])
      }
    }, [JSON.stringify(range)])

    const renderGrid = () => {
      return (
          <LayoutGrid 
            ref={layoutRef}
            gridStyle={isFullScreen ? { padding: 0} : { padding: '20px 0 0 0'}}
            fullElementHeight={'calc(100vh - 178px)'}
            isEdit={!!actionType}
            type={"workspace"}
            layout={isCreate ? undefined : currentDashboard }
            globalQueries={globalQueries}
            onGlobalQueriesChange={(queries) => {
              if (isEqual(queries, globalQueries)) {
                setRefresh(new Date().valueOf())
              } else {
                setQueriesBarParams({
                  ...queriesBarParams,
                  ...queries
                })
                if (!showQueriesBar) {
                  setShowQueriesBarIconDot(true)
                }
              }
            }}
            clusterList={clusterList}
            clusterStatus={clusterStatus}
            onRecordUpdate={(record) => setCurrentDashboard(record)}
            onSaveSuccess={(record) => {
              fetchList(record)
            }}
            refresh={refresh}
            onCancel={handleCancel}
            importAction={<Import onImport={handleAddLayout}/>}
            showQueriesBar={showQueriesBar}
            isFullScreen={isFullScreen}
        />
      )
    }

    const tabsElement = (
      <Tabs 
        hideAdd
        activeKey={isCreate ? 'create' : currentDashboard?.id} 
        className={showAdd ? `${styles.tabs}` : `${styles.tabs} ${styles.noActions}`} 
        onTabClick={handleTabChange} 
        onEdit={handleTabEdit}
        type="editable-card"
        tabBarExtraContent={(currentDashboard || isCreate) && (
          <div className={styles.actions}>
            <Badge dot={showQueriesBar ? false : showQueriesBarIconDot}>
              <Icon style={{ fontSize: 20 }} component={SearchMenu} onClick={() => {
                if (!showQueriesBar && showQueriesBarIconDot) {
                  setShowQueriesBarIconDot(false)
                }
                setShowQueriesBar(!showQueriesBar)
              }}/>
            </Badge>
            <DropdownOptions isAdmin={isAdmin} id={id} onImportSuccess={fetchList} />
            {
              !actionType && (
                <FullScreenDropdown
                  onFullScreen={onFullScreen}
                  onCarousel={onCarousel}
                />
              )
            }
            { isAdmin && !actionType && <Icon type={'edit'} onClick={() => setActionType('edit')}/>}
          </div>
        )}
    >
        { dashboards.map((tab) => (
          <Tabs.TabPane 
            tab={tab.id === currentDashboard?.id ? currentDashboard?.name : tab.name} 
            key={tab.id} 
            closable={actionType ? (isAdmin ? !tab.reserved : false) : false}
          />
        )) }
        { isCreate && (
          <Tabs.TabPane 
            tab={currentDashboard?.name || formatMessage({ id: "dashboard.workspace.new.name"}) } 
            key={'create'} 
          />
        )}
        { showAdd && (
          <Tabs.TabPane tab={(
            <WorkSpaceList 
              handleAdd={handleAdd} 
              onAddToFixedSuccess={(record) => {
                fetchList(record)
              }}
              onRemoveSuccess={(id) => {
                if (id === currentDashboard?.id) {
                  setActionType()
                  onUrlParamsChange({ id: undefined })
                }
                fetchList()
              }}
            />
          )} key="plus" closable={false}/>
        )}
    </Tabs>
    )

    return (
      <Card className={`${styles.dashboard} ${isFullScreen ? styles.fullscreen : ''}`} loading={loading}>
          <Prompt when={!!actionType} message={handlePrompt} />
          { !isFullScreen && tabsElement }
          <div className={styles.content} key={isCreate ? 'create' : currentDashboard?.id }>
            { dashboards.length === 0 && !isCreate ? <Empty /> : renderGrid() }
          </div>
      </Card>
    )
}