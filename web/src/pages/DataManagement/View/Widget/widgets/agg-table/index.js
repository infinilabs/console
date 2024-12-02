import Icon from "./Icon";
import Visualization from "./Visualization";
import { formatMessage } from "umi/locale";
import Source from "./Config/Source";
import General from "./Config/General";

export default {
    type: 'agg-table',
    displayName: formatMessage({ id: "dashboard.widget.display.name.agg-table"}),
    component: Visualization,
    defaultW: 4,
    defaultH: 5,
    icon: Icon,
    sourceConfig: Source,
    generalConfig: General,
    quickBar: {
        changeTypes: ['column', 'bar'],
    },
}