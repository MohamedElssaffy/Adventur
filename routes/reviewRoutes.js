const router = require("express").Router({ mergeParams: true });

const reviewControll = require("../controllers/reviewControll");
const authControll = require("../controllers/authControll");

// Ensure Auth For All Routes
router.use(authControll.ensureAuth);

//  Route For Create Review

router.post("/", authControll.restrictTo("user"), reviewControll.createReviews);

// Route For Get All Reviews
router.get("/", reviewControll.getAllReviews);

// Route For Get  Review By Id
router.get("/:id", reviewControll.getReview);

// Route For Update Review
router.patch(
  "/:id",
  authControll.restrictTo("admin", "user"),
  reviewControll.updateReview
);

// Route For Delete Review
router.delete(
  "/:id",
  authControll.restrictTo("admin", "user"),
  reviewControll.deleteReview
);

module.exports = router;
