const multer = require('multer');
const sharp = require('sharp');
const catchAsync = require('./../utils/catchAsync');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const factory = require('./handlerController');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });
const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

const uploadUserPhoto = upload.single('photo');

const resizeUserphoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

const UpdateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  //1 do not update the password
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'The route is not for password update.Please use /updatePassword',
        400
      )
    );
  }
  // 2 filtered out unwanted fields
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;
  // 3 update the document-only name and email
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

const deteleMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

const createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined,please use /signup instead.'
  });
};

const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
const getAllUsers = factory.getAll(User);
//DO Not Update Password with this function
const updateUserById = factory.updateOne(User);
const deleteUserById = factory.deleteOne(User);
const getUserByID = factory.getOne(User);

exports.createUser = createUser;
exports.deleteUserById = deleteUserById;
exports.getAllUsers = getAllUsers;
exports.getUserByID = getUserByID;
exports.updateUserById = updateUserById;
exports.UpdateMe = UpdateMe;
exports.deleteMe = deteleMe;
exports.getMe = getMe;
exports.uploadUserPhoto = uploadUserPhoto;
exports.resizeUserphoto = resizeUserphoto;
