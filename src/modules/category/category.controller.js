const Category = require("../../model/category.model");
const Subcategory = require("../../model/subcategory.model")
const Plan = require("../../model/plan.model");
const AWS = require('aws-sdk');


const addCategory = async (req, res) => {
    try {
       
        const { CategoryName, Bol} = req.body;
        console.log(CategoryName);
         // Validate the required fields
         if (!CategoryName || !Bol) {
            return res.status(400).json({
                message: 'CategoryName, Bol, and planNames are required and planNames must be an array.'
            });
        }

        //  // Fetch the plans by their names
        //  const plans = await Plan.find({ planname: { $in: planNames } });

        //  if (plans.length === 0) {
        //      return res.status(400).json({
        //          message: 'No valid plans found for the provided plan names.'
        //      });
        //  }

         const savedCategory = await Category.create({
            CategoryName,
            Bol,
        });


        return res.status(200).json({
            savedCategory,
            "message": "category will be added sucessfuly"
        })
    } catch (err) {
        console.error(err);
        return res.status(500).json({ "message": 'Internal Server Error' });
    }
}
const getAllCategory = async (req, res) => {
    try {
        // Fetch all categories
        let allCategories = await Category.find({}).sort({ createdAt: -1 });;

        // For each category, fetch its associated subcategories
        for (let category of allCategories) {
            // Fetch subcategories for the current category using the category._id
            let subcategories = await Subcategory.find({ category: category._id });

            // Add the subcategories to the category object
            category = category.toObject(); // Convert mongoose document to plain object
            category.subcategories = subcategories; // Add subcategories

            // Replace the original category in the array with the updated one
            allCategories = allCategories.map(c => c._id.toString() === category._id.toString() ? category : c);
        }

        return res.status(200).json({
            allCategories
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

const getS3Category = async (req, res) => {
    try {
       const s3Categories = await listCategories(process.env.SPACES_BUCKET);
       return res.status(200).json(s3Categories);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

async function listCategories(bucket) {
    try {
        const s3 = new AWS.S3({
            endpoint: process.env.SPACES_ENDPOINT, 
            accessKeyId: process.env.SPACES_KEY, 
            secretAccessKey: process.env.SPACES_SECRET
        });
        const params = {
            Bucket: bucket,
            Prefix: 'A# Stretch/', // Filter by this prefix (category folder)
            Delimiter: '/', // Group by folders
        };

        const data = await s3.listObjectsV2(params).promise();

        // Extract category names by splitting the prefix and selecting the last part
        const categories = data.CommonPrefixes.map(prefix => {
            const parts = prefix.Prefix.split('/'); // Split by '/'
            return parts[parts.length - 2]; // The category name is second-to-last
        });

        console.log('Categories:', categories);

        return categories;
    } catch (error) {
        console.error('Error listing categories:', error);
    }
}

const getS3Subcategories = async (req, res) => {
    try {
        const { categoryName } = req.params;
        console.log(req.params);
        const subcategories = await listSubcategories(categoryName);
        return res.status(200).json(subcategories);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

async function listSubcategories(categoryName) {
    try {
        const s3 = new AWS.S3({
            endpoint: process.env.SPACES_ENDPOINT, 
            accessKeyId: process.env.SPACES_KEY, 
            secretAccessKey: process.env.SPACES_SECRET
        });
        const params = {
            Bucket: process.env.SPACES_BUCKET,
            Prefix: `A# Stretch/${categoryName}/`,
            Delimiter: '/',
        };

        const data = await s3.listObjectsV2(params).promise();
        console.log(data);

        if (data.CommonPrefixes.length > 0) {
            const subcategories = data.CommonPrefixes.map(prefix => {
                const parts = prefix.Prefix.split('/');
                return parts[parts.length - 2];
            });
            return { hasSubcategories: true, subcategories };
        } else {
            //const hasMp3Files = data.Contents.some(content => content.Key.endsWith('.mp3'));
            return { 
                hasSubcategories: false, 
                subcategories: []
            };
        }
    } catch (error) {
        console.error('Error listing subcategories:', error);
        throw error;
    }
}


module.exports = {
    addCategory, getAllCategory, getS3Category, getS3Subcategories
}
