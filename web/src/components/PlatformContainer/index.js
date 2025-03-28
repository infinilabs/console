import { Alert } from "antd";
import logo from "../../assets/logo.svg";
import styles from "./index.less"
import { isPc } from "@/utils/utils";

export default (props) => {

    const { children } = props;

    return children

    // if (isPc()) {
    //     return children
    // }

    // return (
    //     <div className={styles.platformContainer}>
    //         <img alt="logo" className={styles.logo} src={logo} />
    //         <Alert message="暂不支持移动端浏览器，请使用PC端浏览器！" type="warning" showIcon />
    //     </div>
    // )
}