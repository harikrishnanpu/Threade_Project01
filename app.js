const express = require('express');
const nocache = require('nocache');
const path = require('node:path');
const userRouter = require('./routers/usersRouter.js');
const expressEjsLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');

const MONGODB_URI = process.env.MONGODB_URI


const app = express();
mongoose.connect(MONGODB_URI);
app.use(passport.initialize());


app.use(nocache());
app.use(cookieParser());
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressEjsLayouts);
app.use(express.static(path.join(__dirname, 'public')));
app.set('layout', 'layout/userLayout'); 

app.use('/user', userRouter);









module.exports = app;