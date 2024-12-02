import { Icon } from "antd";
import AliyunImg from "@/assets/aliyun.svg";
import TenxunyunImg from "@/assets/txunyun.svg";
import YidongyunImg from "@/assets/yidongyun.svg";
import PrivateImg from "@/assets/private.svg";
import AWSImg from "@/assets/aws.svg";
import AzureImg from "@/assets/azure.svg";
import GCPImg from "@/assets/gcp.svg";
import IBMImg from "@/assets/ibm.svg";
import OracleImg from "@/assets/oracle.svg";
import DigitalOceanImg from "@/assets/digitalOcean.svg";
import { useMemo } from "react";

export const generateIcon = (width, height, src) => {
  return () => <img height={height} width={width} src={src} />;
};

export const ProviderIcon = ({ provider, width = "24px", height = "24px" }) => {
  const [
    aliyunIcon,
    tenxunyunIcon,
    yidongyunIcon,
    privateIcon,
    awsIcon,
    azureIcon,
    gcpIcon,
    ibmIcon,
    oracleIcon,
    digitalOceanIcon,
  ] = useMemo(() => {
    return [
      generateIcon(width, height, AliyunImg),
      generateIcon(width, height, TenxunyunImg),
      generateIcon(width, height, YidongyunImg),
      generateIcon(width, height, PrivateImg),
      generateIcon(width, height, AWSImg),
      generateIcon(width, height, AzureImg),
      generateIcon(width, height, GCPImg),
      generateIcon(width, height, IBMImg),
      generateIcon(width, height, OracleImg),
      generateIcon(width, height, DigitalOceanImg),
    ];
  }, [width, height]);
  switch (provider) {
    case Providers.Aliyun:
      return (
        <Icon component={aliyunIcon} style={{ width: width, height: height }} />
      );
    case Providers.TencentCloud:
      return (
        <Icon
          component={tenxunyunIcon}
          style={{ width: width, height: height }}
        />
      );
    case Providers.Ecloud:
      return (
        <Icon
          component={yidongyunIcon}
          style={{ width: width, height: height }}
        />
      );
    case Providers.AWS:
      return (
        <Icon component={awsIcon} style={{ width: width, height: height }} />
      );
    case Providers.Azure:
      return (
        <Icon component={azureIcon} style={{ width: width, height: height }} />
      );
    case Providers.GCP:
      return (
        <Icon component={gcpIcon} style={{ width: width, height: height }} />
      );
    case Providers.IBM:
      return (
        <Icon component={ibmIcon} style={{ width: width, height: height }} />
      );
    case Providers.Oracle:
      return (
        <Icon component={oracleIcon} style={{ width: width, height: height }} />
      );
    case Providers.DigitalOcean:
      return (
        <Icon
          component={digitalOceanIcon}
          style={{ width: width, height: height }}
        />
      );
    default:
      return (
        <Icon
          component={privateIcon}
          style={{ width: width, height: height }}
        />
      );
  }
};

export const Providers = {
  OnPremises: "on-premises",
  AWS: "aws",
  Azure: "azure",
  GCP: "gcp",
  IBM: "ibm",
  Oracle: "oracle",
  DigitalOcean: "digital-ocean",
  Aliyun: "aliyun",
  TencentCloud: "tencent-cloud",
  Ecloud: "ecloud",
};
