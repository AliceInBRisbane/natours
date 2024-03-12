const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const APIFeatures = require('./../utils/APIFeatures');

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('No item found for that id.', 404));
    }
    res.status(204).json({
      status: 'success',
      data: null
    });
  });

exports.updateOne = Modal =>
  catchAsync(async (req, res, next) => {
    const doc = await Modal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!doc) {
      return next(new AppError('No item found for this id.', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.createOne = Modal =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Modal.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: newDoc
      }
    });
  });

exports.getOne = (Modal, popOption) => {
  return catchAsync(async (req, res, next) => {
    let query = Modal.findById(req.params.id);
    if (popOption) query = query.populate(popOption);
    const doc = await query;

    if (!doc) {
      return next(new AppError('No item found for that id.', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        doc
      }
    });
  });
};

exports.getAll = Modal =>
  catchAsync(async (req, res, next) => {
    // Allow reviews on tour
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Modal.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .pagination();
    // to see the performance of process doc
    // const docs = await features.query.explain();
    const docs = await features.query;
    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      result: docs.length,
      data: {
        data: docs
      }
    });
  });
