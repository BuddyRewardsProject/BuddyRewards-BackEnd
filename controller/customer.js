const db = require('../model/dbConnection');

exports.addCustomer = (customer) => {
    return new Promise((resolve, reject) => {
        db.query("INSERT INTO Customer (customer_id, first_name, last_name, nick_name, email, password, phone, gender, date_of_birth, line_id, picture_url) VALUES (?,?,?,?,?,?,?,?,?,?,?)", 
        [
            customer.customerId,
            customer.customerFirstName,
            customer.customerLastName,
            customer.customerNickName,
            customer.customerEmail,
            customer.customerPassword,
            customer.customerPhone,
            customer.customerGender,
            customer.customerDOB,
            customer.lineId,
            customer.pictureUrl
        ], (err, result) => {
            if (err) reject(err)
            resolve(result)
        });
    })
}

exports.getCustomerIdById = (customerId) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT customer_id FROM Customer where customer_id = ?",
        [customerId],
            (err, result) => {
                if (err) reject(err)
                resolve(result)
            });
    })
}


exports.getCustomerIdByLineId = (lineId) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM Customer where line_id = ?",
        [lineId],
            (err, result) => {
                if (err) reject(err)
                resolve(result)
            });
    })
}


exports.getCustomerById = (customerId) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM Customer where customer_id = ?",
        [customerId],
            (err, result) => {
                if (err) reject(err)
                resolve(result)
            });
    })
}

exports.getCustomerByEmail = (email) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM Customer where email = ?",
        [
            email
        ],
            (err, result) => {
                if (err) reject(err)
                resolve(result)
            });
    })
}

exports.getCustomerLineContext = (line_context) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT line_context FROM Customer where line_context = ?",
        [
            line_context
        ],
            (err, result) => {
                if (err) reject(err)
                resolve(result)
            });
    })
}

exports.getAllMerchantNamebyCustomerId = (customerId) => {
    return new Promise((resolve, reject) => {
        db.query(`
        select distinct M.merchant_name,customer_id , B.merchant_id
        from Point
       join Branch B on B.branch_id = Point.branch_id
       join Merchant M on B.merchant_id = M.merchant_id
       where customer_id = ?
        `,
        [
            customerId
        ],
            (err, result) => {
                if (err) reject(err)
                resolve(result)
            });
    })
}

