import { CoreEditor } from '../entities/core_editor';
import { Position} from '../entities/position';
import { TokenIterator } from '../entities/token_iterator';

interface Dependencies {
  position: Position;
  editor: CoreEditor;
}

export function createTokenIterator({ editor, position }: Dependencies) {
  const provider = editor.getTokenProvider();
  return new TokenIterator(provider, position);
}
