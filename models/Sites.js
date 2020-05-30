const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Shema
const SiteSchema = new Schema({
  title:{
    type:String,
    required: true
  },
  link:{
    type: String,
    required: true
  },
  blog: {
    type: Schema.Types.ObjectId,
    ref:'blogs'
  },
  user:{
    type: Schema.Types.ObjectId,
    ref:'users'
  },
  date:{
    type: Date,
    default: Date.now
  }
});

// Create collection and add schema
mongoose.model('sites', SiteSchema, 'sites');