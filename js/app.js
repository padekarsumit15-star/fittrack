/* =========================================
   FITTRACK - MAIN APP
   PART 1/5
========================================= */

const App = {
  page: "home",
  date: today(),
  selectedFood: null,
  selectedMeal: "breakfast",
  confirmAction: null,

  meals: [
    ["breakfast", "☀️", "Breakfast"],
    ["morning-snacks", "🍌", "Morning Snacks"],
    ["lunch", "🍲", "Lunch"],
    ["evening-snacks", "🥜", "Evening Snacks"],
    ["dinner", "🌙", "Dinner"]
  ],

  init() {
    this.bindMainEvents();

    const profile = Storage.getProfile();

    if (!profile) {
      document.getElementById("onboarding")
        .classList.remove("hidden");

      document.getElementById("mainApp")
        .classList.add("hidden");

      return;
    }

    this.openApp();
  },

  bindMainEvents() {
    document.getElementById("startBtn")
      .addEventListener("click", () => this.finishOnboarding());

    document.getElementById("profileBtn")
      .addEventListener("click", () => this.showPage("profile"));

    document.querySelectorAll("#bottomNav button")
      .forEach(btn => {
        btn.addEventListener("click", () => {
          this.showPage(btn.dataset.page);
        });
      });

    document.getElementById("closeModal")
      .addEventListener("click", () => closeModal());

    document.getElementById("modalBackdrop")
      .addEventListener("click", () => closeModal());

    document.getElementById("cancelConfirm")
      .addEventListener("click", () => hideConfirm());

    document.getElementById("acceptConfirm")
      .addEventListener("click", () => {
        if (this.confirmAction) {
          this.confirmAction();
        }

        hideConfirm();
      });
  },

  finishOnboarding() {
    const name = value("name");
    const age = Number(value("age"));
    const gender = value("gender");
    const height = Number(value("height"));
    const weight = Number(value("weight"));
    const targetWeight = Number(value("targetWeight"));
    const goal = value("goal");
    const activity = Number(value("activity"));

    if (
      !name ||
      !age ||
      !gender ||
      !height ||
      !weight ||
      !targetWeight
    ) {
      toast("Please complete all fields");
      return;
    }

    if (
      age < 10 ||
      height < 100 ||
      weight < 20 ||
      targetWeight < 20
    ) {
      toast("Please enter valid details");
      return;
    }

    const profile = {
      name,
      age,
      gender,
      height,
      weight,
      startWeight: weight,
      targetWeight,
      goal,
      activity
    };

    Storage.saveProfile(profile);

    const goals = calculateGoals(profile);
    Storage.saveGoals(goals);

    Storage.saveWeight(today(), weight);

    this.openApp();

    toast("Welcome to FitTrack!");
  },

  openApp() {
    document.getElementById("onboarding")
      .classList.add("hidden");

    document.getElementById("mainApp")
      .classList.remove("hidden");

    this.date = today();
    this.showPage("home");
  },

  showPage(page) {
    this.page = page;

    document.querySelectorAll("#bottomNav button")
      .forEach(btn => {
        btn.classList.toggle(
          "active",
          btn.dataset.page === page
        );
      });

    const titles = {
      home: "FitTrack",
      diary: "Food Diary",
      add: "Add Food",
      progress: "Progress",
      profile: "Profile"
    };

    document.getElementById("pageTitle").textContent =
      titles[page] || "FitTrack";

    const profile = Storage.getProfile();

    if (profile) {
      document.getElementById("greeting").textContent =
        page === "home"
          ? `${greeting()}, ${profile.name}`
          : "FitTrack";
    }

    switch (page) {
      case "home":
        this.renderHome();
        break;

      case "diary":
        this.renderDiary();
        break;

      case "add":
        this.renderAddFood();
        break;

      case "progress":
        this.renderProgress();
        break;

      case "profile":
        this.renderProfile();
        break;
    }

    window.scrollTo(0, 0);
  },

  changeDate(days) {
    const date = parseDate(this.date);
    date.setDate(date.getDate() + days);

    this.date = dateKey(date);

    this.showPage(this.page);
  },

  getAllFoods() {
    return [
      ...(window.FOODS || []),
      ...Storage.getCustomFoods()
    ];
  },

  getTotals(date = this.date) {
    const meals = Storage.getMeals(date);

    const total = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };

    Object.values(meals).forEach(list => {
      list.forEach(food => {
        total.calories += Number(food.calories) || 0;
        total.protein += Number(food.protein) || 0;
        total.carbs += Number(food.carbs) || 0;
        total.fat += Number(food.fat) || 0;
      });
    });

    return total;
  },

  getMealTotal(meal, date = this.date) {
    return Storage.getMeals(date)[meal]
      .reduce(
        (sum, food) =>
          sum + (Number(food.calories) || 0),
        0
      );
  },

  /* =====================================
     HOME
  ===================================== */

  renderHome() {
    const profile = Storage.getProfile();
    const goals = Storage.getGoals();
    const totals = this.getTotals();
    const water = Storage.getWater(this.date);

    const remaining = Math.max(
      0,
      goals.calories - totals.calories
    );

    const caloriePercent = percent(
      totals.calories,
      goals.calories
    );

    const mealRows = this.meals.map(meal => {
      const [key, icon, name] = meal;

      return `
        <div class="food-result"
             onclick="App.openMeal('${key}')">

          <div>
            <strong>${icon} ${name}</strong>
            <small>
              ${this.getMealTotal(key).toFixed(0)} kcal
            </small>
          </div>

          <span>›</span>
        </div>
      `;
    }).join("");

    const glasses = Array.from(
      { length: goals.water },
      (_, i) =>
        `<span class="water-glass ${
          i < water ? "filled" : ""
        }">💧</span>`
    ).join("");

    document.getElementById("content").innerHTML = `
      ${dateNavigation(this.date)}

      <section class="card">

        <div class="calorie-top">
          <div>
            <small class="muted">
              Calories consumed
            </small>

            <div class="calorie-number">
              ${totals.calories.toFixed(0)}
              <small>kcal</small>
            </div>
          </div>

          <div style="text-align:right">
            <small class="muted">
              Remaining
            </small>

            <strong>
              ${remaining.toFixed(0)} kcal
            </strong>
          </div>
        </div>

        <div class="progress">
          <div
            class="progress-bar"
            style="width:${caloriePercent}%">
          </div>
        </div>

        <small class="muted">
          Daily goal: ${goals.calories} kcal
        </small>

      </section>


      <section class="card">
        <h2>Macros</h2>

        <div class="macros">

          ${macroBox(
            "Protein",
            totals.protein,
            goals.protein,
            "protein"
          )}

          ${macroBox(
            "Carbs",
            totals.carbs,
            goals.carbs,
            "carbs"
          )}

          ${macroBox(
            "Fat",
            totals.fat,
            goals.fat,
            "fat"
          )}

        </div>
      </section>


      <section class="card">

        <div class="section-title">
          <h2>Meals</h2>

          <button
            class="text-btn"
            onclick="App.showPage('diary')">
            View Diary
          </button>
        </div>

        ${mealRows}

        <button
          class="primary full"
          onclick="App.showPage('add')">
          + Add Food
        </button>

      </section>


      <section class="card">

        <div class="row">
          <h2>Water</h2>

          <strong>
            ${water} / ${goals.water} glasses
          </strong>
        </div>

        <div class="water-glasses">
          ${glasses}
        </div>

        <div class="water-actions">

          <button
            class="secondary"
            onclick="App.changeWater(-1)">
            −
          </button>

          <button
            class="primary"
            onclick="App.changeWater(1)">
            + 1 Glass
          </button>

        </div>

      </section>


      ${this.weightCard(profile)}

      <section class="card recommendation">

        <h2>💡 Daily Recommendation</h2>

        <p>
          ${this.getRecommendation(
            totals,
            goals
          )}
        </p>

      </section>
    `;
  },

  weightCard(profile) {
    const weights = Storage.getWeights();

    const current = weights.length
      ? weights[weights.length - 1].weight
      : profile.weight;

    const change =
      current - profile.startWeight;

    return `
      <section class="card">

        <div class="section-title">

          <h2>Weight</h2>

          <button
            class="text-btn"
            onclick="App.openWeightModal()">
            + Log
          </button>

        </div>

        <div class="grid">

          <div class="stat">
            <small>Current</small>
            <strong>${current} kg</strong>
          </div>

          <div class="stat">
            <small>Goal</small>
            <strong>
              ${profile.targetWeight} kg
            </strong>
          </div>

          <div class="stat">
            <small>Change</small>
            <strong>
              ${change > 0 ? "+" : ""}
              ${change.toFixed(1)} kg
            </strong>
          </div>

        </div>

      </section>
    `;
  },

  changeWater(amount) {
    const goals = Storage.getGoals();
    let water = Storage.getWater(this.date);

    water += amount;

    water = Math.max(
      0,
      Math.min(water, goals.water)
    );

    Storage.saveWater(this.date, water);

    this.renderHome();
  },

  openMeal(meal) {
    this.selectedMeal = meal;
    this.showPage("diary");

    setTimeout(() => {
      const element =
        document.getElementById(`meal-${meal}`);

      if (element) {
        element.scrollIntoView({
          behavior: "smooth"
        });
      }
    }, 50);
  },

  getRecommendation(totals, goals) {
    if (totals.calories === 0) {
      return "Start logging your meals to see personalized nutrition recommendations.";
    }

    const proteinLeft =
      goals.protein - totals.protein;

    const calorieLeft =
      goals.calories - totals.calories;

    if (totals.calories > goals.calories) {
      return `You've passed today's calorie goal by ${Math.round(
        totals.calories - goals.calories
      )} kcal.`;
    }

    if (proteinLeft > 20) {
      return `You still need about ${Math.round(
        proteinLeft
      )} g of protein. Consider a higher-protein food in your next meal.`;
    }

    if (calorieLeft > 500) {
      return `You have about ${Math.round(
        calorieLeft
      )} kcal remaining today.`;
    }

    if (proteinLeft > 0) {
      return `You're close to your protein goal. About ${Math.round(
        proteinLeft
      )} g remains.`;
    }

    return "Your protein target is complete. Keep your remaining meals balanced.";
  }
};
/* =========================================
   FITTRACK - MAIN APP
   PART 2/5
   Diary + Food Search + Food Logging
========================================= */

