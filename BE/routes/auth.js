const express = require("express");
const { body } = require("express-validator");

const User = require("../models/user");
const authController = require("../controllers/auth");

const router = express.Router();

router.put(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("email address already in use");
          }
        });
      })
      .normalizeEmail(), //email is valid and not in use already
    body("password").trim().isLength({ min: 5 }), //password min 5 chars
    body("name").trim().not().isEmpty(), //user name not empty
  ],
  authController.signup
);

module.exports = router;
