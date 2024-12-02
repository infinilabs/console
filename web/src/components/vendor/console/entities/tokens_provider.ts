import { Position } from './position';
import { Token } from './token';

export interface TokensProvider {
  /**
   * Special values in this interface are `null` and an empty array `[]`.
   * - `null` means that we are outside of the document range (i.e., have requested tokens for a non-existent line).
   * - An empty array means that we are on an empty line.
   */
  getTokens(lineNumber: number): Token[] | null;

  /**
   * Get the token at the specified position.
   *
   * The token "at" the position is considered to the token directly preceding
   * the indicated cursor position.
   *
   * Returns null if there is not a token that meets this criteria or if the position is outside
   * of the document range.
   */
  getTokenAt(pos: Position): Token | null;
}
