const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
// const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorhandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();

// set template engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
//serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// 1) GLOBAL MIDDLEWARES
//set security HTTP headers

// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: ["'self'", 'data:', 'blob:'],

//       fontSrc: ["'self'", 'https:', 'data:'],

//       scriptSrc: ["'self'", 'unsafe-inline'],

//       // eslint-disable-next-line no-dupe-keys
//       scriptSrc: ["'self'", 'https://*.cloudflare.com'],

//       scriptSrcElem: ["'self'", 'https:', 'https://*.cloudflare.com'],

//       styleSrc: ["'self'", 'https:', 'unsafe-inline'],

//       connectSrc: ["'self'", 'data', 'https://*.cloudflare.com']
//     }
//   })
// );

//development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP ,please try again in an hour.'
});

app.use('/api', limiter);

//body parse ,reading data from body req.body
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// data sanitization against NoSQL query injection
app.use(mongoSanitize());
//data sanitization against XSS
app.use(xss());

// prevent http parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'price',
      'difficulty'
    ]
  })
);

//test middleware
app.use((req, res, next) => {
  req.requstTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// 3) ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorhandler);

module.exports = app;
