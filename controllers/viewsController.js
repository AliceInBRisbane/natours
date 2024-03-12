const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Booking = require('./../models/bookingModel');
const catcheAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Review = require('./../models/reviewModel');
const APIFeatures = require('../utils/APIFeatures');

exports.getTopTours = catcheAsync(async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  const features = new APIFeatures(Tour.find(), req.query).sort().pagination();
  const tours = await features.query;
  res.status(200).render('overview', {
    title: 'Top 5 Cheap Tours',
    tours: tours
  });
});

exports.getOverview = catcheAsync(async (req, res) => {
  // 1) get tour data from collection
  const tours = await Tour.find().populate({
    path: 'bookings',
    fields: 'user'
  });
  // 2) build template

  // 3) render that template using tour data from collection
  res.status(200).render('overview', {
    title: 'All Tours',
    tours: tours
  });
});
exports.getUsers = catcheAsync(async (req, res, next) => {
  const users = await User.find();

  if (!users) {
    return next(new AppError('There are no users now.', 404));
  }

  res.status(200).render('users', {
    title: `All Users`,
    users: users
  });
});
exports.getTour = catcheAsync(async (req, res, next) => {
  //1) get tour data form collection
  const tour = await Tour.findOne({ slug: req.params.slug })
    .populate({
      path: 'reviews',
      fields: 'review rating user'
    })
    .populate({
      path: 'bookings',
      fields: 'user price createdAt paid'
    });
  // console.log(tour.bookings);
  if (!tour) {
    return next(new AppError('There is no tour for that name.', 404));
  }
  //2) build template
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour: tour
  });
});

exports.userLogin = (req, res, next) => {
  res.status(200).render('login', {
    title: 'Log into your account'
  });
};
exports.userSignup = (req, res, next) => {
  res.status(200).render('signup', {
    title: 'Sign up your account'
  });
};
exports.getAccount = (req, res, next) => {
  res.status(200).render('account', {
    title: 'Your account'
  });
};
exports.getMyTours = catcheAsync(async (req, res, next) => {
  // find the bookings by user
  const bookings = await Booking.find({
    user: req.user.id
  });
  // find the tours booked
  const tourIDs = bookings.map(el => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });
  //3) build template
  res.status(200).render('overview', {
    title: ' My Tour',
    tours: tours
  });
});
exports.getAllBookings = catcheAsync(async (req, res, next) => {
  const bookings = await Booking.find();
  const tourIDs = bookings.map(el => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } }).populate({
    path: 'bookings',
    fields: 'user tour'
  });
  // console.log(bookings);
  res.status(200).render('overview', {
    title: 'All Booking',
    tours: tours
  });
});
exports.getAllReviews = catcheAsync(async (req, res, next) => {
  const reviews = await Review.find();

  res.status(200).render('myReviews', {
    title: ' My Review',
    reviews: reviews
  });
});

exports.getMyReviews = catcheAsync(async (req, res, next) => {
  // find the reviews by user
  const reviews = await Review.find({
    user: req.user.id
  });

  //3) build template
  res.status(200).render('myReviews', {
    title: ' My Review',
    reviews: reviews
  });
});

exports.writeReview = catcheAsync(async (req, res, next) => {
  const { tourId } = req.params;
  res.status(200).render('writeReview', {
    title: ' Write A Review',
    tourId: tourId
  });
});

// No API
exports.updateUserData = catcheAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email
    },
    {
      new: true,
      validate: true
    }
  );
  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser
  });
});
