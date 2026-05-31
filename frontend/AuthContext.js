// Firebase AuthContext listener token refreshed trigger
export function setupIdTokenListener(auth, callback) {
  return auth.onIdTokenChanged(async (user) => {
    if (user) {
      const token = await user.getIdToken(true);
      callback(token);
    }
  });
}
