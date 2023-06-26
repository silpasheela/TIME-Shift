const mongoose = require("mongoose")
mongoose.set('strictQuery', true);
const express = require("express")
const nocache = require('nocache');
const mongoSanitize = require('express-mongo-sanitize');
const app = express()
require('dotenv').config();

DB = process.env.DBURL
mongoose.connect(DB)

const connection = mongoose.connection;

connection.once('open', () => {
  console.log('Database Connection Established !');
});

connection.on('error', (error) => {
  console.error('Error connecting to MongoDB:', error);
})


app.set('view engine', 'ejs');

app.use(express.static('public'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(nocache());


app.use(mongoSanitize());

const userRoute = require("./routes/userRoute");
app.use("/", userRoute);

const adminRoute = require("./routes/adminRoute");
app.use("/admin", adminRoute);

const forgotPassword = require("./routes/forgotPassword");

app.use("/forgot", forgotPassword);

app.all("*", (req, res) => {
  res.render("error")
})

app.listen(process.env.PORT, function () {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
});



