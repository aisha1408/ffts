// recipe-manager.js - Handle recipe saving and retrieval
document.addEventListener("DOMContentLoaded", function() {
    // Add save button click handlers to all recipe cards
    addSaveButtonEventListeners();
    
    // Load saved recipes if on saved recipes page
    if (document.getElementById("saved-recipes-container")) {
        loadSavedRecipes();
    }
});

// Add event listeners to save buttons
function addSaveButtonEventListeners() {
    // Get all recipe save buttons
    const saveButtons = document.querySelectorAll(".save-recipe-btn");
    
    saveButtons.forEach(button => {
        button.addEventListener("click", handleSaveRecipe);
    });
}

// Handle saving a recipe
async function handleSaveRecipe(e) {
    e.preventDefault();
    
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) {
        alert("Please login to save recipes");
        window.location.href = "login.html";
        return;
    }
    
    const recipeCard = e.target.closest(".recipe-card");
    const recipeId = recipeCard.dataset.recipeId;
    const recipeTitle = recipeCard.querySelector("h3").textContent;
    const recipeImage = recipeCard.querySelector("img").src;
    const sourceUrl = recipeCard.querySelector("a").href;
    
    try {
        const response = await fetch("/api/recipes/save", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: user.id,
                recipeId,
                recipeTitle,
                recipeImage,
                sourceUrl
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || "Failed to save recipe");
        }
        
        // Change button text and disable it
        e.target.textContent = "Saved!";
        e.target.disabled = true;
        
        // Show success message
        const successMessage = document.createElement("div");
        successMessage.className = "save-success";
        successMessage.textContent = "Recipe saved successfully!";
        recipeCard.appendChild(successMessage);
        
        // Remove success message after 3 seconds
        setTimeout(() => {
            successMessage.remove();
        }, 3000);
        
    } catch (error) {
        alert(error.message);
    }
}

// Load saved recipes for the current user
async function loadSavedRecipes() {
    const savedRecipesContainer = document.getElementById("saved-recipes-container");
    if (!savedRecipesContainer) return;
    
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) {
        savedRecipesContainer.innerHTML = "<p>Please <a href='login.html'>login</a> to view your saved recipes</p>";
        return;
    }
    
    try {
        const response = await fetch(`/api/recipes/saved/${user.id}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || "Failed to load saved recipes");
        }
        
        // Clear container
        savedRecipesContainer.innerHTML = "";
        
        if (data.recipes.length === 0) {
            savedRecipesContainer.innerHTML = "<p>You haven't saved any recipes yet.</p>";
            return;
        }
        
        // Display saved recipes
        data.recipes.forEach(recipe => {
            const recipeCard = document.createElement("div");
            recipeCard.className = "recipe-card";
            recipeCard.dataset.recipeId = recipe.recipe_id;
            
            recipeCard.innerHTML = `
                <img src="${recipe.recipe_image}" alt="${recipe.recipe_title}">
                <h3>${recipe.recipe_title}</h3>
                <p>Saved on: ${new Date(recipe.saved_at).toLocaleDateString()}</p>
                <div class="recipe-actions">
                    <a href="${recipe.source_url}" target="_blank" class="view-recipe-btn">View Recipe</a>
                    <button class="remove-recipe-btn" data-recipe-id="${recipe.recipe_id}">Remove</button>
                </div>
            `;
            
            savedRecipesContainer.appendChild(recipeCard);
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll(".remove-recipe-btn").forEach(button => {
            button.addEventListener("click", handleRemoveRecipe);
        });
        
    } catch (error) {
        savedRecipesContainer.innerHTML = `<p>Error loading saved recipes: ${error.message}</p>`;
    }
}

// Handle removing a saved recipe
async function handleRemoveRecipe(e) {
    e.preventDefault();
    
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) {
        alert("Please login to remove recipes");
        window.location.href = "login.html";
        return;
    }
    
    const recipeId = e.target.dataset.recipeId;
    
    try {
        const response = await fetch(`/api/recipes/saved/${recipeId}/${user.id}`, {
            method: "DELETE"
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || "Failed to remove recipe");
        }
        
        // Remove the recipe card from the DOM
        e.target.closest(".recipe-card").remove();
        
        // If no recipes left, show message
        const savedRecipesContainer = document.getElementById("saved-recipes-container");
        if (savedRecipesContainer.children.length === 0) {
            savedRecipesContainer.innerHTML = "<p>You haven't saved any recipes yet.</p>";
        }
        
    } catch (error) {
        alert(error.message);
    }
}

// Function to update recipe card HTML to include save button
function createRecipeCardWithSaveButton(recipe) {
    return `
        <div class="recipe-card" data-recipe-id="${recipe.id}">
            <img src="${recipe.image}" alt="${recipe.title}">
            <h3>${recipe.title}</h3>
            <p>Time: ${recipe.readyInMinutes} mins</p>
            <div class="recipe-actions">
                <a href="${recipe.sourceUrl}" target="_blank" class="view-recipe-btn">View Recipe</a>
                <button class="save-recipe-btn">Save Recipe</button>
            </div>
        </div>
    `;
}

// Export function to be used in other scripts
window.createRecipeCardWithSaveButton = createRecipeCardWithSaveButton;