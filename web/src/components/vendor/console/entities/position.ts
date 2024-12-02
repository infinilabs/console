export interface Position {
  /**
   * The line number, not zero-indexed.
   *
   * E.g., if given line number 1, this would refer to the first line visible.
   */
  lineNumber: number;

  /**
   * The column number, not zero-indexed.
   *
   * E.g., if given column number 1, this would refer to the first character of a column.
   */
  column: number;
}

export interface Range {
  /**
   * The start point of the range.
   */
  start: Position;

  /**
   * The end point of the range.
   */
  end: Position;
}
