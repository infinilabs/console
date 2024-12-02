import styles from "./LayoutGrid.less"
import GridContainer from "@/components/GridContainer";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import Widget from "./Widget";
import { WIDGETS } from "./Widget/widgets";
import { generateId } from "@/utils/utils";
import request from "@/utils/request";
import { Button, Icon, Popconfirm, Spin, message, Empty } from "antd";
import Setting from "./Setting";
import { formatMessage } from "umi/locale";
import { isEqual } from "lodash";
import QueriesBar from "./components/QueriesBar";
import WidgetConfigDrawer from "./Widget/WidgetConfig/WidgetConfigDrawer";

export const DEFAULT_COLS = 12 
export const ROW_HEIGHT = 60

export default forwardRef((props, ref) => {

    const { 
        layout,
        gridStyle = {},
        fullElementHeight,
        isEdit,
        globalQueries = {},
        onGlobalQueriesChange,
        clusterList, 
        onRecordUpdate,
        onSaveSuccess,
        type = 'view',
        refresh,
        onCancel,
        importAction,
        showQueriesBar,
        isFullScreen,
    } =  props;

    const drawerRef = useRef(null);
    const formRef = useRef(null);

    const [record, setRecord] = useState({});
    const [widgets, setWidgets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isLocked, setIsLocked] = useState(!isEdit);
    const [fullElementItem, setFullElementItem] = useState()
    const [globalRangeCache, setGlobalRangeCache] = useState()
    const [highlightRange, setHighlightRange] = useState()
    const [widgetConfigVisible, setWidgetConfigVisible] = useState(false);

    const formatWidgets = (widgets) => {
        if (!widgets) return []
        return widgets.map((item) => {
            const widget = WIDGETS.find((w) => w.type === item.type);
            const id = generateId(16)
            return { 
                ...item,
                ...widget, 
                position: {
                    ...item.position, 
                    x: Number.isInteger(item.position.x) ? item.position.x : -Infinity,
                    y: Number.isInteger(item.position.y) ? item.position.y :-Infinity,
                },
                id
            }
        })
    }

    const onLayoutSave = async (values) => {
        setLoading(true);
        const newRecord = {
            ...(layout || {}),
            ...(record || {}),
            ...values,
            config: {
                "cols": DEFAULT_COLS,
                "row_height": ROW_HEIGHT,
                ...(record?.config || {}),
                ...(layout?.config || {}),
                widgets: widgets.map((item) => {
                    const { component, type, id, defaultH, defaultW, displayName, ...rest } = item;
                    return rest;
                })
            },
            type
        }
        if (globalQueries?.view_id && newRecord.type === 'view') {
            newRecord.view_id = globalQueries.view_id;
        }
        if (layout?.id) {
            const res = await request(`/layout/${layout.id}`, {
                method: "PUT",
                body: newRecord,
            });
            if (res?.result === "updated") {
                message.success(formatMessage({id: "app.message.update.success"}));
                if (onSaveSuccess) onSaveSuccess(newRecord)
            } else {
                message.error(formatMessage({id: "app.message.update.failed"}));
            }
        } else {
            newRecord.is_fixed = true;
            const res = await request(`/layout`, {
                method: "POST",
                body: newRecord,
            });
            if (res?.result === "created") {
                message.success(formatMessage({id: "app.message.create.success"}));
                if (onSaveSuccess) onSaveSuccess({ ...newRecord, id: res._id})
            } else {
                message.error(formatMessage({id: "app.message.create.failed"}));
            }
        }
        setLoading(false);
    }

    const onLayoutsChange = (layouts) => {
        const newWidgets = [...widgets];
        layouts.forEach((layout) => {
            const { x, y, w, h, i } = layout
            const index = newWidgets.findIndex((item) => item.id === i)
            if (index !== -1) {
                newWidgets[index].position = { x, y, w, h }
            }
        })
        setWidgets(newWidgets)
    }

    const onWidgetAdd = (item) => {
        setWidgets([
            {
                ...item,
                position: {
                    x: 0,
                    y: 0,
                    w: DEFAULT_COLS,
                    h: item.defaultH,
                },
                id: generateId(16),
                title: `New Widget`,
                desc: `New Widget`,
                series: [
                    { type: item.type }
                ]
            },
            ...widgets.map((widget) => ({
                ...widget,
                position: {
                    ...widget.position,
                    y: widget.position.y + item.defaultH
                }
            })),
        ])
    }

    const onWidgetClone = (item) => {
        setWidgets([
            {
                ...item,
                position: {
                    x: 0,
                    y: 0,
                    w: item.position.w,
                    h: item.position.h,
                },
                id: generateId(16),
            },
            ...widgets.map((widget) => ({
                ...widget,
                position: {
                    ...widget.position,
                    y: widget.position.y + item.position.h
                }
            })),
        ])
    }

    const onWidgetRemove = (record) => {
        const newWidgets = [...widgets];
        const index = newWidgets.findIndex((item) => item.id === record.id)
        if (index !== -1) {
            newWidgets.splice(index, 1);
            if (record.id === fullElementItem?.id) {
                setFullElementItem()
            }
            if (newWidgets.length === 0) {
                const grid = document.getElementById("view-layout-grid")
                const layout = grid.getElementsByClassName("react-grid-layout")
                if (layout?.[0]) {
                    layout[0].style = {}
                }
            }
            setWidgets(newWidgets)
        }
    }

    const onWidgetSave = (record) => {
        const newWidgets = [...widgets];
        const index = newWidgets.findIndex((item) => item.id === record.id)
        if (index !== -1) {
            newWidgets[index] = record;
            if (fullElementItem?.id === record.id && JSON.stringify(fullElementItem) !== JSON.stringify(record)) {
                setFullElementItem(record)
            }
        } else {
            let lastWidget;
            newWidgets.forEach((item) => {
                if (!lastWidget || lastWidget.position.y <= item.position.y) {
                    lastWidget = item;
                }
            })
            newWidgets.push({
                ...record,
                position: {
                    ...(record.position || {}),
                    x: 0,
                    y: lastWidget ? lastWidget.position.y + lastWidget.position.h : 0,
                }
            })
        }
        setWidgets(newWidgets)
    }

    const onFullElement = (record) => {
        if (fullElementItem) {
            setFullElementItem()
        } else {
            setFullElementItem(record)
        }
    }

    const onGlobalRangeCacheChange = (range) => {
        setGlobalRangeCache(range)
    }

    useImperativeHandle(ref, () => ({
        onWidgetAdd: () => {},
        onLayoutCancel: () => {
            setWidgets(formatWidgets(record?.config?.widgets || []))
        },
        onLayoutSave: () => formRef.current?.open(),
        onWidgetsAdd: (newWidgets) => {
            let lastWidget;
            widgets.forEach((item) => {
                if (!lastWidget || lastWidget.position.y <= item.position.y) {
                    lastWidget = item;
                }
            })
            setWidgets([
                ...widgets,
                ...newWidgets.map((item) => {
                    const widget = WIDGETS.find((w) => w.type === item.type);
                    const id = generateId(16)
                    const y = lastWidget ? lastWidget.position.y + lastWidget.position.h + item.position.y : item.position.y;
                    return { 
                        ...item,
                        ...widget, 
                        position: {
                            ...item.position, 
                            y,
                        },
                        id
                    }
                })
            ])
        }
    }));

    useEffect(() => {
        setFullElementItem()
        setRecord(layout || { name: type === 'workspace' ? formatMessage({ id: "dashboard.workspace.new.name"}) : 'New Layout'})
        setWidgets(formatWidgets(layout?.config?.widgets))
    }, [JSON.stringify(layout), type])

    useEffect(() => {
        setIsLocked(!isEdit || isFullScreen)
    }, [isEdit, isFullScreen])

    return (
        <div key={record?.id} className={styles.layoutGrid} style={{ ...gridStyle }}>
            <Spin spinning={loading}>
            {
                !isLocked && (
                    <div className={styles.header}>
                        {
                            (
                                <div className={styles.left}>
                                    {
                                        fullElementItem ? <>&nbsp; </>: (
                                            <>
                                                <Button 
                                                    type="primary" 
                                                    size="small" 
                                                    onClick={() => setWidgetConfigVisible(true)}
                                                >
                                                    {formatMessage({id: "dashboard.action.add.widget"})}
                                                </Button>
                                                {importAction}
                                            </>
                                        )
                                    }
                                </div>
                            )
                        }
                        <div className={styles.right}>
                            <div className={styles.action} onClick={() => onLayoutSave()}>
                                <Icon type="save"/>{formatMessage({id: "dashboard.action.save"})}
                            </div>
                            <div className={styles.action}>
                                <Setting
                                    type={type} 
                                    record={record} 
                                    clusterList={clusterList}
                                    onSave={(layout) => {
                                        const newLayout = {
                                            id: generateId(20),
                                            ...layout,
                                            config: {
                                                ...layout.config,
                                                widgets
                                            }
                                        };
                                        onRecordUpdate(newLayout)
                                        setRecord(newLayout)
                                    }}
                                />
                            </div>
                            <Popconfirm
                                title={"Sure to cancel?"}
                                onConfirm={() => {
                                    setWidgets(formatWidgets(record?.config?.widgets || []))
                                    onCancel()
                                }}
                                placement="left"
                            >
                                <div className={styles.action}>
                                    <Icon type="import"/>{formatMessage({id: "dashboard.action.cancel"})}
                                </div>
                            </Popconfirm>
                        </div>
                    </div>
                )
            }
            {
                showQueriesBar && !isEdit && (
                    <QueriesBar 
                        clusterList={clusterList} 
                        globalQueries={{
                            ...globalQueries,
                            range: {
                                ...globalQueries.range,
                                ...(globalRangeCache || {})
                            }
                        }}
                        onChange={(queries) => {
                            if (!isEqual(queries.range, globalQueries.range)) {
                                setGlobalRangeCache()
                            }
                            onGlobalQueriesChange(queries)
                        }}
                    />
                )
            }
            <div className={styles.grid}>
                {
                    fullElementItem ? (
                        <div className={styles.widget} style={{ height: fullElementHeight ? fullElementHeight : '100%'}}>
                            <Widget
                                record={fullElementItem}
                                globalQueries={globalQueries}
                                onGlobalQueriesChange={onGlobalQueriesChange}
                                onClone={onWidgetClone}
                                onRemove={onWidgetRemove}
                                onSave={onWidgetSave}
                                onFullElement={onFullElement}
                                clusterList={clusterList}
                                isEdit={isEdit}
                                isFullElement={true}
                                refresh={refresh} 
                                globalRangeCache={globalRangeCache}
                                onGlobalRangeCacheChange={onGlobalRangeCacheChange}
                                highlightRange={highlightRange}
                                onHighlightRangeChange={setHighlightRange}
                                isFullScreen={isFullScreen}
                            />
                        </div>
                        
                    ) : (
                        widgets.length === 0 ? (
                            <Empty description="No Widgets"/>
                        ) : (
                            <GridContainer
                                id={"view-layout-grid"}
                                onLayoutsChange={onLayoutsChange}
                                isLocked={isLocked}
                                isResizable={true}
                                cols={record?.config?.cols}
                                rowHeight={record?.config?.row_height}
                            >
                                {widgets.map((item) => (
                                    <div className={styles.widget} key={item.id} data-grid={{...item.position, i: item.id}}>
                                        <Widget
                                            record={item}
                                            globalQueries={globalQueries}
                                            onGlobalQueriesChange={onGlobalQueriesChange}
                                            onClone={onWidgetClone} 
                                            onRemove={onWidgetRemove}
                                            onSave={onWidgetSave}
                                            onFullElement={onFullElement}
                                            clusterList={clusterList}
                                            isEdit={isEdit}
                                            isFullElement={false}
                                            refresh={refresh} 
                                            globalRangeCache={globalRangeCache}
                                            onGlobalRangeCacheChange={onGlobalRangeCacheChange}
                                            highlightRange={highlightRange}
                                            onHighlightRangeChange={setHighlightRange}
                                            isFullScreen={isFullScreen}
                                        />
                                    </div>
                                ))}
                            </GridContainer>
                        )
                    )
                }
            </div>
            <WidgetConfigDrawer 
                visible={widgetConfigVisible}
                onVisibleChange={setWidgetConfigVisible}
                globalQueries={globalQueries}
                clusterList={clusterList}
                onSave={(record) => {
                    onWidgetSave(record)
                    setWidgetConfigVisible(false)
                }}
            />
            </Spin>
        </div>
    )
})