// routes/adminRoute.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');// We will create this controller next
const { verifyAdmin } = require('../middlewares/verifyToken');

// All routes in this file will be prefixed with /api/admin and are protected

// GET /api/admin/restaurants -> Get a list of all restaurants
router.get('/restaurants', verifyAdmin, adminController.getAllRestaurantsForAdmin);

// PATCH /api/admin/restaurants/:restaurantId/status -> Update a restaurant's verification status
router.patch('/restaurants/:restaurantId/status', verifyAdmin, adminController.updateRestaurantVerificationStatus);

// DELETE /api/admin/restaurants/:restaurantId -> Permanently delete a restaurant and its owner
router.delete('/restaurants/:restaurantId', verifyAdmin, adminController.hardDeleteRestaurant);

// GET /api/admin/riders -> Get a list of all riders
router.get('/riders', verifyAdmin, adminController.getAllRidersForAdmin);

// PATCH /api/admin/riders/:riderId/status -> Update a rider's verification status
router.patch('/riders/:riderId/status', verifyAdmin, adminController.updateRiderVerificationStatus);

// DELETE /api/admin/riders/:riderId -> Permanently delete a rider and their user account
router.delete('/riders/:riderId', verifyAdmin, adminController.hardDeleteRider);

module.exports = router;