import { get, throttle } from 'lodash';
import { Editor } from 'brace';

// eslint-disable-next-line import/no-default-export
export default function (editor: Editor) {
  const resize = editor.resize;

  const throttledResize = throttle(() => {
    resize.call(editor, false);

    // Keep current top line in view when resizing to avoid losing user context
    const userRow = get(throttledResize, 'topRow', 0);
    if (userRow !== 0) {
      editor.renderer.scrollToLine(userRow, false, false, () => {});
    }
  }, 35);
  return throttledResize;
}
