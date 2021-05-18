const multer = require("multer");
const sharp = require("sharp");
const User = require("../models/user");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// const multerStorage = multer.diskStorage({
//   destination(req, file, cb) {
//     cb(null, "public/img/users");
//   },
//   filename(req, file, cb) {
//     const ext = file.mimetype.split("/")[1];

//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const upload = multer({
  fileFilter(req, file, cb) {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb(new AppError("Please Upload An Image Only", 400), false);
    }
  },
});

exports.uploadUserImage = upload.single("photo");

exports.customUserImageProp = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.json({
    status: "sucess",
    results: users.length,
    data: {
      users,
    },
  });
});
exports.getUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined!",
  });
};

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined!",
  });
};

exports.getMe = catchAsync(async (req, res, next) => {
  const user = req.user;

  res.json({
    status: "succes",
    data: {
      user,
    },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  const { name, email } = req.body;

  if (name) {
    req.user.name = name;
  }

  if (email) {
    req.user.email = email;
  }

  if (req.file) {
    req.user.photo = req.file.filename;
  }

  await req.user.save();

  res.json({
    status: "success",
    data: {
      user: req.user,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({
    status: "succes",
    data: null,
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndRemove(req.params.id);

  if (!user) {
    return next(new AppError("Not Found User", 404));
  }

  res.status(204).json({
    status: "succes",
    data: null,
  });
});
