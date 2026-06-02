export function extractNotificationsFromResponse(response) {
  if (Array.isArray(response?.data?.notifications)) {
    return response.data.notifications;
  }

  if (Array.isArray(response?.notifications)) {
    return response.notifications;
  }

  return [];
}
