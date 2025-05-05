// Updated script.js - Modified to work with database backend
const API_KEY = "8e6f938fd3954cf8a09a8527b72bfdd7"; // Replace with your API key

// Fetch and display recommended recipes on page load
async function fetchRecommendedRecipes() {
    const recommendedSection = document.getElementById("recommended-recipes");
    recommendedSection.innerHTML = ""; // Clear previous recommended recipes

    try {
        // Get user preferences if logged in
        const user = JSON.parse(localStorage.getItem("user") || "null");
        let apiUrl = `https://api.spoonacular.com/recipes/complexSearch?number=5&sort=random&apiKey=${API_KEY}`;
        
        // If user is logged in, try to get their preferences
        if (user) {
            try {
                const prefsResponse = await fetch(`/api/users/${user.id}/preferences`);
                if (prefsResponse.ok) {
                    const preferences = await prefsResponse.json();
                    if (preferences.preferredCuisine) {
                        apiUrl += `&cuisine=${preferences.preferredCuisine}`;
                    }
                    if (preferences.dietaryRestrictions) {
                        apiUrl += `&intolerances=${preferences.dietaryRestrictions}`;
                    }
                }
            } catch (error) {
                console.error("Error fetching preferences:", error);
                // Continue without preferences if there's an error
            }
        }

        const response = await fetch(apiUrl);

        if (!response.ok) throw new Error("Failed to fetch recommended recipes");

        const data = await response.json();

        // Display recommended recipes
        data.results.forEach(recipe => {
            const recipeCard = document.createElement("div");
            recipeCard.classList.add("recipe-card");
            recipeCard.dataset.recipeId = recipe.id;

            recipeCard.innerHTML = `
                <img src="${recipe.image}" alt="${recipe.title}">
                <h3>${recipe.title}</h3>
                <p>Time: ${recipe.readyInMinutes || 'N/A'} mins</p>
                <div class="recipe-actions">
                    <a href="https://spoonacular.com/recipes/${recipe.title.replace(/\s+/g, '-').toLowerCase()}-${recipe.id}" target="_blank" class="view-recipe-btn">View Recipe</a>
                    <button class="save-recipe-btn">Save Recipe</button>
                </div>
            `;

            recommendedSection.appendChild(recipeCard);
        });
        
        // Add event listeners to save buttons
        document.querySelectorAll(".save-recipe-btn").forEach(button => {
            button.addEventListener("click", window.handleSaveRecipe);
        });
        
    } catch (error) {
        console.error(error);
        recommendedSection.innerHTML = "<p>Failed to load recommended recipes. Please try again later.</p>";
    }
}

// Fetch and display recipes when the form is submitted
document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("ingredient-form");
    if (form) {
        form.addEventListener("submit", async function (e) {
            e.preventDefault();

            const ingredient = document.getElementById("ingredient-input").value;
            const cuisine = document.getElementById("cuisine-input")?.value || "";
            const recipesSection = document.getElementById("recipes");
            const recommendedSection = document.getElementById("recommended-recipes");

            // Clear recommended recipes when a new search is made
            if (recommendedSection) {
                recommendedSection.innerHTML = "";
            }

            recipesSection.innerHTML = ""; // Clear previous results

            if (!ingredient) {
                alert("Please enter an ingredient!");
                return;
            }

            try {
                const response = await fetch(
                    `https://api.spoonacular.com/recipes/complexSearch?query=${ingredient}&cuisine=${cuisine}&number=5&addRecipeInformation=true&apiKey=${API_KEY}`
                );

                if (!response.ok) throw new Error("Failed to fetch recipes");

                const data = await response.json();

                // Check if we have results
                if (data.results && data.results.length > 0) {
                    // Display recipes
                    data.results.forEach(recipe => {
                        const recipeCard = document.createElement("div");
                        recipeCard.classList.add("recipe-card");
                        recipeCard.dataset.recipeId = recipe.id;

                        // Ensure full URL for the sourceUrl
                        let sourceUrl = recipe.sourceUrl;
                        if (!sourceUrl || !sourceUrl.startsWith("http")) {
                            sourceUrl = `https://spoonacular.com/recipes/${recipe.title.replace(/\s+/g, '-').toLowerCase()}-${recipe.id}`;
                        }

                        recipeCard.innerHTML = `
                            <img src="${recipe.image}" alt="${recipe.title}">
                            <h3>${recipe.title}</h3>
                            <p>Time: ${recipe.readyInMinutes} mins</p>
                            <div class="recipe-actions">
                                <a href="${sourceUrl}" target="_blank" class="view-recipe-btn">View Recipe</a>
                                <button class="save-recipe-btn">Save Recipe</button>
                            </div>
                        `;

                        recipesSection.appendChild(recipeCard);
                    });
                    
                    // Add event listeners to save buttons
                    document.querySelectorAll(".save-recipe-btn").forEach(button => {
                        button.addEventListener("click", window.handleSaveRecipe);
                    });
                    
                } else {
                    recipesSection.innerHTML = "<p>No recipes found for the given ingredients. Please try again with different inputs.</p>";
                }

            } catch (error) {
                console.error(error);
                recipesSection.innerHTML = "<p>Failed to load recipes. Please try again later.</p>";
            }
        });
    }

    // Call the fetchRecommendedRecipes function when the page loads
    fetchRecommendedRecipes();
});