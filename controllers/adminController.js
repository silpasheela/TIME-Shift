const User = require("../models/userModel");
const category = require("../models/category");
const path = require('path');
const Product = require("../models/productModel");
const bcrypt = require("bcrypt");
const orders = require("../models/orderModel");
const address = require("../models/addressModel");
const offer = require("../models/offerModel");

const { findById } = require("../models/productModel");
const { log } = require("console");

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

/*LOAD LOGIN PAGE FOR ADMIN*/

const loadLogin = async (req, res) => {
  try {
    res.render("adminLogin", { user: req.session.user });
  } catch (error) {
    console.log(error.message);
  }
};

/*VERIFY LOGIN FOR ADMIN*/

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        if (userData.is_admin === 0) {
          res.render("adminLogin", { message: "email and password incorrect" });
        } else {
          req.session.admin_id = userData._id;
          res.redirect("/admin/home");
        }
      } else {
        res.render("adminLogin", { message: " password is incorrect", user: req.session.admin_id });
      }
    } else {
      res.render("adminLogin", { message: "email is incorrect", user: req.session.admin_id });
    }
  } catch (error) {
    console.log(error.message);
  }
};

/*LOAD DASHBOARD PAGE FOR ADMIN*/


const loadDashboard = async (req, res) => {
  try {
    const products = await Product.find()
    const order = await orders.find();
    const userData = await User.findById({ _id: req.session.admin_id })
    const totalPrice = order.reduce((total, order) => {
      return total + order.products.totalPrice;
    }, 0);
    res.render("home", { admin: userData, orderQty: order.length , productQty: products.length , totalPrice: totalPrice});
  } catch (error) {
    console.log(error.message);
  }
};

const loadChart = async (req, res) => {
  try {
      
      const  categoryChart = await Product.aggregate([
        {
          '$group': {
            '_id': '$category', 
            'total': {
              '$sum': 1
            }
          }
        }
      ]);

      const  productChart = await Product.aggregate([
        {
              '$group': {
                '_id': '$name', 
                'stock': {
                  '$sum': '$stock'
                }
              }
            }
      ]);

      const orderChart = await orders.aggregate([
        {
              '$lookup': {
                'from': 'products', 
                'localField': 'products.item.productId', 
                'foreignField': '_id', 
                'as': 'products'
              }
            }, {
              '$unwind': {
                'path': '$products'
              }
            }, {
              '$group': {
                '_id': '$products.name', 
                'revenue': {
                  '$sum': '$payment.amount'
                }
              }
            }
      ])
      console.log(orderChart);

      res.json({
        categoryChart ,
        productChart ,
        orderChart
      });
    
  } catch (error) {
    console.log(error.message);
  }
};


// category wise product number


//         [
  // {
  //   '$group': {
  //     '_id': '$category', 
  //     'total': {
  //       '$sum': 1
  //     }
  //   }
  // }
// ]


//  product wise number
 
// [
//   {
//     '$group': {
//       '_id': '$name', 
//       'stock': {
//         '$sum': '$stock'
//       }
//     }
//   }
// ]

//  product wise sales

// [
//   {
//     '$lookup': {
//       'from': 'products', 
//       'localField': 'products.item.productId', 
//       'foreignField': '_id', 
//       'as': 'products'
//     }
//   }, {
//     '$unwind': {
//       'path': '$products'
//     }
//   }, {
//     '$group': {
//       '_id': '$products.name', 
//       'revenue': {
//         '$sum': '$payment.amount'
//       }
//     }
//   }
// ]












/*LOAD USER DATA FOR ADMIN*/


const loadUser = async (req, res) => {
  try {
    var search = "";
    if (req.query.search) {
      search = req.query.search;
    }
    const userData = await User.find({ name: { $regex: search + ".*" }, is_admin: 0 });
    res.render("user", { users: userData });
  } catch (error) {
    console.log(error.message);
  }
};

/*LOAD CATEGORY DATA FOR ADMIN*/


const loadCategory = async (req, res) => {
  try {
    var search = "";
    if (req.query.search) {
      search = req.query.search;
    }
    const userData = await category.find({ name: { $regex: search + ".*" } })
    res.render("categories", { category: userData });
  } catch (error) {
    console.log(error.message);
  }
};

/*LOAD ORDER DATA FOR ADMIN*/


