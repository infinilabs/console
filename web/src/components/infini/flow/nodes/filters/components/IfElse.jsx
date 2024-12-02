import ConditionEditor from "../../components/ConditionEditor";

const IfElse = ({ onChange, value }) => {
  const onIfChange = (ifValue) => {
    onChange({
      ...value,
      if: ifValue,
    });
  };
  return <ConditionEditor value={value.if} onChange={onIfChange} label="IF" />;
};

export default IfElse;
