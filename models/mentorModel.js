import mongoose from 'mongoose';


const MentorSchema = new mongoose.Schema({
name: { type: String, index: true },
email: { type: String, required: true, index: true },
course: { type: String },
role: { type: String, enum: ['core', 'softskill', 'cc', 'unknown'], default: 'unknown' },
extra: { type: Object }
}, { timestamps: true });


export default mongoose.model('Mentor', MentorSchema);