/* Add more methods to App */
Object.assign(App, {

  /* =====================================
     DIARY
  ===================================== */

  renderDiary() {
    const totals = this.getTotals();

    const mealSections = this.meals.map(
      ([key, icon, name]) =>
        this.renderMealSection(key, icon, name)
    ).join("");

    document.getElementById("content").innerHTML = `
      ${dateNavigation(this.date)}

      <section class="card">
        <h2>Daily Nutrition</h2>

        <div class="nutrition-grid">

          <div>
            <small>Calories</small>
            <strong>
              ${totals.calories.toFixed(0)}
            </strong>
          </div>

          <div>
            <small>Protein</small>
            <strong>
              ${totals.protein.toFixed(1)} g
            </strong>
          </div>

          <div>
            <small>Carbs</small>
            <strong>
              ${totals.carbs.toFixed(1)} g
            </strong>
          </div>

          <div>
            <small>Fat</small>
            <strong>
              ${totals.fat.toFixed(1)} g
            </strong>
          </div>

        </div>
      </section>

      ${mealSections}

      <section class="card">

        <div class="section-title">
          <div>
            <h2>Meal Planner</h2>
            <small class="muted">
              Plan meals for another day
            </small>
          </div>
        </div>

        <button
          class="secondary full"
          onclick="App.openMealPlanner()">
          Open Meal Planner
        </button>

      </section>
    `;
  },

  renderMealSection(key, icon, name) {
    const foods = Storage.getMeals(this.date)[key] || [];

    const calories = foods.reduce(
      (sum, food) =>
        sum + Number(food.calories || 0),
      0
    );

    let foodHTML;

    if (!foods.length) {
      foodHTML = `
        <div class="empty">
          <span>${icon}</span>
          No food added yet
        </div>
      `;
    } else {
      foodHTML = foods.map(food => `
        <div class="food-entry">

          <div>
            <strong>
              ${escapeHTML(food.name)}
            </strong>

            <small>
              ${escapeHTML(food.serving)}
              ${food.quantity
                ? ` × ${formatNumber(food.quantity)}`
                : ""}
            </small>

            <small>
              P ${formatNumber(food.protein)}g
              · C ${formatNumber(food.carbs)}g
              · F ${formatNumber(food.fat)}g
            </small>
          </div>

          <div style="text-align:right">

            <strong>
              ${Math.round(food.calories)} kcal
            </strong>

            <br>

            <button
              class="remove-food"
              onclick="App.askRemoveFood(
                '${key}',
                '${food.logId}'
              )">
              ×
            </button>

          </div>

        </div>
      `).join("");
    }

    return `
      <section
        class="meal"
        id="meal-${key}">

        <div class="meal-head">

          <div class="meal-title">

            <span>${icon}</span>

            <div>
              <strong>${name}</strong>

              <small>
                ${Math.round(calories)} kcal
              </small>
            </div>

          </div>

          <button
            class="add-meal"
            onclick="App.addToMeal('${key}')">
            +
          </button>

        </div>

        ${foodHTML}

      </section>
    `;
  },

  addToMeal(meal) {
    this.selectedMeal = meal;
    this.showPage("add");
  },

  askRemoveFood(meal, logId) {
    showConfirm(
      "Remove food?",
      "This food will be removed from this meal.",
      () => {
        Storage.removeMealFood(
          this.date,
          meal,
          logId
        );

        this.renderDiary();

        toast("Food removed");
      }
    );
  },


  /* =====================================
     FOOD SEARCH
  ===================================== */

  renderAddFood(search = "") {
    const foods = this.searchFoods(search);

    document.getElementById("content").innerHTML = `

      <label class="form-label">
        Add food to
      </label>

      <select
        id="mealSelect"
        onchange="App.selectedMeal=this.value">

        ${this.meals.map(([key, , name]) => `
          <option
            value="${key}"
            ${this.selectedMeal === key
              ? "selected"
              : ""}>
            ${name}
          </option>
        `).join("")}

      </select>


      <div class="search">

        <span>🔎</span>

        <input
          id="foodSearch"
          type="search"
          placeholder="Search your food database..."
          value="${escapeHTML(search)}"
          autocomplete="off"
          oninput="App.updateFoodSearch(this.value)"
        >

      </div>


      <div class="section-title">

        <small class="muted">
          ${foods.length} food${
            foods.length === 1 ? "" : "s"
          }
        </small>

        <button
          class="text-btn"
          onclick="App.openCustomFood()">
          + Custom Food
        </button>

      </div>


      <div id="foodResults">

        ${this.renderFoodResults(foods)}

      </div>
    `;

    setTimeout(() => {
      const searchBox =
        document.getElementById("foodSearch");

      if (
        searchBox &&
        search &&
        document.activeElement !== searchBox
      ) {
        searchBox.focus();

        searchBox.setSelectionRange(
          searchBox.value.length,
          searchBox.value.length
        );
      }
    }, 0);
  },

  searchFoods(search) {
    const term = search
      .trim()
      .toLowerCase();

    const foods = this.getAllFoods();

    if (!term) return foods;

    return foods.filter(food => {
      const searchable = `
        ${food.name}
        ${food.serving}
        ${food.micro || ""}
      `.toLowerCase();

      return searchable.includes(term);
    });
  },

  updateFoodSearch(search) {
    const results =
      document.getElementById("foodResults");

    if (!results) return;

    const foods = this.searchFoods(search);

    results.innerHTML =
      this.renderFoodResults(foods);

    const counter =
      document.querySelector(
        "#content .section-title small"
      );

    if (counter) {
      counter.textContent =
        `${foods.length} food${
          foods.length === 1 ? "" : "s"
        }`;
    }
  },

  renderFoodResults(foods) {
    if (!foods.length) {
      return `
        <div class="empty">
          <span>🔎</span>
          No matching food found
        </div>
      `;
    }

    return foods.map(food => `
      <button
        class="food-result full"
        onclick="App.openFood(
          '${String(food.id)}'
        )">

        <div style="text-align:left">

          <strong>
            ${escapeHTML(food.name)}
          </strong>

          <small>
            ${escapeHTML(food.serving)}
          </small>

          <small>
            P ${formatNumber(food.protein)}g
            · C ${formatNumber(food.carbs)}g
            · F ${formatNumber(food.fat)}g
          </small>

        </div>

        <strong>
          ${formatNumber(food.calories)}
          kcal
        </strong>

      </button>
    `).join("");
  },


  /* =====================================
     FOOD DETAILS
  ===================================== */

  openFood(id) {
    const food = this.getAllFoods()
      .find(
        item =>
          String(item.id) === String(id)
      );

    if (!food) {
      toast("Food not found");
      return;
    }

    this.selectedFood = food;

    const body =
      document.getElementById("modalBody");

    body.innerHTML = `

      <h2>
        ${escapeHTML(food.name)}
      </h2>

      <p class="muted">
        Per ${escapeHTML(food.serving)}
      </p>


      <div
        class="nutrition-grid"
        id="foodNutritionPreview">

        ${nutritionPreview(food, 1)}

      </div>


      <label class="form-label">
        Meal
      </label>

      <select id="modalMeal">

        ${this.meals.map(([key, , name]) => `
          <option
            value="${key}"
            ${this.selectedMeal === key
              ? "selected"
              : ""}>
            ${name}
          </option>
        `).join("")}

      </select>


      <label class="form-label">
        Number of servings
      </label>

      <input
        id="foodQuantity"
        type="number"
        value="1"
        min="0.1"
        step="0.1"
        inputmode="decimal"
        oninput="App.updateFoodPreview()"
      >


      ${
        food.micro
          ? `
            <section class="card"
              style="box-shadow:none;
              background:var(--bg)">

              <small class="muted">
                Key micronutrients
              </small>

              <p style="margin-top:5px">
                ${escapeHTML(food.micro)}
              </p>

            </section>
          `
          : ""
      }


      <button
        class="primary full"
        onclick="App.confirmFood()">
        Add to Diary
      </button>
    `;

    openModal();
  },

  updateFoodPreview() {
    if (!this.selectedFood) return;

    const input =
      document.getElementById("foodQuantity");

    const preview =
      document.getElementById(
        "foodNutritionPreview"
      );

    if (!input || !preview) return;

    let quantity =
      Number(input.value);

    if (!quantity || quantity < 0) {
      quantity = 0;
    }

    preview.innerHTML =
      nutritionPreview(
        this.selectedFood,
        quantity
      );
  },

  confirmFood() {
    if (!this.selectedFood) return;

    const meal =
      document.getElementById(
        "modalMeal"
      ).value;

    const quantity =
      Number(
        document.getElementById(
          "foodQuantity"
        ).value
      );

    if (!quantity || quantity <= 0) {
      toast("Enter a valid quantity");
      return;
    }

    const food = this.selectedFood;

    const loggedFood = {
      id: food.id,
      name: food.name,
      serving: food.serving,
      quantity,

      calories:
        Number(food.calories) * quantity,

      protein:
        Number(food.protein) * quantity,

      carbs:
        Number(food.carbs) * quantity,

      fat:
        Number(food.fat) * quantity,

      micro: food.micro || "",

      custom:
        Boolean(food.custom)
    };

    Storage.addMealFood(
      this.date,
      meal,
      loggedFood
    );

    this.selectedMeal = meal;
    this.selectedFood = null;

    closeModal();

    toast("Food added");

    this.showPage("diary");
  }
});
/* =========================================
   FITTRACK - MAIN APP
   PART 3/5
   Custom Foods + Weight + Progress
========================================= */

