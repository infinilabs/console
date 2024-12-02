// use localStorage to store the currentUser info, which might be sent from server in actual project.
const currentUserKey = 'current-user';

export function getCurrentUser() {
  const userString = localStorage.getItem(currentUserKey);
  let user;
  try {
    user = JSON.parse(userString);
  } catch (e) {
    user = userString;
  }

  return user;
}

export function setCurrentUser(user) {
  const userJson = typeof user === 'string' ? JSON.parse(user) : user;
  return localStorage.setItem(currentUserKey, JSON.stringify(userJson));
}

export function clearCurrentUser() {
  return setCurrentUser({});
}
