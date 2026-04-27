import { Icon, Popover } from "antd"
import { useEffect, useRef, useState } from "react";
import Info, { IProps } from "./Info";
import styles from './index.scss';

export default (props: IProps & { loading: boolean }) => {
    const { loading, total } = props;

    const [showResultCount, setShowResultCount] = useState(true);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const autoHiddenRef = useRef(true);
    const isMountedRef = useRef(true); // 防止卸载后 setState

    // 处理自动隐藏逻辑
    useEffect(() => {
        if (!showResultCount) return;

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
            if (autoHiddenRef.current && isMountedRef.current) {
                setShowResultCount(false);
            }
        }, 3000);

        // 清理函数
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [showResultCount]);

    // 更新 autoHiddenRef
    useEffect(() => {
        autoHiddenRef.current = loading ? true : autoHiddenRef.current;
    }, [loading]);

    // 组件卸载时标记
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    if (typeof total !== 'number' || total <= 0) return null; 

    return (
        <Popover 
            visible={!loading && showResultCount} 
            placement="left" 
            title={null} 
            overlayClassName={styles.searchInfo}
            content={
                <Info
                    {...props}
                    dateFormat={"YYYY-MM-DD H:mm"}
                />
            }
        >
            <Icon
                type="info-circle"
                style={{ color: '#006BB4', cursor: 'pointer' }}
                onClick={() => {
                    autoHiddenRef.current = showResultCount ? true : false;
                    setShowResultCount(!showResultCount);
                }}
            />
        </Popover>
    );
}