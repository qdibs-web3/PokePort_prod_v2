const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const portfolioItemSchema = new mongoose.Schema({
  // Support both old and new formats during transition
  itemId: { type: String },
  cardId: { type: String }, // Keep this for backward compatibility
  quantity: { type: Number, default: 1 },
  isSealed: { type: Boolean, default: false },
}, { _id: false });

// Add a virtual getter for consistent access
portfolioItemSchema.virtual('consistentId').get(function() {
  return this.itemId || this.cardId;
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  portfolio: [portfolioItemSchema],
});

// Middleware to normalize portfolio items before saving
userSchema.pre('save', function(next) {
  this.portfolio = this.portfolio.map(item => {
    if (item.cardId && !item.itemId) {
      // Migrate old cardId to new itemId format
      return {
        itemId: item.cardId,
        quantity: item.quantity,
        isSealed: false // Assume old items are cards
      };
    }
    return item;
  });
  next();
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Check if the model already exists to prevent model overwrite errors in serverless environment
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
