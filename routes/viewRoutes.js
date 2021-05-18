const router = require("express").Router();
const viewControll = require("../controllers/viewControll");
const authControll = require("../controllers/authControll");
const bookingControll = require("../controllers/bookingControll");

router.get("/signup", viewControll.signUp);

router.get(
  "/",
  bookingControll.createBookingCheckout,
  authControll.checkUserLogin,
  viewControll.getOverView
);
router.get(
  "/tour/:tourSlug",

  authControll.checkUserLogin,
  viewControll.getTour
);
router.get("/login", authControll.checkUserLogin, viewControll.logInPage);
router.get("/me", authControll.ensureAuth, viewControll.myProfile);
router.get("/my-tours", authControll.ensureAuth, viewControll.myBookingTours);

module.exports = router;
