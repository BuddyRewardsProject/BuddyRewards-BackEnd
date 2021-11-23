const db = require('../model/dbConnection');

exports.getPrizeById = (branchId) => {
    return new Promise((resolve, reject) => {
        db.query(`
        select c.customer_id, c.first_name, c.last_name, c.nick_name, c.phone, c.date_of_birth, c.gender
        from Point p
        join Customer c on p.customer_id = c.customer_id
        where p.branch_id = ? group by c.customer_id;`, 
        [
            branchId
        ], (err, result) => {
            if (err) reject(err)
            resolve(result)
        });
    })
}