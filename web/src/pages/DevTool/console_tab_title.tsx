import { useState, useRef, useEffect } from "react";
import "./console_tab_title.scss";
import { SearchEngineIcon } from "@/lib/search_engines";

interface TabTitleProps {
  title: string;
  onTitleChange?: (title: string) => void;
  distribution: string;
}

export const TabTitle = ({
  title,
  onTitleChange,
  distribution,
}: TabTitleProps) => {
  const [editable, setEditable] = useState(false);
  const [value, setValue] = useState(title);
  const onValueChange = (e: any) => {
    const newVal = e.target.value;
    setValue(newVal);
    if (typeof onTitleChange == "function") onTitleChange(newVal);
  };
  useEffect(() => {
    if (editable) {
      inputRef.current?.focus();
    }
  }, [editable]);
  const inputRef = useRef(null);
  const onKeyDown = (e: any) => {
    const { which } = e;

    switch (which) {
      case 13:
        e.target.blur();
        break;
    }
  };

  return (
    <div
      title="double click to change title"
      className="tab-title"
      onDoubleClick={() => {
        setEditable(true);
      }}
    >
      {editable ? (
        <input
          ref={inputRef}
          className="input-eidtor"
          onKeyDown={onKeyDown}
          type="text"
          value={value}
          onBlur={() => {
            setEditable(false);
          }}
          onChange={onValueChange}
        />
      ) : (
        <div className="icon-cont">
          <SearchEngineIcon
            distribution={distribution}
            width="14px"
            height="14px"
          />
          {value}
        </div>
      )}
    </div>
  );
};
