const express = require("express");
const authControll = require("./../controllers/authControll");
const userControll = require("./../controllers/userController");

const router = express.Router();

//  Route For Sign up

router.post("/signup", authControll.singUp);

//  Route For Log In

router.post("/login", authControll.logIn);

// Route For Forget Password

router.post("/forgetpassword", authControll.forgetPassword);

// Route For reset Password

router.patch("/resetpassword/:token", authControll.resetPassword);

//  Ensure Auth For All Routes After This Midelware

router.use(authControll.ensureAuth);

// Route For Update Password

router.patch(
  "/updatepassword",

  authControll.updatePassword
);

// Route For Get Me

router.get("/me", userControll.getMe);

// Route to log out

router.patch("/logout", authControll.ensureAuth, authControll.logOut);

// Route For Update Log in User

router.patch(
  "/updateme",
  userControll.uploadUserImage,
  userControll.customUserImageProp,
  userControll.updateMe
);

// Route For delete Log in User

router.delete("/deleteMe", userControll.deleteMe);

// For Admin Only
router.use(authControll.restrictTo("admin"));

router.route("/").get(userControll.getAllUsers);

router.route("/:id").delete(userControll.deleteUser);
// .get(userControll.getUser)
// .patch(userControll.updateUser)

module.exports = router;
