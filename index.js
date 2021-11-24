const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const functions = require("./utils/functions");
const crypto = require("crypto");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const request = require("request");
const branch = require("./controller/branch");
const category = require("./controller/category");
const district = require("./controller/district");
const province = require("./controller/province");
const merchant = require("./controller/merchant");
const staff = require("./controller/staff");
const customer = require("./controller/customer");
const login = require("./controller/login");
const staffRole = require("./controller/staffRole");
const formula = require("./controller/formula");
const prize = require("./controller/prize");
const moment = require("moment");
require("moment-timezone");
const point = require("./controller/point");
const member = require("./controller/member");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

//Merchant Login
app.post("/merchant/v1/login", async (req, res) => {
  var userName = req.body.userName;
  var hashPassword = req.body.hashPassword;
  var result = await login.getUserById(userName);

  if (result.length > 0) {
    if (result[0].password !== hashPassword) {
      var data = {
        status: "error",
        errorMessage: "ไอดี หรือ รหัสผ่านไม่ถูกต้อง ",
      };
      return functions.responseJson(res, data);
    }
    var user = {
      branchId: result[0].branch_id,
      branchName: result[0].branch_name,
      rewardType: result[0].reward_type,
      phone: result[0].phone,
      userName: result[0].user_name,
      masterAccount: result[0].master_account,
      districtId: result[0].district_id,
      merchantId: result[0].merchant_id,
      merchantName: result[0].merchant_name,
    };
    var data = {
      status: "success",
      accessToken: generateAccessToken(user),
    };
    return functions.responseJson(res, data);
  } else {
    var data = {
      status: "error",
      errorMessage: "ไม่พบข้อมูลโปรดลองใหม่อีกครั้ง",
    };

    return functions.responseJson(res, data);
  }
});

//Pin Login
app.post("/merchant/v1/login/pin", authenticateToken, async (req, res) => {
  var pin = req.body.pincode;
  var authHeader = req.headers["authorization"];
  var token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);
  var decode = jwt.decode(token);

  var data = {
    pincode: pin,
    branchId: decode.branchId,
  };
  var user = await staff.getStaffByPin(data);
  if (user.length > 0) {
    if (user[0].branch_id !== decode.branchId) {
      var data = {
        status: "error",
        errorMessage: "Username or Password is incorrect...",
      };
      return functions.responseJson(res, data);
    }
    if (pin === user[0].pincode) {
      var userInfo = {
        staffId: user[0].staff_id,
        firstName: user[0].first_name,
        lastName: user[0].last_name,
        phone: user[0].phone,
        pincode: user[0].pincode,
        roleId: user[0].role_id,
        branchId: user[0].branch_id,
      };
      var data = {
        status: "success",
        pinToken: generatePinToken(userInfo),
      };
      return functions.responseJson(res, data);
    } else {
      var data = {
        status: "error",
        errorMessage: "Conflict",
      };
      return functions.responseJson(res, data);
    }
  } else {
    var data = {
      status: "error",
      errorMessage: "Conflict",
    };
    return functions.responseJson(res, data);
  }
});

app.post(
  "/merchant/v1/login/pin/check",
  authenticateToken,
  async (req, res) => {
    var branchId = req.body.branchId;
    var user = await staff.getStaffByBranchId(branchId);

    if (user.length > 0) {
      if (user[0].pincode === null) {
        var data = {
          status: "unsuccess",
        };
        return functions.responseJson(res, data);
      } else {
        var data = {
          status: "success",
        };
        return functions.responseJson(res, data);
      }
    } else {
      var data = {
        status: "error",
        errorMessage: "Conflict",
      };
      return functions.responseJson(res, data);
    }
  }
);

