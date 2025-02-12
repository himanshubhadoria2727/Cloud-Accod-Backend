const Plan = require("../../model/plan.model");
const { Uplan } = require("../../model/user_plan.model");

const moment = require("moment");
const { stripe } = require("../../utility/stripe");
const User = require("../../model/user.model");
const { description } = require("../plan/plan.dto");


const createUserplan = async (req, res) => {
  try {
    console.log('Received request body:', req.body); // Log the entire request body

    // Change here to match the request body
    const { plan: planId,amount } = req.body; 
    const user = req.user;

    // Check if user is authenticated
    if (!user) {
      console.log('User authentication failed:', user); // Log the user state
      return res.status(401).json({ message: "Not authenticated user" });
    }

    console.log('Authenticated user:', user); // Log authenticated user details

    // const existingUserPlan = await Uplan.findOne({ user: user._id });
    // console.log('Existing user plan:', existingUserPlan); // Log existing user plan details

    // if (existingUserPlan) {
    //   console.log('Updating existing user plan with planId:', planId); // Log planId being updated
    //   const uplanUpdate = await Uplan.findOneAndUpdate(
    //     { user: user._id },
    //     { plan: planId },
    //     { new: true }
    //   );

    //   let clientsecret = await Createsub(user, planId);
    //   console.log('Client secret after update:', 'sdasdadasdasd'); // Log the client secret after update
    //   return res.status(200).json({
    //     message: "User plan updated",
    //     uplanUpdate,
    //     ...clientsecret,
    //   });
    // }
    if (typeof amount === 'object' && amount.amount !== undefined) {
      console.log('Extracting numeric amount from object:', amount);
      numericAmount = Number(amount.amount); // Extract and convert amount
    } else if (typeof amount === 'number') {
      numericAmount = amount; // Amount is already a number
    } else {
      console.log('Invalid amount format:', amount); // Log invalid format
      return res.status(400).json({ message: "Invalid amount value" });
    }

    console.log('Creating new user plan with planId:', planId); // Log planId for new plan creation
    const uplan = await Uplan.create({
      user: user._id,
      plan: planId,
      amount:numericAmount,
    });
    console.log('New user plan created:', uplan); // Log the newly created user plan

    let clientsecret = await Createsub(user, planId);
    console.log('Client secret after creation:', clientsecret); // Log the client secret after creation

    return res.status(200).json({
      message: "User plan created",
      uplan,
      ...clientsecret,
    });
  } catch (err) {
    console.error('Error occurred in createUserplan:', err); // Log the error details
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getPlanByUserId = async (req, res) => {
  const { userId } = req.params;
  
  try {
    // Step 1: Find the user plan by userId
    const userPlan = await Uplan.findOne({ user: userId }).sort({ createdAt: -1 });
    if (!userPlan) {
      return res.status(200).json({ message: "Plan not found for the user" });
    }

    const planId = userPlan.plan; // Assuming this contains the plan ID
    const plan = await Plan.findById(planId);

    // Step 4: Check if plan exists
    if (!plan) {
      return res.status(200).json({ message: "Plan not found" });
    }

    // Step 5: Return the plan name
    return res.status(200).json({ planName: plan.planname, amount:plan.plantype[0]?.amount, description: plan.description });
  } catch (error) {
    console.error('Error fetching plan:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
};



// const getUserplan = async (req, res) => {
//   try {
//     // Get the search query based on parameters
//     const searchQuery = constructSearchQuery(req.query);
//     console.log('search query', req.query)
//     let users;

//     if (Object.keys(searchQuery).length === 0) {
//       // No filters applied: Fetch all Uplan documents with populated user and plan
//       users = await Uplan.find({})
//         .populate("user")
//         .populate("plan")
//         .exec();
//     } else {
//       // Filters applied: Find plans based on the search query
//       const plans = await Plan.find(searchQuery).exec();

//       if (plans.length > 0) {
//         const planIds = plans.map(plan => plan._id);
//         users = await Uplan.find({ plan: { $in: planIds } })
//           .populate("user")
//           .populate("plan")
//           .exec();
//       } else {
//         // No plans match the search query, return an empty array
//         users = [];
//       }
//     }

//     // Return the users
//     res.json({ users });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };
  const getUserplan = async (req, res) => {
    try {
        // Extract page, limit, and search query from query params
        const { page = 1, limit = 10, search = '' } = req.query;

        // Convert to integers
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);

        // Create a search filter
        let searchFilter = {};

        if (search) {
            searchFilter = {
                $or: [
                    { amount: { $regex: search, $options: 'i' } }, // Search in amount (string representation)
                    { 'user.phone_no': { $regex: search, $options: 'i' } }, // Search in user name
                    { 'plan.planname': { $regex: search, $options: 'i' } } // Search in plan name
                ]
            };
        }

        // Fetch user plans sorted by the latest creation date
        const userPlans = await Uplan.find(searchFilter)
            .populate({
                path: 'user',
                select: 'firstname lastname phone_no email _id country_code' // Adjust fields as needed
            })
            .populate({
                path: 'plan',
                select: 'planname plantype' // Adjust fields as needed
            })
            .sort({ createdAt: -1 }) // Latest to oldest
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);

        // Get the total count for pagination metadata
        const totalCount = await Uplan.countDocuments(searchFilter);

        res.status(200).json({
            success: true,
            data: userPlans,
            meta: {
                totalItems: totalCount,
                currentPage: pageNumber,
                totalPages: Math.ceil(totalCount / limitNumber),
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
  };


const constructSearchQuery = (queryParams) => {
  const constructedQuery = {};

  if (queryParams.freeUser && !queryParams.paidUser) {
    // If only freeUser is provided
    constructedQuery["plantype.amount"] = { $lte: 0 };
  } else if (queryParams.paidUser && !queryParams.freeUser) {
    // If only paidUser is provided
    constructedQuery["plantype.amount"] = { $gt: 0 };
  } else if (queryParams.freeUser && queryParams.paidUser) {
    // If both freeUser and paidUser are provided, handle as needed
    // Example: Fetch users that match either condition
    constructedQuery["$or"] = [
      { "plantype.amount": { $lte: 0 } },
      { "plantype.amount": { $gt: 0 } }
    ];
  }

  // No parameters or no specific filters
  return constructedQuery;
};

const Createsub = async (user, plan) => {
  try {
    if (!user || !plan) {
      throw new Error("User or plan not provided");
    }

    const stripeUser = await User.findById(user?._id);
    const stripePlan = await Plan.findById(plan);

    if (!stripeUser || !stripePlan) {
      throw new Error("User or plan not found");
    }

    console.log("Stripe User:", stripeUser);
    console.log("Stripe Plan:", stripePlan);

    const customer = await stripe.customers.create({
      phone: stripeUser?.phone_no,
    });

    const product = await stripe.products.create({
      name: stripePlan?.planname,
      type: "service",
    });

    const checkingPrices = await Promise.all(
      stripePlan?.plantype?.map(async (singlePlanType) => {
        const price = await stripe.prices.create({
          currency: "usd",
          unit_amount: 20,
          recurring: {
            interval: "month",
          },
          product: product?.id,
        });
        return {
          price: price?.id,
        };
      })
    );

    console.log("Checking Prices:", checkingPrices);

    const subscription = await stripe.subscriptions.create({
      customer: customer?.id,
      items: checkingPrices,
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });
    let respond = {
      client_secret: subscription.latest_invoice.payment_intent.client_secret,
      subscriptionId: subscription.id,
    };
    return respond;
  } catch (error) {
    console.error("Error:", error.message);
    // Handle error as per your application's requirements
  }
};

const deletedUser = async (req, res) => {
  const { id } = req?.params;
  if (!id) {
    throw new Error("id are not provided");
  }
  let deletedUser = await Uplan.findByIdAndDelete(id);
  return res.status(200).json({
    message: "user will be deleted sucessfully",
    deletedUser,
  });
};

module.exports = {
  createUserplan,
  getUserplan,
  deletedUser,
  getPlanByUserId
};
