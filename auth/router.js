const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { User } = require('../users/models');
const lod = require('lodash');


const { JWT_EXPIRY, JWT_SECRET } = require('../config');

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const createAuthToken = user => {
  return jwt.sign({ user }, JWT_SECRET, {
    subject: user.userName,
    expiresIn: JWT_EXPIRY,
    algorithm: 'HS256'
  });
};

const router = express.Router();

router.get('/protected',
  passport.authenticate('jwt', { session: false }),
  (req, res, next) => {
    let { userName } = req.user;
    return User
      .findOne({ userName })
      .then(user => {
        return res.status(200).json({
          data: user.expenseManagerData
        })
      })
  }
);

router.post('/login',
  passport.authenticate('basic', { session: false }),
  (req, res, next) => {
    const authToken = createAuthToken(req.user.apiRepr());
    res.json({ authToken });
    next();
  }
);

router.post('/refresh',
  passport.authenticate('jwt', { session: false }),
  (req, res, next) => {
    const authToken = createAuthToken(req.user);
    res.json({ authToken });
    next();
  }
);

router.post('/budget', jsonParser, passport.authenticate('jwt', { session: false }),
  (req, res, next) => {
    let { userName } = req.user;
    let updateBudget = req.body;
    User.findOne({ userName }, function (err, user) {
      user.expenseManagerData.budget = updateBudget;
      user.save();
      return res.status(200).json({
        data: user.expenseManagerData
      });
    });
  }
);

router.post('/expense', jsonParser, passport.authenticate('jwt', { session: false }),
  (req, res, next) => {
    let { userName } = req.user;
    let addExpense = req.body;
    User.findOne({ userName }, function (err, user) {
      user.expenseManagerData.expense.push(addExpense);
      let expense = user.expenseManagerData.expense;
      let grouped = lod.groupBy(expense, 'category');
      let total = lod.mapValues(grouped, function (t) {
        return lod.reduce(t, function (sum, n) {
          return sum + parseInt(n.amount);
        }, 0);
      });
      let totallingInPairs = lod.toPairs(total);
      var totalExpense = lod.map(totallingInPairs, function(t) {
      return {"category": t[0], "amount": t[1]};
      });
      user.expenseManagerData.totalExpense = totalExpense;
      user.save();
      return res.status(200).json({
        data: user.expenseManagerData
      });
    });
  }
);

module.exports = { router };




