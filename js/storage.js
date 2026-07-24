const Storage = {
  keys: {
    profile: "fittrack_profile",
    goals: "fittrack_goals",
    meals: "fittrack_meals",
    water: "fittrack_water",
    weights: "fittrack_weights",
    customFoods: "fittrack_custom_foods",
    plans: "fittrack_meal_plans"
  },

  get(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  /* PROFILE */
  getProfile() {
    return this.get(this.keys.profile, null);
  },

  saveProfile(profile) {
    this.set(this.keys.profile, profile);
  },

  /* NUTRITION GOALS */
  getGoals() {
    return this.get(this.keys.goals, {
      calories: 2000,
      protein: 80,
      carbs: 250,
      fat: 65,
      water: 8
    });
  },

  saveGoals(goals) {
    this.set(this.keys.goals, goals);
  },

  /* MEALS */
  getMeals(date) {
    const all = this.get(this.keys.meals, {});
    return all[date] || {
      breakfast: [],
      "morning-snacks": [],
      lunch: [],
      "evening-snacks": [],
      dinner: []
    };
  },

  saveMeals(date, meals) {
    const all = this.get(this.keys.meals, {});
    all[date] = meals;
    this.set(this.keys.meals, all);
  },

  addMealFood(date, meal, food) {
    const meals = this.getMeals(date);

    if (!meals[meal]) meals[meal] = [];

    meals[meal].push({
      ...food,
      logId: Date.now() + Math.random()
    });

    this.saveMeals(date, meals);
  },

  removeMealFood(date, meal, logId) {
    const meals = this.getMeals(date);

    if (!meals[meal]) return;

    meals[meal] = meals[meal].filter(
      food => String(food.logId) !== String(logId)
    );

    this.saveMeals(date, meals);
  },

  getAllMeals() {
    return this.get(this.keys.meals, {});
  },

  /* WATER */
  getWater(date) {
    const all = this.get(this.keys.water, {});
    return all[date] || 0;
  },

  saveWater(date, glasses) {
    const all = this.get(this.keys.water, {});

    all[date] = Math.max(0, glasses);

    this.set(this.keys.water, all);
  },

  /* WEIGHT */
  getWeights() {
    return this.get(this.keys.weights, []);
  },

  saveWeight(date, weight) {
    let logs = this.getWeights();

    const existing = logs.find(
      item => item.date === date
    );

    if (existing) {
      existing.weight = Number(weight);
    } else {
      logs.push({
        date,
        weight: Number(weight)
      });
    }

    logs.sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    this.set(this.keys.weights, logs);
  },

  deleteWeight(date) {
    let logs = this.getWeights();

    logs = logs.filter(
      item => item.date !== date
    );

    this.set(this.keys.weights, logs);
  },

  /* CUSTOM FOODS */
  getCustomFoods() {
    return this.get(this.keys.customFoods, []);
  },

  saveCustomFood(food) {
    const foods = this.getCustomFoods();

    foods.push({
      ...food,
      id: "custom_" + Date.now(),
      custom: true
    });

    this.set(this.keys.customFoods, foods);
  },

  deleteCustomFood(id) {
    let foods = this.getCustomFoods();

    foods = foods.filter(
      food => String(food.id) !== String(id)
    );

    this.set(this.keys.customFoods, foods);
  },

  /* MEAL PLANS */
  getPlans(date) {
    const plans = this.get(this.keys.plans, {});

    return plans[date] || {
      breakfast: [],
      "morning-snacks": [],
      lunch: [],
      "evening-snacks": [],
      dinner: []
    };
  },

  savePlans(date, plan) {
    const all = this.get(this.keys.plans, {});

    all[date] = plan;

    this.set(this.keys.plans, all);
  },

  addPlanFood(date, meal, food) {
    const plan = this.getPlans(date);

    if (!plan[meal]) plan[meal] = [];

    plan[meal].push({
      ...food,
      planId: Date.now() + Math.random()
    });

    this.savePlans(date, plan);
  },

  removePlanFood(date, meal, planId) {
    const plan = this.getPlans(date);

    if (!plan[meal]) return;

    plan[meal] = plan[meal].filter(
      food => String(food.planId) !== String(planId)
    );

    this.savePlans(date, plan);
  },

  /* RESET */
  reset() {
    Object.values(this.keys).forEach(
      key => localStorage.removeItem(key)
    );
  }
};
