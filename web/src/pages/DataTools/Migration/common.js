import { formatMessage } from "umi/locale";

export const generateName = (record = {}) => {
  const source = record.cluster?.source?.name || "N/A";
  const target = record.cluster?.target?.name || "N/A";
  const count = record.indicesCount || 0;

  return formatMessage(
    { id: "migration.auto_name.migration" },
    { count, source, target }
  );
};
