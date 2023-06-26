const User = require('../models/userModel')
const bcrypt = require('bcrypt');
const sms = require('../middleware/smsValidation');
const products = require("../models/productModel")
const Category = require("../models/category");
const offer = require("../models/offerModel")
const address = require("../models/addressModel");
const coupon = require("../models/couponModel");
const order = require("../models/orderModel");
const banner = require("../models/bannerModel");
const RazorPay = require("razorpay");
const flash = require('connect-flash');
const toaster = require('toaster');

require("dotenv").config();


/*LOADING HOME PAGE FOR USER*/


const loadHome = async (req, res) => {
    try {
        const product = await products.find({ isAvailable: 1 });
        const banners = await banner.findOne({ is_active: 1 });

        res.render('home', { user: req.session.user, product: product, banner: banners })
    }
    catch (error) {
        res.redirect("/error")
    }
}
const loginLoad = async (req, res) => {
    try {

        res.render('login', { user: req.session.user })

    }
    catch (error) {
        res.redirect("/error")
    }
}
const loadRegister = async (req, res) => {
    try {

        res.render('register', { user: req.session.use })

    }
    catch (error) {
        res.redirect("/error")
    }
}


/*OTP SENDING FOR USER*/


let user;
const loadOtp = async (req, res) => {
    const verify = await User.findOne({ $or: [{ mobile: req.body.mno }, { email: req.body.email }] });
    if (verify) {
        console.log(verify);
        res.render('register', { user: req.session.user, message: "user already exists!" })
    } else {
        const spassword = await bcrypt.hash(req.body.password, 10);
        user = new User({
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mno,
            password: spassword,
            is_admin: 0,
        });
        // newOtp = 1234;

        newOtp = sms.sendMessage(req.body.mno, res);
        console.log(newOtp);
        res.render("otpPage", { otp: newOtp, mobno: req.body.mno })
    }
}

const againOtp = async (req, res) => {
    try {
        // newOtp = 1234;
        newOtp = sms.sendMessage(req.body.phonenumber, res);
        console.log(newOtp);
        res.send({ newOtp });
    } catch (error) {
        res.redirect("/error")
    }
}


/*OTP VERIFICATION FOR USER*/


const verifyOtp = async (req, res) => {

    try {

        if (req.body.sendotp == req.body.otp) {
            const userData = await user.save();
            if (userData) {
                res.render('register', { user: req.session.user, message: "registered successfully" })
            }
            else {
                res.render('register', { user: req.session.user, message: "registration failed!!" })
            }
        } else {

            console.log("otp not match");
            res.render('register', { user: req.session.user, message: "incorrect otp" })
        }

    } catch (error) {
        res.redirect("/error")
    }
}


/*LOGIN CREDENTIALS VERIFICATION FOR USER*/



const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email, is_admin: 0 });
        console.log("user:" + userData)
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password)

            if (passwordMatch) {
                if (userData.is_verified) {
                    // newOtp = "1234";
                    newOtp =  sms.sendMessage(userData.mobile,res)
                    console.log(newOtp);
                    res.render('twoFactor', { otp: newOtp, userData: userData });
                } else {
                    res.render('login', { message: 'You are blocked by the administrator', user: req.session.user })

                }
            }

            else {
                res.render('login', { message: 'email and password are incorrect', user: req.session.user })
            }
        }
        else {
            res.render('login', { message: 'email and password are incorrect', user: req.session.user })
        }



    }
    catch (error) {
        res.redirect("/error")
    }
}

const twoFactor = async (req, res) => {
    try {
        if (req.query.id == req.body.otp) {

            const product = await products.find();
            const banners = await banner.findOne({ is_active: 1 });
            const userid = req.body.userDataid;
            const username = req.body.userDataname;
            req.session.user_id = userid;
            req.session.user = username;
            req.session.user1 = true
            res.render('home', { user: req.session.user, product: product, banner: banners });
        }
        else {
            res.render('login', { message: "incorrect otp!", user: req.session.user })
        }
    } catch (error) {
        res.redirect("/error")
    }
};


/*LOGOUT FOR USER*/


const userLogout = async (req, res) => {
    try {
        req.session.user1 = null;
        req.session.user = 0
        req.session.user_id = 0;
        res.redirect('/')
    }
    catch (error) {
        res.redirect("/error")
    }

}


