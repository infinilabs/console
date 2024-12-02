import GridContainer from "../GridContainer";
import styles from "./index.less";

import { FullScreen, FullScreenHandle } from "@/components/hooks/useFullScreen";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Spin } from "antd";
import { getVisualizationMeta } from "../services/elasticsearch";
import { create } from "../services/visualization";

import Widget from "./Widget";
import Helper from "./Helper";
import { DEFAULT_COLS, DRAGGABLE_HANDLE_CLS } from "../constants/layout";

interface IProps {
  indexPattern: string;
  clusterId: string;
  timeField: string;
  getFilters: () => any;
  getBucketSize: () => string;
  fullScreenHandle: FullScreenHandle,
  layout: any;
  selectedQueries: any
}

export interface IMeta {
  id?: string;
  series: ISeries[]
  title: string;
  description: string;
  position?: {
    x: number,
    y: number,
    h: number, 
    w: number, 
  },
}

export interface ISeries {
  type: string
  metric: any;
  options: string;
}

export default forwardRef((props: IProps, ref: any) => {

  const { clusterId, indexPattern, timeField, getFilters, getBucketSize, fullScreenHandle, layout, selectedQueries } = props;
  const [meta, setMeta] = useState<IMeta[]>([]);
  const [currentList, setCurrentList] = useState<IMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentLayouts, setCurrentLayouts] = useState([]);

  const onLayoutsChange = (nextPositions: any) => {
    setCurrentLayouts(nextPositions)
  };

  const getMeta = async (clusterId: any, indexPattern: any, timeField: any, filters: any) => {
    setLoading(true)
    const res = (await getVisualizationMeta({ 
      clusterId,
      indexPattern,
      timeField,
      filter: filters
    }) || [] ) as IMeta[];
    setMeta(res);
    setLoading(false)
  }

  const formatList = (selectedQueries: any, newMeta: IMeta[], newLayout: any) => {
    if (selectedQueries?.visualizations?.length > 0) {
      setCurrentList(selectedQueries.visualizations)
    } else {
      const newCurrentList: IMeta[] = [];
      newLayout.layout.forEach((item) => {
        const { type, position: { x, y, w, h }, children: { w: childW, h: childH } } = item;
        const column = Math.floor(w / childW);
        const row = Math.floor(h / childH);
        const size = column * row;
        let tmpSize = 0;
        newMeta.forEach((m, index) => {
          const { series } = m;
          if (!series || series.length === 0 ) return;
          if (series[0].type === type && tmpSize < size && newCurrentList.findIndex((item) => item.id === `${index}`) === -1) {
            const tmpX = x + (tmpSize % column * childW);
            const tmpY = y + Math.floor(tmpSize / column) * childH;
            newCurrentList.push({
              position: {
                x: tmpX,
                y: tmpY,
                w: childW,
                h: childH,
              },
              ...m,
              id: `${index}`
            })
            tmpSize++
          }
        })
      })
      setCurrentList(newCurrentList.sort((a, b) => {
        if (!a.position || !b.position) return 0;
        return (a.position.x - b.position.x) && (a.position.y - b.position.y)
      }))
    }
  }

  const onWidgetSave = async (config: any) => {
    setLoading(true)
    const res = await create({...config, index_pattern: indexPattern, cluster_id: clusterId})
    setLoading(false)
  }

  const onWidgetRemove = async (id: string) => {
    const newCurrentList = [...currentList]
    const index = newCurrentList.findIndex((item) => item.id === id)
    if (index !== -1) {
      newCurrentList.splice(index, 1)
      setCurrentList(newCurrentList)
    }
  }

  const filters = useMemo(() => {
    return getFilters()
  }, [getFilters])

  useImperativeHandle(ref, () => ({
    refreshMeta: getMeta,
    getVisualizations: () => {
      if (currentLayouts.length === 0) return currentList
      return currentList.map((item) => {
        const l = currentLayouts.find((cl: any) => cl.i === item.id) as any;
        if (l) {
          return {
            ...item,
            position: {
              ...(item.position || {}),
              x: l.x,
              y: l.y,
              w: l.w,
              h: l.h,
            }
          }
        }
        return item
      })
    }
  }));

  useEffect(() => {
    getMeta(clusterId, indexPattern, timeField, filters)
  }, [clusterId, indexPattern, timeField, filters])

  useEffect(() => {
    formatList(selectedQueries, meta, layout)
  }, [JSON.stringify(selectedQueries), JSON.stringify(meta), JSON.stringify(layout)])

  const style = fullScreenHandle.active ? {
    padding: '6px',
    overflowY: 'auto',
    overflowX: 'hidden'
  } : {
    padding: '0 6px',
  }

  return (
    <FullScreen handle={fullScreenHandle}>
        <div className={styles.container} style={style}>
          <Spin spinning={loading} tip="calculating, please wait...">
            <div style={{ width: '100%', minHeight: 500 }}>
              <GridContainer
                  cols={DEFAULT_COLS}
                  onLayoutsChange={onLayoutsChange}
                  isLocked={false}
                  isResizable={true}
                  draggableHandleCls={DRAGGABLE_HANDLE_CLS}
                >
                  {currentList.map((item, index) => (
                    <div key={item.id} data-grid={{...item.position, i: item.id}}>
                      {
                        item.id && (
                          <Widget 
                            draggableHandleCls={DRAGGABLE_HANDLE_CLS}
                            queries={{
                              clusterId, 
                              indexPattern,
                              timeField,
                              getFilters,
                              getBucketSize
                            }}
                            record={item}
                            onSave={() => {}}
                            onRemove={onWidgetRemove}
                            onUpdate={(record) => {
                              const newList = [...currentList];
                              const index = newList.findIndex((item) => item.id === record.id);
                              if (index !== -1) {
                                newList[index] = record;
                                setCurrentList(newList)
                              }
                            }}
                          />
                        )
                      }
                      
                    </div>
                  ))}
                </GridContainer>
            </div>
          </Spin>
          {
            !fullScreenHandle.active && (
              <Helper 
                queries={{
                  clusterId, 
                  indexPattern,
                  timeField,
                  getFilters,
                  getBucketSize
                }}
                loading={loading}
                data={meta}
                onAdd={(item) => {
                  setCurrentList([
                    ...currentList,
                    {
                      ...item,
                      position: {
                        x: -Infinity,
                        y: -Infinity,
                        w: 4,
                        h: 4
                      },
                      id: `${currentList.length}`
                    }
                  ])
                }}
              />
            )
          }
        </div>
    </FullScreen>
  );
});
