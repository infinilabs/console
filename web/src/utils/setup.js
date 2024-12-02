export function getSetupRequired(str) {
  return localStorage.getItem("infini-setup-required");
}

export function setSetupRequired(required) {
  localStorage.setItem("infini-setup-required", required || `false`);
}