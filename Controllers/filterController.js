const FilterCategory = require('../models/FilterCategory');
const asyncHandler = require('express-async-handler');

exports.getFilterCategories = asyncHandler(async (req, res) => {
  const categories = await FilterCategory.find({ isActive: true })
    .sort('order')
    .lean();

  // Regrouper les catégories par type
  const formattedCategories = categories.reduce((acc, category) => {
    if (!acc[category.type]) {
      acc[category.type] = [];
    }
    acc[category.type].push(category.name);
    return acc;
  }, {});

  res.json(formattedCategories);
}); 