Object.assign(App, {

  /* =====================================
     CUSTOM FOOD
  ===================================== */

  openCustomFood() {
    document.getElementById("modalBody").innerHTML = `
      <h2>Create Custom Food</h2>

      <label class="form-label">Food name</label>
      <input id="customName"
        type="text"
        placeholder="Example: Homemade shake">

      <div class="form-row">
        <div>
          <label class="form-label">Serving amount</label>
          <input id="customServingAmount"
            type="number"
            min="0.1"
            step="0.1"
            placeholder="100"
            inputmode="decimal">
        </div>

        <div>
          <label class="form-label">Unit</label>
          <select id="customServingUnit">
            <option value="g">g</option>
            <option value="ml">ml</option>
            <option value="piece">piece</option>
            <option value="medium">medium</option>
            <option value="katori">katori</option>
            <option value="cup">cup</option>
            <option value="glass">glass</option>
            <option value="bowl">bowl</option>
            <option value="plate">plate</option>
            <option value="serving">serving</option>
          </select>
        </div>
      </div>

      <label class="form-label">Calories</label>
      <input id="customCalories"
        type="number"
        min="0"
        step="0.1"
        placeholder="kcal"
        inputmode="decimal">

      <div class="form-row">
        <div>
          <label class="form-label">Protein (g)</label>
          <input id="customProtein"
            type="number"
            min="0"
            step="0.1"
            placeholder="0"
            inputmode="decimal">
        </div>

        <div>
          <label class="form-label">Carbs (g)</label>
          <input id="customCarbs"
            type="number"
            min="0"
            step="0.1"
            placeholder="0"
            inputmode="decimal">
        </div>
      </div>

      <label class="form-label">Fat (g)</label>
      <input id="customFat"
        type="number"
        min="0"
        step="0.1"
        placeholder="0"
        inputmode="decimal">

      <label class="form-label">
        Key micronutrients (optional)
      </label>

      <textarea id="customMicro"
        rows="3"
        placeholder="Example: Calcium, Iron, Vitamin B12"></textarea>

      <button
        class="primary full"
        onclick="App.saveCustomFood()">
        Save Custom Food
      </button>
    `;

    openModal();
  },

  saveCustomFood() {
    const name = value("customName");
    const amount = Number(value("customServingAmount"));
    const unit = value("customServingUnit");
    const calories = Number(value("customCalories"));
    const protein = Number(value("customProtein"));
    const carbs = Number(value("customCarbs"));
    const fat = Number(value("customFat"));
    const micro = value("customMicro");

    if (!name || !amount || amount <= 0) {
      toast("Enter food name and serving size");
      return;
    }

    if (
      !Number.isFinite(calories) ||
      !Number.isFinite(protein) ||
      !Number.isFinite(carbs) ||
      !Number.isFinite(fat) ||
      calories < 0 ||
      protein < 0 ||
      carbs < 0 ||
      fat < 0
    ) {
      toast("Enter valid nutrition values");
      return;
    }

    Storage.saveCustomFood({
      name,
      serving: `${formatNumber(amount)} ${unit}`,
      calories,
      protein,
      carbs,
      fat,
      micro
    });

    closeModal();

    toast("Custom food saved");

    this.renderAddFood();
  },


  /* =====================================
     WEIGHT LOGGING
  ===================================== */

  openWeightModal() {
    const profile = Storage.getProfile();
    const logs = Storage.getWeights();

    const current = logs.length
      ? logs[logs.length - 1].weight
      : profile.weight;

    document.getElementById("modalBody").innerHTML = `
      <h2>Log Weight</h2>

      <label class="form-label">Date</label>

      <input
        id="weightDate"
        type="date"
        value="${today()}">

      <label class="form-label">Weight (kg)</label>

      <input
        id="weightValue"
        type="number"
        min="20"
        max="300"
        step="0.1"
        value="${current}"
        inputmode="decimal">

      <button
        class="primary full"
        onclick="App.saveWeight()">
        Save Weight
      </button>
    `;

    openModal();
  },

  saveWeight() {
    const date = value("weightDate");
    const weight = Number(value("weightValue"));

    if (
      !date ||
      !weight ||
      weight < 20 ||
      weight > 300
    ) {
      toast("Enter a valid weight");
      return;
    }

    Storage.saveWeight(date, weight);

    const profile = Storage.getProfile();

    /*
      Current profile weight should represent
      the newest weight log, not necessarily the
      log that was just edited.
    */
    const logs = Storage.getWeights();

    if (logs.length) {
      profile.weight =
        logs[logs.length - 1].weight;

      Storage.saveProfile(profile);
    }

    closeModal();

    toast("Weight saved");

    if (this.page === "progress") {
      this.renderProgress();
    } else {
      this.renderHome();
    }
  },


  /* =====================================
     PROGRESS PAGE
  ===================================== */

  renderProgress() {
    const profile = Storage.getProfile();
    const logs = Storage.getWeights();

    const start = Number(profile.startWeight);
    const current = logs.length
      ? Number(logs[logs.length - 1].weight)
      : Number(profile.weight);

    const target = Number(profile.targetWeight);

    const change = current - start;

    const progress =
      calculateWeightProgress(
        start,
        current,
        target
      );

    const history = [...logs]
      .reverse()
      .map(log => `
        <div class="history-item">

          <div>
            <strong>
              ${formatDate(log.date)}
            </strong>

            <small class="muted">
              Weight log
            </small>
          </div>

          <div style="text-align:right">

            <strong>
              ${formatNumber(log.weight)} kg
            </strong>

            <br>

            <button
              class="remove-food"
              onclick="App.askDeleteWeight(
                '${log.date}'
              )">
              ×
            </button>

          </div>

        </div>
      `).join("");

    document.getElementById("content").innerHTML = `
      <section class="card">

        <div class="section-title">

          <div>
            <h2>Weight Progress</h2>
            <small class="muted">
              Track progress toward your goal
            </small>
          </div>

          <button
            class="text-btn"
            onclick="App.openWeightModal()">
            + Log
          </button>

        </div>

        <div class="grid">

          <div class="stat">
            <small>Starting</small>
            <strong>
              ${formatNumber(start)} kg
            </strong>
          </div>

          <div class="stat">
            <small>Current</small>
            <strong>
              ${formatNumber(current)} kg
            </strong>
          </div>

          <div class="stat">
            <small>Goal</small>
            <strong>
              ${formatNumber(target)} kg
            </strong>
          </div>

        </div>

        <div class="progress">
          <div
            class="progress-bar"
            style="width:${progress}%">
          </div>
        </div>

        <p class="muted">
          ${weightMessage(
            start,
            current,
            target
          )}
        </p>

      </section>


      <section class="card">

        <h2>Overall Change</h2>

        <div class="calorie-number">
          ${change > 0 ? "+" : ""}
          ${change.toFixed(1)}

          <small>kg</small>
        </div>

      </section>


      ${this.weeklyNutritionCard()}


      <section class="card">

        <h2>Weight History</h2>

        ${
          history ||
          `
            <div class="empty">
              <span>⚖️</span>
              No weight history yet
            </div>
          `
        }

      </section>
    `;
  },


  /* =====================================
     DELETE WEIGHT
  ===================================== */

  askDeleteWeight(date) {
    const profile = Storage.getProfile();

    /*
      Keep the initial weight entry because
      it is used as the starting point.
    */
    const firstLog =
      Storage.getWeights()[0];

    if (
      firstLog &&
      firstLog.date === date &&
      Number(firstLog.weight) ===
        Number(profile.startWeight)
    ) {
      toast("Starting weight cannot be deleted");
      return;
    }

    showConfirm(
      "Delete weight?",
      `Remove the weight entry from ${formatDate(date)}?`,
      () => {
        Storage.deleteWeight(date);

        const logs = Storage.getWeights();

        profile.weight = logs.length
          ? logs[logs.length - 1].weight
          : profile.startWeight;

        Storage.saveProfile(profile);

        this.renderProgress();

        toast("Weight entry deleted");
      }
    );
  },


  /* =====================================
     WEEKLY NUTRITION
  ===================================== */

  weeklyNutritionCard() {
    let calories = 0;
    let protein = 0;
    let loggedDays = 0;
    let goalDays = 0;

    const goals = Storage.getGoals();
    const rows = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() - i);

      const key = dateKey(d);
      const totals = this.getTotals(key);

      const hasFood =
        totals.calories > 0;

      if (hasFood) {
        calories += totals.calories;
        protein += totals.protein;
        loggedDays++;

        /*
          Count a goal day when calories are
          within ±10% of the calorie target.
        */
        const low =
          goals.calories * 0.9;

        const high =
          goals.calories * 1.1;

        if (
          totals.calories >= low &&
          totals.calories <= high
        ) {
          goalDays++;
        }
      }

      rows.push({
        day: d.toLocaleDateString(
          undefined,
          { weekday: "short" }
        ),
        calories: totals.calories
      });
    }

    const avgCalories = loggedDays
      ? calories / loggedDays
      : 0;

    const avgProtein = loggedDays
      ? protein / loggedDays
      : 0;

    const bars = rows.map(row => {
      const height = row.calories
        ? Math.max(
            8,
            Math.min(
              100,
              (row.calories /
                goals.calories) * 100
            )
          )
        : 4;

      return `
        <div style="
          flex:1;
          text-align:center;
          min-width:0;
        ">

          <div style="
            height:90px;
            display:flex;
            align-items:flex-end;
            justify-content:center;
          ">

            <div
              title="${Math.round(row.calories)} kcal"
              style="
                width:60%;
                max-width:25px;
                height:${height}%;
                min-height:4px;
                border-radius:7px 7px 3px 3px;
                background:var(--green);
              ">
            </div>

          </div>

          <small class="muted">
            ${row.day}
          </small>

        </div>
      `;
    }).join("");

    return `
      <section class="card">

        <h2>Last 7 Days</h2>

        <div class="grid">

          <div class="stat">
            <small>Avg Calories</small>
            <strong>
              ${Math.round(avgCalories)}
            </strong>
          </div>

          <div class="stat">
            <small>Avg Protein</small>
            <strong>
              ${avgProtein.toFixed(1)}g
            </strong>
          </div>

          <div class="stat">
            <small>Goal Days</small>
            <strong>
              ${goalDays}/7
            </strong>
          </div>

        </div>

        <div style="
          display:flex;
          gap:5px;
          margin-top:15px;
          align-items:flex-end;
        ">
          ${bars}
        </div>

      </section>
    `;
  }
});
/* =========================================
   FITTRACK - MAIN APP
   PART 4/5
   Meal Planner + Profile + Goals
========================================= */

