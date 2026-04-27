import { createContext, useContext, useState } from 'react';
import * as S from '../utils/storage';
import { calcBMR, calcTDEE, calcTargets } from '../utils/calculations';

const Ctx = createContext(null);

function buildProfileData(data) {
  const bmr = calcBMR(data.gender, data.weight_kg, data.height_cm, data.age);
  const tdee = calcTDEE(bmr, data.activity);
  return {
    ...data,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    ...calcTargets(tdee, data.weight_kg),
  };
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => S.getUser());
  const [profiles, setProfiles] = useState(() => S.getProfiles());
  const [activeId, setActiveIdState] = useState(() => S.getActiveProfileId());
  // Upload flow state: items accumulated before saving as a meal
  const [pendingItems, setPendingItems] = useState([]);
  const [pendingMeta, setPendingMeta] = useState(null); // { date, mealType }

  const activeProfile = profiles.find((p) => p.id === activeId) || null;

  const login = (u) => {
    S.saveUser(u);
    setUser(u);
  };

  const logout = () => {
    S.removeUser();
    S.setActiveProfileId(null);
    setUser(null);
    setActiveIdState(null);
  };

  const createProfile = (data) => {
    const profile = { id: Date.now().toString(), ...buildProfileData(data) };
    const updated = [...profiles, profile];
    S.saveProfiles(updated);
    setProfiles(updated);
    return profile;
  };

  const updateProfile = (id, data) => {
    const updated = profiles.map((p) =>
      p.id === id ? { ...p, ...buildProfileData(data) } : p
    );
    S.saveProfiles(updated);
    setProfiles(updated);
  };

  const deleteProfile = (id) => {
    const updated = profiles.filter((p) => p.id !== id);
    S.saveProfiles(updated);
    setProfiles(updated);
    if (activeId === id) {
      const newId = updated[0]?.id || null;
      S.setActiveProfileId(newId);
      setActiveIdState(newId);
    }
  };

  const setActiveProfile = (id) => {
    S.setActiveProfileId(id);
    setActiveIdState(id);
  };

  const getMealsForDate = (date) =>
    activeId ? S.getMeals(activeId).filter((m) => m.date === date) : [];

  const getAllMeals = () => (activeId ? S.getMeals(activeId) : []);

  const saveMealEntry = (meal) => {
    if (activeId) S.addMeal(activeId, meal);
  };

  const deleteMealEntry = (mealId) => {
    if (activeId) S.deleteMeal(activeId, mealId);
  };

  const clearPending = () => {
    setPendingItems([]);
    setPendingMeta(null);
  };

  return (
    <Ctx.Provider
      value={{
        user, login, logout,
        profiles, activeProfile, activeId,
        createProfile, updateProfile, deleteProfile, setActiveProfile,
        pendingItems, setPendingItems,
        pendingMeta, setPendingMeta, clearPending,
        getMealsForDate, getAllMeals, saveMealEntry, deleteMealEntry,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useApp = () => useContext(Ctx);
