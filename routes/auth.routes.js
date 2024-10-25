// routes/users.route.js
const express = require('express');
const {getMe,signup,login,pendingSignup} = require('../Controllers/auth.controller');
// const { protect, restrictTo } = require('../Middlewares/authMiddleware');
// const { authenticate, authorize } = require('../Middlewares/authMiddleware');

const authRouter = express.Router();

authRouter.post('/signup', signup);
authRouter.post('/login', login);
authRouter.get('/me', getMe);
authRouter.post('/pending-signup', pendingSignup);
authRouter.get('/confirm/:token', signup);

module.exports = authRouter;


