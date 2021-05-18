const Review = require("../models/review");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.createReviews = catchAsync(async (req, res, next) => {
  const { review, rating } = req.body;

  if (!review) {
    return next(new AppError("Please Provide Your Reviews", 400));
  }

  if (!rating) {
    return next(new AppError("Please Provide Your Rate", 400));
  }

  const reviews = new Review({
    review,
    rating,
    tour: req.params.tourId,
    user: req.user._id,
  });

  await reviews.save();

  res.status(201).json({
    status: "succes",
    data: {
      reviews,
    },
  });
});

exports.getAllReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find();

  res.json({
    status: "sucess",
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

exports.getReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError("Cant find this review", 404));
  }

  res.json({
    status: "succes",
    data: {
      review,
    },
  });
});

exports.updateReview = catchAsync(async (req, res, next) => {
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { ...req.body },
    { new: true, runValidators: true }
  );

  review.constructor.calAvgRat(review.tour);

  if (!review) {
    return next(new AppError("No review Found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      review,
    },
  });
});

exports.deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError("No review Found", 404));
  }

  await review.remove();

  res.status(204).json({
    status: "success",
    data: null,
  });
});
