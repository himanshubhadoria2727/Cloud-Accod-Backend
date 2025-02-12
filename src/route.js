const userRoute = require("./modules/user.route");
const planRoute = require("./modules/plan/plan.route");
const userPlan = require("./modules/user_plan/user.route");
const enquiryRoute = require("./modules/enquiry/enquiry.route");
const contentRoute = require("./modules/content/content.route");
const categoryRoute = require("./modules/category/category.route");
const subcategoryRoute = require("./modules/subcategory/subcategory.route");
const twilioRouter = require("./modules/twilio/twilio.route");
const propertyRoute = require("./modules/property/property.route");

const registerRoute = (app) => {
 
  app.use("/api/user", userRoute);
  app.use("/api/plan", planRoute);
  app.use("/api", userPlan);
  app.use("/api/enquiry",enquiryRoute);
  app.use("/api/content", contentRoute);
  app.use("/api/category", categoryRoute);
  app.use("/api/subcategory", subcategoryRoute);
  app.use(twilioRouter);
  app.use("/api/property", propertyRoute);

};

module.exports = {
  registerRoute,
};
