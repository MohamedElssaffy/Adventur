const express = require("express");
const tourController = require("./../controllers/tourController");
const authControll = require("./../controllers/authControll");
const reviewRoutes = require("./../routes/reviewRoutes");

const router = express.Router();

// For Reviews

router.use("/:tourId/reviews", reviewRoutes);

router
  .route("/")
  .get(tourController.getAllTours)
  .post(
    authControll.ensureAuth,
    authControll.restrictTo("admin", "lead-guide"),
    tourController.createTour
  );

router.get("/topFiveTour", tourController.topTours, tourController.getAllTours);

router.get("/tours-stats", tourController.getTourStats);
router.get(
  "/tours-month",
  authControll.ensureAuth,
  authControll.restrictTo("admin", "lead-guide", "user"),
  tourController.getTourPerMonth
);

// Route For Search With Start Location

router.get("/tour-within", tourController.getToursWithin);

// Route For Get Distances  from all tours

router.get("/tour-dist", tourController.getDistances);

router
  .route("/:id")
  .get(tourController.getTour)
  .patch(
    authControll.ensureAuth,
    authControll.restrictTo("admin", "lead-guide"),
    tourController.uploadTourImages,
    tourController.customTourImagesProp,
    tourController.updateTour
  )
  .delete(
    authControll.ensureAuth,
    authControll.restrictTo("admin", "lead-guide"),
    tourController.deleteTour
  );

module.exports = router;
