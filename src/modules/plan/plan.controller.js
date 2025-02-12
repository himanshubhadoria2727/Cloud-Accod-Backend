const Plan = require("../../model/plan.model");
const planSchema = require("../../model/plan.model");
const { Uplan } = require("../../model/user_plan.model");
const Category = require("../../model/category.model");
const Subcategory = require("../../model/subcategory.model");
const addPlan = async (req, res) => {
  try {
    console.log(req.body);

    // Validate request body
    const { error } = planSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { planname, description, plantype, categories,subCategories } = req.body;

    // Create a new plan with categories
    let savedPlan = await Plan.create({
      planname,
      description,
      plantype,
      categories,
      subCategories // New categories field
    });

    return res.status(201).json({
      message: "Plan created successfully",
      plan: savedPlan,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const editPlan = async (req, res) => {
    try {
      const { planId } = req.params; // Extract planId from request params
      console.log(req.body);
  
      // Validate request body using Joi schema (assuming planSchema is defined somewhere)
      const { error } = planSchema.validate(req.body); 
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }
  
      const { planname, description, plantype, categories,subCategories } = req.body;
  
      // Prepare the update object
      const updatedPlan = await Plan.findByIdAndUpdate(req.params.id, { planname,description,plantype, categories,subCategories }, { new: true });
  
      if (!updatedPlan) {
        return res.status(404).json({ message: "Plan not found" });
      }
  
      // Return the updated plan in the response
      return res.status(200).json({
        message: "Plan updated successfully",
        plan: updatedPlan,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
  

const singleEditPlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: "Content not found" });
    }
    res.status(200).json(plan);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getPlan = async (req, res) => {
  try {
    const query = constructSearchQuery(req.query);
    const country = req.query.country; 

    if (country) {
      const countryQuery = {
        "plantype.country": new RegExp(`^${country}$`, "i"), 
      };
      const plans = await Plan.find(countryQuery);
      if (plans.length === 0) {
        return res.status(404).json({ message: "No plans found for the specified country" });
      }
      const userPlans = [];
      for (let plan of plans) {
        const categories = plan.categories || []; 
        const subCategories = plan.subCategories || []; 
        const matchedCategories = await Category.find({
          _id: { $in: categories },
        });
        const matchedsubCategories = await Subcategory.find({
          _id: { $in: subCategories },
        });
        if (matchedCategories.length !== categories.length) {
          return res.status(400).json({ message: "Some categories are invalid" });
        }

        userPlans.push({
          _id: plan._id,
          planname: plan.planname,
          plantype: plan.plantype,
          description: plan.description,
          categories: matchedCategories,
          subCategories: matchedsubCategories
        });
      }
      console.log("all by country plans:", userPlans);
      return res.status(200).json({
        message: "Plans found successfully",
        plans: userPlans,
      });
    }

    const pageSize = 200;
    const pageNumber = parseInt(req.query.page ? req.query.page.toString() : "1");
    const skip = (pageNumber - 1) * pageSize;

    let allPlan = await Plan.find(query).skip(skip).limit(pageSize);
    const total = await Plan.countDocuments(query);

    const planRespond = {
      data: allPlan,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / pageSize),
      },
    };

    return res.status(200).json(planRespond);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "An error occurred while retrieving plans" });
  }
};

const constructSearchQuery = (queryParms) => {
  const constructedQuery = {};

  // Date range filter (optional)
  if (queryParms.startdate && queryParms.enddate) {
    const startDate = new Date(queryParms.startdate);
    const endDate = new Date(queryParms.enddate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error("Invalid date strings for startdate or enddate.");
      return constructedQuery; // Return an empty query or handle the error as needed
    }

    endDate.setHours(23, 59, 59, 999);

    constructedQuery.makeAt = {
      $gte: startDate,
      $lte: endDate,
    };
  }

  // Plan type filter (optional)
  if (queryParms.freeUser) {
    constructedQuery["plantype.amount"] = { $lte: 0 };
  }
  if (queryParms.paidUser) {
    constructedQuery["plantype.amount"] = { $gt: 0 };
  }

  // Search functionality
  if (queryParms.search) {
    const searchRegex = new RegExp(queryParms.search, "i"); // Case-insensitive search
    constructedQuery.$or = [
      { _id: queryParms.search }, // Search by ID
      { phone_no: searchRegex }, // Search by phone number
      { firstname: searchRegex }, // Search by first name
      { lastname: searchRegex }, // Search by last name
      { email: searchRegex }, // Search by email
    ];
  }

  return constructedQuery;
};

const deletedPlan = async (req, res) => {
  try {
    const id = req.params.id;

    // Check if ID is provided
    if (!id) {
      return res.status(400).json({ message: "Id is not found" });
    }

    console.log(`Checking user count for plan ID: ${id}`);

    // Count how many users are using the plan in the Uplan table
    const userCount = await Uplan.countDocuments({ plan: id }); // Update this line

    console.log(`User count for plan ID ${id}: ${userCount}`);

    if (userCount > 0) {
      return res.status(400).json({
        message: `Cannot delete the plan as it is currently in use by ${userCount} user(s)`,
      });
    }

    // Proceed with deletion if not referenced
    const deletedPan = await Plan.findByIdAndDelete(id);
    if (!deletedPan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    return res
      .status(200)
      .json({ message: "Plan deleted successfully", deletedPan });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  addPlan,
  editPlan,
  singleEditPlan,
  getPlan,
  deletedPlan,
};
