import { CoreSetup } from 'kibana/public';
import {
  DataPublicPluginStart,
  KueryNode,
  QuerySuggestionBasic,
  QuerySuggestionGetFnArgs,
} from '../../../../../../../src/plugins/data/public';

export type KqlQuerySuggestionProvider<T = QuerySuggestionBasic> = (
  core: CoreSetup<object, DataPublicPluginStart>
) => (querySuggestionsGetFnArgs: QuerySuggestionGetFnArgs, kueryNode: KueryNode) => Promise<T[]>;
