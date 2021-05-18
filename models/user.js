const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name Is Required"],
    },
    email: {
      type: String,
      required: [true, "Email Is Required"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please Enter An Email"],
    },
    password: {
      type: String,
      required: [true, "Password Is Required"],
      minlength: [8, "Password Should At Least 8 Characters"],
      select: false,
      validate: {
        validator(val) {
          return !val.toLowerCase().includes("password");
        },
        message: 'Password Should not Include "password"',
      },
    },
    role: {
      type: String,
      enum: ["user", "guide", "lead-guide", "admin"],
      default: "user",
    },
    photo: {
      type: String,
      default: "default.jpg",
    },
    passwordChangedAt: {
      type: Date,
    },
    tokens: [{ token: String }],
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual For Reviews

UserSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "user",
});

UserSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

UserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

UserSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) {
    return next();
  }

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

UserSchema.methods.passowrdChangedAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeInSec = parseInt(this.passwordChangedAt.getTime() / 1000);

    return jwtTimestamp < changedTimeInSec;
  }

  return false;
};

const User = mongoose.model("User", UserSchema);

module.exports = User;
