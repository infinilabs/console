import { Icon, Popover } from "antd"
import { useEffect, useRef, useState } from "react";
import Info, { IProps } from "./Info";
import styles from './index.scss';

export default (props: IProps & { loading: boolean }) => {

    const { loading, total } = props

    const [showResultCount, setShowResultCount] = useState(true);
    const timerRef = useRef(null)
    const autoHiddenRef = useRef(true)

    useEffect(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
        }
        if (showResultCount) {
            timerRef.current = setTimeout(() => {
                if (autoHiddenRef.current) {
                    setShowResultCount(false)
                }
            }, 3000);
        }
    }, [showResultCount])

    useEffect(() => {
        if (loading) {
            autoHiddenRef.current = true
        }
    }, [loading])

    if (typeof total !== 'number' || total <= 0) return null; 

    return (
        <Popover 
            visible={!loading && showResultCount} 
            placement="left" 
            title={null} 
            overlayClassName={styles.searchInfo}
            content={(
            <Info
                {...props}
                dateFormat={"YYYY-MM-DD H:mm"}
            />
        )}>
            <Icon type="info-circle" style={{color: '#006BB4', cursor: 'pointer'}} onClick={() => {
                if (showResultCount) {
                    autoHiddenRef.current = true
                } else {
                    autoHiddenRef.current = false
                }
                setShowResultCount(!showResultCount)
            }}/>
        </Popover>
    )
}