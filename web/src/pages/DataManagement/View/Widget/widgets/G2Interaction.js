import { G2 } from "@ant-design/charts";
import moment from "moment";

export const BRUSH_NAME = 'brush-x-value'

export const getHighlightAnnotations = (range, data) => {
  if (!range || !range.from || !range.to || !data || data.length === 0 ) return;
  const dataCache = data.filter((item, index) => {
    return data.findIndex((d) => d.timestamp === item.timestamp) === index
  })
  const format = 'YYYY-MM-DD HH:mm:ss'
  const filterData = dataCache.filter((item) => 
    (item.timestamp >= range.from || item.timestamp >= moment(moment(range.from).format(format)).valueOf()) 
    && 
    (item.timestamp <= range.to || item.timestamp <= moment(moment(range.to).format(format)).valueOf()) 
  )
  if (filterData.length !== 0) {
    return [
      {
        type: 'region',
        start: [filterData[0].timestamp, 'min'],
        end: [filterData[filterData.length - 1].timestamp, 'max'],
        style: {
          fill: '#1890ff',
          fillOpacity: 0.2,
        },
      },
    ];
  }
  return []
}

export const registerRangeBrush = (id, { onStart, onEnd }) => {
    G2.registerInteraction(`${BRUSH_NAME}-${id}`, {
      showEnable: [
        { trigger: 'plot:mouseenter', action: 'cursor:crosshair' },
        { trigger: 'mask:mouseenter', action: 'cursor:move' },
        { trigger: 'plot:mouseleave', action: 'cursor:default' },
        { trigger: 'mask:mouseleave', action: 'cursor:crosshair' },
      ],
      start: [
        {
          trigger: 'plot:mousedown',
          isEnable: (context) => {
            return context.isInPlot();
          },
          action: ['x-rect-mask:start', 'x-rect-mask:show'],
          callback: (context) => onStart && onStart(),
          arg: [{ maskStyle: { fill: '#000000', fillOpacity: 0.2 } }]
        },
      ],
      processing: [
        {
          trigger: 'plot:mousemove',
          isEnable: (context) => {
            return context.isInPlot();
          },
          action: 'x-rect-mask:resize',
        },
        // {
        //   trigger: 'mask:change',
        //   action: ['sibling-x-filter:filter', 'data-filter:filter'],
        // },
      ],
      end: [
        {
          trigger: 'plot:mouseup',
          action: [
            // 'element-filter:filter',
            'x-rect-mask:end',
            // 'x-rect-mask:hide',
            // 'sibling-x-filter:reset',
          ],
          callback: (context) => {
            const xScale = context.view.getXScale();
            const coord = context.view.getCoordinate();
            
            // 获取框选的的结果
            const { points } = context.getAction('x-rect-mask');

            if (!onEnd) {
              return ;
            }

            if (!points || points.length <= 1) {
              return;
            } 

            const point1 = coord.invert(points[0]);
            const point2 = coord.invert(points[points.length - 1]);

            if (point1.x === point2.x) {
              return;
            }

            // 获取起止点
            let minX = Math.min(point1['x'], point2['x']);
            let maxX = Math.max(point1['x'], point2['x']);

            // 和 range 范围做比较
            const [rangeMin, rangeMax] = xScale.range;
            if (minX < rangeMin) {
              minX = rangeMin;
            }
            if (maxX > rangeMax) {
              maxX = rangeMax;
            }
            // 范围大于整个 view 的范围，则返回 null
            if (minX === rangeMax && maxX === rangeMax) {
              return null;
            }
    
            // 将值域转换为定义域
            const minValue = xScale.invert(minX);
            const maxValue = xScale.invert(maxX);

            if (onEnd) {
              let startX = points[0].x;
              let endX = points[points.length - 1].x
              if (startX > endX) {
                endX = startX;
                startX = points[points.length - 1].x
              }
              startX + Math.floor((endX - startX) / 2)
              onEnd({range: { 
                from: minValue, 
                to: maxValue
              }}, { x: startX + Math.floor((endX - startX) / 2), y: context.view?.viewBBox?.height / 2 })
              return;
            }
          },
        },
      ],
      rollback: [
        // { trigger: 'dblclick', action: ['x-rect-mask:hide', 'sibling-x-filter:reset']}
      ],
    });
  
  }

  G2.registerShape('polygon', 'boundary-polygon', {
    draw(cfg, container) {
      const group = container.addGroup();
      const attrs = {
        stroke: '#fff',
        lineWidth: 1,
        fill: cfg.color,
        paht: [],
      };
      const points = cfg.points;
      const path = [
        ['M', points[0].x, points[0].y],
        ['L', points[1].x, points[1].y],
        ['L', points[2].x, points[2].y],
        ['L', points[3].x, points[3].y],
        ['Z'],
      ]; // @ts-ignore

      attrs.path = this.parsePath(path);
      group.addShape('path', {
        attrs,
      });

      if (cfg.data.lastWeek) {
        const linePath = [
          ['M', points[2].x, points[2].y],
          ['L', points[3].x, points[3].y],
        ]; // 最后一周的多边形添加右侧边框

        group.addShape('path', {
          attrs: {
            path: this.parsePath(linePath),
            lineWidth: 4,
            stroke: '#404040',
          },
        });

        if (cfg.data.lastDay) {
          group.addShape('path', {
            attrs: {
              path: this.parsePath([
                ['M', points[1].x, points[1].y],
                ['L', points[2].x, points[2].y],
              ]),
              lineWidth: 4,
              stroke: '#404040',
            },
          });
        }
      }

      return group;
    },
  });