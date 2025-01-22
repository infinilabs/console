import { getFormatter } from "@/utils/format";
import { Empty } from "antd";
import { useMemo } from "react";
import Heatmap from "./Heatmap";
import Treemap from "./Treemap";

const generateGradientColors = (startColor, endColor, steps) => {
  function colorToRgb(color) {
    const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    return rgb ? {
        r: parseInt(rgb[1], 16),
        g: parseInt(rgb[2], 16),
        b: parseInt(rgb[3], 16)
    } : null;
  }
 
  function rgbToHex(r, g, b) {
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  }
 
  const startRGB = colorToRgb(startColor);
  const endRGB = colorToRgb(endColor);
  const diffR = endRGB.r - startRGB.r;
  const diffG = endRGB.g - startRGB.g;
  const diffB = endRGB.b - startRGB.b;
 
  const colors = [];
  for (let i = 0; i <= steps; i++) {
    const r = startRGB.r + (diffR * i / steps);
    const g = startRGB.g + (diffG * i / steps);
    const b = startRGB.b + (diffB * i / steps);
    colors.push(rgbToHex(Math.round(r), Math.round(g), Math.round(b)));
  }
 
  return colors;
}

export const generateColors = (colors, data) => {
  if (!colors || colors.length <= 1 || !data || data.length <= 1 || data.length <= colors.length) return colors
  const gradientSize = data.length - colors.length
  const steps = Math.floor(gradientSize / (colors.length - 1)) + 1
  let remainder = gradientSize % (colors.length - 1)
  const newColors = []
  for(let i=0; i<colors.length - 1; i++) {
    let fixSteps = steps;
    if (remainder > 0) {
      fixSteps++
      remainder--
    }
    const gradientColors = generateGradientColors(colors[i], colors[i+1], fixSteps)
    newColors.push(...gradientColors.slice(0, gradientColors.length - 1))
  }
  newColors.push(colors[colors.length - 1])
  return newColors
}

export const fixFormatter = (formatType, pattern = '0,0.[00]a') => {
  return getFormatter(formatType === 'number' ? 'num' : formatType, formatType === 'number' ? pattern : '')
}

export const handleTextOverflow = (text, maxWidth) => {
  if (!text || text.length <= 3) return text
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let textWidth = ctx.measureText(text).width;
  if (textWidth > maxWidth) {
      let size = text.length - 3;
      let newText = text.substr(0, size) + '...'
      while (textWidth > maxWidth) {
          size--
          newText = text.substr(0, size) + '...'
          textWidth = ctx.measureText(newText).width;
      }
      return text.substr(0, size - 5) + '...'
  } else {
      return text
  }
}

export default (props) => {

  const { config = {}, data = [] } = props

  return (
    <div style={{ height: '100%'}}>
      { data.length === 0 || data.some((item) => !Number.isFinite(item.value)) ? (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}/>
        </div>
      ) : (
        config?.sourceArea?.id ? (
            <Treemap {...props}/>
        ) : (
            <Heatmap {...props}/>
        )
      )}
    </div>
  )
}