const loadOrder = async (req, res) => {
  try {
    const currentPage = parseInt(req.query.page) || 1;
    const ordersPerPage = 12; 

    const totalOrders = await orders.countDocuments();
    const totalPages = Math.ceil(totalOrders / ordersPerPage);

    const skip = (currentPage - 1) * ordersPerPage;

    const allOrders = await orders.find({})
      .populate("userId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(ordersPerPage);

    const userData = await User.findById(req.session.admin_id);

    res.render("orders", {
      admin: userData,
      orders: allOrders,
      currentPage,
      totalPages,
      ordersPerPage,
    });
  } catch (error) {
    console.log(error.message);
  }
};

/*SORTING FOR ADMIN*/


const sortOrder = async (req, res) => {
  let { start, end } = req.body
  console.log(start, end);
  const allOrders = await orders.find({
    createdAt: { $gte: start, $lte: end }
  }).populate("userId");
  res.send({ orderDetail: allOrders });
}


/*LOAD ADD CATEGORIES PAGE FOR ADMIN*/


const addCategories = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.admin_id });
    res.render("addCategories", { admin: userData, message: "" });
  } catch (error) {
    console.log(error.message);
  }
};


const addCategoriesredir = async (req, res) => {
  const findCat = await category.findOne({ name: req.body.addCategory });
  if (findCat) {
    res.render("addCategories", { message: "already exists!" });
  } else {
    try {
      const addCategory = new category({ name: req.body.addCategory })
      addCategory.save()
      console.log(addCategory);
      res.redirect("/admin/category");
    } catch (error) {
      console.log(error.message);
    }
  }

};

/*DELETING CATEGORIES BY ADMIN*/


const deleteCategory = async (req, res) => {
  try {
    const id = req.query.id;
    console.log(id);
    const categoryData = await category.findOne({ _id: id });
    if (categoryData.is_available) {
      await category.findByIdAndUpdate({ _id: id }, { $set: { is_available: 0 } }); console.log("hidden");
    }
    else { await category.findByIdAndUpdate({ _id: id }, { $set: { is_available: 1 } }); console.log("unhidden"); }
    res.redirect("/admin/category");
  } catch (error) {
    console.log(error);
  }
};

/*EDITING CATEGORIES BY ADMIN*/


const editCategory = async (req, res) => {
  try {
    e_id = req.query.id;
    const catagoryDetail = await category.findOne({ _id: e_id })
    console.log(catagoryDetail);
    res.render("editCategories", { category: catagoryDetail, message: "" });
  } catch (error) {
    console.log(error.message);
  }
};

const editUpdateCategory = async (req, res) => {
  const find = await category.findOne({ name: req.body.addCategory })
  if (find) {
    const cat = await category.find();
    res.render("editCategories", { message: "already Exists!!", category: cat })
  } else {

    try {
      const categotyData = await category.updateOne({ _id: e_id }, { $set: { name: req.body.addCategory } });
      res.redirect("/admin/category");
    } catch (error) {
      console.log(error.message);
    }
  }
};



// const loadCategoryOffer = async (req, res) => {
  // try {
  //   const offerData = await offer.find({});
  //   const userData = await User.findById({ _id: req.session.admin_id });
  //   res.render("offers", { admin: userData, offer: offerData, message: "" });
  // } catch (error) {
  //   res.redirect("/error")
  // }

//   try {
//     var search = "";
//     if (req.query.search) {
//       search = req.query.search;
//     }
//     const offerData = await offer.find({ name: { $regex: search + ".*" } })
//     res.render("offers", { offer: offerData });
//   } catch (error) {
//     res.redirect("/error")
//   }


// };

// const addCategoryOffer = async (req, res) => {
//   try {
//       // const verifyCoup = await coupon.findOne({ name: req.body.coupName });
//       const addCatOfr = new category({ is_available: req.body.isAvailable === 'on' ? 1 : 0, name: req.body.categoryId, discountPercentage: req.body.discountPercentage, startDate: req.body.startDate, endDate: req.body.endDate });
//       const addCatOfrData = addCatOfr.save();
//       if(addCatOfrData){
//         res.redirect("/admin/category");
//       }
//   } catch (error) {
//     console.log(error.message);
//   }
// }


/*ADDING CATEGORY OFFER BY ADMIN*/


const loadaddCategoryOffer = async (req, res) => {
  try {
    const categoryOfrData = await category.find({});
    const userData = await User.findById({ _id: req.session.admin_id });
    res.render("addCategoryOffer", { admin: userData, category: categoryOfrData, message: "" });
  } catch (error) {
    res.redirect("/error")
  }
};



// const addCategoryOffer = async (req, res) => {
//   try {
//     const addCatOfr = new category({
//       is_available: req.body.isAvailable === 'on' ? 1 : 0,
//       name: req.body.categoryId,
//       discountPercentage: req.body.discountPercentage,
//       startDate: req.body.startDate,
//       endDate: req.body.endDate
//     });
//     const addCatOfrData = await addCatOfr.save();
//     if (addCatOfrData) {
//       res.redirect("/admin/category");
//     }
//   } catch (error) {
//     console.log(error.message);
//   }
// };




