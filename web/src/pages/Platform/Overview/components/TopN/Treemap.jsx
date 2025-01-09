import { Treemap } from "@ant-design/charts";
import { Empty } from "antd";
import { useMemo } from "react";

export default (props) => {

  const { config = {}, data = [], unitArea = '', unitColor = '' } = props
  const { 
    top,
    colors = [],
    sourceArea,
    sourceColor,
  } = config;

  const color = useMemo(() => {
    if (colors.length === 0 || !sourceColor?.key || data.length === 0) return undefined
    if (data.length === 1) return colors[0]
    const values = data.map((item) => item.valueColor);
    const max = Math.max(...values)
    if (!Number.isFinite(max)) return undefined
    const div = max / colors.length
    const range = colors.map((_, index) => div * (index + 1))
    return ({ name }) => {
      let color = colors[0]
      const item = data.find((item) => item.name === name)
      if (!item) return color
      range.some((r, index) => {
        if (item.valueColor <= r) {
          color = colors[index]
          return true
        }
        return false
      })
      return color
    }
  }, [data, colors, sourceColor])

  return (
    <div style={{ height: '100%' }}>
      { data.length === 0 || data.some((item) => !Number.isFinite(item.value)) ? (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}/>
        </div>
      ) : (
        <Treemap {...{
          data: {
            name: 'root',
            children: data
          },
          autoFit: true,
          color,
          colorField: 'name',
          legend: {
              position: 'top-left',
              itemName: {
                formatter: (text) => {
                  const item = data.find((item) => item.name === text)
                  return item?.groupName || text
                }
              }
          },
          label: {
            formatter: (item) => item.displayName
          },
          tooltip: {
              customContent: (title, items) => {
                if (!items[0]) return;
                const { color, data } = items[0];
                const { displayName, value, metricArea, nameArea, metricColor, nameColor, valueColor } = data;

                
                let currentUnitArea = unitArea
                if (sourceArea?.unit) {
                  currentUnitArea = `${currentUnitArea} ${sourceArea?.unit}`
                }
                const markers = [
                  {
                    name: nameArea,
                    value: value,
                    unit: currentUnitArea,
                    marker: <span style={{ position: 'absolute', left: 0, top: 0, fontSize: 12 }}><svg t="1735902367048" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="15719" width="1em" height="1em"><path d="M525.649872 2.562499l-4.199999-2.499999c8.862498 12.062497 8.862498 6.424998 4.199999 2.562499z m467.062386 236.662443A31.862492 31.862492 0 0 0 1024.73725 207.499949V39.53749a31.862492 31.862492 0 0 0-31.962492-31.687492H823.462299a31.862492 31.862492 0 0 0-31.962492 31.687492v52.162488h-103.937475a31.349992 31.349992 0 0 0-9.787497 0H233.237443V39.53749A31.849992 31.849992 0 0 0 201.249951 7.849998H31.974992A31.862492 31.862492 0 0 0 0 39.53749v167.824959a31.849992 31.849992 0 0 0 31.974992 31.687493h52.624987v553.749864h-52.624987A31.862492 31.862492 0 0 0 0 824.487299v167.824959a31.849992 31.849992 0 0 0 31.974992 31.687492H201.249951a31.837492 31.837492 0 0 0 31.962492-31.737492v-52.174988H791.374807v52.174988a31.862492 31.862492 0 0 0 31.974992 31.737492h169.299959a31.862492 31.862492 0 0 0 31.974992-31.737492V824.599799a31.862492 31.862492 0 0 0-31.974992-31.737493H939.999771V347.299915a15.574996 15.574996 0 0 0 0-3.237499v-104.899974h52.749987zM148.749964 462.499887a34.024992 34.024992 0 0 0 5.412498-4.312499l305.212426-302.874926H604.999852L148.749964 607.912352z m52.624987-223.337445A31.849992 31.849992 0 0 0 233.299943 207.499949v-52.249987h135.512467L148.649964 373.749909V239.162442zM148.749964 697.68733L695.46233 155.249962h95.974977v38.974991L187.787454 792.862306h-39.24999v-95.174976zM876.087286 564.999862L569.399861 869.149788a32.349992 32.349992 0 0 0-5.687499 7.624998H418.012398l458.074888-454.374889z m-52.624987 227.899944a31.862492 31.862492 0 0 0-31.962492 31.737493v52.174987H652.399841l223.749945-221.987446v138.037466z m52.624987-460.287387L327.39992 876.774786h-94.162477v-39.137491l603.362353-598.474853h39.48749z" p-id="15720" fill="#666"></path></svg></span>
                  }
                ]

                let currentUnitColor = unitColor
                if (sourceColor?.unit) {
                  currentUnitColor = `${currentUnitColor} ${sourceColor?.unit}`
                }

                if (metricColor) {
                  markers.push({
                    name: nameColor,
                    value: Number.isFinite(valueColor) ? valueColor : '-',
                    unit: currentUnitColor,
                    marker: <span style={{ position: 'absolute', left: 0, top: 0, display: 'block', borderRadius: '2px', backgroundColor: color, width: 12, height: 12 }}></span>
                  })
                }

                return (
                  <div style={{ padding: 4 }}>
                    {
                      <h5 style={{ marginTop: 12, marginBottom: 12 }}>
                        {displayName}
                      </h5>
                    }
                    <div>
                      {
                        markers.map((item, index) => (
                          <div
                            style={{ display: 'block', paddingLeft: 18, marginBottom: 12, position: 'relative' }}
                            key={index}
                          >
                            {item.marker}
                            <span
                              style={{ display: 'inline-flex', flex: 1, justifyContent: 'space-between' }}
                            >
                              <span style={{ marginRight: 16 }}>{item.name}:</span>
                              <span className="g2-tooltip-list-item-value">
                                {item.unit ? `${item.value}${item.unit}` : item.value}
                              </span>
                            </span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                );
              },
            }
        }} />
      )}
    </div>
  )
}