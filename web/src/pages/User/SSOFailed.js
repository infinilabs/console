import React from 'react';
import { formatMessage, FormattedMessage } from 'umi/locale';
import { Button } from 'antd';
import Link from 'umi/link';
import Result from '@/components/Result';

const actions = (
  <div>
    <Link to="/">
      <Button size="large">
        <FormattedMessage id="app.register-result.back-home" />
      </Button>
    </Link>
  </div>
);

const SSOFailed = ({ location }) => (
  <Result
    type="error"
    title={
      <div>
           <FormattedMessage id="app.sso-failed-result.message" />
      </div>
    }
    actions={actions}
    style={{ marginTop: 56 }}
  />
);

export default SSOFailed;
