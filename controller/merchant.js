const db = require('../model/dbConnection');

exports.addMerchant = (merchant) => {
    console.log(merchant)
    return new Promise((resolve, reject) => {
        db.query("INSERT INTO Merchant (merchant_id, merchant_name, reward_type, formula_id) VALUES (?,?,?,?)", 
        [
            merchant.merchantId,
            merchant.merchantName,
            merchant.rewardType,
            merchant.formulaId
        ], (err, result) => {
            if (err) reject(err)
            resolve(result)
        });
    })
}

exports.getMerchantById = (merchantId) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM Merchant where merchant_id = ?", 
        [
            merchantId
        ], (err, result) => {
            if (err) reject(err)
            resolve(result)
        });
    })
}
exports.getMerchantBycustomerId = (merchantId) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM Merchant where merchant_id = ?", 
        [
            merchantId
        ], (err, result) => {
            if (err) reject(err)
            resolve(result)
        });
    })
}
