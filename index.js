const dotenv = require('dotenv');
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
const {httpServer} = require('./app');



const PORT = process.env.PORT;


httpServer.listen(PORT,()=> console.log(`Server Running on Port: ${PORT} [${process.env.NODE_ENV}]`));