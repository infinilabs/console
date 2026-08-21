import ace from 'brace';

export const CONSOLE_FONT_FAMILY =
  '"SFMono-Regular",Monaco,Menlo,Consolas,"Liberation Mono","Ubuntu Mono",monospace';

export const DEFAULT_CONSOLE_FONT_SIZE = '13px';

export function applyConsoleEditorFont(
  container: HTMLElement,
  fontSize = DEFAULT_CONSOLE_FONT_SIZE
) {
  container.style.fontFamily = CONSOLE_FONT_FAMILY;
  container.style.fontSize = fontSize;
}

export function applyConsoleAceFont(
  editor: Pick<ace.Editor, 'container' | 'setFontSize'>,
  fontSize = DEFAULT_CONSOLE_FONT_SIZE
) {
  editor.setFontSize(fontSize);
  applyConsoleEditorFont(editor.container, fontSize);
}
