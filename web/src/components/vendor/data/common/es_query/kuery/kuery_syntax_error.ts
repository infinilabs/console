/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { repeat } from 'lodash';

const endOfInputText = 'end of input';

const grammarRuleTranslations: Record<string, string> = {
  fieldName: 'field name',
  value: 'value',
  literal: 'literal',
  whitespace: 'whitespace',
};

interface KQLSyntaxErrorData extends Error {
  found: string;
  expected: KQLSyntaxErrorExpected[] | null;
  location: any;
}

interface KQLSyntaxErrorExpected {
  description: string;
}

export class KQLSyntaxError extends Error {
  shortMessage: string;

  constructor(error: KQLSyntaxErrorData, expression: any) {
    let message = error.message;
    if (error.expected) {
      const translatedExpectations = error.expected.map((expected) => {
        return grammarRuleTranslations[expected.description] || expected.description;
      });

      const translatedExpectationText = translatedExpectations.join(', ');

      message =  `Expected ${translatedExpectationText} but ${error.found ? `"${error.found}"` : endOfInputText} found.`;
    }

    const fullMessage = [message, expression, repeat('-', error.location.start.offset) + '^'].join(
      '\n'
    );

    super(fullMessage);
    this.name = 'KQLSyntaxError';
    this.shortMessage = message;
  }
}
