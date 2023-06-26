const User = require('../models/userModel')
const products = require('../models/productModel')
const coupon = require("../models/couponModel");
const category = require("../models/category");
const toaster = require('toaster');



/*LOADING THE CART ON USER SIDE*/


const loadCart = async (req, res) => {
    try {
        userSession = req.session.user_id;
        if (userSession) {

            const userData = await User.findById({ _id: userSession })
            const completeUser = await userData.populate('cart.item.productId')
            const categoryData = await category.find()
            const productData = await products.find()
            res.render("cart", { user: req.session.user, cartProducts: completeUser.cart, category: categoryData,product: productData });
        } else {
            res.redirect("/login");
        }
    } catch (error) {
        // console.log(error.message);
        res.redirect("/error")
    }
}

/*ADDING PRODUCTS TO THE CART ON USER SIDE*/


const addToCart = async (req, res) => {
    try {
        const productId = req.query.id;
        console.log(productId);
        userSession = req.session.user_id;
        if (userSession) {
            const details = await products.findOne({ _id: productId })
            const product = await products.find({ category: details.category });
            const userData = await User.findById({ _id: userSession })
            const productData = await products.findById({ _id: productId })
            userData.addToCart(productData)
            res.redirect('/loadCart');
            // res.render('details',{ user: req.session.user,message:"product added to cart !",detail: details, related: product })

        } else {
            res.redirect('/login')
        }
    } catch (error) {
        res.redirect("/error")
    }
}


/*UPDATE THE CART ON USER SIDE*/


const updateCart = async (req, res) => {
    try {
        console.log("test update cart");
        let { quantity, _id } = req.body
        const userData = await User.findById({ _id: req.session.user_id })
        const productData = await products.findById({ _id: _id })
        const price = productData.price;
        let test = await userData.updateCart(_id, quantity)
        console.log(test);
        res.json({ test, price })

    } catch (error) {
        console.log(error)
    }
}


/*DELETING THE PRODUCTS FROM THE CART ON USER SIDE*/


const deleteCart = async (req, res,) => {

    try {
        const productId = req.query.id
        userSession = req.session
        const userData = await User.findById({ _id: userSession.user_id })
        userData.removefromCart(productId)
        res.redirect('/loadCart')
    } catch (error) {
        res.redirect("/error")
    }
}
module.exports = {
    loadCart,
    addToCart,
    deleteCart,
    updateCart,
}