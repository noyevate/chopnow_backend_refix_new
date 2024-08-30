const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    title: {type: String, required:true},
    value: {type: String, required:true},
    imageUrl: {type: String, required:true}
},{
    toJSON: {
        transform(doc, ret){
            delete ret.__v;
        }
    },
    timestamps: true
});

module.exports = mongoose.model('Category', CategorySchema)