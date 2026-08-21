import React, { useEffect } from "react";
import { formatMessage, FormattedMessage } from "umi/locale";
import { Button } from "antd";
import Link from "umi/link";
import Result from "@/components/Result";
import { router } from "umi";
import { setAuthority } from "@/utils/authority";
import { reloadAuthorized } from "@/utils/Authorized";
import {
  clearStoredLoginResponse,
  storeLoginResponse,
} from "@/utils/auth_session";

const actions = (
  <div>
    <Link to="/">
      <Button size="large">
        <FormattedMessage id="app.register-result.back-home" />
      </Button>
    </Link>
  </div>
);

const SSOSuccess = ({ location }) => {
  useEffect(() => {
    if (location?.query?.payload) {
      const loginResponse = storeLoginResponse(location.query.payload);
      try {
        const query = loginResponse || JSON.parse(location.query.payload);
        if (query?.privilege) {
          setAuthority(query.privilege);
          reloadAuthorized();
        } else {
          localStorage.setItem("infini-console-authority", "");
        }
      } catch (error) {
        localStorage.setItem("infini-console-authority", "");
      }
    } else {
      clearStoredLoginResponse();
    }
    setTimeout(() => {
      router.push("/");
    }, 2000);
  }, []);

  return (
    <Result
      type="success"
      title={
        <div>
          <FormattedMessage id="app.sso-success-result.message" />
        </div>
      }
      actions={actions}
      style={{ marginTop: 56 }}
    />
  );
};

export default SSOSuccess;
