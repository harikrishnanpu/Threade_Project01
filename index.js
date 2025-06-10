const dotenv = require('dotenv');
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
const app = require('./app.js');



const PORT = process.env.PORT;


app.listen(PORT,()=> console.log(`Server Running on Port: ${PORT} [${process.env.NODE_ENV}]`));