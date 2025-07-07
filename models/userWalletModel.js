const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    reference: { type: String },
    note: { type: String },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
)


const UserWalletSchema = new mongoose.Schema({
    user: { type: mongoose.Types.ObjectId, ref: 'User', unique: true, required: true },
    balance: { type: Number, default: 0 },
    transactions: [transactionSchema]
  },
  { timestamps: true }
)

UserWalletSchema.pre('save', function (next) {
  try {
   const totalIn = this.transactions.reduce((sum, trans) => {
    if(trans.type == 'credit'){
      return sum + trans.amount
    }
    return sum + 0;
    }, 0)

  const totalOut = this.transactions.reduce((sum, trans) => {
    if(trans.type == 'debit'){
      return sum + trans.amount
    }
    return sum + 0;
    }, 0)

    this.balance = totalIn - totalOut;

    next();
  } catch (err) {
    next(err);
  }
})

const UserWallet = mongoose.model('UserWallet', UserWalletSchema)
module.exports = UserWallet
