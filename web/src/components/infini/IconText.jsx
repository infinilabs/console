export default ({ icon, text }) => {
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      <span>{icon}</span>
      <span style={{ width: "calc(100% - 20px)"}}>{text}</span>
    </span>
  );
};
