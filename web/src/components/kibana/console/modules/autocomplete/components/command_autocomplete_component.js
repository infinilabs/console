// import { ListComponent } from './list_component';

// export class CommandAutoCompleteComponent extends ListComponent {
//   constructor(name, list, parent, multiValued) {
//     super(name, list, parent, multiValued);
//   }


// }

import _ from 'lodash';
import { getCommands } from '../../mappings/mappings';
import { ListComponent } from './list_component';
function nonValidIndexType(token) {
  return !(token === '_all' || token[0] !== '_');
}
export class CommandAutocompleteComponent extends ListComponent {
  constructor(name, parent, multiValued) {
    super(name, getCommands, parent, multiValued);
  }
  validateTokens(tokens) {
    if (!this.multiValued && tokens.length > 1) {
      return false;
    }
    return !_.find(tokens, nonValidIndexType);
  }

  getDefaultTermMeta() {
    return 'command';
  }

  getContextKey() {
    return 'command';
  }
}
