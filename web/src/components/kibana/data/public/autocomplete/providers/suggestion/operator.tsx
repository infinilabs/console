import React from 'react';
import { $Keys } from 'utility-types';
import { flatten } from 'lodash';

import { KqlQuerySuggestionProvider } from './types';
import { QuerySuggestionTypes } from '../query_suggestion_provider';

const equalsText = (
  "equals"
);
const lessThanOrEqualToText = (
  "less than or equal to"
);
const greaterThanOrEqualToText = (
 "greater than or equal to"
);
const lessThanText = (
"less than"
);
const greaterThanText = (
  "greater than"
);
const existsText = (
  "exists"
);

const operators = {
  ':': {
    description: (
     `${<span className="kbnSuggestionItem__callout">{equalsText}</span>} some value`
    ),
    fieldTypes: [
      'string',
      'number',
      'number_range',
      'date',
      'date_range',
      'ip',
      'ip_range',
      'geo_point',
      'geo_shape',
      'boolean',
    ],
  },
  '<=': {
    description: (
      `is ${ <span className="kbnSuggestionItem__callout">{lessThanOrEqualToText}</span>} some value`
    ),
    fieldTypes: ['number', 'number_range', 'date', 'date_range', 'ip', 'ip_range'],
  },
  '>=': {
    description: (
      `is ${<span className="kbnSuggestionItem__callout">{greaterThanOrEqualToText}</span>} some value`
    ),
    fieldTypes: ['number', 'number_range', 'date', 'date_range', 'ip', 'ip_range'],
  },
  '<': {
    description: (
     `is ${<span className="kbnSuggestionItem__callout">{lessThanText}</span>} some value`
    ),
    fieldTypes: ['number', 'number_range', 'date', 'date_range', 'ip', 'ip_range'],
  },
  '>': {
    description: (
      `is ${<span className="kbnSuggestionItem__callout">{greaterThanText}</span>} some value`
    ),
    fieldTypes: ['number', 'number_range', 'date', 'date_range', 'ip', 'ip_range'],
  },
  ': *': {
    description: (
      `${<span className="kbnSuggestionItem__callout">{existsText}</span>} in any form`
    ),
    fieldTypes: undefined,
  },
};

type Operators = $Keys<typeof operators>;

const getOperatorByName = (operator: string) => operators[operator as Operators];
const getDescription = (operator: string) => <p>{getOperatorByName(operator).description}</p>;

export const setupGetOperatorSuggestions: KqlQuerySuggestionProvider = () => {
  return ({ indexPatterns }, { end, fieldName, nestedPath }) => {
    const allFields = flatten(
      indexPatterns.map((indexPattern) => {
        return indexPattern.fields.slice();
      })
    );
    const fullFieldName = nestedPath ? `${nestedPath}.${fieldName}` : fieldName;
    const fields = allFields
      .filter((field) => field.name === fullFieldName)
      .map((field) => {
        const matchingOperators = Object.keys(operators).filter((operator) => {
          const { fieldTypes } = getOperatorByName(operator);

          return !fieldTypes || fieldTypes.includes(field.type);
        });

        const suggestions = matchingOperators.map((operator) => ({
          type: QuerySuggestionTypes.Operator,
          text: operator + ' ',
          description: getDescription(operator),
          start: end,
          end,
        }));
        return suggestions;
      });

    return Promise.resolve(flatten(fields));
  };
};
