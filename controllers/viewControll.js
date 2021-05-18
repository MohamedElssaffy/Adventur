const Booking = require("../models/booking");
const Tour = require("../models/tour");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.signUp = (req, res, next) => {
  res.render("sign-up");
};

exports.getOverView = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();

  res.render("overview", {
    title: "All Tour",
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.tourSlug }).populate({
    path: "reviews",
    fields: "user review rating",
  });

  if (!tour) {
    return next(new AppError("No Tour Found !", 404));
  }

  res
    .set(
      "Content-Security-Policy",
      "default-src 'self' https://*.mapbox.com https://*.stripe.com ; connect-src 'self' https://*.mapbox.com https://*.stripe.com ws://127.0.0.1:*/ ; base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com https://js.stripe.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    )
    .render("tour", {
      title: `${tour.name} Tour`,
      tour,
    });
});

exports.logInPage = catchAsync(async (req, res, next) => {
  if (req.cookies["auth"] && req.cookies["auth"] !== "Logged Out") {
    return res.redirect("/");
  }
  res.render("login", {
    title: "Log In",
  });
});

exports.myProfile = (req, res) => {
  res.render("profile", { title: "Your Account" });
};

exports.myBookingTours = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id }).select("tour");

  if (!bookings) {
    return next(new AppError("You Dont Booking Any Tour Yet", 404));
  }

  const toursId = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: toursId } });

  res.render("overview", {
    title: "My Tours",
    tours,
  });
});