const addCategoryOffer = async (req, res) => {
  try {
    const categoryName = req.body.categoryId; // New name value from the request body
    const existingCategory = await category.findOne({ name: categoryName });

    if (existingCategory) {
      // If a category with the same name already exists, update its properties
      existingCategory.is_available = req.body.isAvailable === 'on' ? 1 : 0;
      existingCategory.discountPercentage = req.body.discountPercentage;
      existingCategory.startDate = req.body.startDate;
      existingCategory.endDate = req.body.endDate;
      
      const updatedCategory = await existingCategory.save();
      
      if (updatedCategory) {
        res.redirect("/admin/category");
      }
    } else {
      // If no category with the same name exists, create a new category
      const newCategory = new category({
        is_available: req.body.isAvailable === 'on' ? 1 : 0,
        name: categoryName,
        discountPercentage: req.body.discountPercentage,
        startDate: req.body.startDate,
        endDate: req.body.endDate
      });

      const newCategoryData = await newCategory.save();
      
      if (newCategoryData) {
        res.redirect("/admin/category");
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};





/*LOGOUT BY ADMIN*/



const logout = async (req, res) => {
  try {
    req.session.admin_id = null;
    req.session.admin = null
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};


/*DASHBOARD OF ADMIN*/

const adminDashboard = async (req, res) => {
  try {
    var search = "";
    if (req.query.search) {
      search = req.query.search;

    }
    const userData = await User.find({
      is_admin: 0,
      $or: [
        { name: { $regex: ".*" + search + ".*" } },
        { email: { $regex: ".*" + search + ".*" } },
        { mobile: { $regex: ".*" + search + ".*" } },
      ],
    });
    res.render("dashboard", { users: userData });
  } catch (error) {
    console.log(error.message);
  }
};

/*BLOCKING USERS BY ADMIN*/


const BlockUser = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findOne({ _id: id });
    if (userData.is_verified) {
      await User.findByIdAndUpdate({ _id: id }, { $set: { is_verified: 0 } }); console.log("blocked");
    }
    else { await User.findByIdAndUpdate({ _id: id }, { $set: { is_verified: 1 } }); console.log("unblocked"); }
    res.redirect("/admin/user");
  } catch (error) {
    console.log(error);
  }
}

/*ADDING USERS BY ADMIN*/


const addUser = async (req, res) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const mno = req.body.mno;
    const password = req.body.password;
    const spassword = await securePassword(password);

    const user = new User({
      name: name,
      email: email,
      mobile: mno,
      password: spassword,
      is_admin: 0,
    });

    const userData = await user.save();
    if (userData) {
      res.redirect("/admin/dashboard");
    } else {
      res.render("new-user", { message: "Something Wrong" });
    }
  } catch (error) {
    console.log(error.message);
  }
};


/*VIEW ORDER BY ADMIN*/



const viewOrderDetails = async (req, res) => {
  try {
    const id = req.query.id;
    const order = await orders.findById({ _id: id });
    const details = await order.populate('products.item.productId')
    res.render("viewOrderDetails", { orders: details });
  } catch (error) {
    console.log(error.message);
  }
}


/*UPDATE ORDER STATUS BY ADMIN*/


const updateStatus = async (req, res) => {
  try {
    const status = req.body.status;
    const orderId = req.body.orderId;
    const orderDetails = await orders.findByIdAndUpdate({ _id: orderId }, { $set: { status: status } })
    if ((status == "cancelled") && orderDetails.payment.method !== "COD") {
      userDetails = await User.findOne({ _id: orderDetails.userId });
      const walletData = userDetails.wallet;
      userData = await User.updateOne({ _id: orderDetails.userId }, { $set: { wallet: walletData + orderDetails.payment.amount } })
    }
    if (status == "cancelled") {
      const productData = await Product.find()
      const orderData = await orders.findById({ _id: orderId });
      for (let key of orderData.products.item) {
        for (let prod of productData) {
          console.log(key.productId);
          if (new String(prod._id).trim() == new String(key.productId).trim()) {
            prod.stock = prod.stock + key.qty
            await prod.save()
          }
        }
      }
    }
    res.redirect("/admin/order")
  } catch (error) {

  }
}


module.exports = {
  loadLogin,
  verifyLogin,
  loadDashboard,
  loadCategory,
  loadUser,
  loadOrder,
  logout,
  adminDashboard,
  addCategoriesredir,
  editCategory,
  addUser,
  addCategories,
  BlockUser,
  editUpdateCategory,
  deleteCategory,
  viewOrderDetails,
  updateStatus,
  sortOrder,
  loadaddCategoryOffer,
  addCategoryOffer,
  loadChart
};




