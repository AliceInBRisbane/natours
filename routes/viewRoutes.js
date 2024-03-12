const express = require('express');
const viewsController = require('./../controllers/viewsController');
const authController = require('./../controllers/authController');
const bookingController = require('./../controllers/bookingController');

const router = express.Router({ mergeParams: true });

router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewsController.getOverview
);

router.get(
  '/top-5-cheap',
  authController.isLoggedIn,
  viewsController.getTopTours
);

router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);

router.get('/signup', authController.isLoggedIn, viewsController.userSignup);
router.get('/login', authController.isLoggedIn, viewsController.userLogin);
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-tours', authController.protect, viewsController.getMyTours);
router.get('/my-reviews', authController.protect, viewsController.getMyReviews);
router.get(
  '/write-review/:tourId',
  authController.protect,
  viewsController.writeReview
);

router.get('/all-users', authController.isLoggedIn, viewsController.getUsers);
router.get(
  '/all-reviews',
  authController.isLoggedIn,
  viewsController.getAllReviews
);
router.get(
  '/all-bookings',
  authController.isLoggedIn,
  viewsController.getAllBookings
);

// No API update user name & email
router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData
);
module.exports = router;
