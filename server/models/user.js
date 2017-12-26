const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

var UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: '{VALUE} is not a valid email'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  tokens: [{
    access: {
      type:String,
      required: true
    },
    token: {
      type:String,
      required: true
    }
  }]
});

//Override the toJSON method so all of our documents can only return the _id and email field. Password should  be private
UserSchema.methods.toJSON = function(){
  var user = this;
  var userObject = user.toObject();

  return _.pick(userObject, ['_id', 'email']);
};

// add a generateAuthTokens method to the Schema that hashes the user id, access and salt(All document instances will have this method available to them)
UserSchema.methods.generateAuthToken = function() {
  var user = this;
  var access = 'auth';
  var token = jwt.sign({_id: user._id.toHexString(), access}, 'abc123').toString();

  //update the tokens array in the Schema for a user
  user.tokens.push({access, token});

  //save and return a user. The function returns a token which is to be used in server.js
  return user.save().then(() => {
    return token;
  });
};

UserSchema.methods.removeToken = function (token) {
  var user = this;
// the pull operator from mongodb, removes the token object from the tokens array
  return user.update({
    $pull: {
      tokens: {token}
    }
  });
};

UserSchema.statics.findByToken = function (token) {
  var User = this;
  var decoded;

  try {
    decoded = jwt.verify(token, 'abc123');
  } catch (e) {
    return Promise.reject();
  }

  return User.findOne({
    '_id': decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth'
  });
};
// add a findByCredentials method that can find a user by email and check the password (The User model will have this method available to it)
UserSchema.statics.findByCredentials = function(email, password){
  var User = this;

  return User.findOne({email}).then((user) => {
    if(!user){
      return Promise.reject();
    }
    //wrap bcryt in a promise since it supports only callbacks
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, res) => {
        if (res) {
          resolve(user);
        } else{

          reject();
        }
      });
    });
  });
};
//hash the password before the 'save' event
UserSchema.pre('save', function (next) {
  var user = this;

  //only hash the password if it has been modified (or is new)
  if (user.isModified('password')) {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, (err, hash) => {
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

var User = mongoose.model('User', UserSchema);

module.exports = {User}
