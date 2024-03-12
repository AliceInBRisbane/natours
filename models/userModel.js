const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const validator = require('validator');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please tell us your name.']
    },
    email: {
      type: String,
      unique: true,
      require: [true, 'User must have a email.'],
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email.']
    },
    photo: { type: String, default: 'default.jpg' },
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user'
    },
    password: {
      type: String,
      required: [true, 'user must have a password.'],
      minlength: 8,
      select: false
    },
    passwordConfirm: {
      type: String,
      required: [true, 'User must confirm the password.'],
      validate: {
        //this only work on create and save!
        validator: function(el) {
          return el === this.password;
        },
        message: 'Passwords are not the same!'
      }
    },
    passwordChangeAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
//virtual populate
userSchema.virtual('bookings', {
  ref: 'Booking',
  foreignField: 'user',
  localField: '_id'
});
userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();
  // hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  // validation finished ,no need of passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangeAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function(next) {
  //this point to the current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangeAt) {
    // console.log(this.passwordChangeAt, JWTTimestamp);
    const changedTimestamp = parseInt(
      this.passwordChangeAt.getTime() / 1000,
      10
    );
    // changeTime after token issued means really changed
    // console.log(JWTTimestamp, changedTimestamp);
    return JWTTimestamp < changedTimestamp;
  }
  //false means not changed
  return false;
};

userSchema.methods.creatPasswordResetToken = function() {
  const resetTOken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetTOken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetTOken;
};
const User = mongoose.model('User', userSchema);
module.exports = User;
