import line from './line';
import column from './column';
import area from './area';
import pie from './pie';
import number from './number';

export interface VisualizationType {
    type: string;
    displayName: string;
    component: any;
}

const plugins: VisualizationType[] = [
    line,
    column,
    area,
    pie,
    number
];

export default plugins