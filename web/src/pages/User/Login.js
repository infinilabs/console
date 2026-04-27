import React, { Component } from "react";
import { connect } from "dva";
import { formatMessage, FormattedMessage } from "umi/locale";
import Link from "umi/link";
import { Checkbox, Alert, Icon,Button } from "antd";
import router from "umi/router";
import Login from "@/components/Login";
import { getHealth } from "@/services/system";
import { getSetupRequired, setSetupRequired } from "@/utils/setup";
import styles from "./Login.less";
import "./LoginPage.scss";

const { Tab, UserName, Password, Mobile, Captcha, Submit } = Login;

@connect(({ login, loading }) => ({
  login,
  submitting: loading.effects["login/login"],
}))
class LoginPage extends Component {
  state = {
    type: "account",
    autoLogin: true,
  };

  componentDidMount() {
    if (getSetupRequired() === "true") {
      router.replace("/guide/initialization");
      return;
    }

    this.syncSetupState();
  }

  syncSetupState = async () => {
    try {
      const res = await getHealth();
      setSetupRequired(`${!!res?.setup_required}`);
      if (res?.setup_required) {
        router.replace("/guide/initialization");
      }
    } catch (error) {
      console.log(error);
    }
  };

  onTabChange = (type) => {
    this.setState({ type });
  };

  onGetCaptcha = () =>
    new Promise((resolve, reject) => {
      this.loginForm.validateFields(["mobile"], {}, (err, values) => {
        if (err) {
          reject(err);
        } else {
          const { dispatch } = this.props;
          dispatch({
            type: "login/getCaptcha",
            payload: values.mobile,
          })
            .then(resolve)
            .catch(reject);
        }
      });
    });

  handleSubmit = (err, values) => {
    const { type } = this.state;
    if (!err) {
      const { dispatch } = this.props;
      dispatch({
        type: "login/login",
        payload: {
          ...values,
          type,
        },
      });
    }
  };

  changeAutoLogin = (e) => {
    this.setState({
      autoLogin: e.target.checked,
    });
  };

  renderMessage = (content) => (
    <Alert
      style={{ marginBottom: 24 }}
      message={content}
      type="error"
      showIcon
    />
  );

  render() {
    const { login, submitting } = this.props;
    const { type, autoLogin } = this.state;
    return (
      <div className={`login-wrapper ${styles.main}`}>
        <Login
          defaultActiveKey={type}
          onTabChange={this.onTabChange}
          onSubmit={this.handleSubmit}
          ref={(form) => {
            this.loginForm = form;
          }}
        >
          <Tab
            key="account"
            tab={formatMessage({ id: "app.login.tab-login-credentials" })}
          >
            {login.status === "error" &&
              login.type === "account" &&
              !submitting &&
              this.renderMessage(
                formatMessage({ id: "app.login.message-invalid-credentials" })
              )}
            <UserName name="userName" placeholder="username" />
            <Password
              name="password"
              placeholder="password"
              onPressEnter={() =>
                this.loginForm.validateFields(this.handleSubmit)
              }
            />
          </Tab>
          {/* <Tab key="mobile" tab={formatMessage({ id: 'app.login.tab-login-mobile' })}>
            {login.status === 'error' &&
              login.type === 'mobile' &&
              !submitting &&
              this.renderMessage(formatMessage({ id: 'app.login.message-invalid-verification-code' }))}
            <Mobile name="mobile" />
            <Captcha name="captcha" countDown={120} onGetCaptcha={this.onGetCaptcha} />
          </Tab> */}
          <div>
            <Checkbox checked={autoLogin} onChange={this.changeAutoLogin}>
              <FormattedMessage id="app.login.remember-me" />
            </Checkbox>
            {/* <a style={{ float: 'right' }} href="">
              <FormattedMessage id="app.login.forgot-password" />
            </a> */}
          </div>
          <Submit loading={submitting}>
            <FormattedMessage id="app.login.login" />
          </Submit>
          {<div className={styles.other}>
            <FormattedMessage id="app.login.sign-in-with" />
            <Button type="link" href="/sso/login/"><Icon type="github" className={styles.icon} theme="outlined" /></Button>
          </div> }
        </Login>
      </div>
    );
  }
}

export default LoginPage;