Object.assign(App, {

  /* =====================================
     MEAL PLANNER
  ===================================== */

  openMealPlanner() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    this.planDate = this.planDate || dateKey(tomorrow);
    this.planMeal = this.planMeal || "breakfast";

    this.renderMealPlanner();
    openModal();
  },

  renderMealPlanner(search = "") {
    const foods = this.searchFoods(search);
    const plan = Storage.getPlans(this.planDate);

    const plannedSections = this.meals.map(
      ([key, icon, name]) => {

        const items = plan[key] || [];

        const foodRows = items.length
          ? items.map(food => `
              <div class="food-entry">

                <div>
                  <strong>
                    ${escapeHTML(food.name)}
                  </strong>

                  <small>
                    ${escapeHTML(food.serving)}
                    ${food.quantity
                      ? ` × ${formatNumber(food.quantity)}`
                      : ""}
                  </small>
                </div>

                <div style="text-align:right">

                  <strong>
                    ${Math.round(food.calories)}
                    kcal
                  </strong>

                  <br>

                  <button
                    class="remove-food"
                    onclick="App.removePlanFood(
                      '${key}',
                      '${food.planId}'
                    )">
                    ×
                  </button>

                </div>

              </div>
            `).join("")
          : `<p class="muted">No foods planned</p>`;

        return `
          <div style="
            padding:12px 0;
            border-bottom:1px solid var(--border)
          ">

            <strong>
              ${icon} ${name}
            </strong>

            <div style="margin-top:6px">
              ${foodRows}
            </div>

          </div>
        `;
      }
    ).join("");

    document.getElementById("modalBody").innerHTML = `
      <h2>Meal Planner</h2>

      <label class="form-label">
        Plan date
      </label>

      <input
        id="planDate"
        type="date"
        value="${this.planDate}"
        onchange="App.changePlanDate(this.value)"
      >

      <label class="form-label">
        Meal
      </label>

      <select
        id="planMeal"
        onchange="App.planMeal=this.value">

        ${this.meals.map(([key, , name]) => `
          <option
            value="${key}"
            ${this.planMeal === key
              ? "selected"
              : ""}>
            ${name}
          </option>
        `).join("")}

      </select>


      <div class="search">

        <span>🔎</span>

        <input
          type="search"
          placeholder="Search food to plan..."
          value="${escapeHTML(search)}"
          oninput="App.updatePlannerSearch(this.value)"
        >

      </div>


      <div id="plannerSearchResults">

        ${foods.slice(0, 10).map(food => `
          <button
            class="food-result full"
            onclick="App.addPlanFood(
              '${String(food.id)}'
            )">

            <div style="text-align:left">

              <strong>
                ${escapeHTML(food.name)}
              </strong>

              <small>
                ${escapeHTML(food.serving)}
              </small>

            </div>

            <strong>
              + ${formatNumber(food.calories)}
              kcal
            </strong>

          </button>
        `).join("")}

      </div>


      <hr style="
        border:0;
        border-top:1px solid var(--border);
        margin:20px 0
      ">


      <h2>
        Planned Foods
      </h2>

      ${plannedSections}


      <button
        class="primary full"
        style="margin-top:18px"
        onclick="App.copyPlanToDiary()">
        Add Plan to Diary
      </button>
    `;
  },

  updatePlannerSearch(search) {
    const foods =
      this.searchFoods(search).slice(0, 10);

    const container =
      document.getElementById(
        "plannerSearchResults"
      );

    if (!container) return;

    if (!foods.length) {
      container.innerHTML = `
        <div class="empty">
          No matching food
        </div>
      `;
      return;
    }

    container.innerHTML = foods.map(food => `
      <button
        class="food-result full"
        onclick="App.addPlanFood(
          '${String(food.id)}'
        )">

        <div style="text-align:left">

          <strong>
            ${escapeHTML(food.name)}
          </strong>

          <small>
            ${escapeHTML(food.serving)}
          </small>

        </div>

        <strong>
          + ${formatNumber(food.calories)}
          kcal
        </strong>

      </button>
    `).join("");
  },

  changePlanDate(date) {
    if (!date) return;

    this.planDate = date;
    this.renderMealPlanner();
  },

  addPlanFood(id) {
    const food = this.getAllFoods().find(
      item => String(item.id) === String(id)
    );

    if (!food) return;

    const mealSelect =
      document.getElementById("planMeal");

    if (mealSelect) {
      this.planMeal = mealSelect.value;
    }

    const plannedFood = {
      id: food.id,
      name: food.name,
      serving: food.serving,
      quantity: 1,
      calories: Number(food.calories),
      protein: Number(food.protein),
      carbs: Number(food.carbs),
      fat: Number(food.fat),
      micro: food.micro || "",
      custom: Boolean(food.custom)
    };

    Storage.addPlanFood(
      this.planDate,
      this.planMeal,
      plannedFood
    );

    this.renderMealPlanner();

    toast("Food added to plan");
  },

  removePlanFood(meal, planId) {
    Storage.removePlanFood(
      this.planDate,
      meal,
      planId
    );

    this.renderMealPlanner();

    toast("Removed from plan");
  },

  copyPlanToDiary() {
    const plan =
      Storage.getPlans(this.planDate);

    let count = 0;

    this.meals.forEach(([meal]) => {
      (plan[meal] || []).forEach(food => {

        const copy = { ...food };

        delete copy.planId;

        Storage.addMealFood(
          this.planDate,
          meal,
          copy
        );

        count++;
      });
    });

    if (!count) {
      toast("No planned foods to add");
      return;
    }

    this.date = this.planDate;

    closeModal();

    this.showPage("diary");

    toast(`${count} planned food${
      count === 1 ? "" : "s"
    } added`);
  },


  /* =====================================
     PROFILE
  ===================================== */

  renderProfile() {
    const p = Storage.getProfile();
    const g = Storage.getGoals();

    document.getElementById("content").innerHTML = `

      <section class="card">

        <h2>Personal Details</h2>

        <label class="form-label">
          Name
        </label>

        <input
          id="editName"
          type="text"
          value="${escapeHTML(p.name)}"
        >


        <div class="form-row">

          <div>
            <label class="form-label">
              Age
            </label>

            <input
              id="editAge"
              type="number"
              min="10"
              max="100"
              value="${p.age}"
            >
          </div>


          <div>
            <label class="form-label">
              Sex
            </label>

            <select id="editGender">

              <option
                value="male"
                ${p.gender === "male"
                  ? "selected"
                  : ""}>
                Male
              </option>

              <option
                value="female"
                ${p.gender === "female"
                  ? "selected"
                  : ""}>
                Female
              </option>

            </select>
          </div>

        </div>


        <div class="form-row">

          <div>
            <label class="form-label">
              Height (cm)
            </label>

            <input
              id="editHeight"
              type="number"
              step="0.1"
              value="${p.height}"
            >
          </div>


          <div>
            <label class="form-label">
              Current Weight (kg)
            </label>

            <input
              id="editWeight"
              type="number"
              step="0.1"
              value="${p.weight}"
            >
          </div>

        </div>


        <label class="form-label">
          Target Weight (kg)
        </label>

        <input
          id="editTarget"
          type="number"
          step="0.1"
          value="${p.targetWeight}"
        >


        <label class="form-label">
          Goal
        </label>

        <select id="editGoal">

          <option
            value="gain"
            ${p.goal === "gain"
              ? "selected"
              : ""}>
            Gain Weight
          </option>

          <option
            value="maintain"
            ${p.goal === "maintain"
              ? "selected"
              : ""}>
            Maintain Weight
          </option>

          <option
            value="lose"
            ${p.goal === "lose"
              ? "selected"
              : ""}>
            Lose Weight
          </option>

        </select>


        <label class="form-label">
          Activity Level
        </label>

        <select id="editActivity">

          ${[
            [1.2, "Sedentary"],
            [1.375, "Lightly Active"],
            [1.55, "Moderately Active"],
            [1.725, "Very Active"]
          ].map(([v, name]) => `
            <option
              value="${v}"
              ${Number(p.activity) === v
                ? "selected"
                : ""}>
              ${name}
            </option>
          `).join("")}

        </select>


        <button
          class="primary full"
          onclick="App.saveProfile()">
          Save Profile
        </button>

      </section>


      <section class="card">

        <h2>Daily Nutrition Goals</h2>

        <label class="form-label">
          Calories
        </label>

        <input
          id="goalCalories"
          type="number"
          min="500"
          value="${g.calories}"
        >


        <div class="form-row">

          <div>
            <label class="form-label">
              Protein (g)
            </label>

            <input
              id="goalProtein"
              type="number"
              min="0"
              value="${g.protein}"
            >
          </div>


          <div>
            <label class="form-label">
              Carbs (g)
            </label>

            <input
              id="goalCarbs"
              type="number"
              min="0"
              value="${g.carbs}"
            >
          </div>

        </div>


        <label class="form-label">
          Fat (g)
        </label>

        <input
          id="goalFat"
          type="number"
          min="0"
          value="${g.fat}"
        >


        <label class="form-label">
          Water Goal (glasses)
        </label>

        <input
          id="goalWater"
          type="number"
          min="1"
          max="30"
          value="${g.water}"
        >


        <button
          class="secondary full"
          onclick="App.saveGoals()">
          Save Nutrition Goals
        </button>

      </section>


      <section class="card">

        <h2>Recalculate Goals</h2>

        <p class="muted"
           style="margin-bottom:14px">
          Calculate calorie and macro goals again
          using your age, height, weight, activity
          and weight goal.
        </p>

        <button
          class="secondary full"
          onclick="App.recalculateGoals()">
          Recalculate Automatically
        </button>

      </section>


      <section class="card">

        <h2>App Data</h2>

        <p class="muted"
           style="margin-bottom:14px">
          Resetting deletes your profile, meals,
          water, weight history, custom foods and
          meal plans stored on this device.
        </p>

        <button
          class="danger full"
          onclick="App.askReset()">
          Reset All Data
        </button>

      </section>
    `;
  },


  /* =====================================
     SAVE PROFILE
  ===================================== */

  saveProfile() {
    const old =
      Storage.getProfile();

    const updated = {
      ...old,

      name: value("editName"),

      age:
        Number(value("editAge")),

      gender:
        value("editGender"),

      height:
        Number(value("editHeight")),

      weight:
        Number(value("editWeight")),

      targetWeight:
        Number(value("editTarget")),

      goal:
        value("editGoal"),

      activity:
        Number(value("editActivity"))
    };

    if (
      !updated.name ||
      !updated.age ||
      !updated.height ||
      !updated.weight ||
      !updated.targetWeight
    ) {
      toast("Complete all profile fields");
      return;
    }

    if (
      updated.age < 10 ||
      updated.height < 100 ||
      updated.weight < 20 ||
      updated.targetWeight < 20
    ) {
      toast("Enter valid profile details");
      return;
    }

    Storage.saveProfile(updated);

    /*
      Also create/update today's weight log if
      current weight was manually changed.
    */
    if (
      Number(old.weight) !==
      Number(updated.weight)
    ) {
      Storage.saveWeight(
        today(),
        updated.weight
      );
    }

    toast("Profile saved");

    this.renderProfile();
  },


  /* =====================================
     SAVE GOALS
  ===================================== */

  saveGoals() {
    const goals = {
      calories:
        Math.round(
          Number(value("goalCalories"))
        ),

      protein:
        Math.round(
          Number(value("goalProtein"))
        ),

      carbs:
        Math.round(
          Number(value("goalCarbs"))
        ),

      fat:
        Math.round(
          Number(value("goalFat"))
        ),

      water:
        Math.round(
          Number(value("goalWater"))
        )
    };

    if (
      goals.calories < 500 ||
      goals.protein < 0 ||
      goals.carbs < 0 ||
      goals.fat < 0 ||
      goals.water < 1
    ) {
      toast("Enter valid goals");
      return;
    }

    Storage.saveGoals(goals);

    toast("Nutrition goals saved");

    this.renderProfile();
  },


  /* =====================================
     RECALCULATE GOALS
  ===================================== */

  recalculateGoals() {
    /*
      Save profile fields first so calculations
      use the values currently visible.
    */

    const old =
      Storage.getProfile();

    const profile = {
      ...old,
      name: value("editName"),
      age: Number(value("editAge")),
      gender: value("editGender"),
      height: Number(value("editHeight")),
      weight: Number(value("editWeight")),
      targetWeight: Number(value("editTarget")),
      goal: value("editGoal"),
      activity: Number(value("editActivity"))
    };

    if (
      !profile.name ||
      !profile.age ||
      !profile.height ||
      !profile.weight ||
      !profile.targetWeight
    ) {
      toast("Complete your profile first");
      return;
    }

    Storage.saveProfile(profile);

    const goals =
      calculateGoals(profile);

    Storage.saveGoals(goals);

    this.renderProfile();

    toast("Goals recalculated");
  },


  /* =====================================
     RESET APP
  ===================================== */

  askReset() {
    showConfirm(
      "Reset FitTrack?",
      "All FitTrack data stored on this device will be permanently deleted.",
      () => {
        Storage.reset();

        this.page = "home";
        this.date = today();
        this.selectedFood = null;
        this.selectedMeal = "breakfast";

        document.getElementById(
          "mainApp"
        ).classList.add("hidden");

        document.getElementById(
          "onboarding"
        ).classList.remove("hidden");

        document.querySelectorAll(
          "#onboarding input"
        ).forEach(input => {
          input.value = "";
        });

        toast("FitTrack has been reset");
      }
    );
  }

});
/* =========================================
   FITTRACK - MAIN APP
   PART 5/5
   Helpers + Calculations + Startup
========================================= */


