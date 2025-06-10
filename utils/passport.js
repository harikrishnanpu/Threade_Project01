const passport = require('passport');
const Users = require('../models/userModel.js');
const GoogleStrategy = require('passport-google-oauth20').Strategy;


passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_AUTH_CLIENT_ID,
  clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
  callbackURL: "/user/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const googleId = profile.id;
    const email = profile.emails?.[0]?.value;

    let user = await Users.findOne({ $or: [ {email} , {googleId} ] });

    if (!user) {
      // If user doesn't exist, create a new one
      user = new Users({
        googleId,
        name: profile.displayName,
        email,
        isVerified: true
      });

      await user.save();
    }

    if (user.isBlocked) {
      return done(null, false, { message: 'Your account is blocked. Contact support.' });
    }else{
      return done(null, user);
    }
  } catch (err) {
    return done(err, null);
  }
}));

