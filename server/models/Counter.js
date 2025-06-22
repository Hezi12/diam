const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 999 } // מתחיל מ-999 כך שהראשון יהיה 1000
});

counterSchema.statics.getNextSequence = async function(sequenceName) {
  // שימוש בsession כדי לוודא atomicity
  const session = await this.db.startSession();
  
  try {
    let result;
    await session.withTransaction(async () => {
      const counter = await this.findByIdAndUpdate(
        sequenceName,
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true, session }
      );
      result = counter.sequence_value;
    });
    
    return result;
  } finally {
    await session.endSession();
  }
};

module.exports = mongoose.model('Counter', counterSchema); 