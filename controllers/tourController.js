const multer = require("multer");
const sharp = require("sharp");
const Tour = require("../models/tour");
const AIPQueries = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: "fail",
//       message: "Missing name or price",
//     });
//   }
//   next();
// };

const upload = multer({
  fileFilter(req, file, cb) {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb(new AppError("Please Upload An Image Only", 400), false);
    }
  },
});

exports.uploadTourImages = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);

exports.customTourImagesProp = catchAsync(async (req, res, next) => {
  if (req.files.imageCover) {
    req.body.imageCover = `tour-cover-${req.params.id}-${Date.now()}.jpeg`;

    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${req.body.imageCover}`);
  }

  if (req.files.images) {
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (image, i) => {
        const filename = `tour-${req.params.id}-${Date.now()}=${i + 1}.jpeg`;
        await sharp(image.buffer)
          .resize(2000, 1333)
          .toFormat("jpeg")
          .jpeg({ quality: 90 })
          .toFile(`public/img/tours/${filename}`);

        req.body.images.push(filename);
      })
    );
  }

  next();
});

exports.topTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,summary,difficulty,ratingsAverage";

  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  // const queryObj = { ...req.query };

  // const excludedFields = ["page", "sort", "limit", "fields"];

  // excludedFields.forEach((fieldName) => delete queryObj[fieldName]);

  // let queryStr = JSON.stringify(queryObj);

  // queryStr = JSON.parse(
  //   queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => "$" + match)
  // );

  // let query = Tour.find(queryStr);

  // For Sorting

  // if (req.query.sort) {
  //   const sortBy = req.query.sort.split(",").join(" ");
  //   query.sort(sortBy);
  // } else {
  //   query.sort("-createdAt");
  // }

  // Fields Select To Show

  // if (req.query.fields) {
  //   const fields = req.query.fields.split(",").join(" ");
  //   query.select(fields);
  // }

  //  For Pagination

  // const page = parseInt(req.query.page) || 1;
  // const limit = parseInt(req.query.limit) || 100;
  // const skip = (page - 1) * limit;

  // if (req.query.page) {
  //   const toursNum = await Tour.countDocuments();

  //   if (skip >= toursNum) {
  //     return res.status(404).json({
  //       status: "fail",
  //       message: "This Page Does Not Exist",
  //     });
  //   }
  // }

  // query.skip(skip).limit(limit);

  //  Query Excute
  const query = new AIPQueries(Tour.find(), req.query)
    .filterQuery()
    .sort()
    .selectedFields()
    .limitAndPage();

  const tours = await query.query;

  res.status(200).json({
    status: "success",
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id).populate("reviews");

  if (!tour) {
    return next(new AppError("No Tour Found", 404));
  }

  res.json({
    status: "succes",
    data: {
      tour,
    },
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  const tour = new Tour({ ...req.body });

  await tour.save();

  res.status(201).json({
    status: "succes",
    data: {
      tour,
    },
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(
    req.params.id,
    { ...req.body },
    { new: true, runValidators: true }
  );

  if (!tour) {
    return next(new AppError("No Tour Found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      tour,
    },
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);

  if (!tour) {
    return next(new AppError("No Tour Found", 404));
  }

  await tour.remove();

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: {
        ratingsAverage: { $gte: 4.5 },
      },
    },
    {
      $group: {
        _id: { $toUpper: "$difficulty" },
        numTours: {
          $sum: 1,
        },
        numRating: {
          $sum: "$ratingsQuantity",
        },
        avgRating: {
          $avg: "$ratingsAverage",
        },
        avgPrice: {
          $avg: "$price",
        },
        maxPrice: {
          $max: "$price",
        },
        minPrice: {
          $min: "$price",
        },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);

  res.json({
    status: "succ",
    data: {
      stats,
    },
  });
});

exports.getTourPerMonth = catchAsync(async (req, res, next) => {
  const year = req.query.year;
  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTourStarts: { $sum: 1 },
        tours: { $push: "$name" },
      },
    },
    {
      $addFields: {
        month: "$_id",
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
  ]);

  res.json({
    status: "succ",
    data: {
      plan,
    },
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { dist, coords, unit } = req.query;
  if (!dist || !coords) {
    return next(
      new AppError("Please Provide Your Location And The Distance", 400)
    );
  }

  const [lat, long] = coords.split(",");

  const raduis = unit === "mi" ? dist / 3963.2 : dist / 6378.1;

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[long, lat], raduis] } },
  });

  if (!tours) {
    return next(
      new AppError("Sorry, Cant Find Tour Near With This Distance", 404)
    );
  }

  res.json({
    status: "succes",
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { coords, unit } = req.query;

  if (!coords) {
    return next(new AppError("Please Provide Your Location", 400));
  }

  const [lat, long] = coords.split(",");

  const tours = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [parseInt(long), parseInt(lat)],
        },
        distanceField: "distance",
        distanceMultiplier: unit === "mi" ? 0.000621371 : 0.001,
      },
    },
    {
      $project: {
        name: 1,
        distance: 1,
      },
    },
  ]);

  res.json({
    status: "succes",
    results: tours.length,
    data: {
      tours,
    },
  });
});
