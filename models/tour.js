const mongoose = require("mongoose");
const slugify = require("slugify");

const TourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "A Tour Name Is Required"],
      unique: true,
      maxlength: [40, "Tour Name Should Be Less Than 40 Characters"],
    },
    slug: String,
    duration: {
      type: String,
      required: [true, "You Should Add Duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A Tour Should Have A Group Size"],
    },
    difficulty: {
      type: String,
      required: [true, "A Tour Should Have A Difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either: esay, medium, difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      min: [1, "Ratting should be 1.0 or heigher"],
      max: [5, "Ratting should be 5.0 or blew"],
      default: 4.5,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "Please Add Your Price For Tour"],
    },
    priceDiscount: {
      type: Number,
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A Tour Should Have A description"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A Tour Should Have A Cover  Image"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: {
      type: [Date],
      required: [true, "Please Tell Us About Start Dates"],
    },
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        enum: {
          values: ["Point"],
          message: "Type Should Be Only Point",
        },
        default: "Point",
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          enum: {
            values: ["Point"],
            message: "Type Should Be Only Point",
          },
          default: "Point",
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes

TourSchema.index({ price: 1, ratingsAverage: -1 });
TourSchema.index({ slug: 1 });

TourSchema.index({ "startLocation.coordinates": "2dsphere" });

// Virtual For Reviews

TourSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "tour",
});

// Before Save Hooks (Type Document)

TourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Find Hooks (Type Query)

TourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } }).populate({
    path: "guides",
    select: "-__v -passwordChangedAt",
  });
  next();
});

// Aggregation Hooks
TourSchema.pre("aggregate", function (next) {
  if (!Object.keys(this.pipeline()[0]).includes("$geoNear")) {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  }
  next();
});

const Tour = mongoose.model("Tour", TourSchema);

module.exports = Tour;
