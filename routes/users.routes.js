const express = require('express');
const userRouter = express.Router();
const userController = require('../Controllers/users.controller');

userRouter.post('/', userController.login);

module.exports = userRouter;