/*LOAD PRODUCT DETAILS FOR USER*/


const loadDetails = async (req, res) => {

    try {
        const id = req.query.id;
        const details = await products.findOne({ _id: id })
        const product = await products.find({ category: details.category });
        const categoryData = await Category.find()
        res.render("details", { user: req.session.user, detail: details, related: product, category: categoryData, message: "" });
    } catch (error) {
        res.redirect("/error")
    }
};



/*SHOPPING PAGE FOR USER*/



const loadShop = async (req, res) => {
    try {
        const categoryData = await Category.find()
        let { search, sort, category, limit, page, ajax } = req.query
        if (!search) {
            search = ''
        }
        skip = 0
        if (!limit) {
            limit = 15
        }
        if (!page) {
            page = 0
        }
        skip = page * limit
        console.log(category);
        let arr = []
        if (category) {
            for (i = 0; i < category.length; i++) {
                arr = [...arr, categoryData[category[i]].name]
            }
        } else {
            category = []
            arr = categoryData.map((x) => x.name)
        }
        console.log('sort ' + req.query.sort);
        console.log('category ' + arr);
        if (sort == 0) {
            productData = await products.find({ $and: [{ category: arr }, { $or: [{ name: { $regex: '' + search + ".*" } }, { category: { $regex: ".*" + search + ".*" } }] }] }).sort({ $natural: -1 })
            pageCount = Math.floor(productData.length / limit)
            if (productData.length % limit > 0) {
                pageCount += 1
            }
            console.log(productData.length + ' results found ' + pageCount);
            productData = await products.find({ $and: [{ category: arr }, { $or: [{ name: { $regex: '' + search + ".*" } }, { category: { $regex: ".*" + search + ".*" } }] }] }).sort({ $natural: -1 }).skip(skip).limit(limit)
        } else {
            productData = await products.find({ $and: [{ category: arr }, { $or: [{ name: { $regex: '' + search + ".*" } }, { category: { $regex: ".*" + search + ".*" } }] }] }).sort({ price: sort })
            pageCount = Math.floor(productData.length / limit)
            if (productData.length % limit > 0) {
                pageCount += 1
            }
            console.log(productData.length + ' results found ' + pageCount);
            productData = await products.find({ $and: [{ category: arr }, { $or: [{ name: { $regex: '' + search + ".*" } }, { category: { $regex: ".*" + search + ".*" } }] }] }).sort({ price: sort }).skip(skip).limit(limit)
        }
        console.log(productData.length + ' results found');
        if (req.session.user) { session = req.session.user } else session = false
        if (pageCount == 0) { pageCount = 1 }
        if (ajax) {
            res.json({ products: productData, pageCount, page })
        } else {
            res.render('shop', { user: session, product: productData, category: categoryData, val: search, selected: category, order: sort, limit: limit, pageCount, page })
        }
    } catch (error) {
        res.redirect("/error")
    }
}

function updateStatusFilter(status) {
    const start = document.getElementById("startdate").value;
    const end = document.getElementById("enddate").value;
    const data = { start, end, status };
    
    axios.post('/admin/updateOrder', data)
      .then(res => {
        if (res.data) {
          const orders = res.data.orderDetail;
          let ordersTableHTML = '';
  
          if (orders.length > 0) {
            orders.forEach((order, i) => {
              ordersTableHTML += `<tr>...</tr>`;
            });
          } else {
            ordersTableHTML = '<tr><td colspan="5">Products Not Found</td></tr>';
          }
          document.getElementById("tbody").innerHTML = ordersTableHTML;
        }
      })
      .catch(error => {
        console.log(error);
      });
  }
  
/*CHECKOUT PAGE FOR USER*/


const loadCheckout = async (req, res) => {
    try {
        const couponData = await coupon.find();
        const userData = req.session.user_id;
        const addresss = await address.find({ userId: userData });
        const userDetails = await User.findById({ _id: userSession })
        const completeUser = await userDetails.populate('cart.item.productId')

        if (req.session.orderPlaced) {
            // Clear the orderPlaced flag from the session
            req.session.orderPlaced = false;
      
            // Redirect to a different page (e.g., order confirmation page)
            return res.redirect('/orderSuccess');
          }

        res.render("checkout", { user: req.session.user, address: addresss, checkoutdetails: completeUser.cart, coupon: couponData, discount: req.query.coupon, wallet: userDetails.wallet });
    } catch (error) {
        res.redirect("/error")
    }
}


