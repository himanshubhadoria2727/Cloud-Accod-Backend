const express = require('express');
const { validateGetAgentForm, createAgentRequest, getAllAgentRequests, getAgentRequestById, updateAgentRequestStatus, deleteAgentRequest } = require('./getAgent.controller');
const router = express.Router();

router.post('/createAgentRequest', validateGetAgentForm, createAgentRequest);
router.get('/getAllAgentRequest', getAllAgentRequests);
router.get('/getAgentRequest/:id', getAgentRequestById);
router.put('/updateAgentRequest/:id', updateAgentRequestStatus);
router.delete('/deleteAgentRequest/:id', deleteAgentRequest);

module.exports = router;
