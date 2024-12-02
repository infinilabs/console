import { Icon, Popover } from "antd"
import { useState } from "react";
import Info, { IProps } from "./Info";
import styles from './index.scss';

export default (props: IProps & { loading: boolean }) => {

    const [showResultCount, setShowResultCount] = useState(true);

    if (typeof props.hits !== 'number' || props.hits <= 0) return null; 

    return (
        <Popover 
            visible={!props.loading && showResultCount} 
            placement="left" 
            title={null} 
            overlayClassName={styles.searchInfo}
            content={(
            <Info
                {...props}
                dateFormat={"YYYY-MM-DD H:mm"}
            />
        )}>
            <Icon type="info-circle" style={{color: '#006BB4', cursor: 'pointer'}} onClick={() => setShowResultCount(!showResultCount)}/>
        </Popover>
    )
}