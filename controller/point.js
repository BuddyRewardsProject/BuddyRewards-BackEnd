const db = require('../model/dbConnection');

exports.addPoint = (point) => {
    return new Promise((resolve, reject) => {
        db.query("INSERT INTO Point (point_id, point, point_status, time_stamp, branch_id, customer_id) VALUES (?,?,?,?,?,?)", 
        [
            point.pointId,
            point.point,
            point.pointStatus,
            point.timeStamp,
            point.branchId,
            point.customerId
        ], (err, result) => {
            if (err) reject(err)
            resolve(result)
        });
    })
}

exports.getPointByCustomerId = (customerId) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM Point where customer_id = ?", 
        [
            customerId
        ], (err, result) => {
            if (err) reject(err)
            resolve(result)
        });
    })
}

exports.getPointByBranchId = (customerId) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM Point where branch_id = ?", 
        [
            branchId
        ], (err, result) => {
            if (err) reject(err)
            resolve(result)
        });
    })
}

exports.getTotalPoint = (totalPoint) => {
    return new Promise((resolve, reject) => {
        db.query(`
        SELECT reward - redeem as result
        FROM (SELECT SUM(point) as reward
              FROM Point p left join Branch b on p.branch_id = b.branch_id
             WHERE p.customer_id = ? and p.point_status = 'reward' and b.merchant_id = ?) as a,
             (SELECT ifnull(SUM(point),0) as redeem
              FROM Point p right join Branch b on p.branch_id = b.branch_id
             WHERE p.customer_id = ? and p.point_status = 'redeem' and b.merchant_id = ?) as b`, 
        [
            totalPoint.customerId,
            totalPoint.merchantId,
            totalPoint.customerId,
            totalPoint.merchantId
        ], (err, result) => {
            if (err) reject(err)
            resolve(result)
        });
    })
}
