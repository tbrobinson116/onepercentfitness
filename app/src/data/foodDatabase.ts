// Built-in food nutrition database for offline food search
// All values are per standard serving

export interface FoodItem {
  id: string;
  name: string;
  category: 'protein' | 'dairy' | 'grain' | 'fruit' | 'vegetable' | 'fat' | 'snack' | 'beverage' | 'condiment' | 'meal';
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  aliases?: string[]; // alternate search terms
}

export const FOOD_DATABASE: FoodItem[] = [
  // ============ PROTEINS ============
  { id: 'chicken-breast', name: 'Chicken Breast (cooked)', category: 'protein', servingSize: 6, servingUnit: 'oz', calories: 281, protein: 53, carbs: 0, fat: 6, aliases: ['chicken', 'grilled chicken'] },
  { id: 'chicken-thigh', name: 'Chicken Thigh (cooked)', category: 'protein', servingSize: 4, servingUnit: 'oz', calories: 232, protein: 28, carbs: 0, fat: 13, aliases: ['dark meat chicken'] },
  { id: 'ground-turkey', name: 'Ground Turkey (93% lean)', category: 'protein', servingSize: 4, servingUnit: 'oz', calories: 170, protein: 21, carbs: 0, fat: 9, aliases: ['turkey'] },
  { id: 'ground-beef-90', name: 'Ground Beef (90% lean)', category: 'protein', servingSize: 4, servingUnit: 'oz', calories: 200, protein: 22, carbs: 0, fat: 11, aliases: ['beef', 'hamburger', 'ground beef'] },
  { id: 'ground-beef-80', name: 'Ground Beef (80% lean)', category: 'protein', servingSize: 4, servingUnit: 'oz', calories: 287, protein: 19, carbs: 0, fat: 23, aliases: ['fatty beef'] },
  { id: 'steak-sirloin', name: 'Sirloin Steak (cooked)', category: 'protein', servingSize: 6, servingUnit: 'oz', calories: 312, protein: 48, carbs: 0, fat: 12, aliases: ['steak', 'sirloin'] },
  { id: 'steak-ribeye', name: 'Ribeye Steak (cooked)', category: 'protein', servingSize: 6, servingUnit: 'oz', calories: 398, protein: 42, carbs: 0, fat: 24, aliases: ['ribeye'] },
  { id: 'salmon', name: 'Salmon Fillet (cooked)', category: 'protein', servingSize: 6, servingUnit: 'oz', calories: 350, protein: 38, carbs: 0, fat: 20, aliases: ['fish', 'salmon fillet'] },
  { id: 'tuna-canned', name: 'Tuna (canned in water)', category: 'protein', servingSize: 5, servingUnit: 'oz', calories: 130, protein: 29, carbs: 0, fat: 1, aliases: ['tuna', 'canned tuna'] },
  { id: 'shrimp', name: 'Shrimp (cooked)', category: 'protein', servingSize: 4, servingUnit: 'oz', calories: 112, protein: 24, carbs: 0, fat: 1, aliases: ['prawns'] },
  { id: 'tilapia', name: 'Tilapia (cooked)', category: 'protein', servingSize: 4, servingUnit: 'oz', calories: 145, protein: 30, carbs: 0, fat: 3, aliases: ['white fish'] },
  { id: 'cod', name: 'Cod (cooked)', category: 'protein', servingSize: 4, servingUnit: 'oz', calories: 119, protein: 26, carbs: 0, fat: 1, aliases: ['cod fish'] },
  { id: 'pork-chop', name: 'Pork Chop (cooked)', category: 'protein', servingSize: 5, servingUnit: 'oz', calories: 275, protein: 37, carbs: 0, fat: 13, aliases: ['pork'] },
  { id: 'bacon', name: 'Bacon (cooked)', category: 'protein', servingSize: 3, servingUnit: 'slices', calories: 129, protein: 9, carbs: 0, fat: 10 },
  { id: 'turkey-breast-deli', name: 'Turkey Breast (deli)', category: 'protein', servingSize: 3, servingUnit: 'oz', calories: 90, protein: 18, carbs: 1, fat: 1, aliases: ['deli turkey', 'turkey slices'] },
  { id: 'tofu', name: 'Tofu (firm)', category: 'protein', servingSize: 4, servingUnit: 'oz', calories: 88, protein: 10, carbs: 2, fat: 5 },
  { id: 'tempeh', name: 'Tempeh', category: 'protein', servingSize: 3, servingUnit: 'oz', calories: 162, protein: 15, carbs: 9, fat: 9 },

  // ============ EGGS & DAIRY ============
  { id: 'egg-whole', name: 'Egg (whole, large)', category: 'dairy', servingSize: 1, servingUnit: 'egg', calories: 72, protein: 6, carbs: 0, fat: 5, aliases: ['egg', 'eggs', 'whole egg'] },
  { id: 'egg-whites', name: 'Egg Whites', category: 'dairy', servingSize: 3, servingUnit: 'whites', calories: 51, protein: 11, carbs: 0, fat: 0, aliases: ['egg white'] },
  { id: 'greek-yogurt', name: 'Greek Yogurt (plain, nonfat)', category: 'dairy', servingSize: 1, servingUnit: 'cup', calories: 100, protein: 17, carbs: 6, fat: 1, aliases: ['yogurt', 'greek yoghurt'] },
  { id: 'greek-yogurt-full', name: 'Greek Yogurt (full fat)', category: 'dairy', servingSize: 1, servingUnit: 'cup', calories: 220, protein: 20, carbs: 8, fat: 11, aliases: ['full fat yogurt'] },
  { id: 'cottage-cheese', name: 'Cottage Cheese (low fat)', category: 'dairy', servingSize: 0.5, servingUnit: 'cup', calories: 92, protein: 13, carbs: 5, fat: 1, aliases: ['cottage cheese'] },
  { id: 'milk-whole', name: 'Whole Milk', category: 'dairy', servingSize: 1, servingUnit: 'cup', calories: 149, protein: 8, carbs: 12, fat: 8, aliases: ['milk'] },
  { id: 'milk-2pct', name: '2% Milk', category: 'dairy', servingSize: 1, servingUnit: 'cup', calories: 122, protein: 8, carbs: 12, fat: 5, aliases: ['reduced fat milk'] },
  { id: 'milk-skim', name: 'Skim Milk', category: 'dairy', servingSize: 1, servingUnit: 'cup', calories: 83, protein: 8, carbs: 12, fat: 0, aliases: ['fat free milk', 'nonfat milk'] },
  { id: 'almond-milk', name: 'Almond Milk (unsweetened)', category: 'dairy', servingSize: 1, servingUnit: 'cup', calories: 30, protein: 1, carbs: 1, fat: 3, aliases: ['almond milk'] },
  { id: 'oat-milk', name: 'Oat Milk', category: 'dairy', servingSize: 1, servingUnit: 'cup', calories: 120, protein: 3, carbs: 16, fat: 5, aliases: ['oat milk'] },
  { id: 'cheddar', name: 'Cheddar Cheese', category: 'dairy', servingSize: 1, servingUnit: 'oz', calories: 113, protein: 7, carbs: 0, fat: 9, aliases: ['cheese', 'cheddar'] },
  { id: 'mozzarella', name: 'Mozzarella Cheese', category: 'dairy', servingSize: 1, servingUnit: 'oz', calories: 85, protein: 6, carbs: 1, fat: 6, aliases: ['mozz', 'string cheese'] },
  { id: 'parmesan', name: 'Parmesan Cheese', category: 'dairy', servingSize: 2, servingUnit: 'tbsp', calories: 42, protein: 4, carbs: 0, fat: 3 },
  { id: 'cream-cheese', name: 'Cream Cheese', category: 'dairy', servingSize: 2, servingUnit: 'tbsp', calories: 100, protein: 2, carbs: 1, fat: 10 },
  { id: 'butter', name: 'Butter', category: 'fat', servingSize: 1, servingUnit: 'tbsp', calories: 102, protein: 0, carbs: 0, fat: 12 },

  // ============ GRAINS & CARBS ============
  { id: 'white-rice', name: 'White Rice (cooked)', category: 'grain', servingSize: 1, servingUnit: 'cup', calories: 206, protein: 4, carbs: 45, fat: 0, fiber: 1, aliases: ['rice'] },
  { id: 'brown-rice', name: 'Brown Rice (cooked)', category: 'grain', servingSize: 1, servingUnit: 'cup', calories: 216, protein: 5, carbs: 45, fat: 2, fiber: 4, aliases: ['brown rice'] },
  { id: 'quinoa', name: 'Quinoa (cooked)', category: 'grain', servingSize: 1, servingUnit: 'cup', calories: 222, protein: 8, carbs: 39, fat: 4, fiber: 5 },
  { id: 'oats', name: 'Oats (dry)', category: 'grain', servingSize: 0.5, servingUnit: 'cup', calories: 150, protein: 5, carbs: 27, fat: 3, fiber: 4, aliases: ['oatmeal', 'rolled oats'] },
  { id: 'pasta', name: 'Pasta (cooked)', category: 'grain', servingSize: 1, servingUnit: 'cup', calories: 221, protein: 8, carbs: 43, fat: 1, fiber: 3, aliases: ['spaghetti', 'noodles', 'penne'] },
  { id: 'bread-white', name: 'White Bread', category: 'grain', servingSize: 1, servingUnit: 'slice', calories: 79, protein: 3, carbs: 15, fat: 1, aliases: ['bread', 'toast'] },
  { id: 'bread-wheat', name: 'Whole Wheat Bread', category: 'grain', servingSize: 1, servingUnit: 'slice', calories: 81, protein: 4, carbs: 14, fat: 1, fiber: 2, aliases: ['wheat bread', 'whole grain bread'] },
  { id: 'tortilla-flour', name: 'Flour Tortilla (10")', category: 'grain', servingSize: 1, servingUnit: 'tortilla', calories: 290, protein: 8, carbs: 48, fat: 8, aliases: ['tortilla', 'burrito wrap'] },
  { id: 'tortilla-corn', name: 'Corn Tortilla', category: 'grain', servingSize: 2, servingUnit: 'tortillas', calories: 104, protein: 3, carbs: 22, fat: 1 },
  { id: 'bagel', name: 'Bagel (plain)', category: 'grain', servingSize: 1, servingUnit: 'bagel', calories: 270, protein: 10, carbs: 53, fat: 2 },
  { id: 'sweet-potato', name: 'Sweet Potato (baked)', category: 'grain', servingSize: 1, servingUnit: 'medium', calories: 103, protein: 2, carbs: 24, fat: 0, fiber: 4, aliases: ['sweet potato', 'yam'] },
  { id: 'potato', name: 'Potato (baked)', category: 'grain', servingSize: 1, servingUnit: 'medium', calories: 161, protein: 4, carbs: 37, fat: 0, fiber: 4, aliases: ['baked potato'] },
  { id: 'english-muffin', name: 'English Muffin', category: 'grain', servingSize: 1, servingUnit: 'muffin', calories: 132, protein: 5, carbs: 26, fat: 1 },
  { id: 'granola', name: 'Granola', category: 'grain', servingSize: 0.5, servingUnit: 'cup', calories: 210, protein: 5, carbs: 30, fat: 9 },

  // ============ FRUITS ============
  { id: 'banana', name: 'Banana', category: 'fruit', servingSize: 1, servingUnit: 'medium', calories: 105, protein: 1, carbs: 27, fat: 0, fiber: 3 },
  { id: 'apple', name: 'Apple', category: 'fruit', servingSize: 1, servingUnit: 'medium', calories: 95, protein: 0, carbs: 25, fat: 0, fiber: 4 },
  { id: 'blueberries', name: 'Blueberries', category: 'fruit', servingSize: 1, servingUnit: 'cup', calories: 85, protein: 1, carbs: 21, fat: 0, fiber: 4, aliases: ['berries'] },
  { id: 'strawberries', name: 'Strawberries', category: 'fruit', servingSize: 1, servingUnit: 'cup', calories: 49, protein: 1, carbs: 12, fat: 0, fiber: 3 },
  { id: 'orange', name: 'Orange', category: 'fruit', servingSize: 1, servingUnit: 'medium', calories: 62, protein: 1, carbs: 15, fat: 0, fiber: 3 },
  { id: 'grapes', name: 'Grapes', category: 'fruit', servingSize: 1, servingUnit: 'cup', calories: 104, protein: 1, carbs: 27, fat: 0 },
  { id: 'avocado', name: 'Avocado', category: 'fruit', servingSize: 0.5, servingUnit: 'avocado', calories: 161, protein: 2, carbs: 9, fat: 15, fiber: 7 },
  { id: 'mixed-berries', name: 'Mixed Berries', category: 'fruit', servingSize: 1, servingUnit: 'cup', calories: 70, protein: 1, carbs: 17, fat: 0, fiber: 4 },
  { id: 'mango', name: 'Mango', category: 'fruit', servingSize: 1, servingUnit: 'cup', calories: 99, protein: 1, carbs: 25, fat: 1, fiber: 3 },
  { id: 'pineapple', name: 'Pineapple', category: 'fruit', servingSize: 1, servingUnit: 'cup', calories: 82, protein: 1, carbs: 22, fat: 0 },
  { id: 'watermelon', name: 'Watermelon', category: 'fruit', servingSize: 1, servingUnit: 'cup', calories: 46, protein: 1, carbs: 12, fat: 0 },

  // ============ VEGETABLES ============
  { id: 'broccoli', name: 'Broccoli (cooked)', category: 'vegetable', servingSize: 1, servingUnit: 'cup', calories: 55, protein: 4, carbs: 11, fat: 1, fiber: 5 },
  { id: 'spinach', name: 'Spinach (raw)', category: 'vegetable', servingSize: 2, servingUnit: 'cups', calories: 14, protein: 2, carbs: 2, fat: 0, fiber: 1 },
  { id: 'spinach-cooked', name: 'Spinach (cooked)', category: 'vegetable', servingSize: 1, servingUnit: 'cup', calories: 41, protein: 5, carbs: 7, fat: 0, fiber: 4 },
  { id: 'mixed-greens', name: 'Mixed Salad Greens', category: 'vegetable', servingSize: 2, servingUnit: 'cups', calories: 18, protein: 2, carbs: 3, fat: 0, fiber: 2, aliases: ['salad', 'lettuce', 'greens'] },
  { id: 'bell-pepper', name: 'Bell Pepper', category: 'vegetable', servingSize: 1, servingUnit: 'medium', calories: 31, protein: 1, carbs: 7, fat: 0, fiber: 2, aliases: ['pepper'] },
  { id: 'tomato', name: 'Tomato', category: 'vegetable', servingSize: 1, servingUnit: 'medium', calories: 22, protein: 1, carbs: 5, fat: 0, fiber: 1 },
  { id: 'onion', name: 'Onion', category: 'vegetable', servingSize: 0.5, servingUnit: 'medium', calories: 22, protein: 1, carbs: 5, fat: 0, fiber: 1 },
  { id: 'mushrooms', name: 'Mushrooms', category: 'vegetable', servingSize: 1, servingUnit: 'cup', calories: 15, protein: 2, carbs: 2, fat: 0, fiber: 1 },
  { id: 'carrots', name: 'Carrots', category: 'vegetable', servingSize: 1, servingUnit: 'medium', calories: 25, protein: 1, carbs: 6, fat: 0, fiber: 2 },
  { id: 'green-beans', name: 'Green Beans', category: 'vegetable', servingSize: 1, servingUnit: 'cup', calories: 35, protein: 2, carbs: 7, fat: 0, fiber: 4 },
  { id: 'asparagus', name: 'Asparagus', category: 'vegetable', servingSize: 6, servingUnit: 'spears', calories: 20, protein: 2, carbs: 4, fat: 0, fiber: 2 },
  { id: 'zucchini', name: 'Zucchini', category: 'vegetable', servingSize: 1, servingUnit: 'medium', calories: 33, protein: 2, carbs: 6, fat: 1, fiber: 2 },
  { id: 'corn', name: 'Corn (cooked)', category: 'vegetable', servingSize: 1, servingUnit: 'ear', calories: 90, protein: 3, carbs: 19, fat: 1, fiber: 2 },
  { id: 'cauliflower', name: 'Cauliflower', category: 'vegetable', servingSize: 1, servingUnit: 'cup', calories: 27, protein: 2, carbs: 5, fat: 0, fiber: 2 },
  { id: 'cucumber', name: 'Cucumber', category: 'vegetable', servingSize: 0.5, servingUnit: 'medium', calories: 8, protein: 0, carbs: 2, fat: 0, fiber: 0 },

  // ============ FATS & NUTS ============
  { id: 'olive-oil', name: 'Olive Oil', category: 'fat', servingSize: 1, servingUnit: 'tbsp', calories: 119, protein: 0, carbs: 0, fat: 14, aliases: ['oil', 'evoo'] },
  { id: 'coconut-oil', name: 'Coconut Oil', category: 'fat', servingSize: 1, servingUnit: 'tbsp', calories: 121, protein: 0, carbs: 0, fat: 14 },
  { id: 'almonds', name: 'Almonds', category: 'fat', servingSize: 1, servingUnit: 'oz (23 nuts)', calories: 164, protein: 6, carbs: 6, fat: 14, fiber: 4 },
  { id: 'peanuts', name: 'Peanuts', category: 'fat', servingSize: 1, servingUnit: 'oz', calories: 161, protein: 7, carbs: 5, fat: 14, fiber: 2 },
  { id: 'walnuts', name: 'Walnuts', category: 'fat', servingSize: 1, servingUnit: 'oz', calories: 185, protein: 4, carbs: 4, fat: 18, fiber: 2 },
  { id: 'cashews', name: 'Cashews', category: 'fat', servingSize: 1, servingUnit: 'oz', calories: 157, protein: 5, carbs: 9, fat: 12, fiber: 1 },
  { id: 'peanut-butter', name: 'Peanut Butter', category: 'fat', servingSize: 2, servingUnit: 'tbsp', calories: 188, protein: 8, carbs: 6, fat: 16, fiber: 2, aliases: ['pb'] },
  { id: 'almond-butter', name: 'Almond Butter', category: 'fat', servingSize: 2, servingUnit: 'tbsp', calories: 196, protein: 7, carbs: 6, fat: 18, fiber: 3 },
  { id: 'chia-seeds', name: 'Chia Seeds', category: 'fat', servingSize: 2, servingUnit: 'tbsp', calories: 138, protein: 5, carbs: 12, fat: 9, fiber: 10 },
  { id: 'flaxseed', name: 'Ground Flaxseed', category: 'fat', servingSize: 2, servingUnit: 'tbsp', calories: 74, protein: 3, carbs: 4, fat: 6, fiber: 4 },
  { id: 'sunflower-seeds', name: 'Sunflower Seeds', category: 'fat', servingSize: 1, servingUnit: 'oz', calories: 165, protein: 6, carbs: 7, fat: 14, fiber: 3 },

  // ============ SNACKS & CONVENIENCE ============
  { id: 'protein-shake', name: 'Whey Protein Shake', category: 'snack', servingSize: 1, servingUnit: 'scoop', calories: 120, protein: 24, carbs: 3, fat: 1, aliases: ['protein', 'whey', 'protein powder', 'shake'] },
  { id: 'protein-bar', name: 'Protein Bar', category: 'snack', servingSize: 1, servingUnit: 'bar', calories: 220, protein: 20, carbs: 24, fat: 8, aliases: ['quest bar', 'rxbar'] },
  { id: 'trail-mix', name: 'Trail Mix', category: 'snack', servingSize: 0.25, servingUnit: 'cup', calories: 175, protein: 5, carbs: 16, fat: 11 },
  { id: 'rice-cakes', name: 'Rice Cakes', category: 'snack', servingSize: 2, servingUnit: 'cakes', calories: 70, protein: 1, carbs: 15, fat: 0, aliases: ['rice cake'] },
  { id: 'jerky', name: 'Beef Jerky', category: 'snack', servingSize: 1, servingUnit: 'oz', calories: 82, protein: 14, carbs: 3, fat: 1, aliases: ['jerky'] },
  { id: 'dark-chocolate', name: 'Dark Chocolate (70%)', category: 'snack', servingSize: 1, servingUnit: 'oz', calories: 170, protein: 2, carbs: 13, fat: 12, aliases: ['chocolate'] },
  { id: 'hummus', name: 'Hummus', category: 'snack', servingSize: 2, servingUnit: 'tbsp', calories: 70, protein: 2, carbs: 6, fat: 4 },
  { id: 'popcorn', name: 'Popcorn (air-popped)', category: 'snack', servingSize: 3, servingUnit: 'cups', calories: 93, protein: 3, carbs: 19, fat: 1, fiber: 4 },
  { id: 'crackers', name: 'Whole Wheat Crackers', category: 'snack', servingSize: 6, servingUnit: 'crackers', calories: 120, protein: 3, carbs: 20, fat: 4 },
  { id: 'chips', name: 'Potato Chips', category: 'snack', servingSize: 1, servingUnit: 'oz', calories: 152, protein: 2, carbs: 15, fat: 10 },

  // ============ LEGUMES ============
  { id: 'black-beans', name: 'Black Beans (cooked)', category: 'protein', servingSize: 0.5, servingUnit: 'cup', calories: 114, protein: 8, carbs: 20, fat: 0, fiber: 7, aliases: ['beans'] },
  { id: 'chickpeas', name: 'Chickpeas (cooked)', category: 'protein', servingSize: 0.5, servingUnit: 'cup', calories: 134, protein: 7, carbs: 22, fat: 2, fiber: 6, aliases: ['garbanzo beans'] },
  { id: 'lentils', name: 'Lentils (cooked)', category: 'protein', servingSize: 0.5, servingUnit: 'cup', calories: 115, protein: 9, carbs: 20, fat: 0, fiber: 8 },
  { id: 'edamame', name: 'Edamame (shelled)', category: 'protein', servingSize: 0.5, servingUnit: 'cup', calories: 95, protein: 9, carbs: 7, fat: 4, fiber: 4 },

  // ============ BEVERAGES ============
  { id: 'coffee-black', name: 'Coffee (black)', category: 'beverage', servingSize: 1, servingUnit: 'cup', calories: 2, protein: 0, carbs: 0, fat: 0, aliases: ['coffee'] },
  { id: 'coffee-cream', name: 'Coffee with Cream & Sugar', category: 'beverage', servingSize: 1, servingUnit: 'cup', calories: 70, protein: 1, carbs: 8, fat: 4, aliases: ['coffee with cream'] },
  { id: 'orange-juice', name: 'Orange Juice', category: 'beverage', servingSize: 1, servingUnit: 'cup', calories: 112, protein: 2, carbs: 26, fat: 0, aliases: ['oj'] },
  { id: 'green-smoothie', name: 'Green Smoothie', category: 'beverage', servingSize: 12, servingUnit: 'oz', calories: 180, protein: 4, carbs: 35, fat: 3, aliases: ['smoothie'] },
  { id: 'protein-smoothie', name: 'Protein Smoothie', category: 'beverage', servingSize: 16, servingUnit: 'oz', calories: 300, protein: 30, carbs: 35, fat: 6, aliases: ['protein shake', 'gym shake'] },
  { id: 'sports-drink', name: 'Sports Drink (Gatorade)', category: 'beverage', servingSize: 20, servingUnit: 'oz', calories: 140, protein: 0, carbs: 36, fat: 0, aliases: ['gatorade', 'electrolyte'] },
  { id: 'soda', name: 'Soda (Cola)', category: 'beverage', servingSize: 12, servingUnit: 'oz', calories: 140, protein: 0, carbs: 39, fat: 0, aliases: ['coke', 'pepsi', 'cola'] },
  { id: 'beer', name: 'Beer (regular)', category: 'beverage', servingSize: 12, servingUnit: 'oz', calories: 153, protein: 2, carbs: 13, fat: 0 },
  { id: 'wine-red', name: 'Red Wine', category: 'beverage', servingSize: 5, servingUnit: 'oz', calories: 125, protein: 0, carbs: 4, fat: 0, aliases: ['wine'] },

  // ============ CONDIMENTS & EXTRAS ============
  { id: 'honey', name: 'Honey', category: 'condiment', servingSize: 1, servingUnit: 'tbsp', calories: 64, protein: 0, carbs: 17, fat: 0 },
  { id: 'maple-syrup', name: 'Maple Syrup', category: 'condiment', servingSize: 2, servingUnit: 'tbsp', calories: 104, protein: 0, carbs: 27, fat: 0 },
  { id: 'ketchup', name: 'Ketchup', category: 'condiment', servingSize: 1, servingUnit: 'tbsp', calories: 20, protein: 0, carbs: 5, fat: 0 },
  { id: 'mayo', name: 'Mayonnaise', category: 'condiment', servingSize: 1, servingUnit: 'tbsp', calories: 94, protein: 0, carbs: 0, fat: 10, aliases: ['mayo'] },
  { id: 'ranch', name: 'Ranch Dressing', category: 'condiment', servingSize: 2, servingUnit: 'tbsp', calories: 129, protein: 0, carbs: 2, fat: 13, aliases: ['ranch dressing'] },
  { id: 'bbq-sauce', name: 'BBQ Sauce', category: 'condiment', servingSize: 2, servingUnit: 'tbsp', calories: 52, protein: 0, carbs: 13, fat: 0 },
  { id: 'salsa', name: 'Salsa', category: 'condiment', servingSize: 2, servingUnit: 'tbsp', calories: 10, protein: 0, carbs: 2, fat: 0 },
  { id: 'soy-sauce', name: 'Soy Sauce', category: 'condiment', servingSize: 1, servingUnit: 'tbsp', calories: 8, protein: 1, carbs: 1, fat: 0 },
  { id: 'hot-sauce', name: 'Hot Sauce', category: 'condiment', servingSize: 1, servingUnit: 'tsp', calories: 0, protein: 0, carbs: 0, fat: 0 },

  // ============ COMMON MEALS ============
  { id: 'pizza-slice', name: 'Pizza Slice (cheese)', category: 'meal', servingSize: 1, servingUnit: 'slice', calories: 285, protein: 12, carbs: 36, fat: 10, aliases: ['pizza'] },
  { id: 'pizza-pepperoni', name: 'Pizza Slice (pepperoni)', category: 'meal', servingSize: 1, servingUnit: 'slice', calories: 313, protein: 13, carbs: 36, fat: 13 },
  { id: 'burger', name: 'Cheeseburger', category: 'meal', servingSize: 1, servingUnit: 'burger', calories: 535, protein: 28, carbs: 40, fat: 28, aliases: ['burger', 'hamburger'] },
  { id: 'burrito', name: 'Chicken Burrito', category: 'meal', servingSize: 1, servingUnit: 'burrito', calories: 580, protein: 35, carbs: 60, fat: 20, aliases: ['burrito', 'chipotle'] },
  { id: 'burrito-bowl', name: 'Burrito Bowl', category: 'meal', servingSize: 1, servingUnit: 'bowl', calories: 510, protein: 38, carbs: 48, fat: 16, aliases: ['bowl', 'chipotle bowl'] },
  { id: 'sandwich-turkey', name: 'Turkey Sandwich', category: 'meal', servingSize: 1, servingUnit: 'sandwich', calories: 350, protein: 24, carbs: 38, fat: 10, aliases: ['sandwich', 'sub'] },
  { id: 'salad-chicken', name: 'Chicken Salad', category: 'meal', servingSize: 1, servingUnit: 'bowl', calories: 380, protein: 32, carbs: 18, fat: 20, aliases: ['salad with chicken'] },
  { id: 'sushi-roll', name: 'Sushi Roll (6 pcs)', category: 'meal', servingSize: 6, servingUnit: 'pieces', calories: 250, protein: 9, carbs: 38, fat: 6, aliases: ['sushi', 'california roll'] },
  { id: 'tacos', name: 'Tacos (2 beef)', category: 'meal', servingSize: 2, servingUnit: 'tacos', calories: 340, protein: 18, carbs: 28, fat: 16, aliases: ['taco', 'tacos'] },
  { id: 'stir-fry', name: 'Chicken Stir Fry', category: 'meal', servingSize: 1.5, servingUnit: 'cups', calories: 320, protein: 28, carbs: 24, fat: 12, aliases: ['stir fry'] },
  { id: 'mac-cheese', name: 'Mac & Cheese', category: 'meal', servingSize: 1, servingUnit: 'cup', calories: 350, protein: 15, carbs: 42, fat: 14, aliases: ['mac and cheese', 'macaroni'] },
  { id: 'ramen', name: 'Ramen', category: 'meal', servingSize: 1, servingUnit: 'bowl', calories: 436, protein: 16, carbs: 56, fat: 16 },
  { id: 'grilled-chicken-rice', name: 'Grilled Chicken & Rice', category: 'meal', servingSize: 1, servingUnit: 'plate', calories: 487, protein: 45, carbs: 50, fat: 8, aliases: ['chicken and rice', 'meal prep'] },
  { id: 'omelette', name: 'Omelette (3 egg, cheese)', category: 'meal', servingSize: 1, servingUnit: 'omelette', calories: 340, protein: 24, carbs: 2, fat: 26, aliases: ['omelet', 'omelette'] },
  { id: 'pancakes', name: 'Pancakes (3 stack)', category: 'meal', servingSize: 3, servingUnit: 'pancakes', calories: 330, protein: 9, carbs: 48, fat: 12, aliases: ['pancakes', 'flapjacks'] },
  { id: 'overnight-oats', name: 'Overnight Oats', category: 'meal', servingSize: 1, servingUnit: 'cup', calories: 310, protein: 14, carbs: 42, fat: 9, aliases: ['overnight oats'] },
  { id: 'acai-bowl', name: 'Acai Bowl', category: 'meal', servingSize: 1, servingUnit: 'bowl', calories: 390, protein: 6, carbs: 62, fat: 14, aliases: ['acai'] },
  { id: 'caesar-salad', name: 'Caesar Salad', category: 'meal', servingSize: 1, servingUnit: 'bowl', calories: 260, protein: 8, carbs: 14, fat: 20, aliases: ['caesar'] },
  { id: 'soup-chicken-noodle', name: 'Chicken Noodle Soup', category: 'meal', servingSize: 1.5, servingUnit: 'cups', calories: 175, protein: 12, carbs: 20, fat: 5, aliases: ['soup', 'chicken soup'] },
  { id: 'chili', name: 'Chili (beef)', category: 'meal', servingSize: 1, servingUnit: 'cup', calories: 287, protein: 20, carbs: 22, fat: 13, aliases: ['chili'] },
];

/**
 * Search foods by name or alias. Returns up to `limit` results.
 */
export function searchFoods(query: string, limit = 10): FoodItem[] {
  if (!query || query.length < 2) return [];

  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/);

  type Scored = { food: FoodItem; score: number };
  const scored: Scored[] = [];

  for (const food of FOOD_DATABASE) {
    const name = food.name.toLowerCase();
    const allTerms = [name, ...(food.aliases?.map((a) => a.toLowerCase()) ?? [])];

    let score = 0;

    // Exact name match
    if (name === q) {
      score = 100;
    }
    // Exact alias match
    else if (food.aliases?.some((a) => a.toLowerCase() === q)) {
      score = 90;
    }
    // Name starts with query
    else if (name.startsWith(q)) {
      score = 80;
    }
    // Alias starts with query
    else if (food.aliases?.some((a) => a.toLowerCase().startsWith(q))) {
      score = 70;
    }
    // All query words found in name or aliases
    else if (words.every((w) => allTerms.some((t) => t.includes(w)))) {
      score = 60;
    }
    // Any word match
    else if (words.some((w) => allTerms.some((t) => t.includes(w)))) {
      score = 40;
    }

    if (score > 0) {
      scored.push({ food, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.food);
}
