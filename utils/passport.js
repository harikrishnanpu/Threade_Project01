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
    const profileImage = profile.photos?.length > 0 ? profile.photos[0].value : null;


    let user = await Users.findOne({ $or: [ {email} , {googleId} ] });

    if (!user) {

      user = new Users({
        googleId,
        name: profile.displayName,
        email,
        isVerified: true,
      });

    }

    if(!user.profileImage){
      user.profileImage = profileImage
    }


    await user.save();

    if (user.isBlocked) {
      return done(null, false, { message: 'Your account is blocked. Contact support.' });
    }else{
      return done(null, user);
    }

  } catch (err) {
    console.log(err);
    
    return done(err, null);
  }
}));

