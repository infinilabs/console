import { useState, useEffect, useRef } from "react"

export default ({data=[], rowRender=()=>{return null}, keepDataLength = 1000, style={}})=>{
  const [logs, setLogs] = useState(data);
  const [autoScrollToBottom, setAutoScrollToBottom] = useState(true);
  const messageEnd = useRef(null);
  useEffect(() => {
    if (autoScrollToBottom === true) {
      messageEnd.current?.scrollIntoView();
    }
  }, [logs.length]);

  useEffect(()=>{
    if(messageEnd.current === null){
      return
    }
    setLogs((oldLogs)=>{
      let newLogs = oldLogs.concat(data);
      if(newLogs.length > keepDataLength) {
        newLogs = newLogs.slice(newLogs.length - keepDataLength)
      }
      return newLogs
    })
  }, [data]);

  return <div>
    <div
      style={{
        background: "black",
        color:"#fff",
        padding: 5,
        fontSize: 14,
        wordBreak:"break-all",
        ...style,
      }}
    >
      <ul>
        {(logs || []).map((row, idx) => (
          <li key={idx}>{rowRender(row)}</li>
        ))}
      </ul>
      <div style={{ float: "left", clear: "both" }} ref={messageEnd} />
    </div>
  </div>

}