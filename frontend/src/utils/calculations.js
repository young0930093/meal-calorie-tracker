export function calcBMR(gender, weight, height, age) {
  if (gender === '여') {
    return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }
  return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
}

export function calcTDEE(bmr, activity) {
  const factors = { 적음: 1.2, 보통: 1.55, 많음: 1.725 };
  return bmr * (factors[activity] ?? 1.55);
}

export function calcTargets(tdee, weight) {
  return {
    target_calories: Math.round(tdee),
    target_carbs_g: Math.round((tdee * 0.55) / 4),
    target_protein_g: Math.round(weight * 1.0),
    target_fat_g: Math.round((tdee * 0.25) / 9),
  };
}

export function calcExercise(weight, calories) {
  if (!calories || calories <= 0) return { running_km: 0, walking_min: 0, cycling_min: 0 };
  return {
    running_km: +(calories / (weight * 1.036)).toFixed(1),
    walking_min: Math.round(calories / (weight * 0.067)),
    cycling_min: Math.round(calories / (weight * 0.133)),
  };
}

export function sumNutrition(foods) {
  return foods.reduce(
    (acc, f) => ({
      calorie: acc.calorie + (f.calorie || 0),
      carbs_g: acc.carbs_g + (f.carbs_g || 0),
      protein_g: acc.protein_g + (f.protein_g || 0),
      fat_g: acc.fat_g + (f.fat_g || 0),
    }),
    { calorie: 0, carbs_g: 0, protein_g: 0, fat_g: 0 }
  );
}

export function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function linearRegressionSlope(values) {
  const n = values.length;
  if (n < 2) return 0;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((a, v) => a + v, 0) / n;
  const num = values.reduce((a, v, i) => a + (i - meanX) * (v - meanY), 0);
  const den = values.reduce((a, _, i) => a + (i - meanX) ** 2, 0);
  return den === 0 ? 0 : num / den;
}

export function formatDate(dateStr) {
  const [, m, d] = dateStr.split('-');
  return `${parseInt(m)}/${parseInt(d)}`;
}

export function getPast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    days.push(`${y}-${mo}-${day}`);
  }
  return days;
}
