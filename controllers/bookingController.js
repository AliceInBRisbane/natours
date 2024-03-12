const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// const AppError = require('../utils/appError');
const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const factory = require('./handlerController');
const catchAsync = require('./../utils/catchAsync');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //1) get the booked tour
  const tour = await Tour.findById(req.params.tourId);

  //2) Create the checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    //carry query in this url
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      // refer to this documentation https://docs.stripe.com/payments/accept-a-payment
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            // need to be online links
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`]
          },
          unit_amount: tour.price * 100
        },
        quantity: 1
      }
    ],
    mode: 'payment'
  });
  //3)Create session as response
  res.status(200).json({
    status: 'success',
    session: session
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  //This is only Temporary since it is Unsecure without payment to proceed a booking only click to the url
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price });
  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
