const User = require("../models/userModel");
const coupon = require("../models/couponModel");


/*LOADING THE COUPON ON USER SIDE*/


const loadCoupon = async (req, res) => {
  try {
    const coupons = await coupon.find();
    res.render("coupon", { coupon: coupons });
  } catch (error) {
    console.log(error.message);
  }
}

/*APPLYING THE COUPON ON USER SIDE*/


const addCoupon = async (req, res) => {
  try {
    res.render("addCoupon", { message: "" });
  } catch (error) {
    console.log(error.message);
  }
}

/*ADDING THE COUPON ON ADMIN SIDE*/


const addNewCoupon = async (req, res) => {
  try {
    const verifyCoup = await coupon.findOne({ name: req.body.coupName });
    if (verifyCoup) {
      res.render("addCoupon", { message: "already exists" })
    } else {
      const addCoupon = new coupon({ name: req.body.coupName, discount: req.body.coupDis, minimumvalue: req.body.coupMin, maximumvalue: req.body.coupMax, expiryDate: req.body.coupDate });
      addCoupon.save();
      res.redirect("/admin/loadCoupon")
    }
  } catch (error) {
    console.log(error.message);
  }
}

/*DELETING THE COUPON ON ADMIN SIDE*/


const deleteCoupon = async (req, res) => {
  try {
    const id = req.query.id;
    const coupData = await coupon.deleteOne({ _id: id })
    res.redirect("/admin/loadCoupon")
    console.log(coupData);
  } catch (error) {
    console.log(error.message);
  }
}

const availCoupon = async (req, res) => {
  try {
    const id = req.query.id;
    const allCoupon = await coupon.findOne({ _id: id });
    if (allCoupon.isAvailable) {
      await coupon.updateOne({ _id: id }, { $set: { isAvailable: 0 } })
    } else {
      await coupon.updateOne({ _id: id }, { $set: { isAvailable: 1 } })

    }
    res.redirect("/admin/loadCoupon");
  } catch (error) {
    console.log(error.message);
  }
};


/*EDITING THE COUPON ON ADMIN SIDE*/


const editCoupon = async (req, res) => {
  try {
    const id = req.query.id;
    console.log(id);
    const couponDetail = await coupon.findOne({ _id: id });
    res.render("editCoupon", { coupon: couponDetail, message: "" })
  } catch (error) {
    console.log(error.message);
    res.redirect("error")
  }
};  

const editUpdateCoupon = async (req, res) => {
  try {
    const coupName = req.body.coupName;
    const coupDisc = req.body.coupDis;
    const coupMin = req.body.coupMin;
    const coupMax = req.body.coupMax;
    id = req.body.id;
    const search = await coupon.findOne({ name: req.body.coupName });
    // if (search) {
      if (search && search._id.toString() !== id) {
      console.log("Same coupon name already exists");
      const coupaData = await coupon.findOne({ _id: id })
      res.render("editCoupon", { message: "Coupon name already exists", coupon: coupaData });
    } 
    else {
      const coupData = await coupon.updateOne({ _id: id },{ $set: { name: coupName, discount: coupDisc, minimumvalue: coupMin, maximumvalue: coupMax } });
      console.log(coupData);
      // if (coupData) {
        res.redirect("/admin/loadCoupon");
      // }
    }
  } catch (error) {
    console.log(error.message);
  }
}

module.exports = {
  loadCoupon,
  addCoupon,
  addNewCoupon,
  availCoupon,
  editCoupon,
  editUpdateCoupon,
  deleteCoupon,
}