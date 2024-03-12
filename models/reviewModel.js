//review/ rating/createAt/red to user who reviews/ref to user who write

const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty.']
      // trim: true,
      // minlength: [10, 'A review must have more or equal than 10 characters!']
      // // validate: [validator.isAfter, 'Tour name must only contain characters!']
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be above 1.0!'],
      max: [5, 'Rating must be below 5.0!']
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
// avoid multiple reviews from one user for one tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  // console.log(stats);
  //apply to Tour
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

// findAndDelete short for findOneandDelete
// findAndUpdate
//cannot change to post since query will not exist
reviewSchema.pre(/^findOneAnd/, async function(next) {
  //this point to a current qury ,to get the doc ,apply findOne from the query
  this.r = await this.findOne();
  // console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  //this.r point to the query result which is a instance of Review model
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

reviewSchema.post('save', function() {
  //this point to current review ,so tour is the tourId
  this.constructor.calcAverageRatings(this.tour);
});
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
