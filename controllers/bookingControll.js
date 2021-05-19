const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Tour = require("../models/tour");
const Booking = require("../models/booking");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const User = require("../models/user");

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    success_url: `${req.protocol}://${req.get("host")}/my-tours`,
    cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [
          `${req.protocol}://${req.get("host")}/img/tours/${tour.imageCover}`,
        ],
        amount: tour.price * 100,
        currency: "usd",
        quantity: 1,
      },
    ],
  });

  res.status(200).json({
    status: "success",
    session,
  });
});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   const { tour, user, price } = req.query;

//   if (!tour && !user && !price) return next();
//   await Booking.create({ tour, user, price });

//   res.redirect("/");
// });

exports.webhookStripe = (req, res, next) => {
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`WebHook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const tour = session.client_reference_id;
    const user = (await User.findOne({ email: session.customer_email })).id;
    const price = session.line_items[0].amount / 100;

    await Booking.create({ tour, user, price });
  }

  res.json({ received: true });
};

exports.createBooking = catchAsync(async (req, res, next) => {
  const { user, tour, price } = req.body;

  if (!user || !tour || !price)
    return next(new AppError("Please Provide All Fields", 400));

  const booking = new Booking({ user, tour, price });

  await booking.save();

  res.status(201).json({
    status: "success",
    data: {
      booking,
    },
  });
});

exports.getAllBooking = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find();

  if (!bookings) return next(new AppError("Not Found", 404));

  res.json({
    status: "success",
    result: bookings.length,
    data: {
      bookings,
    },
  });
});

exports.getBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!bookings) return next(new AppError("Not Found", 404));

  res.json({
    status: "success",
    data: {
      booking,
    },
  });
});

exports.updateBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!bookings) return next(new AppError("Not Found", 404));
  const { user, tour, price } = req.body;

  if (user) {
    booking.user = user;
  }
  if (tour) {
    booking.tour = tour;
  }
  if (price) {
    booking.price = price;
  }

  await booking.save();
  res.json({
    status: "success",
    data: {
      booking,
    },
  });
});

exports.deleteBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!bookings) return next(new AppError("Not Found", 404));

  await booking.remove();

  res.json({
    status: "success",
  });
});
