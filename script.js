const API_KEY = "8e6f938fd3954cf8a09a8527b72bfdd7"; // Replace with your API key

// Fetch and display recommended recipes on page load
async function fetchRecommendedRecipes() {
    const recommendedSection = document.getElementById("recommended-recipes");
    recommendedSection.innerHTML = ""; // Clear previous recommended recipes

    try {
        const response = await fetch(
            `https://api.spoonacular.com/recipes/complexSearch?number=5&sort=random&apiKey=${API_KEY}`
        );

        if (!response.ok) throw new Error("Failed to fetch recommended recipes");

        const data = await response.json();

        // Display recommended recipes
        data.results.forEach(recipe => {
            const calories = recipe.nutrition?.nutrients?.find(n => n.name === "Calories")?.amount || "Not Available";
            const card = document.createElement("div");
            card.classList.add("recipe-card");

            card.innerHTML = `
                <img src="${recipe.image}" alt="${recipe.title}">
                <h3>${recipe.title}</h3>
                <p>Calories: ${calories}</p>
                <p>Time: ${recipe.readyInMinutes} mins</p>
                <a href="${recipe.sourceUrl}" target="_blank">View Recipe</a>
            `;

            recommendedSection.appendChild(card);
        });
    } catch (error) {
        console.error(error);
        recommendedSection.innerHTML = "<p>Failed to load recommended recipes. Please try again later.</p>";
    }
}

// Fetch and display recipes when the form is submitted
document.getElementById("ingredient-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const ingredient = document.getElementById("ingredient-input").value;
    const cuisine = document.getElementById("cuisine-input")?.value || "";
    const recipesSection = document.getElementById("recipes");
    const recommendedSection = document.getElementById("recommended-recipes");

    // Clear recommended recipes when a new search is made
    recommendedSection.innerHTML = "";

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
                const calories = recipe.nutrition?.nutrients?.find(n => n.name === "Calories")?.amount || "Not Available";
                const card = document.createElement("div");
                card.classList.add("recipe-card");

                // Log to check the recipe's sourceUrl
                console.log("Recipe Source URL:", recipe.sourceUrl);

                // Ensure full URL for the sourceUrl
                let sourceUrl = recipe.sourceUrl;
                if (!sourceUrl.startsWith("http")) {
                    sourceUrl = `https://spoonacular.com${sourceUrl}`;  // Add base URL if it's a relative URL
                }

                card.innerHTML = `
                    <img src="${recipe.image}" alt="${recipe.title}">
                    <h3>${recipe.title}</h3>
                    <p>Calories: ${calories}</p>
                    <p>Time: ${recipe.readyInMinutes} mins</p>
                    <a href="${sourceUrl}" target="_blank">View Recipe</a>
                `;

                recipesSection.appendChild(card);
            });
        } else {
            recipesSection.innerHTML = "<p>No recipes found for the given ingredients. Please try again with different inputs.</p>";
        }

    } catch (error) {
        console.error(error);
        recipesSection.innerHTML = "<p>Failed to load recipes. Please try again later.</p>";
    }
});

// Call the fetchRecommendedRecipes function when the page loads
window.onload = fetchRecommendedRecipes;

