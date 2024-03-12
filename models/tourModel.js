const mongoose = require('mongoose');

const slugify = require('slugify');
// const User = require('./userModel');

// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tour must have a name.'],
      unique: true,
      trim: true,
      maxlength: [
        40,
        'A tour name must have less or equal than 40 characters!'
      ],
      minlength: [10, 'A tour name must have more or equal than 10 characters!']
      // validate: [validator.isAfter, 'Tour name must only contain characters!']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration.']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size.']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty.'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy ,medium, difficult.'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0!'],
      max: [5, 'Rating must be below 5.0!'],
      //avoid cannot devided number
      set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'Tour must have a price.']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          //this only point to current doc on new document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE})should be lower than reqular price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'Tour must have a summary.']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'Tour must have a image.']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
// improve efficientcy by only exam the doc you need
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

//virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

tourSchema.virtual('bookings', {
  ref: 'Booking',
  foreignField: 'tour',
  localField: '_id'
});

// Document Middleware,: run before .save() and .create()
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});
// before save set the guides
// tourSchema.pre('save', async function(next) {
//   const guidesPromises = await this.guides.map(
//     async id => await User.findById(id)
//   );
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// tourSchema.pre('save', function(next) {
//   console.log('will save doc');
//   next();
// });
tourSchema.post('save', function(doc, next) {
  // console.log(this);
  next();
});

// query middleware
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});
// help to populate guides in all the find queries
tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangeAt '
  });
  next();
});
tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start}milliseconds!`);
  // console.log(docs);
  next();
});

//aggregation middleware
// tourSchema.pre('aggregate', function(next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// });
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;