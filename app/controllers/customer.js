var moment = require('moment');
var expressValidator = require('express-validator');

var Customer = require('../models/customer');

/**
 * 200 - OK success GET
 * 201 - created success POST
 * 203 - created success PUT
 * 204 - no content success DELETE
 * 400 bad request
 * 401 unathorized
 * 403 forbidden
 * 404 not found
 * 405 method not allowed
 */

var sendJson = function(res, status, content) {
      content = content || {};
      res.status(status);
      return res.json(content);
};

exports.getCustomers = function(req, res) {
  getCustomers()
  .then(results => {
    sendJson(res, 200, results);
  })
  .catch(err => {
    sendJson(res, 400, results);
  });
}

exports.getCustomer = function(req, res) {
  var id = req.params.id;

  getCustomerById(id)
  .then(results => {
    sendJson(res, 200, results);
  })
  .catch(err => {
    sendJson(res, 400, results);
  });
}

exports.createCustomer = function(req, res) {
  req.checkBody('firstName', 'First name is required').notEmpty();
  req.checkBody('lastName', 'Last name is required').notEmpty();
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('email', 'Email must be proper format').isEmail();
  
  var errors = req.validationErrors();
  if (errors) return sendJson(res, 400, {errors: errors});

  var obj = new Customer(req.body);
  obj.save(err => {
    if (err) return sendJson(res, 400, err.message);
    sendJson(res, 201, obj);
  })
}

exports.updateCustomer = function(req, res) {
  req.checkBody('email', 'Email must be proper format').optional().isEmail();
  
  var errors = req.validationErrors();
  if (errors) return sendJson(res, 400, {errors: errors});  

  var validParams = ["firstName","lastName","email","phone"];

  var id = req.params.id;
  var updatedParams = {};
  validParams.forEach(param => {
    if (req.body[param]) updatedParams[param] = req.body[param];
  });

  // Make sure at least one valid parameter is included
  if (Object.keys(updatedParams).length === 0) {
    return sendJson(res, 400, {errors: `No valid parameters were provided to update.  Valid parameters are: ${validParams.join(', ')}`});
  }

  updateCustomer(id, updatedParams)
  .then(results => {
    sendJson(res, 203, results);
  })
  .catch(err => {
    if (!results) return sendJson(res, 400, {errors: 'Record could not be found with provided id'});
    sendJson(res, 400, err);
  });
}

exports.deleteCustomer = function(req, res) {
  var id = req.params.id;
  // todo implement validator
  getCustomerById(id)
  .then(results => {
    if (!results) return sendJson(res, 400, {errors: 'Record could not be found with provided id'});
    results.remove(err => {
      if (err) return sendJson(res, 400, results);
      sendJson(res, 204, {message: "Deleted sucessfully"});
    });
  })
  .catch(err => {
    sendJson(res, 400, err);
  });
}

function getCustomerById(id) {
  return new Promise((resolve, reject) => {
    Customer.findById(id, (err, results) => {
      if (err) return reject({error: err.message});
      resolve(results);
    });
  })
}

function getCustomers(query) {
  query = query || {};
  return new Promise((resolve, reject) => {
    Customer.find(query, (err, results) => {
      if (err) return reject({error: err.message});
      resolve(results);
    });
  })
}

function updateCustomer(id, updateParams) {
  return new Promise((resolve, reject) => {
    Customer.findByIdAndUpdate(id, updateParams, (err) => {
      if (err) return reject({error: err.message});
      getCustomerById(id)
      .then(results => { resolve(results) })
      .catch(err => { reject(err) });
    });
  })
}