const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');

const {User} = require('./models');

const router = express.Router();

const jsonParser = bodyParser.json();
let currentUser = "";

router.post('/', jsonParser, (req, res,next) => {
  const requiredFields = ['userName', 'password'];
  const missingField = requiredFields.find(field => !(field in req.body));

  if (missingField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Missing field',
      location: missingField
    });
  }

  const stringFields = ['userName', 'password', 'fullName'];
  const nonStringField = stringFields.find(field =>
    (field in req.body) && typeof req.body[field] !== 'string'
  );

  if (nonStringField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Incorrect field type: expected string',
      location: nonStringField
    });
  }

  let {userName, password, fullName} = req.body;

  return User
    .find({userName})
    .count()
    .then(count => {
      if (count > 0) {
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'Username already taken',
          location: 'userName'
        });
      }
      return User.hashPassword(password)
    })
    .then(hash => {
      return User
        .create({
          userName,
          password: hash,
          fullName
        })
    })
    .then(user => {
      currentUser = user;
      return res.status(201).json({
        code: 201,
        reason: '',
        user: user.apiRepr()
      })     
    })
    .catch(err => {
      if (err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      res.status(500).json({code: 500, message: 'Internal server error'});
    });
});


router.get('/', (req, res) => {
  return User
    .find()
    .then(users => res.json(users.map(user => user.apiRepr())))
    .catch(err => res.status(500).json({message: 'Internal server error'}));
});


module.exports = {router};

// app.post('/api/budget',
// (req, res) => {
//   // let {userName} = req.user;
//   // let toUpdate = {budget: {gas:400,water:75}}
//   console.log("user in /budget",req)
//   console.log(req.body);
// //  return User
// //     .findOneAndUpdate({userName},{expenseManagerData:{toUpdate}})
// //     .exec()
// //     .then(user => {
// //       console.log("after update",user)
// //       return res.status(200).json({
// //         message:"success",
// //         data: user.expenseManagerData
// //       })
// //     })
 
// }
// );