import { useState, Dispatch } from 'react';

import { collapseLiteralStrings, expandLiteralStrings } from './json_xjson_translation_tools';

interface ReturnValue {
  xJson: string;
  setXJson: Dispatch<string>;
  convertToJson: typeof collapseLiteralStrings;
}

export const useXJsonMode = (json: Record<string, any> | string | null): ReturnValue => {
  const [xJson, setXJson] = useState(() =>
    json === null
      ? ''
      : expandLiteralStrings(typeof json === 'string' ? json : JSON.stringify(json, null, 2))
  );

  return {
    xJson,
    setXJson,
    convertToJson: collapseLiteralStrings,
  };
};
