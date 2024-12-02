import _ from 'lodash';
import {
  isExistsFilter,
  isPhraseFilter,
  getPhraseFilterValue,
  getPhraseFilterField,
  isScriptedPhraseFilter,
  buildFilter,
  FilterStateStore,
  FILTERS,
  uniqFilters,
} from '@/components/vendor/data/common';
import { mapAndFlattenFilters } from '@/components/vendor/data/public/query';

function getExistingFilter(appFilters, fieldName, value ) {
  return _.find(appFilters, function (filter) {
    if (!filter) return;

    if (fieldName === '_exists_' && isExistsFilter(filter)) {
      return filter.exists?.field === value;
    }

    if (isPhraseFilter(filter)) {
      return getPhraseFilterField(filter) === fieldName && getPhraseFilterValue(filter) === value;
    }

    if (isScriptedPhraseFilter(filter)) {
      return filter.meta.field === fieldName && filter.script?.script.params.value === value;
    }
  });
}

function updateExistingFilter(existingFilter, negate) {
  existingFilter.meta.disabled = false;
  if (existingFilter.meta.negate !== negate) {
    existingFilter.meta.negate = !existingFilter.meta.negate;
  }
}

export function generateFilter(appFilters, field, values, operation, index) {
  values = Array.isArray(values) ? values : [values];
  const fieldObj = (_.isObject(field) ? field : { name: field });
  const fieldName = fieldObj.name;
  const newFilters = [];

  const negate = operation === '-';
  let filter;

  _.each(values, function (value) {
    const existing = getExistingFilter(appFilters, fieldName, value);

    if (existing) {
      updateExistingFilter(existing, negate);
      filter = existing;
    } else {
      const tmpIndexPattern = { id: index };
      // exists filter special case:  fieldname = '_exists' and value = fieldname
      const filterType = fieldName === '_exists_' ? FILTERS.EXISTS : FILTERS.PHRASE;
      const actualFieldObj = fieldName === '_exists_' ? ({ name: value }) : fieldObj;

      // Fix for #7189 - if value is empty, phrase filters become exists filters.
      const isNullFilter = value === null || value === undefined;

      filter = buildFilter(
        tmpIndexPattern,
        actualFieldObj,
        isNullFilter ? FILTERS.EXISTS : filterType,
        isNullFilter ? !negate : negate,
        false,
        value,
        null,
        FilterStateStore.APP_STATE
      );
    }

    newFilters.push(filter);
  });
  
  return newFilters
}

export function mergeFilters(appFilters, filters) {
  const currentFilters = appFilters.concat(mapAndFlattenFilters(filters))
  return uniqFilters(currentFilters.reverse()).reverse();
}
