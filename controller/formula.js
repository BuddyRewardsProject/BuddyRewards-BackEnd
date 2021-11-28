const db = require('../model/dbConnection');

exports.addFormula = (formula) => {
    console.log(formula)
    return new Promise((resolve, reject) => {
        db.query("INSERT INTO Formula (formula_id, divider) VALUES (?,?)", 
        [
            formula.formulaId,
            formula.divider
        ], (err, result) => {
            if (err) reject(err)
            resolve(result)
        });
    })
}

exports.getFormulaById = (formulaId) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM Formula where formula_id = ?",[
            formulaId
        ],
            (err, result) => {
                if (err) reject(err)
                resolve(result)
            });
    })
}