/*COUPONS FOR USER*/


    const applyCoupon = async (req, res) => {
        try {
            const totalPrice = req.body.totalValue;
            console.log("total" + totalPrice);
            console.log(req.body.coupon);
            userdata = await User.findById({ _id: req.session.user_id });
            offerdata = await coupon.findOne({ name: req.body.coupon });
            if (offerdata) {
                console.log(offerdata.expiryDate, Date.now());
                const date1 = new Date(offerdata.expiryDate);
                const date2 = new Date(Date.now());
                if (date1.getTime() > date2.getTime()) {
                    if (offerdata.usedBy.includes(req.session.user_id)) {
                        messag = 'Coupon already used !'
                        console.log(messag);
                        res.send({ messag, state: 0 })
                    } else {
                        console.log(userdata.cart.totalPrice, offerdata.maximumvalue, offerdata.minimumvalue);
                        if (userdata.cart.totalPrice >= offerdata.minimumvalue) {
                            console.log('offerdata.name');
                            await coupon.updateOne({ name: offerdata.name }, { $push: { usedBy: userdata._id } });
                            disc = (offerdata.discount * totalPrice) / 100;
                            if (disc > offerdata.maximumvalue) { disc = offerdata.maximumvalue }
                            console.log(disc);
                            messag = 'Coupon applied successfully !'
                            res.send({ offerdata, disc, messag, state: 1 })
                        } else {
                            messag = 'Cannot apply coupon !'
                            res.send({ messag, state: 0 })
                        }
                    }
                } else {
                    messag = 'Coupon Expired !'
                    res.send({ messag, state: 0 })
                }
            } else {
                messag = 'Coupon not found !'
                res.send({ messag, state: 0 })
            }
            // res.send({ messag, state: 0 })
        }

        catch (error) {
            res.redirect("/error")
        }
    }


    /*USER PROFILE FOR USER*/


const loadUserProfile = async (req, res) => {
    try {
        const usid = req.session.user_id;
        const user = await User.findOne({ _id: usid });
        const adid = await address.find({ userId: usid })
        const addressData = await address.find({ userId: usid })
        const orderData = await order.find({ userId: usid }).sort({ createdAt: -1 }).populate("products.item.productId");
        res.render("profile", { user: req.session.user, userAddress: adid, userData: user, address: addressData, order: orderData })
    } catch (error) {
        res.redirect("/error")
    }
}
  
/*ADDING NEW ADDRESS FOR USER*/


const addNewAddress = async (req, res) => {
    try {
        userSession = req.session
        const nAddress = await new address({
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            country: req.body.country,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            zip: req.body.zip,
            mobile: req.body.mno,
            userId: userSession.user_id
        })
        const newAddress = await nAddress.save();
        if (newAddress) {

            req.session.toaster = {
                type: 'success',
                message: 'New address added successfully!'
              };
            res.redirect("/userProfile");
        }
    } catch (error) {

        res.redirect("/error")

    }
}


/*DELETING EXISTING ADDRESS FOR USER*/


const deleteAddress = async (req, res) => {
    try {
        const id = req.query.id;
        const Address = await address.deleteOne({ _id: id });
        if (Address) {
            req.session.toaster = {
                type: 'success',
                message: 'Address deleted successfully!'
            };
            res.redirect("/userProfile");
        }
    } catch (error) {
        res.redirect("/error")
    }
}


/*EDITING EXISTING ADDRESS FOR USER*/


const editAddress = async (req, res) => {
    try {
        const id = req.query.id;
        const addres = await address.findOne({ _id: id })
        res.render("editaddress", { user: req.session.user, address: addres });
    } catch (error) {
        res.redirect("/error")
    }
}
const editUpdateAddress = async (req, res) => {
    try {
        const id = req.body.id;
        console.log(req.body);
        console.log(id);
        const upadteAddres = await address.updateOne({ _id: id }, {
            $set: {
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                country: req.body.country,
                address: req.body.address,
                city: req.body.city,
                zip: req.body.zip,
                mobile: req.body.mno
            }
        })
        console.log(upadteAddres);
        req.session.toaster = {
            type: 'success',
            message: 'Address updated successfully!'
        };
        res.redirect("/userProfile")
    } catch (error) {
        res.redirect("/error")
    }
}


