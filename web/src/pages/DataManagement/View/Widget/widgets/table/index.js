import Icon from "./Icon";
import Visualization from "./Visualization";
import { formatMessage } from "umi/locale";
import WidgetHeaderActions from "./WidgetHeaderActions";
import Source from "./Config/Source";
import General from "./Config/General";

export default {
    type: 'table',
    displayName: formatMessage({ id: "dashboard.widget.display.name.table"}),
    component: Visualization,
    defaultW: 12,
    defaultH: 5,
    icon: Icon,
    widgetHeaderActions: WidgetHeaderActions,
    sourceConfig: Source,
    generalConfig: General,
}