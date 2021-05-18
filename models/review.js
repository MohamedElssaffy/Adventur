const mongoose = require("mongoose");
const Tour = require("./tour");

const ReviewSchema = new mongoose.Schema({
  review: {
    type: String,
    required: [true, "Review Cant Be Empty"],
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tour",
    required: [true, "Tour Is Required"],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User Is Required"],
  },
});

ReviewSchema.index({ user: 1, tour: 1 }, { unique: true });

ReviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name photo",
  });
  next();
});

ReviewSchema.statics.calAvgRat = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: "$tour",
        numOfRate: { $sum: 1 },
        avgRat: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: Math.round(stats[0].avgRat * 10) / 10,
      ratingsQuantity: stats[0].numOfRate,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0,
    });
  }
};

ReviewSchema.post(/(save|remove)/, function () {
  this.constructor.calAvgRat(this.tour);
});

//  This For Update Tour Avrage Rating When Make FindOneAnd(Update)

// ReviewSchema.pre("findOneAndUpdate", async function (next) {
//   this.review = await this.findOne();
//   next();
// });

// ReviewSchema.post("findOneAndUpdate", async function () {
//   this.review.constructor.calAvgRat(this.review.tour);
// });

const Review = mongoose.model("Review", ReviewSchema);

module.exports = Review;
