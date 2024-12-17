const { validationResult } = require("express-validator");
const fs = require("fs");
const path = require("path");

const Post = require("../models/post");
const post = require("../models/post");

const NextError = (next, error, status = 500) => {
  if (!error.statusCode) {
    error.statusCode = status;
  }
  next(error);
};

exports.getPosts = (req, res, next) => {
  Post.find()
    .then((posts) => {
      res.status(200).json({ message: "fetched posts", posts: posts });
    })
    .catch((error) => NextError(next, error));
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("validation failed, entered data is incorrect.");
    error.statusCode = 422;
    throw error;
  }

  if (!req.file) {
    const error = new Error("validation failed, no image provided.");
    error.statusCode = 400;
    throw error;
  }

  const imageUrl = req.file.path.replace("\\", "/");
  const title = req.body.title;
  const content = req.body.content;
  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: { name: "max" },
  });
  post
    .save()
    .then((result) => {
      // Create post in db
      res.status(201).json({
        message: "Post created successfully!",
        post: result,
      });
    })
    .catch((error) => NextError(next, error));
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;

  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Could not find post.");
        error.statusCode = 404;
        throw error;
      }

      res.status(200).json({ message: "post fetched", post: post });
    })
    .catch((error) => NextError(next, error));
};

exports.updatePost = (req, res, next) => {
  const postId = req.params.postId;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("validation failed, entered data is incorrect.");
    error.statusCode = 422;
    throw error;
  }

  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;

  if (req.file) {
    imageUrl = req.file.path.replace("\\", "/");
  }

  if (!imageUrl) {
    const error = new Error("no file picked");
    error.statusCode = 422;
    throw error;
  }

  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Could not find post.");
        error.statusCode = 404;
        throw error;
      }

      if (imageUrl !== post.imageUrl) {
        clearImage(post.imageUrl);
      }

      //post found
      post.title = title;
      post.imageUrl = imageUrl;
      post.content = content;
      return post.save();
    })
    .then((result) => {
      res.status(200).json({ message: "Post  updated", post: result });
    })
    .catch((error) => NextError(next, error));
};

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;

  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Could not find post.");
        error.statusCode = 404;
        throw error;
      }

      clearImage(post.imageUrl);
      return Post.findByIdAndDelete(postId);
    })
    .then((result) => {
      console.log(result);
      res.status(200).json({ message: "successfully deleted post" });
    })
    .catch((error) => NextError(next, error));
};

const clearImage = (filepath) => {
  filepath = path.join(__dirname, "..", filepath);
  fs.unlink(filepath, (err) => console.log(err));
};