//Register
app.post("/merchant/v1/register", async (req, res) => {
  var registerData = req.body.data;
  var generate = Math.round(new Date().getTime() / 1000);
  var hash = crypto.createHmac("sha512", process.env.SECRET_KEY);
  hash.update(registerData.merchantPassword);
  var hasedPassword = hash.digest("hex");
  var genFormulaId = generate;

  if (registerData.merchantName === "") {
    var data = {
      status: "error",
      errorMessage: "Conflict",
    };
    return functions.responseJson(res, data);
  }
  var merchantInfo = {
    merchantId: generate,
    merchantName: registerData.merchantName,
    rewardType: registerData.rewardType,
    formulaId: genFormulaId,
  };
  var branchInfo = {
    branchName: registerData.branchName,
    phone: registerData.branchPhone,
    userName: registerData.merchantUserName,
    password: hasedPassword,
    masterAccount: 1,
    districtId: registerData.districtName,
    merchantId: generate,
  };
  var formulaInfo = {
    formulaId: genFormulaId,
    divider: registerData.divider,
  };
  try {
    var formulaState = await formula.addFormula(formulaInfo);
    var merchantState = await merchant.addMerchant(merchantInfo);
    var branchState = await branch.addBranch(branchInfo);

    if (
      merchantState.affectedRows === 1 &&
      branchState.affectedRows === 1 &&
      formulaState.affectedRows === 1
    ) {
      var staffInfo = {
        staffId: generate,
        firstName: registerData.ownerFirstName,
        lastName: registerData.ownerLastName,
        pincode: registerData.staffPin,
        phone: registerData.staffPhone,
        roleId: 1,
        branchId: branchState.insertId,
      };
      var staffState = await staff.addStaff(staffInfo);
      if (staffState.affectedRows === 1) {
        var data = {
          status: "success",
        };
        return functions.responseJson(res, data);
      }
    }
  } catch (error) {
    var data = {
      status: "error",
      errorMessage: "Conflict",
    };
    return functions.responseJson(res, data);
  }
});

app.post(
  "/merchant/v1/branch/branchmanagement/add",
  authenticatePinToken,
  async (req, res) => {
    var registerData = req.body.data;
    var generate = Math.round(new Date().getTime() / 1000);
    var hash = crypto.createHmac("sha512", process.env.SECRET_KEY);
    hash.update(registerData.merchantPassword);
    var hasedPassword = hash.digest("hex");
    var authHeader = req.headers["authorization"];
    var token = authHeader && authHeader.split(" ")[1];

    if (token == null) return res.sendStatus(401);
    var decode = jwt.decode(token);
    if (
      decode.roleId !== undefined &&
      decode.roleId === 2 &&
      decode.roleId === 3 &&
      jwt.decode(registerData.userToken).masterAccount === 0
    ) {
      var data = {
        status: "error",
        errorMessage: "Do not have permittion",
      };
      return functions.responseJson(res, data);
    }

    var branchInfo = {
      branchName: registerData.branchName,
      phone: registerData.branchPhone,
      userName: registerData.merchantUserName,
      password: hasedPassword,
      masterAccount: 0,
      districtId: registerData.districtName,
      merchantId: jwt.decode(registerData.userToken).merchantId,
    };
    try {
      var branchState = await branch.addBranch(branchInfo);
      if (branchState.affectedRows === 1) {
        var staffInfo = {
          staffId: generate,
          firstName: decode.firstName,
          lastName: decode.lastName,
          pincode: decode.pincode,
          phone: decode.phone,
          roleId: 1,
          branchId: branchState.insertId,
        };
        var staffState = await staff.addStaff(staffInfo);
        if (staffState.affectedRows === 1) {
          var data = {
            status: "success",
          };
          return functions.responseJson(res, data);
        } else {
          var data = {
            status: "error",
            errorMessage: "Error",
          };
          return functions.responseJson(res, data);
        }
      }
    } catch (error) {
      var data = {
        status: "error",
        errorMessage: "Conflict",
      };
      return functions.responseJson(res, data);
    }
  }
);