/* =====================================
   DATE HELPERS
===================================== */

function today() {
  return dateKey(new Date());
}

function dateKey(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDate(key) {
  const [year, month, day] =
    key.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day,
    12
  );
}

function formatDate(key) {
  return parseDate(key)
    .toLocaleDateString(
      undefined,
      {
        day: "numeric",
        month: "short",
        year: "numeric"
      }
    );
}

function shortDate(key) {
  return parseDate(key)
    .toLocaleDateString(
      undefined,
      {
        weekday: "short",
        day: "numeric",
        month: "short"
      }
    );
}

function dateNavigation(date) {
  const isToday = date === today();

  return `
    <div class="date-nav">

      <button
        onclick="App.changeDate(-1)">
        ‹
      </button>

      <button
        class="date"
        onclick="App.goToday()">

        <strong>
          ${isToday
            ? "Today"
            : shortDate(date)}
        </strong>

        <small>
          ${formatDate(date)}
        </small>

      </button>

      <button
        onclick="App.changeDate(1)">
        ›
      </button>

    </div>
  `;
}


/* =====================================
   GENERAL HELPERS
===================================== */

function value(id) {
  const element =
    document.getElementById(id);

  return element
    ? element.value.trim()
    : "";
}

function formatNumber(number) {
  const n = Number(number) || 0;

  if (Number.isInteger(n)) {
    return n;
  }

  return Number(n.toFixed(1));
}

