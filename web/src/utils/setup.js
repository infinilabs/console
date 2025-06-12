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