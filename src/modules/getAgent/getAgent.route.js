const express = require('express');
const { validateGetAgentForm, createAgentRequest, getAllAgentRequests, getAgentRequestById, updateAgentRequestStatus, deleteAgentRequest } = require('./getAgent.controller');
const { AuthenticateAdmin } = require('../../middleware/middleware');
const router = express.Router();

router.post('/createAgentRequest', validateGetAgentForm, createAgentRequest);
router.get('/getAllAgentRequest', AuthenticateAdmin, getAllAgentRequests);
router.get('/getAgentRequest/:id', AuthenticateAdmin, getAgentRequestById);
router.put('/updateAgentRequest/:id', AuthenticateAdmin, updateAgentRequestStatus);
router.delete('/deleteAgentRequest/:id', AuthenticateAdmin, deleteAgentRequest);

module.exports = router;
