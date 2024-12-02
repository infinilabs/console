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
      <span>{text}</span>
    </span>
  );
};
