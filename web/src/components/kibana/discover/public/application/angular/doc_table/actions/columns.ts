/**
 * Helper function to provide a fallback to a single _source column if the given array of columns
 * is empty, and removes _source if there are more than 1 columns given
 * @param columns
 * @param useNewFieldsApi should a new fields API be used
 */
 function buildColumns(columns, useNewFieldsApi) {
  if (columns.length > 1 && columns.indexOf('_source') !== -1) {
    return columns.filter((col) => col !== '_source');
  } else if (columns.length !== 0) {
    return columns;
  }
  return useNewFieldsApi ? [] : ['_source'];
}

export function addColumn(columns, columnName, useNewFieldsApi) {
  if (columns.includes(columnName)) {
    return columns;
  }
  return buildColumns([...columns, columnName], useNewFieldsApi);
}

export function removeColumn(columns, columnName, useNewFieldsApi) {
  if (!columns.includes(columnName)) {
    return columns;
  }
  return buildColumns(
    columns.filter((col) => col !== columnName),
    useNewFieldsApi
  );
}

export function moveColumn(columns, columnName, newIndex) {
  if (newIndex < 0 || newIndex >= columns.length || !columns.includes(columnName)) {
    return columns;
  }
  const modifiedColumns = [...columns];
  modifiedColumns.splice(modifiedColumns.indexOf(columnName), 1); // remove at old index
  modifiedColumns.splice(newIndex, 0, columnName); // insert before new index
  return modifiedColumns;
}

export function getStateColumnActions({
  indexPattern,
  indexPatterns,
  useNewFieldsApi,
  setAppState,
  state,
}) {
  function onAddColumn(columnName) {
    const columns = addColumn(state.columns || [], columnName, useNewFieldsApi);
    const defaultOrder = 'desc'
    const sort =
      columnName === '_score' && !state.sort?.length ? [['_score', defaultOrder]] : state.sort;
    setAppState({ columns, sort });
  }

  function onRemoveColumn(columnName) {
    const columns = removeColumn(state.columns || [], columnName, useNewFieldsApi);
    // The state's sort property is an array of [sortByColumn,sortDirection]
    const sort =
      state.sort && state.sort.length
        ? state.sort.filter((subArr) => subArr[0] !== columnName)
        : [];
    setAppState({ columns, sort });
  }

  function onMoveColumn(columnName, newIndex) {
    const columns = moveColumn(state.columns || [], columnName, newIndex);
    setAppState({ columns });
  }

  function onSetColumns(columns) {
    // remove first element of columns if it's the configured timeFieldName, which is prepended automatically
    const actualColumns =
      indexPattern.timeFieldName && indexPattern.timeFieldName === columns[0]
        ? columns.slice(1)
        : columns;
    setAppState({ columns: actualColumns });
  }
  return {
    onAddColumn,
    onRemoveColumn,
    onMoveColumn,
    onSetColumns,
  };
}
