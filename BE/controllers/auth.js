const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

const NextError = (next, error, status = 500) => {
  if (!error.statusCode) {
    error.statusCode = status;
  }
  next(error);
};

exports.signup = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("validation failed");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;

  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        email: email,
        password: hashedPassword,
        name: name,
      });
      return user.save();
    })
    .then((result) => {
      console.log(result);
      res.status(201).json({ message: "user created", userId: result._id });
    })
    .catch((error) => {
      NextError(next, error);
    });
};

exports.login = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;

  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        const error = new Error("a user with this email could not be found");
        error.statusCode = 401;
        throw error;
      }
      loadedUser = user;

      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error("Wrong password");
        error.statusCode = 401;
        throw error;
      }

      // create token
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
        },
        "secretKey",
        {
          expiresIn: "1h",
        }
      );
      res.status(200).json({ token: token, userId: loadedUser._id.toString() });
    })
    .catch((error) => {
      NextError(next, error);
    });
};
