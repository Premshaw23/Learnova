const STORAGE_KEY = "recentlyViewedResources";

export const addRecentlyViewed = (resource) => {
  const existing = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "[]"
  );

  const filtered = existing.filter(
    (item) => item.id !== resource.id
  );

  filtered.unshift({
    ...resource,
    viewedAt: new Date().toISOString(),
  });

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(filtered.slice(0, 20))
  );
};

export const getRecentlyViewed = () => {
  return JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "[]"
  );
};

export const clearRecentlyViewed = () => {
  localStorage.removeItem(STORAGE_KEY);
};