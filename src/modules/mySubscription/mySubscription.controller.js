const Category = require("../../model/category.model");
const Plan = require("../../model/plan.model");
const { Uplan } = require("../../model/user_plan.model");
const  User  = require("../../model/user.model");

const currencyMap= {
    india: '₹', // Indian Rupee
    australia: 'A$', // Australian Dollar
    canada: 'C$', // Canadian Dollar
    usa: '$', // US Dollar
  };
const getMySubscriptionPlans = async (req, res) => {
    try {
      const user = req.user;
      const userDetail = await User.findById(user._id);
      console.log("userDetail", userDetail);
      const currency = currencyMap[userDetail?.country_name.toLowerCase()] || '₹';
      const country = userDetail?.country_name;
      console.log("currency", currency);
      const [allPlans, userPlan] = await Promise.all([
        Plan.find({ "plantype.country" : userDetail.country_name.toLowerCase() }),
        Uplan.findOne({ user: user._id }).sort({ createdAt: -1 }),
      ]);
      console.log("user plan", userPlan);
      // Create a new array for the response
      const responsePlans = [];
  
      // Loop through allPlans and create a new object with necessary changes
      for (const plan of allPlans) {
        const planObj = plan.toObject();  // Convert to plain object to modify
        
        planObj.plantype= planObj.plantype.filter((item) => item.country.toLowerCase() == userDetail.country_name.toLowerCase());
        // Create a new plan object with the selected key and populated categories
        const newPlan = {
          ...planObj,
          selected: planObj._id.toString() === userPlan.plan.toString(),
          categories: await Category.find({ '_id': { $in: planObj.categories } }).lean(),
        };
  
        // Add the newly created plan object to the response array
        responsePlans.push(newPlan);
      }
  
      // Send the new response object
      res.status(200).json({ userId: user._id,currency: currency ,country, plans:responsePlans});
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };



  
  
  

const updateMySubscription = async (req, res) => {
  try {
    const mySubscription = await MySubscription.findOneAndUpdate({ user: req.user._id }, req.body, { new: true });
    if (!mySubscription) {
      return res.status(404).json({ message: 'My Subscription not found' });
    }
    res.status(200).json(mySubscription);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = { getMySubscriptionPlans, updateMySubscription };