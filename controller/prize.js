const db = require('../model/dbConnection');

exports.addPrize = (prize) => {
    return new Promise((resolve, reject) => {
        db.query("INSERT INTO Prize (prize_name, prize_detail, prize_pointCost, branch_id) VALUES (?,?,?,?)", 
        [
            prize.prizeName, 
            prize.prizeDetail, 
            prize.prizePointCost, 
            prize.branchId
        ], (err, result) => {
            if (err) reject(err)
            resolve(result)
        });
    })
}

exports.getPrizeById = (prizeId) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM Prize where prize_id = ?", 
        [
            prizeId
        ], (err, result) => {
            if (err) reject(err)
            resolve(result)
        });
    })
}

exports.getPrizeByBranchId = (branchId) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM Prize where branch_id = ?", 
        [
            branchId
        ], (err, result) => {
            if (err) reject(err)
            resolve(result)
        });
    })
}

exports.removePrize = (prizeId) => {
    return new Promise((resolve, reject) => {
        db.query("DELETE FROM Prize WHERE prize_id = ?", 
        [
            prizeId
        ], (err, result) => {
            if (err) reject(err)
            resolve(result)
        });
    })
}