/*EDITING USER DETAILS FOR USER*/


const editUser = async (req, res) => {
    try {
        const currentUser = req.session.user_id;
        const findUser = await User.findOne({ _id: currentUser });
        res.render("editUser", { user: findUser });

    } catch (error) {
        res.redirect("/error")
    }
}

const editUserUpdate = async (req, res) => {
    try {
        await User.findByIdAndUpdate({ _id: req.body.id }, {
            $set: {
                name: req.body.name,
                email: req.body.email,
                mobile: req.body.number

            }
        })
        req.session.toaster = {
            type: 'success',
            message: 'User details updated successfully!'
        };
        res.redirect("/userProfile")
    } catch (error) {
        res.redirect("/error")
    }
}

/*PLACING ORDER BY USER*/


let Norder;
const placeOrder = async (req, res) => {
    try {
        if (req.body.address == 0) {
            nAddress = new address({
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                country: req.body.country,
                address: req.body.details,
                city: req.body.city,
                state: req.body.state,
                zip: req.body.zip,
                mobile: req.body.mno,
            })
        }
        else {
            console.log(req.body.address);
            nAddress = await address.findOne({ _id: req.body.address });
        }
        const userData = await User.findOne({ _id: req.session.user_id })
        Norder = new order({
            userId: req.session.user_id,
            address: nAddress,
            payment: {
                method: req.body.payment,
                amount: req.body.cost,

            },
            offer: req.body.coupon,
            products: userData.cart,
        })
        if (req.body.payment == "COD") {
            await Norder.save();
            const productData = await products.find()
            for (let key of userData.cart.item) {
                for (let prod of productData) {
                   
                    if (new String(prod._id).trim() == new String(key.productId._id).trim()) {
                        if(prod.stock === 0) {
                           res.render("outOfStock");
                        } else {
                            prod.stock = prod.stock - key.qty
                            await prod.save()
                        }
                      
                    }
                }
            }
            await User.updateOne({ _id: req.session.user_id }, { $unset: { cart: 1 } })

            req.session.orderPlaced = true;


            res.render("orderSuccess", { user: req.session.user })

        } else if (req.body.payment == "wallet") {
            let walletAmount = parseInt(req.body.walamount);
            let totalAmount = parseInt(req.body.cost)
            req.session.totalWallet = walletAmount;
            console.log(req.session.totalWallet);
            if (walletAmount >= totalAmount) {
                await Norder.save();
                let userWallet = await User.findOne({ _id: req.session.user_id })
                let minusAmt = userWallet.wallet - req.body.cost;
                let minuswalAmt = await User.updateOne({ _id: req.session.user_id }, { $set: { wallet: minusAmt } })
                console.log(minuswalAmt);
                await User.updateOne({ _id: req.session.user_id }, { $unset: { cart: 1 } })

                const productData = await products.find()
                for (let key of userData.cart.item) {
                    for (let prod of productData) {

                        if (new String(prod._id).trim() == new String(key.productId._id).trim()) {
                            if(prod.stock === 0) {
                                res.render("outOfStock");
                            } 
                            else {
                                prod.stock = prod.stock - key.qty
                                await prod.save()
                            }
                        }
                    }
                }

                res.render("orderSuccess", { user: req.session.user })
            } else {
                var instance = new RazorPay({
                    key_id: process.env.key_id,
                    key_secret: process.env.key_secret
                })
                let razorpayOrder = await instance.orders.create({
                    amount: req.body.cost * 100,
                    currency: 'INR',
                    receipt: Norder._id.toString()
                })

                console.log('order Order created', razorpayOrder);
                const productData = await products.find()
                for (let key of userData.cart.item) {
                    for (let prod of productData) {

                        if (new String(prod._id).trim() == new String(key.productId._id).trim()) {
                            if(prod.stock === 0) {
                                res.render("outOfStock");
                            } else {
                                prod.stock = prod.stock - key.qty
                                await prod.save()
                            }
                            
                        }
                    }
                }
            }
        }
        else {
            var instance = new RazorPay({
                key_id: process.env.key_id,
                key_secret: process.env.key_secret
            })
            let razorpayOrder = await instance.orders.create({
                amount: req.body.cost * 100,
                currency: 'INR',
                receipt: Norder._id.toString()
            })
            //   console.log('order Order created', razorpayOrder);
            paymentDetails = razorpayOrder;
            //   console.log(Norder+"asfasfasdfdsf");

            const productData = await products.find()
            for (let key of userData.cart.item) {
                for (let prod of productData) {
                    if (new String(prod._id).trim() == new String(key.productId._id).trim()) {
                        prod.stock = prod.stock - key.qty
                        await prod.save()
                    }
                }
            }
            res.render("confirmPayment", {
                userId: req.session.user_id,
                order_id: razorpayOrder.id,
                total: req.body.amount,
                session: req.session,
                key_id: process.env.key_id,
                user: userData,
                orders: Norder,
                orderId: Norder._id.toString(),

            });
        }

    } catch (error) {
        res.redirect("/error")
    }
}

