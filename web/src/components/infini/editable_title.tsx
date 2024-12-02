import { useState, useRef, useEffect } from "react";

interface TabTitleProps {
  title: string;
  onTitleChange?: (title: string) => void;
}

export const EditableTitle = ({ title, onTitleChange }: TabTitleProps) => {
  const [editable, setEditable] = useState(false);
  const [value, setValue] = useState(title);
  const onValueChange = (e: any) => {
    const newVal = e.target.value;
    setValue(newVal);
    if (typeof onTitleChange == "function") onTitleChange(newVal);
  };
  useEffect(() => {
    setValue(title);
  }, [title]);
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
      title="double click to change it"
      className="eidtable-title"
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
          style={{
            outline: "none",
            border: "none",
            borderBottom: "1px solid #999",
          }}
        />
      ) : (
        <div>{value}</div>
      )}
    </div>
  );
};
