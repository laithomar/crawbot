const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Shema
const TemplateSchema = new Schema({
    tempbody: { type: Schema.Types.Mixed },
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
mongoose.model('template', TemplateSchema, 'template');