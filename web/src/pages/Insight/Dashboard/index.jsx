import { FullScreen, FullScreenHandle, useFullScreenHandle } from "@/components/hooks/useFullScreen";
import { connect } from "dva";
import { Fragment, useEffect, useState } from "react";
import Dashboard from "./Dashboard";
import request from "@/utils/request";
import { formatESSearchResult } from "@/lib/elasticsearch/util"
import moment from "moment";
import { useHistory } from "react-router-dom";
import { stringify } from "qs";
import { Carousel } from "antd";
import styles from "./index.less";
import logo from "@/assets/logo_no_color.svg";

export default connect(({ global }) => ({
  clusterList: global.clusterList,
  clusterStatus: global.clusterStatus,
  selectedCluster: global.selectedCluster,
}))((props) => {

  const { location } = props;
  const { query } = location
  const { id } = query

  const fullScreenHandle = useFullScreenHandle();
  const history = useHistory();
  const [fullScreenOption, setFullScreenOption] = useState({})
  const [loading, setLoading] = useState(false);
  const [dashboards, setDashboards] = useState([]);
  const [actionType, setActionType] = useState();
  const [currentDashboard, setCurrentDashboard] = useState();
  const [showQueriesBar, setShowQueriesBar] = useState(true);

  const resize = () => {
    setTimeout(() => {
      const resizeEvent = new Event('resize');
      window.dispatchEvent(resizeEvent)
    }, 500)
  }

  const onFullScreen = (callback) => {
    fullScreenHandle.enter().then(() => {
      if (callback) callback()
    })
  }

  const fetchList = async (newDashboard, callback) => {
    setLoading(true)
    const res = await request("/layout/_search", { 
      queryParams: {
        from: 0,
        size: 1000,
        type: "workspace",
        is_fixed: true,
      } 
    })
    setLoading(false)
    if (res) {
      const result = formatESSearchResult(res);
      const newDashboards = result.data.sort((a, b) => moment(a.created).diff(moment(b.created), 'seconds'));
      if (newDashboards.length === 0) {
        setDashboards([])
        if (callback) callback()
        setActionType()
        replaceUrlParams({ id: undefined })
        return;
      }
      setDashboards(newDashboards)
      if (newDashboard) {
        replaceUrlParams({ id: newDashboard.id })
      }
      setActionType()
    }
  }

  const replaceUrlParams = (newParams) => {
    const newQuery = { ...query, ...newParams }
    const search = stringify(newQuery)
    history.replace(`${location.pathname}${search ? `?${search}` : ''}`)
  }

  const renderDashboard = (dashboard) => {
    return (
      <>
        <Dashboard 
          {...props}
          dashboards={dashboards}
          fetchList={fetchList}
          actionType={actionType}
          setActionType={setActionType}
          loading={loading}
          setLoading={setLoading}
          currentDashboard={dashboard}
          setCurrentDashboard={setCurrentDashboard}
          isFullScreen={fullScreenHandle.active} 
          onFullScreen={onFullScreen}
          onCarousel={() => {
            onFullScreen(() => {
              const index = dashboards.findIndex((item) => item.id === dashboard.id)
              setFullScreenOption({ isCarousel: true, initialSlide: index })
            })
          }}
          onUrlParamsChange={replaceUrlParams}
          showQueriesBar={showQueriesBar}
          setShowQueriesBar={setShowQueriesBar}
        />
      </>
    )
  }

  useEffect(() => {
    fetchList()
  }, [])

  useEffect(() => {
    if (actionType === 'create') {
      setCurrentDashboard();
      return;
    }
    if (dashboards.length === 0) {
      setCurrentDashboard();
      return;
    }
    if (id) {
      const dashboard = dashboards.find((item) => item.id === id);
      if (dashboard) {
        setCurrentDashboard(dashboard);
      } else {
        setCurrentDashboard(dashboards[0]);
      }
    } else {
      replaceUrlParams({ id: dashboards[0].id })
    }
  }, [id, JSON.stringify(dashboards), actionType])

  useEffect(() => {
    if (!fullScreenHandle.active) {
      setFullScreenOption({})
    } else {
      setActionType()
    }
    resize()
  }, [fullScreenHandle.active])

  return (
    <FullScreen handle={fullScreenHandle}>
      <div className={`${styles.container} ${fullScreenHandle.active ? styles.fullscreen : ''}`}>
        {
          fullScreenOption.isCarousel ? (
            <Carousel initialSlide={fullScreenOption.initialSlide || 0} dots={false} autoplay={true} autoplaySpeed={10000} beforeChange={(current, next) => {
              replaceUrlParams({ id: dashboards[next].id })
            }}>
              {
                dashboards.map((item) => (
                  <Fragment key={item.id}>
                    {renderDashboard(item)}
                  </Fragment>
                ))
              }
            </Carousel>
          ) : renderDashboard(currentDashboard)
        }
        {
          fullScreenHandle.active && (
            <>
              <div className={styles.watermark} style={{ bottom: 22, left: 22}}>
                <div className={styles.wrapper}>
                  <div className={styles.name}>
                    {currentDashboard?.name}
                  </div>
                </div>
              </div>
              <div className={styles.watermark} style={{ right: 22, top: 22, pointerEvents: 'auto'}}>
                <div className={styles.wrapper}>
                  <div className={styles.logo} onClick={fullScreenHandle.exit}>
                    <img src={logo} />
                  </div>
                </div>
              </div>
            </>
          )
        }
      </div>
    </FullScreen>
  )
});