function percent(value, goal) {
  if (!goal) return 0;

  return Math.min(
    100,
    Math.max(
      0,
      (Number(value) /
        Number(goal)) * 100
    )
  );
}

function escapeHTML(text) {
  const div =
    document.createElement("div");

  div.textContent =
    String(text ?? "");

  return div.innerHTML;
}

function greeting() {
  const hour =
    new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
}


/* =====================================
   MACRO BOX
===================================== */

function macroBox(
  name,
  current,
  goal,
  className
) {
  const remaining =
    Math.max(
      0,
      Number(goal) -
      Number(current)
    );

  return `
    <div class="macro">

      <small class="${className}">
        ${name}
      </small>

      <strong>
        ${formatNumber(current)}g
      </strong>

      <small>
        ${formatNumber(remaining)}g left
      </small>

    </div>
  `;
}


/* =====================================
   NUTRITION PREVIEW
===================================== */

function nutritionPreview(
  food,
  quantity
) {
  const q =
    Number(quantity) || 0;

  return `
    <div>
      <small>Calories</small>
      <strong>
        ${formatNumber(
          food.calories * q
        )}
      </strong>
    </div>

    <div>
      <small>Protein</small>
      <strong>
        ${formatNumber(
          food.protein * q
        )}g
      </strong>
    </div>

    <div>
      <small>Carbs</small>
      <strong>
        ${formatNumber(
          food.carbs * q
        )}g
      </strong>
    </div>

    <div>
      <small>Fat</small>
      <strong>
        ${formatNumber(
          food.fat * q
        )}g
      </strong>
    </div>
  `;
}


