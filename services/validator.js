const { validationResult } = require('express-validator'); 


const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    const errorMessage = firstError.msg;
    return res.status(400).json({ message: errorMessage });
  }
  next();
}


module.exports = { handleValidationErrors };