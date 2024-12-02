import React from 'react';
import { $Keys } from 'utility-types';
import { KqlQuerySuggestionProvider } from './types';
import {
  QuerySuggestion,
  QuerySuggestionTypes,
} from '../query_suggestion_provider';

const bothArgumentsText = (
  "both arguments"
);

const oneOrMoreArgumentsText = (
  "one or more arguments"
);

const conjunctions: Record<string, JSX.Element> = {
  and: (
    <p>
      Requires {<span className="kbnSuggestionItem__callout">{bothArgumentsText}</span>} to be true
    </p>
  ),
  or: (
    <p>
      Requires {<span className="kbnSuggestionItem__callout">{oneOrMoreArgumentsText}</span>} to be true
    </p>
  ),
};

export const setupGetConjunctionSuggestions: KqlQuerySuggestionProvider = (core) => {
  return (querySuggestionsArgs, { text, end }) => {
    let suggestions: QuerySuggestion[] | [] = [];

    if (text.endsWith(' ')) {
      suggestions = Object.keys(conjunctions).map((key: $Keys<typeof conjunctions>) => ({
        type: QuerySuggestionTypes.Conjunction,
        text: `${key} `,
        description: conjunctions[key],
        start: end,
        end,
      }));
    }

    return Promise.resolve(suggestions);
  };
};