//add staff in branch
app.post(
  "/merchant/v1/branch/staff/add",
  authenticatePinToken,
  async (req, res) => {
    var authHeader = req.headers["authorization"];
    var token = authHeader && authHeader.split(" ")[1];

    if (token == null) return res.sendStatus(401);
    var decode = jwt.decode(token);

    if (decode.roleId !== undefined && decode.roleId === 3) {
      var data = {
        status: "error",
        errorMessage: "Do not have permittion",
      };
      return functions.responseJson(res, data);
    }
    var staffData = req.body.data;
    var generate = Math.round(new Date().getTime() / 1000);

    if (staffData.firstName === "") {
      var data = {
        status: "error",
        errorMessage: "Empty",
      };
      return functions.responseJson(res, data);
    }
    var staffInfo = {
      staffId: generate,
      firstName: staffData.staffFirstName,
      lastName: staffData.staffLastName,
      pincode: staffData.staffPin,
      phone: staffData.staffPhone,
      roleId: staffData.roleId,
      branchId: staffData.branchId,
    };
    try {
      var staffState = await staff.addStaffManagement(staffInfo);
      if (staffState.affectedRows === 1) {
        var data = {
          status: "success",
        };
        return functions.responseJson(res, data);
      }
    } catch (error) {
      var data = {
        status: "error",
        errorMessage: "Conflict",
      };
      return functions.responseJson(res, data);
    }
  }
);

app.post(
  "/merchant/v1/branch/staff/remove",
  authenticatePinToken,
  async (req, res) => {
    var authHeader = req.headers["authorization"];
    var token = authHeader && authHeader.split(" ")[1];

    if (token == null) return res.sendStatus(401);
    var decode = jwt.decode(token);

    if (decode.roleId !== undefined && decode.roleId === 3) {
      var data = {
        status: "error",
        errorMessage: "Do not have permittion",
      };
      return functions.responseJson(res, data);
    }

    var staffId = req.body.staffId;
    try {
      var staffState = await staff.removeStaffManagement(staffId);
      if (staffState.affectedRows === 1) {
        var data = {
          status: "success",
        };
        return functions.responseJson(res, data);
      }
    } catch (error) {
      var data = {
        status: "error",
        errorMessage: "Conflict",
      };
      return functions.responseJson(res, data);
    }
  }
);

app.get("/merchant/v1/register/init", async (req, res) => {
  var categoryInfo = await category.getCategory();
  var provinceInfo = await province.getProvince();
  var districtInfo = await district.getDistrict();

  var data = {
    status: "sucess",
    categories: categoryInfo,
    provinces: provinceInfo,
    districts: districtInfo,
  };
  return functions.responseJson(res, data);
});

app.post("/merchant/v1/branch/staff/init", async (req, res) => {
  var branchId = req.body.branchId;
  var staffList = await staff.getStaffByBranchId(branchId);
  var staffRoleInfo = await staffRole.getStaffRole();

  var data = {
    status: "sucess",
    staffList: staffList,
    roles: staffRoleInfo,
  };
  return functions.responseJson(res, data);
});

app.post("/merchant/v1/branch/branchmanagement/init", async (req, res) => {
  var merchantId = req.body.branchId;
  var categoryInfo = await category.getCategory();
  var provinceInfo = await province.getProvince();
  var districtInfo = await district.getDistrict();
  var branchList = await branch.getBranchByMerchantId(merchantId);

  var data = {
    status: "sucess",
    branchList: branchList,
    categories: categoryInfo,
    provinces: provinceInfo,
    districts: districtInfo,
  };
  return functions.responseJson(res, data);
});

app.get("/merchant/v1/categories", (req, res) => {
  category
    .getCategory()
    .then((e) => {
      var data = {
        status: "sucess",
        categories: e,
      };
      return functions.responseJson(res, data);
    })
    .catch((e) => {
      var data = {
        status: "error",
        errorMessage: e,
      };
      return functions.responseJson(res, data);
    });
});

