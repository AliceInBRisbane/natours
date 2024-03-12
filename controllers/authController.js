const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const catcheAsync = require('../utils/catchAsync');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, errorCode, res) => {
  const token = signToken(user._id);

  const cookieOtions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 1000 * 60 * 24 * 60
    ),
    secure: true,
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') {
    cookieOtions.secure = true;
  }
  res.cookie('jwt', token, cookieOtions);
  //remove the password form the output
  user.password = undefined;
  res.status(errorCode).json({
    status: 'success',
    token: token,
    data: {
      user: user
    }
  });
};

exports.signup = catcheAsync(async (req, res, next) => {
  const newUser = await User.create({
    // protect application  from signup as an admin and carry other data into server
    name: req.body.name,
    role: req.body.role,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangeAt: req.body.passwordChangeAt
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
});

exports.login = catcheAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //1) check if email and password exist,
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  //2) check if user exists && password is correct
  const user = await User.findOne({ email: email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password.', 401));
  }
  //3)if everything ok,send token to client

  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expiresIn: new Date(Date.now() + 1000 * 10),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catcheAsync(async (req, res, next) => {
  let token;
  //1 Getting the token and check of its exist
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }
  //2 Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //   console.log(decoded);
  //3 check if user still exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }
  //4 check if user change password after the token was issued
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'User recently changed the password, please log in again.',
        401
      )
    );
  }
  //5 Grant access to the protected user put the data into req.user
  req.user = currentUser;
  res.locals.user = currentUser;
  return next();
});

//only for rendered pages no error
//not use the catchAsync to avoid carrying the err to next
exports.isLoggedIn = async (req, res, next) => {
  try {
    //1 Verification token
    if (req.cookies.jwt) {
      //2 check if user still exist
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      //4 check if user change password after the token was issued
      if (currentUser.changePasswordAfter(decoded.iat)) {
        return next();
      }
      //5 There is a logged in user
      //res.locals get access to the pug template and create a variable
      res.locals.user = currentUser;
      return next();
    }
    return next();
  } catch (err) {
    // do not carry err
    return next();
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles is an array roles=['admin,'user] role=user
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catcheAsync(async (req, res, next) => {
  //1 get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email.', 404));
  }

  //2 generate the random reset token
  const resetToken = user.creatPasswordResetToken();
  console.log(resetToken);
  // validation turn off to save the data
  await user.save({ validateBeforeSave: false });

  //3 send to user's email

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'token sent to mail'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.resetPassword = catcheAsync(async (req, res, next) => {
  //1 get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: {
      $gt: Date.now()
    }
  });
  //2 if token is not expired,and there is user ,set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired!'), 400);
  }
  //3 update changedPasswordAt property for the user
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //4 log the user in send jwt

  createSendToken(user, 200, res);
});
// for login user who passed the protect middleware
exports.updatePassword = catcheAsync(async (req, res, next) => {
  //1 get user from the collection
  const user = await User.findById(req.user.id).select('+password');
  //   console.log(user);
  //2 check if Posted current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }
  //3 if so ,update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //4 log user in and send jwt
  createSendToken(user, 200, res);
  // User.findByIdAndUpdate will NOT work as intended!
});
