import { CoreEditor } from './core_editor';
import { Range } from './position';
import { Token } from './token';

export interface ResultTerm {
  context?: AutoCompleteContext;
  insertValue?: string;
  name?: string;
  value?: string;
}

export interface AutoCompleteContext {
  autoCompleteSet?: null | ResultTerm[];
  endpoint?: null | {
    paramsAutocomplete: {
      getTopLevelComponents: (method?: string | null) => unknown;
    };
    bodyAutocompleteRootComponents: unknown;
    id?: string;
    documentation?: string;
  };
  urlPath?: null | unknown;
  urlParamsTokenPath?: Array<Record<string, string>> | null;
  method?: string | null;
  token?: Token;
  activeScheme?: unknown;
  replacingToken?: boolean;
  rangeToReplace?: Range;
  autoCompleteType?: null | string;
  editor?: CoreEditor;

  /**
   * The tokenized user input that prompted the current autocomplete at the cursor. This can be out of sync with
   * the input that is currently being displayed in the editor.
   */
  createdWithToken?: Token | null;

  /**
   * The tokenized user input that is currently being displayed at the cursor in the editor when the user accepted
   * the autocomplete suggestion.
   */
  updatedForToken?: Token | null;

  addTemplate?: unknown;
  prefixToAdd?: string;
  suffixToAdd?: string;
  textBoxPosition?: { lineNumber: number; column: number };
  urlTokenPath?: string[];
  otherTokenValues?: string;
  requestStartRow?: number | null;
  bodyTokenPath?: string[] | null;
  endpointComponentResolver?: unknown;
  globalComponentResolver?: unknown;
  documentation?: string;
}
