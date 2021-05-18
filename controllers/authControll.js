const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/user");
const AppError = require("../utils/appError");
const Email = require("../utils/nodemailer");

const signToken = (id, res) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  const cookieOptions = {
    httpOnly: true,
    maxAge: 90 * 60 * 60 * 24 * 1000,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("auth", token, cookieOptions);

  return token;
};

exports.singUp = catchAsync(async (req, res, next) => {
  const { email, name, password } = req.body;
  const user = new User({ name, email, password });
  const token = signToken(user._id, res);
  user.tokens.push({ token });
  await user.save();

  user.password = undefined;

  const url = `${req.protocol}://${req.get("host")}/me`;
  new Email(user, url).sendWelcom();

  res.status(201).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
});

exports.logIn = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please Provide email and password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new AppError("Your Email Or Password Wrong", 401));
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    return next(new AppError("Your Email Or Password Wrong", 401));
  }

  const token = signToken(user._id, res);
  user.tokens.push({ token });

  await user.save();

  res.json({
    status: "success",
    token,
  });
});

exports.ensureAuth = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.replace("Bearer ", "");
  } else if (req.cookies["auth"]) {
    token = req.cookies["auth"];
  }

  if (!token) {
    return next(new AppError("Please Log In ", 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findOne({ _id: decoded.id, "tokens.token": token });

  if (!user) {
    return next(new AppError("Your Are Not Logged in", 401));
  }

  if (user.passowrdChangedAfter(decoded.iat)) {
    return next(new AppError("Password Changed Please Log In Again", 401));
  }

  req.user = user;
  res.locals.user = user;

  next();
});

exports.checkUserLogin = async (req, res, next) => {
  if (req.cookies["auth"]) {
    try {
      const decoded = jwt.verify(req.cookies["auth"], process.env.JWT_SECRET);

      const user = await User.findOne({
        _id: decoded.id,
        "tokens.token": req.cookies["auth"],
      });

      if (!user) {
        return next();
      }

      if (user.passowrdChangedAfter(decoded.iat)) {
        return next();
      }

      res.locals.user = user;
      return next();
    } catch (error) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You Dont Have Permission For This Action", 403)
      );
    }
    next();
  };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError("Cant Find This Email", 404));
  }

  const resetPasswordToken = jwt.sign(
    { id: user._id },
    process.env.JWT_FORGETPASSWORD_SECRET,
    { expiresIn: process.env.JWT_FORGETPASSWORD_EXPIRES_IN }
  );

  const restURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetpassword/${resetPasswordToken}`;

  new Email(user, restURL).sendResetPassword();

  res.json({
    status: "succ",
    message: "restToken is Sent",
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const decoded = jwt.verify(
    req.params.token,
    process.env.JWT_FORGETPASSWORD_SECRET
  );

  const user = await User.findById(decoded.id).select("+password");
  if (user.passwordChangedAt) {
    if (decoded.iat < user.passwordChangedAt.getTime() / 1000) {
      return next(
        new AppError(
          "This Link Is Used If You Want To Rest Password Again Make Anther Forget password",
          400
        )
      );
    }
  }
  if (!user) {
    return next(new AppError("Cant Find", 404));
  }

  const { password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return next(new AppError("Please Match The Password", 400));
  }

  user.password = password;

  await user.save();

  const token = signToken(user._id, res);

  res.json({
    status: "succ",
    token,
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { password, currentPassword, passwordConfirm } = req.body;

  if (!currentPassword || !password) {
    return next(new AppError("Please provide your password", 400));
  }

  const user = await User.findById(req.user._id).select("+password");

  const isMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isMatch) {
    return next(new AppError("Password is wrong", 401));
  }

  if (password !== passwordConfirm) {
    return next(new AppError("Password should be match", 400));
  }

  user.password = password;
  user.passwordChangedAt = Date.now();

  const token = signToken(user._id, res);
  user.tokens = [];
  user.tokens.push({ token });

  await user.save();

  res.json({
    status: "success",
    token,
  });
});

exports.logOut = catchAsync(async (req, res, next) => {
  const authToken = req.cookies["auth"];
  req.user.tokens.filter((token) => token !== authToken);

  await req.user.save();
  res.locals.user = undefined;
  res.cookie("auth", "Logged Out", {
    maxAge: 1 * 1000 * 60,
    httpOnly: true,
  });
  res.json({
    status: "success",
  });
});
