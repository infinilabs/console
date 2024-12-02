export default ({ variables = {} }) => {
  const vks = Object.keys(variables);
  if (vks.length == 0) {
    return null;
  }
  return (
    <div className="variable-cnt">
      <div className="label">Variables:</div>
      {vks.map((variable) => {
        return (
          <div key={variable} className="variable">
            {variable}
          </div>
        );
      })}
    </div>
  );
};
