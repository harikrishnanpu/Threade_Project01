const express = require('express');
const nocache = require('nocache');
const http = require('http');
const path = require('node:path');
const userRouter = require('./routers/user/usersRouter.js');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const { checkAndRedirect } = require('./middlewares/userMiddleware.js');
const expressEjsLayouts = require('express-ejs-layouts');
const adminRouter = require('./routers/admin/adminRouter.js');
const { connectDb } = require('./config/db.js');
const { Server  } = require('socket.io');

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



const httpServer = http.createServer(app);          // already in your file

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

io.on('connection', socket => {
  console.log('⚡  client connected', socket.id);

  /*  A.  shoppers emit   socket.emit('register', { id, name })  */
  socket.on('register', user => {
    socket.data.user = user;        // { id, name }
    updateActive();
  });

  /*  B.  admin tab says socket.emit('joinAdminRoom')  */
  socket.on('joinAdminRoom', () => socket.join('adminRoom'));

  /*  C.  chat  */
  socket.on('chatMessage', msg => {
    // msg = { from, to, text, ts }
    for (const s of io.sockets.sockets.values()) {
      const uid = s.data.user?.id;
      if (uid === msg.to || uid === msg.from || msg.to === 'admin') {
        s.emit('chatMessage', msg);
      }
    }
    io.to('adminRoom').emit('chatMessage', msg);   // keep admin panels synced
  });

  socket.on('disconnect', updateActive);

  /* helper */
  function updateActive() {
    const users = [];
    for (const s of io.sockets.sockets.values()) {
      if (s.data.user && s.data.user.id !== 'admin') {
        users.push({ id: s.data.user.id, name: s.data.user.name });
      }
    }
    io.to('adminRoom').emit('activeUsers', users);
  }
});






module.exports = httpServer;