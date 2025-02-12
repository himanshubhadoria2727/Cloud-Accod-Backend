const express = require('express')
const { Authenticateuser } = require('../../middleware/middleware')
const { createUserplan, getUserplan,getPlanByUserId, deletedUser } = require('./userplan.controller')


const router = express.Router()

router.post('/userplan', Authenticateuser, createUserplan)

router.get('/userplan',Authenticateuser, getUserplan)
router.get('/getPlanByUserId/:userId', getPlanByUserId)
router.delete('/userplan/:id', deletedUser)




module.exports = router