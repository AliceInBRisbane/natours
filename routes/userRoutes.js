const express = require('express');
const authController = require('./../controllers/authController');

const router = express.Router();
const userController = require('../controllers/userController');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//Protect all routes after this middleware
router.use(authController.protect);

router.get('/me', userController.getMe, userController.getUserByID);

router.patch('/updatePassword', authController.updatePassword);

router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserphoto,
  userController.UpdateMe
);
router.delete('/deleteMe', userController.deleteMe);

router.use(authController.restrictTo('admin'));
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUserByID)
  .patch(userController.updateUserById)
  .delete(userController.deleteUserById);

module.exports = router;
