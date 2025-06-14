const checkIsNumber = (number) => {
  return /^-?\d+(\.\d+)?$/.test(number);
};

const checkEmailValid = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); 
};

const checkPhoneNumberValid = (phoneNumber) => {
  return /^\d{7,15}$/.test(phoneNumber); 
};

const checkUsernameValid = (username) => {
  return /^(?! )[a-zA-Z0-9_ ]{3,20}(?<! )$/.test(username);
};

const checkPasswordValid = (password) => {
return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]{8,}$/.test(password);
};

const checkNameValid = (name) => {
  return /^[A-Za-z\s'-]{2,50}$/.test(name.trim());
};

const checkPasswordMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};

const checkOtpValid = (otp) => {
  const otpRegex = /^\d{6}$/;
  return otpRegex.test(otp);
};





