const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Shema
const BlogsSchema = new Schema({
  title:{
    type:String,
    required: true
  },
  link:{
    type: String,
    required: true
  },
  blogID: {
    type: String,
    required: true
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
mongoose.model('blogs', BlogsSchema, 'blogs');