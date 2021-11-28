const db = require('../model/dbConnection');

exports.getTotalPointByMerchantId = (merchantId) => {
    return new Promise((resolve, reject) => {
        db.query(`
        SELECT *, IFNULL((SELECT  reward - redeem
FROM (SELECT SUM(point) as reward
      FROM Point p left join Branch b on p.branch_id = b.branch_id
     WHERE customer_id = c.customer_id and p.point_status = 'reward' and b.merchant_id = ?) as a,
     (SELECT ifnull(SUM(point),0) as redeem
      FROM Point p right join Branch b on p.branch_id = b.branch_id
     WHERE customer_id = c.customer_id and p.point_status = 'redeem' and b.merchant_id = ?) as b) ,0) as totalPoint FROM Customer c `, 
        [
            merchantId,
            merchantId
        ], (err, result) => {
            if (err) reject(err)
            resolve(result)
        });
    })
}