/*ORDER SUCCESS FOR USER*/


const loadOrderSuccess = async (req, res) => {
    try {
        Norder.payment.method = "Online"
        Norder.paymentDetails.reciept = paymentDetails.receipt;
        Norder.paymentDetails.status = paymentDetails.status;
        Norder.paymentDetails.createdAt = paymentDetails.created_at;
        console.log("confirmation");
        let minuswalAmt = await User.updateOne({ _id: req.session.user_id }, { $set: { wallet: 0 } });
        await Norder.save();
        await User.updateOne({ _id: req.session.user_id }, { $unset: { cart: 1 } })
        const data = req.session.totalWallet
        res.render("orderSuccess", { user: req.session.user })

    } catch (error) {
        res.redirect("/error")
    }
}
const editCheckoutAddress = async (req, res) => {
    try {
        const id = req.query.id;
        const addressData = await address.findById({ _id: id });
        res.render("editCheckoutAddress", { user: req.session.user, address: addressData });
    } catch (error) {
        res.redirect("/error")
    }
}

const editUpdateCheckoutAddress = async (req, res) => {
    try {
        const id = req.body.id;
        console.log(id);
        const upadteAddres = await address.findByIdAndUpdate({ _id: id }, {
            $set: {
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                country: req.body.country,
                address: req.body.address,
                city: req.body.city,
                zip: req.body.zip,
                mobile: req.body.mno
            }
        })
        console.log(upadteAddres)
        res.redirect("/loadCheckout")
    } catch (error) {
        res.redirect("/error")
    }
}

const deleteCheckoutAddress = async (req, res) => {
    try {
        const id = req.query.id;
        const deleteAddress = await address.findByIdAndDelete({ _id: id })
        res.redirect("/loadCheckout")
    } catch (error) {

        res.redirect("/error")

    }
}

/*VIEW PLACED ORDER DETAILS BY USER*/


const viewOrderDetails = async (req, res) => {
    try {
        const id = req.query.id;
        const users = req.session.user_id
        const orderDetails = await order.findById({ _id: id });
        const addres = await address.findById({ _id: users })
        const orderData = await order.find({ userId: users }).sort({ createdAt: -1 }).populate("products.item.productId");
        console.log(addres);
        await orderDetails.populate('products.item.productId')
        res.render("viewOrderDetails", { user: req.session.user, orders: orderDetails, order: orderData});
    } 
    
    catch (error) {
        res.redirect("/error")
    }
}
  


// const cancelOrder = async (req, res) => {
//     try {
//         const id = req.query.id;
//         const orderDetails = await order.findById({ _id: id });
//         let state = "cancelled"
//         await order.findByIdAndUpdate({ _id: id }, { $set: { status: "cancelled" } })
//         if (state == "cancelled") {
//             const productData = await products.find()
//             const orderData = await order.findById({ _id: id });

