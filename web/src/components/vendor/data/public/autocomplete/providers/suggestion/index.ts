import { CoreSetup } from 'kibana/public';
import { $Keys } from 'utility-types';
import { flatten, uniqBy } from 'lodash';
import { setupGetFieldSuggestions } from './field';
import { setupGetValueSuggestions } from './value';
import { setupGetOperatorSuggestions } from './operator';
import { setupGetConjunctionSuggestions } from './conjunction';

import {
  QuerySuggestion,
  QuerySuggestionGetFnArgs,
  QuerySuggestionGetFn,
} from '../..';
import {
  fromKueryExpression,
  toElasticsearchQuery,
  nodeTypes,
} from '../../../../common';

const esKuery = {
  nodeTypes,
  fromKueryExpression,
  toElasticsearchQuery,
};

const cursorSymbol = '@kuery-cursor@';

const dedup = (suggestions: QuerySuggestion[]): QuerySuggestion[] =>{
  return uniqBy(suggestions, ({ type, text, start, end }) => [type, text, start, end].join('|'));
}

export const KUERY_LANGUAGE_NAME = 'kuery';

export const setupKqlQuerySuggestionProvider = (
  core: CoreSetup<object, DataPublicPluginStart>
): QuerySuggestionGetFn => {
  const providers = {
    field: setupGetFieldSuggestions(core),
    value: setupGetValueSuggestions(core),
    operator: setupGetOperatorSuggestions(core),
    conjunction: setupGetConjunctionSuggestions(core),
  };

  const getSuggestionsByType = (
    cursoredQuery: string,
    querySuggestionsArgs: QuerySuggestionGetFnArgs
  ): Array<Promise<QuerySuggestion[]>> | [] => {
    try {
      const cursorNode = esKuery.fromKueryExpression(cursoredQuery, {
        cursorSymbol,
        parseCursor: true,
      });
      return cursorNode.suggestionTypes.map((type: $Keys<typeof providers>) =>
        providers[type](querySuggestionsArgs, cursorNode)
      );
    } catch (e) {
      return [];
    }
  };

  return (querySuggestionsArgs) => {
    const { query, selectionStart, selectionEnd } = querySuggestionsArgs;
    const cursoredQuery = `${query.substr(0, selectionStart)}${cursorSymbol}${query.substr(
      selectionEnd
    )}`;
    return Promise.all(
      getSuggestionsByType(cursoredQuery, querySuggestionsArgs)
    ).then((suggestionsByType) => dedup(flatten(suggestionsByType)));
  };
};
