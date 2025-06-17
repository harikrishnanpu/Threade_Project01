const express = require('express');
const nocache = require('nocache');
const path = require('node:path');
const userRouter = require('./routers/usersRouter.js');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const { checkAndRedirect } = require('./middlewares/userMiddleware.js');
const expressEjsLayouts = require('express-ejs-layouts');
const adminRouter = require('./routers/adminRouter.js');
const { connectDb } = require('./config/db.js');

const MONGODB_URI = process.env.MONGODB_URI;


connectDb(MONGODB_URI);
const app = express();


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
app.use(expressEjsLayouts);
app.set('layout', 'layout/userLayout');
app.set('views', path.join(__dirname, 'views'));


app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', checkAndRedirect); 
app.use('/user', userRouter);
app.use('/admin', adminRouter);









module.exports = app;