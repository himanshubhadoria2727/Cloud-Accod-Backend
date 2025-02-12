const express = require('express')
const { Authenticateuser } = require('../../middleware/middleware')
const { addPlan, getPlan, deletedPlan, editPlan,singleEditPlan } = require('./plan.controller')

const router = express.Router()

router.post('/addplan', Authenticateuser, addPlan)
router.put('/editPlan/:id', Authenticateuser, editPlan)
router.get('/editPlan/:id', Authenticateuser, singleEditPlan)
router.get('/getPlan', getPlan)
router.delete('/:id', deletedPlan)




module.exports = router

