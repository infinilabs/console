import Icon from "./Icon";
import Visualization from "./Visualization";
import { formatMessage } from "umi/locale";
import RangeActions from "../../WidgetHeader/RangeActions";
import Source from "./Config/Source";
import General from "./Config/General";

export default {
    type: 'date-histogram',
    displayName: formatMessage({ id: "dashboard.widget.display.name.date-histogram"}),
    component: Visualization,
    defaultW: 4,
    defaultH: 5,
    icon: Icon,
    widgetHeaderActions: RangeActions,
    sourceConfig: Source,
    generalConfig: General,
    quickBar: {
        changeTypes: ['line', 'area', 'date-bar', 'agg-table'],
    },
    isTimeSeries: true,
}