app.get("/merchant/v1/branch/staff/role", authenticatePinToken, (req, res) => {
  staffRole
    .getStaffRole()
    .then((e) => {
      var data = {
        status: "sucess",
        roles: e,
      };
      return functions.responseJson(res, data);
    })
    .catch((e) => {
      var data = {
        status: "error",
        errorMessage: e,
      };
      return functions.responseJson(res, data);
    });
});

//---------------------------------------- Reward Point System ----------------------------------------
app.post(
  "/merchant/v1/branch/webpos/customerInfo",
  authenticatePinToken,
  async (req, res) => {
    var inputData = req.body.data;
    if (inputData === "") {
      var data = {
        status: "error",
        errorMessage: "inputData = Null",
      };
      return functions.responseJson(res, data);
    } else {
      var user = await customer.getCustomerById(inputData.customerId);
      if (user.length > 0) {
        var customerInfo = {
          customerId: user[0].customer_id,
          customerNickName: user[0].nick_name,
          customerFirstName: user[0].first_name,
          customerPhone: user[0].phone,
          customerLastName: user[0].last_name,
          customerEmail: user[0].email,
          customerDOB: moment(user[0].date_of_birth).format("DD/MM/YYYY"),
        };
        var data = {
          status: "success",
          customerInfo: customerInfo,
        };
        return functions.responseJson(res, data);
      } else {
        var data = {
          status: "error",
          errorMessage: "Error",
        };
        return functions.responseJson(res, data);
      }
    }
  }
);

app.post("/merchant/v1/calculate", async (req, res) => {
  var price = req.body.data.price;
  var merchantId = req.body.data.merchantId;
  var merchantInfo = await merchant.getMerchantById(merchantId);
  var formulaInfo = await formula.getFormulaById(merchantInfo[0].formula_id);
  var divider = formulaInfo[0].divider;
  var resultPoint = price / divider;

  var data = {
    status: "success",
    resultPoint: parseInt(resultPoint),
  };
  return functions.responseJson(res, data);
});

app.post("/merchant/v1/totalPoint", async (req, res) => {
  var info = {
    customerId: req.body.data.customerId,
    merchantId: req.body.data.merchantId,
  };
  var customerPoint = await point.getTotalPoint(info);

  if (customerPoint.length === 0) {
    var data = {
      status: "error",
      errorMessage: "Null",
    };
    return functions.responseJson(res, data);
  }
  var data = {
    status: "success",
    customerPoint: customerPoint[0].result,
  };
  return functions.responseJson(res, data);
});

