const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Shema
const SettingSchema = new Schema({
  settingbody: { type: Schema.Types.Mixed },
  site: {
    type: Schema.Types.ObjectId,
    ref:'sites'
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
},{ strict: false });

// Create collection and add schema
mongoose.model('settings', SettingSchema, 'settings');