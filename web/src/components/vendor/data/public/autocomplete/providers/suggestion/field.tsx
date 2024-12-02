import React from 'react';
import { flatten } from 'lodash';
import { escapeKuery } from './lib/escape_kuery';
import { sortPrefixFirst } from './sort_prefix_first';
import {
  QuerySuggestionField,
  QuerySuggestionTypes,
} from '../query_suggestion_provider';
import { isNestedField, isFilterable } from '../../../../common'; 
import { KqlQuerySuggestionProvider } from './types';

const indexPatternsUtils = {
  isFilterable
}

const getDescription = (field) => {
  return (
    <p>
      Filter results that contain {<span className="kbnSuggestionItem__callout">{field.name}</span> }
    </p>
  );
};

const keywordComparator = (first, second) => {
  const extensions = ['raw', 'keyword'];
  if (extensions.map((ext) => `${first.name}.${ext}`).includes(second.name)) {
    return 1;
  } else if (extensions.map((ext) => `${second.name}.${ext}`).includes(first.name)) {
    return -1;
  }

  return first.name.localeCompare(second.name);
};

export const setupGetFieldSuggestions: KqlQuerySuggestionProvider<QuerySuggestionField> = (
  core
) => {
  return ({ indexPatterns }, { start, end, prefix, suffix, nestedPath = '' }) => {
    const allFields = flatten(
      indexPatterns.map((indexPattern) => {
        const field =  indexPattern.fields.filter(indexPatternsUtils.isFilterable);
        return field;
      })
    );
    const search = `${prefix}${suffix}`.trim().toLowerCase();
    const matchingFields = allFields.filter((field) => {
      return (
        (!nestedPath ||
          (nestedPath &&
            field.subType &&
            field.subType.nested &&
            field.subType.nested.path.includes(nestedPath))) &&
        field.name.toLowerCase().includes(search)
      );
    });
    const sortedFields = sortPrefixFirst(matchingFields.sort(keywordComparator), search, 'name');

    const suggestions: QuerySuggestionField[] = sortedFields.map((field) => {
      const remainingPath =
        field.subType && field.subType.nested
          ? field.subType.nested.path.slice(nestedPath ? nestedPath.length + 1 : 0)
          : '';
      const text =
        field.subType && field.subType.nested && remainingPath.length > 0
          ? `${escapeKuery(remainingPath)}:{ ${escapeKuery(
              field.name.slice(field.subType.nested.path.length + 1)
            )}  }`
          : `${escapeKuery(field.name.slice(nestedPath ? nestedPath.length + 1 : 0))} `;
      const description = getDescription(field);
      const cursorIndex =
        field.subType && field.subType.nested && remainingPath.length > 0
          ? text.length - 2
          : text.length;

      return {
        type: QuerySuggestionTypes.Field,
        text,
        description,
        start,
        end,
        cursorIndex,
        field,
      };
    });

    return Promise.resolve(suggestions);
  };
};
