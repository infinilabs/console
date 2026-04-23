export const EASYSEARCH_MIGRATION_INDEX_SETTINGS = {
  codec: "ZSTD",
  source_reuse: true,
};

export const applyEasysearchMigrationIndexSettings = (settings = {}) => {
  const nextSettings = {
    ...(settings || {}),
  };
  nextSettings.index = {
    ...(nextSettings.index || {}),
    ...EASYSEARCH_MIGRATION_INDEX_SETTINGS,
  };
  return nextSettings;
};
