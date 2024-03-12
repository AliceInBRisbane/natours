const Review = require('./../models/reviewModel');
const factory = require('./handlerController');

const getAllReviews = factory.getAll(Review);

const getReviewByID = factory.getOne(Review);

const setTourandUserID = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};
const createReview = factory.createOne(Review);

const deleteReviewByID = factory.deleteOne(Review);
const updateRiewByID = factory.updateOne(Review);

exports.createReview = createReview;
exports.getAllReviews = getAllReviews;
exports.getReviewByID = getReviewByID;
exports.deleteReviewByID = deleteReviewByID;
exports.updateRiewByID = updateRiewByID;
exports.setTourandUserID = setTourandUserID;
