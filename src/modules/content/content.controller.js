const Content = require("../../model/content.model");
const contentValidationSchema = require("./content.dto")




const addContent = async (req, res) => {
    try {
        const { error } = contentValidationSchema.validate(req.body)
        // if (error) {
        //     return res.status(400).json({ message: error.details[0].message });
        // }
        const bannerImage = req?.file?.filename ? req?.file?.filename : req.body.bannerImage

        const { title, description, phone_no, email } = req.body

        let content = await Content.create({
            title: title,
            phone_no:phone_no,
            email:email,
            bannerImage, bannerImage,
            description: description
        })

        return res.status(200).json({
            "message": "content will be created sucessfully",
            content
        })

    } catch (err) {
        console.log(err)
        return res.status(500).json({ "message": "Internal server error" })
    }
}

const allContent = async (req, res) => {
    try {

        let allContent = await Content.find({})

        res.status(200).json(allContent);

    } catch (err) {
        console.log(err)
        return res.status(500).json({ "message": "Internal server error" })
    }


}

const editcontent = async (req, res) => {
    try {
        const { title, description,phone_no,email } = req.body;
        const bannerImage = req?.file?.filename ? req?.file?.filename : req.body.bannerImage
        console.log(req.body);
        const updatedContent = await Content.findByIdAndUpdate(req.params.id, { title,phone_no,email, description, bannerImage }, { new: true });
        if (!updatedContent) {
            return res.status(404).json({ message: 'Content not found' });
        }
        res.status(200).json(updatedContent);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}

const singleeditcontent = async (req, res) => {
    try {
        const content = await Content.findById(req.params.id);
        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }
        res.status(200).json(content);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}
const deletedcontent = async (req, res) => {
    try {
        const deletedContent = await Content.findByIdAndDelete(req.params.id);
        if (!deletedContent) {
            return res.status(404).json({ message: 'Content not found' });
        }
        res.status(200).json({ message: 'Content deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    addContent, editcontent, deletedcontent, allContent, singleeditcontent
}