//             for (let key of orderData.products.item) {
//                 for (let prod of productData) {
//                     console.log(key.productId);
//                     if (new String(prod._id).trim() == new String(key.productId).trim()) {
//                         prod.stock = prod.stock + key.qty
//                         await prod.save()
//                     }
//                 }
//             }
//         }
//         if (state == "cancelled" && orderDetails.payment.method != "COD") {
//             userDetails = await User.findOne({ _id: orderDetails.userId });
//             const walletData = userDetails.wallet;
//             userData = await User.updateOne({ _id: orderDetails.userId }, { $set: { wallet: walletData + orderDetails.payment.amount } })
//         }
//         res.redirect("/userProfile")
//     } catch (error) {
//         res.redirect("/error")
//     }
// }

// const cancelOrder = async (req, res) => {
//     try {
//       const id = req.query.id;
//       const orderDetails = await order.findById({ _id: id });
//       const cancellationReason = req.body.cancellationReason;
//       orderDetails.status = "cancelled";
//       orderDetails.cancellationReason = cancellationReason;
//       await orderDetails.save();
  
//       const productData = await products.find();
//       for (let key of orderDetails.products.item) {
//         for (let prod of productData) {
//           if (prod._id.toString() === key.productId.toString()) {
//             prod.stock += key.qty;
//             await prod.save();
//           }
//         }
//       }
  
//       if (orderDetails.status === "cancelled" && orderDetails.payment.method !== "COD") {
//         const userDetails = await User.findOne({ _id: orderDetails.userId });
//         userDetails.wallet += orderDetails.payment.amount;
//         await userDetails.save();
//       }
  
//       res.redirect("/userProfile");
//     } catch (error) {
//       res.redirect("/error");
//     }
//   };
  

/*CANCEL PLACED ORDER BY USER*/


// const cancelOrder = async (req, res) => {
//     try {
//       const id = req.query.id;
//       const orderDetails = await order.findById(id);
//       const cancellationReason = req.body.cancellationReason;
//       orderDetails.status = "cancelled";
//       orderDetails.cancellationReason = cancellationReason;
//       await orderDetails.save();
  
//       if (orderDetails.status === "cancelled") {
//         const productData = await products.find();
//         for (let key of orderDetails.products.item) {
//           for (let prod of productData) {
//             if (prod._id.toString() === key.productId.toString()) {
//               prod.stock += key.qty;
//               await prod.save();
//             }
//           }
//         }
//       }
//       req.session.toaster = {
//         type: 'success',
//         message: 'Order cancelled successfully!'
//       };
//       res.redirect("/userProfile");
//     } catch (error) {

//       res.redirect("/error");
//     }
//   };



const cancelOrder = async (req, res) => {
    try {
      const id = req.query.id;
      const orderDetails = await order.findById(id);
      const cancellationReason = req.body.cancellationReason;
      orderDetails.status = "cancelled";
      orderDetails.cancellationReason = cancellationReason;
      await orderDetails.save();
  
      if (orderDetails.status === "cancelled") {
        const productData = await products.find();
        for (let key of orderDetails.products.item) {
          for (let prod of productData) {
            if (prod._id.toString() === key.productId.toString()) {
              prod.stock += key.qty;
              await prod.save();
            }
          }
        }
      }

      if (orderDetails.state == "cancelled" && orderDetails.payment.method != "COD") {
        userDetails = await User.findOne({ _id: orderDetails.userId });
        const walletData = userDetails.wallet;
        userData = await User.updateOne({ _id: orderDetails.userId }, { $set: { wallet: walletData + orderDetails.payment.amount } })

    }

      req.session.toaster = {
        type: 'success',
        message: 'Order cancelled successfully!'
      };
      res.redirect("/userProfile");
    } catch (error) {

      res.redirect("/error");
    }
  };
  
  

// const retunOrder = async (req, res) => {
//     try {
//         const id = req.query.id;
//         const users = req.session.user_id
//         const orderDetails = await order.findById({ _id: id });
//         const addres = await address.findById({ _id: users })
//         const cancel = await order.findByIdAndUpdate({ _id: id }, { $set: { status: "returned" } })
//         await orderDetails.populate('products.item.productId')
//         let state = "returned";
//         if (state == "returned") {
//             const productData = await products.find()
//             const orderData = await order.findById({ _id: id });
//             for (let key of orderData.products.item) {
//                 for (let prod of productData) {
//                     console.log(key.productId);
//                     if (new String(prod._id).trim() == new String(key.productId).trim()) {
//                         prod.stock = prod.stock + key.qty
//                         await prod.save()
//                     }
//                 }
//             }
//         }
//         if (state == "returned" && orderDetails.payment.method != "COD") {
//             userDetails = await User.findOne({ _id: orderDetails.userId });
//             const walletData = userDetails.wallet;
//             userData = await User.updateOne({ _id: orderDetails.userId }, { $set: { wallet: walletData + orderDetails.payment.amount } })
//         }
//         res.redirect("/userProfile")
//     } catch (error) {
//         res.redirect("/error")
//     }
// }


