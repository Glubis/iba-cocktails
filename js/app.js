import {
  buildCatalog,
  buildCatalogSortedByLength,
  getRecipeIngredients,
} from "./normalize.js";

const UNCategorized = "Uncategorized";

let recipes = [];
let catalog = [];
let catalogByLength = [];
let selectedIngredients = new Set();
let lastResults = null;

const ingredientsForm = document.getElementById("ingredients-form");
const readySection = document.getElementById("ready-section");
const missingSection = document.getElementById("missing-section");
const copyButton = document.getElementById("copy-json");
const jsonFallback = document.getElementById("json-fallback");

function getCategory(recipe) {
  return recipe.category || UNCategorized;
}

function classifyRecipe(recipe) {
  const required = getRecipeIngredients(recipe, catalogByLength);
  const have = required.filter((ingredient) => selectedIngredients.has(ingredient));
  const missing = required.filter((ingredient) => !selectedIngredients.has(ingredient));

  return {
    name: recipe.name,
    have,
    missing,
    isReady: missing.length === 0,
  };
}

function groupByCategory(items, getName) {
  const groups = new Map();

  for (const item of items) {
    const category = getCategory(item.recipe ?? item);
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category).push(getName ? getName(item) : item);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, entries]) => ({
      category,
      entries: entries.sort((a, b) => {
        const nameA = typeof a === "string" ? a : a.name;
        const nameB = typeof b === "string" ? b : b.name;
        return nameA.localeCompare(nameB);
      }),
    }));
}

function computeResults() {
  const classified = recipes.map((recipe) => ({
    recipe,
    ...classifyRecipe(recipe),
  }));

  const ready = classified.filter((item) => item.isReady);
  const missing = classified.filter((item) => !item.isReady);

  const readyToMake = {};
  for (const { category, entries } of groupByCategory(ready, (item) => item.name)) {
    readyToMake[category] = entries;
  }

  const missingIngredients = {};
  for (const { category, entries } of groupByCategory(missing)) {
    missingIngredients[category] = entries.map(({ name, have, missing: missingItems }) => ({
      name,
      have,
      missing: missingItems,
    }));
  }

  return {
    readyToMake,
    missingIngredients,
    readyGroups: groupByCategory(ready, (item) => item.name),
    missingGroups: groupByCategory(missing),
  };
}

function renderCategoryList(container, groups, renderItem) {
  container.replaceChildren();

  if (groups.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-message";
    empty.textContent = "None";
    container.appendChild(empty);
    return;
  }

  for (const { category, entries } of groups) {
    const categoryBlock = document.createElement("div");
    categoryBlock.className = "category-block";

    const heading = document.createElement("h3");
    heading.textContent = category;
    categoryBlock.appendChild(heading);

    const list = document.createElement("ul");
    for (const entry of entries) {
      list.appendChild(renderItem(entry));
    }
    categoryBlock.appendChild(list);
    container.appendChild(categoryBlock);
  }
}

function renderResults() {
  lastResults = computeResults();

  renderCategoryList(readySection, lastResults.readyGroups, (name) => {
    const item = document.createElement("li");
    item.textContent = name;
    return item;
  });

  renderCategoryList(missingSection, lastResults.missingGroups, (entry) => {
    const item = document.createElement("li");
    item.textContent = entry.name;

    const sublist = document.createElement("ul");
    sublist.className = "ingredient-status";

    const haveItem = document.createElement("li");
    haveItem.textContent = `Have: ${entry.have.length ? entry.have.join(", ") : "None"}`;
    sublist.appendChild(haveItem);

    const missingItem = document.createElement("li");
    missingItem.textContent = `Missing: ${entry.missing.join(", ")}`;
    sublist.appendChild(missingItem);

    item.appendChild(sublist);
    return item;
  });
}

function renderIngredientForm() {
  ingredientsForm.replaceChildren();

  for (const ingredient of catalog) {
    const label = document.createElement("label");
    label.className = "ingredient-checkbox";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = ingredient;
    checkbox.checked = selectedIngredients.has(ingredient);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        selectedIngredients.add(ingredient);
      } else {
        selectedIngredients.delete(ingredient);
      }
      renderResults();
    });

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(ingredient));
    ingredientsForm.appendChild(label);
  }
}

function buildExportJson() {
  const results = lastResults ?? computeResults();
  return {
    selectedIngredients: [...selectedIngredients].sort((a, b) => a.localeCompare(b)),
    results: {
      readyToMake: results.readyToMake,
      missingIngredients: results.missingIngredients,
    },
  };
}

async function copyResultsJson() {
  const jsonText = JSON.stringify(buildExportJson(), null, 2);

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(jsonText);
      copyButton.textContent = "Copied!";
      setTimeout(() => {
        copyButton.textContent = "Copy JSON";
      }, 2000);
      jsonFallback.hidden = true;
      return;
    } catch {
      // Fall through to textarea fallback.
    }
  }

  jsonFallback.hidden = false;
  jsonFallback.value = jsonText;
  jsonFallback.focus();
  jsonFallback.select();
}

function wireControls() {
  document.getElementById("select-all").addEventListener("click", () => {
    selectedIngredients = new Set(catalog);
    renderIngredientForm();
    renderResults();
  });

  document.getElementById("clear-all").addEventListener("click", () => {
    selectedIngredients = new Set();
    renderIngredientForm();
    renderResults();
  });

  copyButton.addEventListener("click", copyResultsJson);
}

async function init() {
  const [ingredientsResponse, recipesResponse] = await Promise.all([
    fetch("./ingredients.json"),
    fetch("./recipes.json"),
  ]);

  if (!ingredientsResponse.ok || !recipesResponse.ok) {
    throw new Error("Failed to load cocktail data.");
  }

  const baseIngredients = await ingredientsResponse.json();
  recipes = await recipesResponse.json();
  catalog = buildCatalog(baseIngredients, recipes);
  catalogByLength = buildCatalogSortedByLength(catalog);

  renderIngredientForm();
  renderResults();
  wireControls();
}

init().catch((error) => {
  document.body.insertAdjacentHTML(
    "beforeend",
    `<p class="error-message">Failed to load app: ${error.message}</p>`,
  );
});
