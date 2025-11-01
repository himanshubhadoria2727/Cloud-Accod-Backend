const express = require('express')
const { upload } = require('../../utility/uploadfile')
const { Authenticateuser, AuthenticateAdmin } = require('../../middleware/middleware');
const { addContent, editcontent, deletedcontent, allContent, singleeditcontent } = require('./content.controller')

const router = express.Router()



router.post('/addContent', AuthenticateAdmin, addContent)
router.get('/allContent', allContent)
router.get('/editContent/:id', AuthenticateAdmin, singleeditcontent)

router.put('/editContent/:id', AuthenticateAdmin, upload.single("file"), editcontent)
router.delete('/:id', AuthenticateAdmin, deletedcontent)


module.exports = router