app.post("/merchant/v1/addPoint", authenticatePinToken, async (req, res) => {
  var authHeader = req.headers["authorization"];
  var token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);
  var decode = jwt.decode(token);
  var rewardData = req.body.data;

  var pointData = {
    point: rewardData.point,
    pointStatus: "reward",
    timeStamp: moment().tz("Asia/Bangkok").format(),
    branchId: decode.branchId,
    customerId: rewardData.customerId,
    staffId: decode.staffId,
  };
  try {
    var pointState = await point.addPoint(pointData);

    if (pointState.affectedRows === 1) {
      var data = {
        status: "success",
      };
      //message
      var user = await customer.getCustomerById(rewardData.customerId);
      var merchantInfo = await merchant.getMerchantById(rewardData.merchantId);
      var branchInfo = await branch.getBranchById(rewardData.branchId);
      var request = require("request");
      var options = {
        method: "POST",
        url: "https://api.line.me/v2/bot/message/push",
        headers: {
          Authorization:
            "Bearer aHWepJVgrz/uWn+EIztg3U5364iasK2r9yAAQSOfZ0qnNshGRpiG41L0YDKyuf1scGxRywDimRu1LGKcvQlcTQhgMDGtdF6sDPDse1zr008cTR4e0B3x2cE3ApAJz7EZrx9NA3nN52ipcnC6CZ3v8QdB04t89/1O/w1cDnyilFU=",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: user[0].line_id,
          messages: [
            {
              type: "flex",
              altText:
                "คุณได้รับ " +
                rewardData.point +
                " แต้ม จาก " +
                `${merchantInfo[0].merchant_name}` +
                " " +
                `${branchInfo[0].branch_name}`, //เปลี่ยน
              contents: {
                type: "bubble",
                size: "kilo",
                body: {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "text",
                          text: "สะสม / รับ", //เปลี่ยน
                          weight: "bold",
                          size: "md",
                          color: "#FF7A12FF",
                          align: "start",
                          gravity: "center",
                          contents: [],
                        },
                        {
                          type: "image",
                          url: "https://cdn.discordapp.com/attachments/629314902602809345/910457263964192768/Group_233buddyreward.png", //เปลี่ยน
                          margin: "none",
                          align: "end",
                          size: "xs",
                          aspectRatio: "16:9",
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "baseline",
                      margin: "none",
                      contents: [
                        {
                          type: "text",
                          text: rewardData.point + " แต้ม", //เปลี่ยน
                          weight: "bold",
                          size: "3xl",
                          align: "start",
                          contents: [],
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            {
                              type: "text",
                              text: moment()
                                .tz("Asia/Bangkok")
                                .format("DD/MM/YYYY HH:mm"), //เปลี่ยน
                              size: "sm",
                              color: "#949494FF",
                              align: "start",
                              margin: "sm",
                              contents: [],
                            },
                          ],
                        },
                        {
                          type: "separator",
                          margin: "md",
                          color: "#C3C3C3FF",
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      spacing: "sm",
                      margin: "md",
                      contents: [
                        {
                          type: "box",
                          layout: "baseline",
                          spacing: "sm",
                          contents: [
                            {
                              type: "text",
                              text: "ร้านค้า",
                              size: "md",
                              color: "#AAAAAA",
                              flex: 1,
                              align: "start",
                              gravity: "top",
                              wrap: true,
                              contents: [],
                            },
                            {
                              type: "text",
                              text: `${merchantInfo[0].merchant_name}`, //เปลี่ยน
                              size: "md",
                              color: "#666666",
                              align: "end",
                              wrap: true,
                              contents: [],
                            },
                          ],
                        },
                        {
                          type: "box",
                          layout: "baseline",
                          spacing: "sm",
                          contents: [
                            {
                              type: "text",
                              text: "สาขา",
                              size: "md",
                              color: "#AAAAAA",
                              flex: 1,
                              contents: [],
                            },
                            {
                              type: "text",
                              text: `${branchInfo[0].branch_name}`, //เปลี่ยน
                              size: "md",
                              color: "#666666",
                              align: "end",
                              wrap: true,
                              contents: [],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          ],
        }),
      };
      request(options, function (error, response) {
        if (error) throw new Error(error);
        console.log(response.body);
      });

      return functions.responseJson(res, data);
    }
  } catch (error) {
    console.log(error);
    var data = {
      status: "error",
      errorMessage: "Conflict",
    };
    return functions.responseJson(res, data);
  }
});

//-------------------------------------------- Redeem Point System ----------------------------------------
app.post("/merchant/v1/createPrize", authenticatePinToken, async (req, res) => {
  var authHeader = req.headers["authorization"];
  var token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);
  var decode = jwt.decode(token);

  if (decode.roleId !== undefined && decode.roleId === 3) {
    var data = {
      status: "error",
      errorMessage: "Do not have permittion",
    };
    return functions.responseJson(res, data);
  }
  var prizeData = req.body.data;
  if (prizeData.prizeName === "") {
    var data = {
      status: "error",
      errorMessage: "Empty",
    };
    return functions.responseJson(res, data);
  }
  var prizeInfo = {
    prizeName: prizeData.prizeName,
    prizeDetail: prizeData.prizeDetail,
    prizePointCost: prizeData.prizePointCost,
    branchId: prizeData.branchId, //Waiting for testing
  };
  try {
    var prizeState = await prize.addPrize(prizeInfo);
    if (prizeState.affectedRows === 1) {
      var data = {
        status: "success",
      };
      return functions.responseJson(res, data);
    }
  } catch (error) {
    var data = {
      status: "error",
      errorMessage: "Conflict",
    };
    return functions.responseJson(res, data);
  }
});

app.post("/merchant/v1/prizeInit", authenticatePinToken, async (req, res) => {
  var branchId = req.body.branchId;
  var prizeList = await prize.getPrizeByBranchId(branchId);

  var data = {
    status: "sucess",
    prizeList: prizeList,
  };
  return functions.responseJson(res, data);
});

app.post("/merchant/v1/removePrize", authenticatePinToken, async (req, res) => {
  var authHeader = req.headers["authorization"];
  var token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);
  var decode = jwt.decode(token);

  if (decode.roleId !== undefined && decode.roleId === 3) {
    var data = {
      status: "error",
      errorMessage: "Do not have permittion",
    };
    return functions.responseJson(res, data);
  }

  var prizeId = req.body.prizeId;
  try {
    var prizeState = await prize.removePrize(prizeId);
    if (prizeState.affectedRows === 1) {
      var data = {
        status: "success",
      };
      return functions.responseJson(res, data);
    }
  } catch (error) {
    var data = {
      status: "error",
      errorMessage: "Conflict",
    };
    return functions.responseJson(res, data);
  }
});

//-------------------------------------------- History -----------------------------------------
app.post(
  "/merchant/v1/pointHistory",
  authenticatePinToken,
  async (req, res) => {
    var branchId = req.body.branchId;
    var pointList = await point.getPointHistory(branchId);

    var data = {
      status: "sucess",
      pointList: pointList,
    };
    return functions.responseJson(res, data);
  }
);

app.post("/merchant/v1/myMember", async (req, res) => {
  
  
  console.log(req.body.token);
  var decode = jwt.decode(req.body.token);
console.log(decode)
var customerList = await member.getTotalPointByMerchantId(decode.merchantId);
  var data = {
    status: "sucess",
    customerList: customerList,
  };
  
  return functions.responseJson(res, data);
});



//-------------------------------------------- Customer -----------------------------------------
app.post("/customer/v1/home", authenticateCustomerToken, async (req, res) => {
  var email = req.body.email;
  var authHeader = req.headers["authorization"];
  var token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);
  var customerInfo = await customer.getCustomerByEmail(email);

  var data = {
    status: "sucess",
    customerInfo: customerInfo,
  };
  return functions.responseJson(res, data);
});

app.get("/customer/v1/accCheck", async (req, res) => {
  var lineContext = req.body.accessToken;
  var result = await customer.getCustomerLineContext(lineContext);

  var result = {
    customerLineContext: result[0].line_context,
  };

  if (result.length > 0) {
    if (result[0].customerLineContext !== lineContext) {
      var data = {
        status: "none",
        errorMessage: "none",
      };
      return functions.responseJson(res, data);
    }
  }
});

//Create Customer
app.post("/customer/v1/register", async (req, res) => {
  var registerData = req.body.data;
  var generate = Math.round(new Date().getTime() / 1000);
  var hash = crypto.createHmac("sha512", process.env.SECRET_KEY);
  hash.update(registerData.customerPassword);
  var hasedPassword = hash.digest("hex");

  if (registerData === "") {
    //Null check
    var data = {
      status: "error",
      errorMessage: "registerData=Null",
    };
    return functions.responseJson(res, data);
  }
  var token = registerData.customerToken;
  //console.log(token)

  var options = {
    method: "GET",
    url: "https://api.line.me/v2/profile",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  request(options, async function (error, response) {
    if (error) throw new Error(error);
    var user = JSON.parse(response.body);
    var customerInfo = {
      customerId: generate,
      customerFirstName: registerData.customerFirstName,
      customerLastName: registerData.customerLastName,
      customerNickName: registerData.customerNickName,
      customerEmail: registerData.customerEmail,
      customerPassword: hasedPassword,
      customerPhone: registerData.customerPhone,
      customerGender: registerData.customerGender,
      customerDOB: registerData.customerDOB,
      lineId: user.userId,
      pictureUrl: user.pictureUrl,
    };

    try {
      var customerState = await customer.addCustomer(customerInfo); //console.log(customerState)

      if (customerState.affectedRows === 1) {
        var data = {
          status: "success",
        };
        return functions.responseJson(res, data);
      }
    } catch (error) {
      var data = {
        status: "error",
        errorMessage: "unsuccessAddCustomer",
      };
      return functions.responseJson(res, data);
    }
  });
});

app.post("/customer/v1/liff", async (req, res) => {
  var token = req.body.accessToken;
  var options = {
    method: "GET",
    url: "https://api.line.me/v2/profile",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  request(options, async function (error, response) {
    if (error) throw new Error(error);
    var user = JSON.parse(response.body);
    var result = await customer.getCustomerIdByLineId(user.userId);

    if (result.length === 0) {
      var data = {
        status: "error",
        redirect: "/customer/register",
      };
      return functions.responseJson(res, data);
    }
    var customerInfo = {
      customerId: result[0].customer_id,
      customerFirstName: result[0].first_name,
      customerLastName: result[0].last_name,
      customerNickName: result[0].nick_name,
      customerEmail: result[0].email,
      customerPhone: result[0].phone,
      customerGender: result[0].gender,
      customerDOB: result[0].date_of_birth,
      customerPic: result[0].picture_url,
    };
    var data = {
      status: "success",
      customerToken: generateCustomerAccessToken(customerInfo),
    };
    return functions.responseJson(res, data);
  });
});

// Customer Login
app.post("/customer/v1/login", async (req, res) => {
  var email = req.body.email;
  var hashpassword = req.body.hashpassword;
  var result = await customer.getCustomerByEmail(email);

  if (result.length > 0) {
    if (result[0].password !== hashpassword) {
      var data = {
        status: "error",
        errorMessage: "Password is incorrect",
      };
      return functions.responseJson(res, data);
    }
    var customerInfo = {
      customerId: result[0].customer_id,
      customerFirstName: result[0].first_name,
      customerLastName: result[0].last_name,
      customerNickName: result[0].nick_name,
      customerEmail: result[0].email,
      customerPhone: result[0].phone,
      customerGender: result[0].gender,
      customerDOB: result[0].date_of_birth,
      customerPic: result[0].picture_url,
    };

    var data = {
      status: "success",
      customerToken: generateCustomerAccessToken(customerInfo),
    };
    return functions.responseJson(res, data);
  } else {
    var data = {
      status: "error",
      errorMessage: "Username or Password is incorrect",
    };
    return functions.responseJson(res, data);
  }
});

//----------------------------------------- Server/Token --------------------------------------
app.listen(process.env.PORT, () => {
  console.log("Server is running on port 3001");
});

function generateAccessToken(user) {
  return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1800s" });
}
function generatePinToken(user) {
  return jwt.sign(user, process.env.JWT_PIN_SECRET, { expiresIn: "1800s" });
}
function generateCustomerAccessToken(user) {
  return jwt.sign(user, process.env.JWT_CUSTOMER_SECRET, {
    expiresIn: "1800s",
  });
}
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    console.log(err);

    if (err) return res.sendStatus(403);

    req.user = user;

    next();
  });
}
function authenticatePinToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_PIN_SECRET, (err, user) => {
    console.log(err);

    if (err) return res.sendStatus(403);

    req.user = user;

    next();
  });
}
function authenticateCustomerToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_CUSTOMER_SECRET, (err, user) => {
    console.log(err);

    if (err) return res.sendStatus(403);

    req.user = user;

    next();
  });
}