/* =====================================
   CALORIE & MACRO CALCULATION
===================================== */

function calculateGoals(profile) {
  const weight =
    Number(profile.weight);

  const height =
    Number(profile.height);

  const age =
    Number(profile.age);

  /*
    Mifflin-St Jeor equation
  */

  let bmr;

  if (profile.gender === "male") {
    bmr =
      10 * weight +
      6.25 * height -
      5 * age +
      5;
  } else {
    bmr =
      10 * weight +
      6.25 * height -
      5 * age -
      161;
  }

  let calories =
    bmr *
    Number(profile.activity);

  /*
    Small calorie adjustment based
    on selected goal.
  */

  if (profile.goal === "gain") {
    calories += 300;
  }

  if (profile.goal === "lose") {
    calories -= 300;
  }

  calories =
    Math.max(
      1200,
      Math.round(calories)
    );

  /*
    Protein:
    1.6 g per kg body weight

    Fat:
    25% of calories

    Carbs:
    Remaining calories
  */

  const protein =
    Math.round(
      weight * 1.6
    );

  const fat =
    Math.round(
      (calories * 0.25) / 9
    );

  const carbCalories =
    calories -
    protein * 4 -
    fat * 9;

  const carbs =
    Math.max(
      0,
      Math.round(
        carbCalories / 4
      )
    );

  return {
    calories,
    protein,
    carbs,
    fat,
    water: 8
  };
}


