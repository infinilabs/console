import { buildQueryFromKuery } from "@/components/vendor/data/common/es_query/es_query/from_kuery";
import { buildQueryFromFilters } from "@/components/vendor/data/common";
import { groupBy, has } from "lodash";

export const dslToQueryFilters = (dsl) => {
  let dslFilter = {}
  if (dsl) {
    try {
      const dslObject = JSON.parse(dsl) || {}
      if (dslObject.bool) {
        dslFilter = dslObject.bool
      } else {
        dslFilter = {
          filter: [dslObject]
        }
      }
    } catch (error) {
    }
  }
  return dslFilter
}

export const kqlFiltersToKql = (filters) => {
  if (!filters || filters.length === 0) return;
  return {
    language: "kuery",
    query: filters.filter((item) => item.values?.length > 0).map((item) => {
      let str;
      if (item.operator === 'range') {
        str = `${item.field} >= ${item.values[0]} and ${item.field} <= ${item.values[1]}`
      } else {
        if (item.type === "string") {
          str = `${item.field} ${item.operator} \"${item.values[0]}\" `
        } else {
          str = `${item.field} ${item.operator} ${item.values[0]}`
        }
      }
      return `${item.logic || ''} ${str}`
    }).join(' ')
  }
}

export const kqlToQueryFilters = (kql) => {
  let kqlFilter = {}
  if (kql) {
    try {
      const validQueries = [kql].filter((query) => has(query, 'query'));
      const queriesByLanguage = groupBy(validQueries, 'language');
      kqlFilter = buildQueryFromKuery(
        undefined,
        queriesByLanguage.kuery,
        false,
      );
    } catch (error) {
    }
  }
  return kqlFilter
}

export const filtersToQueryFilters = (filters) => {
  let filtersObject = {}
  if (filters?.length > 0) {
    try {
      filtersObject = buildQueryFromFilters(
        filters,
        undefined,
        false
      );
    } catch (error) {
    }
  }
  return filtersObject
}