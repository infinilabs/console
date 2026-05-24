import { formatMessage } from "umi/locale";

export const formatConfigsValues = (configs) => {
  const configs_new = {};
  Object.keys(configs).map((k) => {
    let item = configs[k];
    item.interval = item?.interval
      ? item.interval.toString().replace(/s/g, "")
      : 10;
    configs_new[k] = {
      ...item,
      interval: `${item.interval}s`,
    };
  });
  return configs_new;
};

export const getClusterProbePath = (cluster) =>
  cluster?.probe_path || cluster?.labels?.console_probe_path || "";

const normalizeReason = (reason) => `${reason || ""}`.trim();

const resolveClusterConnectErrorMessageByKey = (key) => {
  if (!key || !String(key).startsWith("cluster.")) {
    return "";
  }
  return formatMessage({ id: key });
};

const extractStructuredReason = (reason) => {
  const normalized = normalizeReason(reason);
  if (!normalized.startsWith("{")) {
    return normalized;
  }
  try {
    const payload = JSON.parse(normalized);
    return (
      payload?.error?.reason ||
      payload?.error?.root_cause?.[0]?.reason ||
      normalized
    );
  } catch (e) {
    return normalized;
  }
};

export const getClusterConnectErrorMessage = (
  reason,
  fallbackId = "guide.cluster.test.connection.failed"
) => {
  const normalizedReason = extractStructuredReason(reason).replace(
    /^error on get cluster health:\s*/i,
    ""
  );
  const lowerReason = normalizedReason.toLowerCase();
  if (!normalizedReason) {
    return formatMessage({ id: fallbackId });
  }

  if (normalizedReason.includes("cluster health status is red")) {
    return formatMessage({ id: "cluster.connect.error.health_red" });
  }

  if (
    lowerReason.includes("invalid character '<' looking for beginning of value") ||
    lowerReason.includes("<!doctype html>") ||
    lowerReason.includes("<html")
  ) {
    return formatMessage({ id: "cluster.connect.error.non_es_endpoint" });
  }

  if (
    lowerReason.includes("client sent an http request to an https server") ||
    lowerReason.includes("server gave http response to https client") ||
    lowerReason.includes("first record does not look like a tls handshake")
  ) {
    return formatMessage({ id: "cluster.connect.error.tls_mismatch" });
  }

  if (
    lowerReason.includes("missing authentication information") ||
    lowerReason.includes("security_exception") ||
    lowerReason.includes("unauthorized") ||
    lowerReason.includes("invalid status code: 401")
  ) {
    return formatMessage({ id: "cluster.connect.error.auth_required" });
  }

  if (
    lowerReason.includes("connection refused") ||
    lowerReason.includes("no such host") ||
    lowerReason.includes("context deadline exceeded") ||
    lowerReason.includes("i/o timeout") ||
    lowerReason.includes("timeout") ||
    lowerReason.includes(": eof") ||
    lowerReason.endsWith(" eof")
  ) {
    return formatMessage({ id: "cluster.connect.error.endpoint_unreachable" });
  }

  if (lowerReason.includes("invalid status code")) {
    return formatMessage({ id: "cluster.connect.error.unexpected_status" });
  }

  return normalizedReason;
};

export const getClusterConnectErrorMessageFromResponse = (
  response,
  fallbackId = "guide.cluster.test.connection.failed"
) => {
  const key =
    typeof response?.error === "string" ? "" : response?.error?.key || "";
  const localizedMessage = resolveClusterConnectErrorMessageByKey(key);
  if (localizedMessage) {
    return localizedMessage;
  }
  const reason =
    typeof response?.error === "string"
      ? response.error
      : response?.error?.reason;
  return getClusterConnectErrorMessage(reason, fallbackId);
};

export const getClusterConnectErrorMessageFromError = async (
  error,
  fallbackId = "guide.cluster.test.connection.failed"
) => {
  let key =
    (typeof error?.error === "string" ? "" : error?.error?.key) || "";
  let reason =
    (typeof error?.error === "string" ? error.error : error?.error?.reason) ||
    "";

  if (!reason && error?.rawResponse?.clone) {
    try {
      const payload = await error.rawResponse.clone().json();
      key = typeof payload?.error === "string" ? "" : payload?.error?.key || key;
      reason =
        typeof payload?.error === "string"
          ? payload.error
          : payload?.error?.reason || "";
    } catch (e) {}
  }

  const localizedMessage = resolveClusterConnectErrorMessageByKey(key);
  if (localizedMessage) {
    return localizedMessage;
  }

  return getClusterConnectErrorMessage(reason, fallbackId);
};
