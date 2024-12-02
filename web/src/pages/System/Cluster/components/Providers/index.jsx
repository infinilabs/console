import { Icon, Tooltip } from "antd";
import "./index.scss";
import { useState, useEffect } from "react";
import { ProviderIcon, Providers } from "@/lib/providers";
import { formatMessage } from "umi/locale";

export default ({ value, onChange }) => {
  return (
    <div className="searchLocationBox">
      <Tooltip
        title={formatMessage({
          id: "cluster.manage.label.provider.on_premises",
        })}
      >
        <div
          className={
            value == Providers.OnPremises
              ? "searchLocationBoxActive"
              : "searchLocationBoxDisable"
          }
          onClick={() => {
            onChange(Providers.OnPremises);
          }}
        >
          <ProviderIcon provider={Providers.OnPremises} />
          {/* <span>
          {formatMessage({
            id: "cluster.manage.label.provider.on_premises",
          })}
        </span> */}
        </div>
      </Tooltip>
      <Tooltip
        title={formatMessage({
          id: "cluster.manage.label.provider.aws",
        })}
      >
        <div
          className={
            value == Providers.AWS
              ? "searchLocationBoxActive"
              : "searchLocationBoxDisable"
          }
          onClick={() => {
            onChange(Providers.AWS);
          }}
        >
          <ProviderIcon provider={Providers.AWS} />
          {/* <span>
          {formatMessage({
            id: "cluster.manage.label.provider.aws",
          })}
        </span> */}
        </div>
      </Tooltip>
      <Tooltip
        title={formatMessage({
          id: "cluster.manage.label.provider.azure",
        })}
      >
        <div
          className={
            value == Providers.Azure
              ? "searchLocationBoxActive"
              : "searchLocationBoxDisable"
          }
          onClick={() => {
            onChange(Providers.Azure);
          }}
        >
          <ProviderIcon provider={Providers.Azure} />
          {/* <span>
          {formatMessage({
            id: "cluster.manage.label.provider.azure",
          })}
        </span> */}
        </div>
      </Tooltip>
      <Tooltip
        title={formatMessage({
          id: "cluster.manage.label.provider.gcp",
        })}
      >
        <div
          className={
            value == Providers.GCP
              ? "searchLocationBoxActive"
              : "searchLocationBoxDisable"
          }
          onClick={() => {
            onChange(Providers.GCP);
          }}
        >
          <ProviderIcon provider={Providers.GCP} />
          {/* <span>
          {formatMessage({
            id: "cluster.manage.label.provider.gcp",
          })}
        </span> */}
        </div>
      </Tooltip>
      <Tooltip
        title={formatMessage({
          id: "cluster.manage.label.provider.ibm",
        })}
      >
        <div
          className={
            value == Providers.IBM
              ? "searchLocationBoxActive"
              : "searchLocationBoxDisable"
          }
          onClick={() => {
            onChange(Providers.IBM);
          }}
        >
          <ProviderIcon provider={Providers.IBM} />
          {/* <span>
          {formatMessage({
            id: "cluster.manage.label.provider.ibm",
          })}
        </span> */}
        </div>
      </Tooltip>
      <Tooltip
        title={formatMessage({
          id: "cluster.manage.label.provider.oracle",
        })}
      >
        <div
          className={
            value == Providers.Oracle
              ? "searchLocationBoxActive"
              : "searchLocationBoxDisable"
          }
          onClick={() => {
            onChange(Providers.Oracle);
          }}
        >
          <ProviderIcon provider={Providers.Oracle} />
          {/* <span>
          {formatMessage({
            id: "cluster.manage.label.provider.oracle",
          })}
        </span> */}
        </div>
      </Tooltip>
      <Tooltip
        title={formatMessage({
          id: "cluster.manage.label.provider.digital-ocean",
        })}
      >
        <div
          className={
            value == Providers.DigitalOcean
              ? "searchLocationBoxActive"
              : "searchLocationBoxDisable"
          }
          onClick={() => {
            onChange(Providers.DigitalOcean);
          }}
        >
          <ProviderIcon provider={Providers.DigitalOcean} />
          {/* <span>
          {formatMessage({
            id: "cluster.manage.label.provider.digital-ocean",
          })}
        </span> */}
        </div>
      </Tooltip>
      <Tooltip
        title={formatMessage({
          id: "cluster.manage.label.provider.aliyun",
        })}
      >
        <div
          className={
            value == Providers.Aliyun
              ? "searchLocationBoxActive"
              : "searchLocationBoxDisable"
          }
          onClick={() => {
            onChange(Providers.Aliyun);
          }}
        >
          <ProviderIcon provider={Providers.Aliyun} />
          {/* <span>
          {formatMessage({
            id: "cluster.manage.label.provider.aliyun",
          })}
        </span> */}
        </div>
      </Tooltip>
      <Tooltip
        title={formatMessage({
          id: "cluster.manage.label.provider.tencent_cloud",
        })}
      >
        <div
          className={
            value == Providers.TencentCloud
              ? "searchLocationBoxActive"
              : "searchLocationBoxDisable"
          }
          onClick={() => {
            onChange(Providers.TencentCloud);
          }}
        >
          <ProviderIcon provider={Providers.TencentCloud} />
          {/* <span>
          {formatMessage({
            id: "cluster.manage.label.provider.tencent_cloud",
          })}
        </span> */}
        </div>
      </Tooltip>
      <Tooltip
        title={formatMessage({
          id: "cluster.manage.label.provider.ecloud",
        })}
      >
        <div
          className={
            value == Providers.Ecloud
              ? "searchLocationBoxActive"
              : "searchLocationBoxDisable"
          }
          onClick={() => {
            onChange(Providers.Ecloud);
          }}
        >
          <ProviderIcon provider={Providers.Ecloud} />
          {/* <span>
          {formatMessage({
            id: "cluster.manage.label.provider.ecloud",
          })}
        </span> */}
        </div>
      </Tooltip>
    </div>
  );
};
