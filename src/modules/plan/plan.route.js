const express = require('express')
const { Authenticateuser, AuthenticateAdmin } = require('../../middleware/middleware')
const { addPlan, getPlan, deletedPlan, editPlan,singleEditPlan } = require('./plan.controller')

const router = express.Router()

router.post('/addplan', AuthenticateAdmin, addPlan)
router.put('/editPlan/:id', AuthenticateAdmin, editPlan)
router.get('/editPlan/:id', AuthenticateAdmin, singleEditPlan)
router.get('/getPlan', getPlan)
router.delete('/:id', AuthenticateAdmin, deletedPlan)




module.exports = router

