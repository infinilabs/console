import { Card } from "antd"
import styles from "./index.less"
import { formatMessage } from "umi/locale";

export default (props) => {

    const { currentUser } = props

    const getTime = () => {
        const now = new Date();
        const hours = now.getHours();
        if (hours >= 0 && hours < 12) {
            return formatMessage({ id: 'overview.welcome.am'})
        } else {
            return formatMessage({ id: 'overview.welcome.pm'})
        }
    }   

    return (
        <Card className={styles.welcome} size="small">
            <div className={styles.user}>
                Hi,&nbsp;{ currentUser?.nick_name }{getTime()}
            </div>
            <div className={styles.desc}>
                {formatMessage({ id: 'overview.welcome.desc'})}
            </div>
        </Card>
    )
}