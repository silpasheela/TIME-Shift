const fast2sms = require("fast-two-sms");
require("dotenv").config();



const sendMessage = function (mobile, res, next) {
  let randomOTP = 2759; 
  var options = {
    authorization :process.env.SMSAUTH,
    message: `your OTP verification code is ${randomOTP}`,
    numbers: [mobile],
  };



  //send this message
  fast2sms
    .sendMessage(options)
    .then((response) => {
      console.log("otp sent successfully");
    })
    .catch((error) => {
      console.log(error);
    });
  return randomOTP;
};


module.exports = {
  sendMessage,
};
