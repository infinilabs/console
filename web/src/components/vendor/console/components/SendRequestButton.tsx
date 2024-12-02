// @ts-ignore
import React from 'react';
import { EuiIcon, EuiToolTip } from '@elastic/eui/es';
import { useSendCurrentRequestToES } from '../hooks/use_send_current_request_to_es';

const SendRequestButton = () => {
  const sendCurrentRequestToES = useSendCurrentRequestToES();

  return (
    <EuiToolTip
      content={'Click to send request'}
    >
      <button
        data-test-subj="sendRequestButton"
        aria-label={'Click to send request'}
        className="conApp__editorActionButton conApp__editorActionButton--success"
        onClick={sendCurrentRequestToES}
      >
        <EuiIcon type="play" />
      </button>
    </EuiToolTip>
  );
};

export default SendRequestButton;
