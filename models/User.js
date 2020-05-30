const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Shema
const UserSchema = new Schema({
  googleID:{
    type:String,
    required: true
  },
  displayName:{
    type: String,
    required: true
  }
});

// Create collection and add schema
mongoose.model('users', UserSchema);