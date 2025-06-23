const Wallet = require('../models/userWalletModel')

const getWallet = async (userId) => {
  try {
    let wallet = await Wallet.findOne({ user: userId }).lean()

    if (!wallet) {
      await Wallet.create({ user: userId })
      wallet = await Wallet.findOne({ user: userId }).lean()
    }
        // console.log(wallet.transactions);

    wallet.transactions.sort((a, b) => b.createdAt - a.createdAt)

    return wallet
  } catch (err) {
    throw new Error(err.message)
  }
}

module.exports = { getWallet }
