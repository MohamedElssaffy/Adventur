const express = require("express");
const bookingControll = require("./../controllers/bookingControll");
const authControll = require("./../controllers/authControll");

const router = express.Router();

router.get(
  "/checkout-session/:tourId",
  authControll.ensureAuth,
  bookingControll.getCheckoutSession
);

//  Routes For Booking CRUD Operation

router.use(
  authControll.ensureAuth,
  authControll.restrictTo("admin", "lead-guide")
);

router.post("/", bookingControll.createBooking);
router.get("/", bookingControll.getAllBooking);
router.get("/:id", bookingControll.getBooking);
router.patch("/:id", bookingControll.updateBooking);
router.delete("/:id", bookingControll.deleteBooking);

module.exports = router;
