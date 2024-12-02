import { TinyArea } from '@ant-design/plots';

export default (props) => {
  const config = {
    height: props?.height || 30,
    autoFit: props?.autoFit || true,
    data:props?.data || [],
    smooth: true,
    areaStyle: {
      fill: props?.areaColor || '#d6e3fd',
    },
    line: {
      color: props?.lineColor || '#1890ff',
    }
  };
  return <TinyArea {...config} />;
};
