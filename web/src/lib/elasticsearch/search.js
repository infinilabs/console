export const buildSearchAggs = (fields = []) => {
  const parts = fields.map((field) => {
    return {
      fieldName: field.name,
      agg: {
        terms: {
          field: field.name,
          size: field.size,
        },
      },
    };
  });
  const aggs = {};
  parts.map((part) => {
    aggs[part.fieldName] = part.agg;
    return part;
  });
  return aggs;
};

export const buildSearchHighlight = (
  fields = [],
  fragmentSize = 200,
  numberOfFragment = 1
) => {
  var esFields = {};
  fields.map((f) => {
    esFields[f] = {};
    return f;
  });
  return {
    fields: esFields,
    fragment_size: fragmentSize,
    number_of_fragments: numberOfFragment,
  };
};

export const getSearchFacets = (searchRes, aggNames = []) => {
  if (!searchRes?.aggregations) {
    return [];
  }
  const allAggsNames = Object.keys(searchRes.aggregations);
  if (!aggNames || aggNames.length == 0) {
    aggNames = allAggsNames;
  }
  if (aggNames.length == 0) {
    return [];
  }
  return aggNames.map((aggName) => {
    return {
      field: aggName,
      data: searchRes.aggregations[aggName]?.buckets || [],
    };
  });
};

export const buildSearchFilter = (filters = {}) => {
  filters = filters || {};
  const filterDsls = Object.keys(filters).map((fk) => {
    const terms = (filters[fk] || []).map((v) => {
      return {
        term: {
          [fk]: v,
        },
      };
    });
    return {
      bool: {
        minimum_should_match: 1,
        should: terms,
      },
    };
  });
  return filterDsls;
};
