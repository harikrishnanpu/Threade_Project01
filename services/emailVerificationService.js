const nodemailer = require('nodemailer');
const otpModel = require('../models/otpModel.js');


const sendOtpToEmail = async (email, otp) => {

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!isValidEmail) {
    throw new Error('Invalid email format');
  }

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"THREADE Support" <${process.env.MAIL_USER}>`,
    to: email,
    subject: 'Email Verification OTP',
    html: `<p>Your OTP for verifying your email is:</p>
           <h2>${otp}</h2>
           <p>This OTP is valid for 10 minutes.</p>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, message: 'mail sent successfully', info };
  } catch (error) {
    console.error('Error sending email:', error.message);
    throw new Error('Email was not sent successfully');
  }
};


const sendResetPasswordLinkToEmail = async (email, link) => {

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!isValidEmail) {
    throw new Error('Invalid email format');
  }

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"THREADE Support" <${process.env.MAIL_USER}>`,
    to: email,
    subject: 'Email Verification OTP',
    html: `<p>Your Reset Lnk for reseting your account password is:</p>
           <h2>${link}</h2>
           <p>This link is valid only for 15 minutes.</p>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, message: 'mail sent successfully', info };
  } catch (error) {
    console.error('Error sending email:', error.message);
    throw new Error('Email was not sent successfully');
  }
};


const verifyEmailOtp = async (email, otp) => {

  try{    

    const dbOtp = await otpModel.findOne({email});

    if (!dbOtp) {
      throw new Error('No OTP found for this email');
    }

    if (dbOtp.attempt >= 5) {
      await dbOtp.deleteOne({ email });
      throw new Error('Too many incorrect attempts' );
    }

    if (dbOtp.expiresAt < Date.now()) {
      await dbOtp.deleteOne({ email });
      throw new Error ('OTP has expired');
    }

    if (dbOtp.otp !== otp) {
      dbOtp.attempt += 1;
      await dbOtp.save();
      throw new Error('Incorrect OTP');
    }


    // Clean up OTP entry
    await dbOtp.deleteOne({ email });

    return true;


  }catch(err){
    throw new Error(err.message);
  }
}


const findAndDeletePreviousOtp = async (email) =>{


  try{

    const dbOtp = await otpModel.findOne({email});

    if(!dbOtp){
      return true
    }

    await dbOtp.deleteOne({email});

    return true;


  }catch(err){

    throw new Error(err.message)

  }



}





module.exports = { sendOtpToEmail, verifyEmailOtp ,  findAndDeletePreviousOtp, sendResetPasswordLinkToEmail}
