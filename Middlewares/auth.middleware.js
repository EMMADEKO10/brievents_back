const authorize = (roles) => {
  return (req, res, next) => {
    const { role } = req.user;

    if (roles.includes(role)) {
      next(); // User is authorized, proceed to the next middleware or route handler
    } else {
      return res.status(403).json({
        message:
          "You are not authorized to perform this action because of your role",
      });
    }
  };
};

module.exports = authorize;




