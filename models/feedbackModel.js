import mongoose from 'mongoose';


const FeedbackSchema = new mongoose.Schema({
timestamp: Date,
studentEmail: String,
course: String,
batch: String,


// Mapped mentors from the feedback sheet
coreMentor: String,
softSkillMentor: String,
courseCoordinator: String,


// Ratings
ratingCore: Number,
ratingSoft: Number,
ratingCC: Number,
ratingOverall: Number,


// Free‑text columns (stored raw)
raw: Object
}, { timestamps: true });


export default mongoose.model('Feedback', FeedbackSchema);