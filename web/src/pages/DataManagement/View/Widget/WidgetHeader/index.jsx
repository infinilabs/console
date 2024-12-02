import styles from './index.less';
import { Divider, Dropdown, Icon, Menu } from "antd";
import { formatMessage } from "umi/locale";
import { WIDGETS } from '../widgets';
import { useMemo } from 'react';
import FullScreenExit from '@/components/Icons/FullScreenExit';
import FullScreen from '@/components/Icons/FullScreen';
import ZoomOut from '@/components/Icons/ZoomOut';
import ZoomIn from '@/components/Icons/ZoomIn';
import Mark from '@/components/Icons/Mark';
import ResetTime from '@/components/Icons/ResetTime';
import GroupDropdown from './GroupDropdown';

export default (props) => {

    const { 
        record, 
        isChanged,
        onRecordChange,
        onRecordReset,
        globalQueries,
        isEdit, 
        isFullElement, 
        handleFullElement, 
        zoom,
        handleZoom,
        handleEdit, 
        handleClone,
        handleRemove,
        isFullScreen,
        handleLayerChange 
    } = props;


    const { title, series = [], is_layered, layer_index } = record;

    const { type, metric = {} } = series[0] || {}

    const { groups = [] } = metric

    let titleClassName = styles.title;
    if (isEdit) {
        titleClassName += " widget-drag-handle"
    }

    const widget = useMemo(() => {
        return WIDGETS.find((p) => p.type === type);
    }, [type]) 

    return (
        <div className={styles.header}>
            <div className={titleClassName} style={{ cursor: isEdit ? "move" : "initial"}}>{title}</div>
            {
                !isFullScreen && (<div className={styles.actions}>
                    {
                        isEdit ? ( 
                            <Dropdown overlay={(
                                <Menu>
                                    <Menu.Item onClick={handleEdit}>
                                        <Icon 
                                            type="setting" 
                                        />
                                        {formatMessage({id: "dashboard.widget.action.setting"})}
                                    </Menu.Item>
                                    <Menu.Item onClick={() => handleClone(record)}>
                                        <Icon type="copy"/>
                                        {formatMessage({id: "dashboard.widget.action.clone"})}
                                    </Menu.Item>
                                    <Menu.Item onClick={() => handleRemove(record)}>
                                        <Icon type="delete"/>
                                        {formatMessage({id: "dashboard.widget.action.delete"})}
                                    </Menu.Item>
                                </Menu>
                            )} placement="bottomRight" trigger={'click'}>
                                <Icon title={"setting"} type="ellipsis" />
                            </Dropdown>
                        ) : (
                            <>
                                <Icon title={"reset"} className={isChanged ? '' : styles.disabled} component={ResetTime} onClick={onRecordReset}/>
                                { widget?.widgetHeaderActions && (
                                    <widget.widgetHeaderActions 
                                        record={record} 
                                        onRecordChange={onRecordChange} 
                                        onRecordReset={onRecordReset} 
                                        globalQueries={globalQueries}
                                        actions={{
                                            zoom,
                                            handleZoom,
                                        }}
                                    />
                                )}
                                <Divider type="vertical" />
                                {
                                    is_layered && groups.length > 1 && (
                                        <>
                                            <GroupDropdown 
                                                currentIndex={layer_index}
                                                handleLayerChange={handleLayerChange}
                                                groups={groups}
                                            />
                                            <Divider type="vertical" />
                                        </>
                                    )
                                }
                                <Icon title={isFullElement ? "exit full screen" : "full screen"} component={isFullElement ? FullScreenExit : FullScreen} onClick={handleFullElement}/>
                            </>
                        )
                    }
                </div>)
            }
        </div>
    )
}