const db = require("../model/dbConnection");

exports.addPoint = (point) => {
  return new Promise((resolve, reject) => {
    db.query(
      "INSERT INTO Point (point_id, point, point_status, time_stamp, branch_id, customer_id, staff_id) VALUES (?,?,?,?,?,?,?)",
      [
        point.pointId,
        point.point,
        point.pointStatus,
        point.timeStamp,
        point.branchId,
        point.customerId,
        point.staffId,
      ],
      (err, result) => {
        if (err) reject(err);
        resolve(result);
      }
    );
  });
};

exports.addPointRedeem = (point) => {
  return new Promise((resolve, reject) => {
    db.query(
      "INSERT INTO Point (point_id, point, point_status, time_stamp, branch_id, customer_id, staff_id, prize_id) VALUES (?,?,?,?,?,?,?,?)",
      [
        point.pointId,
        point.point,
        point.pointStatus,
        point.timeStamp,
        point.branchId,
        point.customerId,
        point.staffId,
        point.prizeId,
      ],
      (err, result) => {
        if (err) reject(err);
        resolve(result);
      }
    );
  });
};

exports.getPointByCustomerId = (customerId) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM Point where customer_id = ?",
      [customerId],
      (err, result) => {
        if (err) reject(err);
        resolve(result);
      }
    );
  });
};

exports.getPointByBranchId = () => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM Point where branch_id = ?",
      [branchId],
      (err, result) => {
        if (err) reject(err);
        resolve(result);
      }
    );
  });
};

exports.getTotalPoint = (totalPoint) => {
  return new Promise((resolve, reject) => {
    db.query(
      `
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
        totalPoint.merchantId,
      ],
      (err, result) => {
        if (err) reject(err);
        resolve(result);
      }
    );
  });
};

exports.getPointHistory = (branchId) => {
    return new Promise((resolve, reject) => {
        db.query(`select p.time_stamp, c.first_name, c.last_name, c.nick_name,p.point,p.point_status,s.first_name as staffFirstname, p.prize_id
        from Customer c
                join Point p on c.customer_id = p.customer_id
                join Branch b on p.branch_id = b.branch_id
                join Staff s on p.staff_id = s.staff_id             
                where p.branch_id = ? order by p.time_stamp DESC`
            , [
                branchId
            ], (err, result) => {
                if (err) reject(err)
                resolve(result)
            });
    })
}

exports.getTotalPointTwo = (merchantId) => {
  return new Promise((resolve, reject) => {
    db.query(
      `
        select *
            from Point p
            join Customer c on p.customer_id = c.customer_id
            join Branch b on b.branch_id = p.branch_id
            where b.merchant_id = ? order by p.time_stamp desc;`[merchantId],
      (err, result) => {
        if (err) reject(err);
        resolve(result);
      }
    );
  });
};

exports.getCustomerPointByMerchantId = (merchantId, customerId) => {
  return new Promise((resolve, reject) => {
    db.query(
      `
        SELECT IFNULL((SELECT  reward - redeem
            FROM (SELECT SUM(point) as reward
                  FROM Point p left join Branch b on p.branch_id = b.branch_id
                 WHERE customer_id = c.customer_id and p.point_status = 'reward' and b.merchant_id = ?) as a,
                 (SELECT ifnull(SUM(point),0) as redeem
                  FROM Point p right join Branch b on p.branch_id = b.branch_id
                 WHERE customer_id = c.customer_id and p.point_status = 'redeem' and b.merchant_id = ?) as b) ,0)
                as totalPoint FROM Customer c where customer_id = ?
        `,
      [merchantId, merchantId, customerId],
      (err, result) => {
        if (err) reject(err);
        resolve(result);
      }
    );
  });
};

exports.getPointHistoryByMerchantIdAndCustomerId = (merchantId, customerId) => {
    return new Promise((resolve, reject) => {
      db.query(
        `
        select p.time_stamp, c.customer_id,p.point,p.point_status,b.branch_name,F.divider
        from Customer c
                join Point p on c.customer_id = p.customer_id
                join Branch b on p.branch_id = b.branch_id
                join Merchant M on b.merchant_id = M.merchant_id
                join Formula F on M.formula_id = F.formula_id

                where b.merchant_id = ? and c.customer_id = ? order by p.time_stamp DESC
          `,
        [merchantId,
        customerId],
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        }
      );
    });
  };
  