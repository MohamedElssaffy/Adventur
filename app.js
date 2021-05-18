const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const xss = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const morgan = require("morgan");
const helmet = require("helmet");

const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const viewRouter = require("./routes/viewRoutes");
const bookingRouter = require("./routes/bookingRoutes");
const AppError = require("./utils/appError");

const app = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "templates"));

// 1) MIDDLEWARES

app.use(express.static(path.join(__dirname, "public")));

// Set Securty HTTP Headers

app.use(helmet());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// For Limit Requests
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too Many Requests From This IP, Please Try Agian in an hour.",
});

app.use("/api", limiter);

app.use(express.json());

//  For Cookie Parser

app.use(cookieParser());

//  For Sanitize Mongo Query

app.use(mongoSanitize());

// For Clean code from html syntax

app.use(xss());

// For Prevent Repeate in query

app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsAverage",
      "ratingsQuantity",
      "price",
      "difficulty",
      "maxGroupSize",
    ],
  })
);

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES

app.use("/", viewRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/booking", bookingRouter);

//  For Not Found Pages
app.all("*", (req, res, next) => {
  next(new AppError(`Cant find ${req.originalUrl}`, 404));
});

// Global Middleware For Error
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    console.error(err);
  }

  if (
    err.name === "CastError" ||
    err.code === 11000 ||
    err.name === "ValidationError" ||
    err.name === "JsonWebTokenError" ||
    err.name === "TokenExpiredError"
  ) {
    if (err.name === "CastError") {
      err.message = `Invalid ${err.path}: ${err.value}`;
    }

    if (err.code === 11000) {
      if (Object.keys(err.keyPattern).length > 1) {
        err.message = "You Only Have To Make a Review For a Singl Tour ";
      } else {
        err.message = `This ${Object.keys(err.keyPattern)}: (${
          err.keyValue.name || err.keyValue.email
        }) Is Already Taken`;
      }
    }

    if (err.name === "ValidationError") {
      const errorsMsg = Object.values(err.errors).map((val) => val.message);

      err.message = `Invalied Data: ${errorsMsg.join(". ")}`;
    }

    err.isOperational = true;
    err.statusCode = 400;
    err.status = "fail";

    if (err.name === "JsonWebTokenError") {
      err.message = "invaled token";
      err.statusCode = 401;
    }

    if (err.name === "TokenExpiredError") {
      err.message = "Expired Token";
      err.statusCode = 401;
    }
  }

  if (req.originalUrl.startsWith("/api")) {
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      res.status(500).json({
        status: "Error",
        message: "Something Went Wrong!",
      });
    }
  } else {
    if (err.isOperational) {
      res.status(err.statusCode).render("error", {
        title: "Something Went Wrong",
        msg: err.message,
      });
    } else {
      res.status(500).render("error", {
        title: "Something Went Wrong",
        msg: "Please Try Again Later",
      });
    }
  }
});

module.exports = app;
