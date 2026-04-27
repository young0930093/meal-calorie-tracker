const K = {
  PROFILES: 'meal_tracker:profiles',
  ACTIVE: 'meal_tracker:active_profile_id',
  USER: 'meal_tracker:user',
  meals: (id) => `meal_tracker:meals:${id}`,
};

const parse = (key) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
};

export const getUser = () => parse(K.USER);
export const saveUser = (u) => localStorage.setItem(K.USER, JSON.stringify(u));
export const removeUser = () => localStorage.removeItem(K.USER);

export const getProfiles = () => parse(K.PROFILES) || [];
export const saveProfiles = (p) => localStorage.setItem(K.PROFILES, JSON.stringify(p));

export const getActiveProfileId = () => localStorage.getItem(K.ACTIVE);
export const setActiveProfileId = (id) => {
  if (id) localStorage.setItem(K.ACTIVE, id);
  else localStorage.removeItem(K.ACTIVE);
};

export const getMeals = (profileId) => parse(K.meals(profileId)) || [];
export const saveMeals = (profileId, meals) =>
  localStorage.setItem(K.meals(profileId), JSON.stringify(meals));

export const addMeal = (profileId, meal) => {
  const meals = getMeals(profileId);
  const updated = [...meals, meal];
  saveMeals(profileId, updated);
  return updated;
};

export const deleteMeal = (profileId, mealId) => {
  const updated = getMeals(profileId).filter((m) => m.id !== mealId);
  saveMeals(profileId, updated);
  return updated;
};

export const exportAllData = (profileId) => ({
  exportedAt: new Date().toISOString(),
  profiles: getProfiles(),
  meals: getMeals(profileId),
});
