import React from 'react';
import { Icon } from 'antd';
import { formatMessage } from 'umi/locale';
import styles from './index.less';

export default {
  UserName: {
    props: {
      size: 'large',
      prefix: <Icon type="user" className={styles.prefixIcon} />,
      placeholder: 'admin',
    },
    rules: [
      {
        required: true,
        message: formatMessage({ id: 'app.login.username.required' }),
      },
    ],
  },
  Password: {
    props: {
      size: 'large',
      prefix: <Icon type="lock" className={styles.prefixIcon} />,
      type: 'password',
      placeholder: '888888',
    },
    rules: [
      {
        required: true,
        message: formatMessage({ id: 'app.login.password.required' }),
      },
    ],
  },
  Mobile: {
    props: {
      size: 'large',
      prefix: <Icon type="mobile" className={styles.prefixIcon} />,
      placeholder: formatMessage({ id: 'app.login.mobile.placeholder' }),
    },
    rules: [
      {
        required: true,
        message: formatMessage({ id: 'app.login.mobile.required' }),
      },
      {
        pattern: /^1\d{10}$/,
        message: formatMessage({ id: 'app.login.mobile.invalid' }),
      },
    ],
  },
  Captcha: {
    props: {
      size: 'large',
      prefix: <Icon type="mail" className={styles.prefixIcon} />,
      placeholder: formatMessage({ id: 'app.login.captcha.placeholder' }),
    },
    rules: [
      {
        required: true,
        message: formatMessage({ id: 'app.login.captcha.required' }),
      },
    ],
  },
};