/*RETURN DELIVERED ORDER BY USER*/


// const retunOrder = async (req, res) => {
//     try {
//         const id = req.query.id;
//         const orderDetails = await order.findById(id);
//         const returnReason = req.body.returnReason;
//         orderDetails.status = "returned";
//         orderDetails.returnReason = returnReason;
//         await orderDetails.save();
    
//         if (orderDetails.status === "returned") {
//           const productData = await products.find();
//           for (let key of orderDetails.products.item) {
//             for (let prod of productData) {
//               if (prod._id.toString() === key.productId.toString()) {
//                 prod.stock += key.qty;
//                 await prod.save();
//               }
//             }
//           }
//           req.session.toaster = {
//             type: 'success',
//             message: 'Order returned successfully!'
//           };
//         }
//         res.redirect("/userProfile");
//       } catch (error) {
//         res.redirect("/error");
//       }
// }


const retunOrder = async (req, res) => {
    try {
        const id = req.query.id;
        const orderDetails = await order.findById(id);
        const returnReason = req.body.returnReason;
        orderDetails.status = "returned";
        orderDetails.returnReason = returnReason;
        await orderDetails.save();
    
        if (orderDetails.status === "returned") {
          const productData = await products.find();
          for (let key of orderDetails.products.item) {
            for (let prod of productData) {
              if (prod._id.toString() === key.productId.toString()) {
                prod.stock += key.qty;
                await prod.save();
              }
            }
            }
        }

        if (orderDetails.status == "returned" && orderDetails.payment.method != "COD") {
            userDetails = await User.findOne({ _id: orderDetails.userId });
            const walletData = userDetails.wallet;
            userData = await User.updateOne({ _id: orderDetails.userId }, { $set: { wallet: walletData + orderDetails.payment.amount } })
        }

        req.session.toaster = {
            type: 'success',
            message: 'Order returned successfully!'
          };
        res.redirect("/userProfile");
      } catch (error) {
        res.redirect("/error");
      }
}

const writeReview = async (req, res) => {
    try {
        const orderId = req.query.id;
        const userData = req.session.user
        console.log(userData);
        const orderData = await order.findById({ _id: orderId }).populate("products.item.productId");
        console.log("hi"+orderData);
        res.render("writeReview", { user: req.session.user, userDatas: userData, orderDatas: orderData });
    } catch (error) {
        res.redirect("/error")
    }
}

const submitReview = async (req, res) => {
    try {
        let { rev, id } = req.body;
        let users = req.session.user;
        console.log(rev, id, users);
        let product = await products.updateOne({ _id: id }, {
            $push: {
                review: {
                    username: users,
                    review: rev
                }
            }
        })
    } catch (error) {
        res.redirect("/error")
    }
}


/*LOADING COUPONS FOR USER*/


const loadcoupons = async(req,res)=>{
    try{
        const coupondata = await coupon.find()
        res.render("couponDisplay",coupondata)
    }catch(error){
        res.redirect("/error")
    }
}

module.exports = {
    loadRegister,
    loginLoad,
    verifyLogin,
    loadHome,
    userLogout,
    loadDetails,
    loadOtp,
    verifyOtp,
    loadShop,
    twoFactor,
    loadCheckout,
    loadUserProfile,
    addNewAddress,
    deleteAddress,
    editAddress,
    editUser,
    editUserUpdate,
    placeOrder,
    editUpdateAddress,
    editCheckoutAddress,
    editUpdateCheckoutAddress,
    deleteCheckoutAddress,
    viewOrderDetails,
    cancelOrder,
    applyCoupon,
    retunOrder,
    loadOrderSuccess,
    writeReview,
    submitReview,
    againOtp,
    loadcoupons
}