/* =====================================
   WEIGHT PROGRESS
===================================== */

function calculateWeightProgress(
  start,
  current,
  target
) {
  start = Number(start);
  current = Number(current);
  target = Number(target);

  if (start === target) {
    return 100;
  }

  const totalDistance =
    Math.abs(target - start);

  const moved =
    start < target
      ? current - start
      : start - current;

  return Math.min(
    100,
    Math.max(
      0,
      (moved / totalDistance) * 100
    )
  );
}

function weightMessage(
  start,
  current,
  target
) {
  start = Number(start);
  current = Number(current);
  target = Number(target);

  const remaining =
    Math.abs(target - current);

  if (
    start < target &&
    current >= target
  ) {
    return "You have reached your target weight.";
  }

  if (
    start > target &&
    current <= target
  ) {
    return "You have reached your target weight.";
  }

  if (start === target) {
    return "You are already at your target weight.";
  }

  if (
    start < target &&
    current < start
  ) {
    return `${formatNumber(
      remaining
    )} kg from your target. Your weight has moved away from your goal.`;
  }

  if (
    start > target &&
    current > start
  ) {
    return `${formatNumber(
      remaining
    )} kg from your target. Your weight has moved away from your goal.`;
  }

  return `${formatNumber(
    remaining
  )} kg remaining to reach your target.`;
}


/* =====================================
   MODAL
===================================== */

function openModal() {
  document
    .getElementById("modal")
    .classList.remove("hidden");

  document.body
    .classList.add("modal-open");
}

function closeModal() {
  document
    .getElementById("modal")
    .classList.add("hidden");

  document.body
    .classList.remove("modal-open");

  App.selectedFood = null;
}


/* =====================================
   CONFIRMATION
===================================== */

function showConfirm(
  title,
  text,
  action
) {
  document.getElementById(
    "confirmTitle"
  ).textContent = title;

  document.getElementById(
    "confirmText"
  ).textContent = text;

  App.confirmAction = action;

  document.getElementById(
    "confirmBox"
  ).classList.remove("hidden");
}

function hideConfirm() {
  document.getElementById(
    "confirmBox"
  ).classList.add("hidden");

  App.confirmAction = null;
}


/* =====================================
   TOAST
===================================== */

let toastTimer;

function toast(message) {
  const element =
    document.getElementById("toast");

  if (!element) return;

  element.textContent = message;

  element.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(
    () => {
      element.classList.remove("show");
    },
    2200
  );
}


/* =====================================
   EXTRA APP METHODS
===================================== */

Object.assign(App, {

  goToday() {
    this.date = today();

    this.showPage(this.page);
  }

});


/* =====================================
   SERVICE WORKER
===================================== */

function registerServiceWorker() {
  if (
    "serviceWorker" in navigator &&
    location.protocol !== "file:"
  ) {
    navigator.serviceWorker
      .register("sw.js")
      .catch(error => {
        console.log(
          "Service worker:",
          error
        );
      });
  }
}


/* =====================================
   START FITTRACK
===================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    App.init();
    registerServiceWorker();
  }
);
