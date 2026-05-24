export function getSetupRequired(str) {
  return localStorage.getItem("infini-setup-required");
}

export function setSetupRequired(required) {
  localStorage.setItem("infini-setup-required", required || `false`);
}

export function isSystemCluster(clusterID){
  return clusterID === getSystemClusterID();
}

export function getSystemClusterID() {
  return 'infini_default_system_cluster';
}

export function getPreferredCluster(clusters = [], options = {}) {
  if (!Array.isArray(clusters) || clusters.length === 0) {
    return null;
  }

  const { selectedClusterID, targetClusterID } = options;
  const findCluster = (clusterID) =>
    clusterID ? clusters.find((item) => item.id === clusterID) : null;

  return (
    findCluster(selectedClusterID) ||
    findCluster(targetClusterID) ||
    findCluster(getSystemClusterID()) ||
    clusters[0] ||
    null
  );
}
