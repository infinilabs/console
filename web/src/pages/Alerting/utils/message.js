export const stripDuplicatedAlertTitle = (message, title) => {
  if (
    typeof message !== "string" ||
    !message ||
    typeof title !== "string" ||
    !title
  ) {
    return message;
  }

  const normalizedTitle = title.trim();
  if (!normalizedTitle) {
    return message;
  }

  const lines = message.replace(/\r\n/g, "\n").split("\n");
  let removed = false;
  const filtered = lines.filter((line) => {
    if (removed) {
      return true;
    }
    if (line.trim() !== normalizedTitle) {
      return true;
    }
    removed = true;
    return false;
  });

  return filtered.join("\n");
};
