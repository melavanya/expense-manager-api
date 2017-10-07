const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const UserSchema = mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  fullName: {
    type: String, 
    default: ""
  },
  expenseManagerData:{
    budget: {
      gas: 0,
      water: 0,
      electricity: 0,
      tv: 0,
      rent: 0,
      phone: 0,
      misc: 0,
      groceries: 0,
      kids: 0,
      travel: 0,
      restaurant: 0
  },
   expense: [{ value: 0, category: "", amount: 0, date: Date }],
   anuualExpense: {},
   totalExpense: [{}],
  }
});

UserSchema.methods.apiRepr = function() {
  return {
    userName: this.userName || '',
    fullName: this.fullName || ''
  };
}
UserSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
}
UserSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
}


const User = mongoose.model('User', UserSchema);

module.exports = {User};
