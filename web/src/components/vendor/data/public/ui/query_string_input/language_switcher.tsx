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

import {
  EuiButtonEmpty,
  EuiForm,
  EuiFormRow,
  EuiLink,
  EuiPopover,
  EuiPopoverTitle,
  EuiSpacer,
  EuiSwitch,
  EuiText,
  PopoverAnchorPosition,
} from "@elastic/eui";
import React, { useState } from "react";
import { useKibana } from "../../../../react/public";

interface Props {
  language: string;
  onSelectLanguage: (newLanguage: string) => void;
  anchorPosition?: PopoverAnchorPosition;
}

export function QueryLanguageSwitcher(props: Props) {
  const kibana = useKibana();
  // const kueryQuerySyntaxDocs = kibana.services.docLinks!.links.query.kueryQuerySyntax;
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const luceneLabel = "Lucene";
  const kqlLabel = "KQL";
  const kqlFullName = "Kibana Query Language";

  const button = (
    <EuiButtonEmpty
      size="xs"
      onClick={() => setIsPopoverOpen(!isPopoverOpen)}
      className="euiFormControlLayout__append kqlQueryBar__languageSwitcherButton"
      data-test-subj={"switchQueryLanguageButton"}
    >
      {props.language === "lucene" ? luceneLabel : kqlLabel}
    </EuiButtonEmpty>
  );

  return (
    <EuiPopover
      id="queryLanguageSwitcherPopover"
      anchorClassName="euiFormControlLayout__append"
      ownFocus
      anchorPosition={props.anchorPosition || "downRight"}
      button={button}
      isOpen={isPopoverOpen}
      closePopover={() => setIsPopoverOpen(false)}
      // withTitle
      repositionOnScroll
    >
      <EuiPopoverTitle>Syntax options</EuiPopoverTitle>
      <div style={{ width: "350px" }}>
        <EuiText>
          <p>
            The{" "}
            <EuiLink
              href={
                "https://www.elastic.co/guide/en/kibana/7.10/kuery-query.html"
              }
              target="_blank"
            >
              {kqlFullName}
            </EuiLink>{" "}
            (KQL) offers a simplified query syntax and support for scripted
            fields. KQL also provides autocomplete if you have a Basic license
            or above. If you turn off KQL, Kibana uses Lucene.
          </p>
        </EuiText>

        <EuiSpacer size="m" />

        <EuiForm>
          <EuiFormRow label={kqlFullName}>
            <EuiSwitch
              id="queryEnhancementOptIn"
              name="popswitch"
              label={props.language === "kuery" ? "On" : "Off"}
              checked={props.language === "kuery"}
              onChange={() => {
                const newLanguage =
                  props.language === "lucene" ? "kuery" : "lucene";
                props.onSelectLanguage(newLanguage);
              }}
              data-test-subj="languageToggle"
            />
          </EuiFormRow>
        </EuiForm>
      </div>
    </EuiPopover>
  );
}
