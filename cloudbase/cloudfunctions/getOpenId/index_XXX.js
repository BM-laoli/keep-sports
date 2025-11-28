const cloud = require("wx-server-sdk");
const lodash = require("lodash");

class Res {
  static CodeEnum = {
    SUCCESS: 200,
    ERROR: 500,
  };

  static res = (data = {}) => {
    return {
      code: Res.CodeEnum.SUCCESS,
      success: true,
      message: "",
      data: {},
      ...data,
    };
  };
}

cloud.init({
  env: "keep-sport-5gn0lvxn1a592b35",
});

const db = cloud.database();
const DB_MAP = {
    users: "users",
    trainingPlane: "training-plane", // 训练计划
    trainingHistory: "training-history" // 任务打卡系统
}

//本系统不需要用户认证，直接使用 openid 作为用户唯一标识，要求每个集合的数据 存储的时候
// 都要带上 _openid 字段，如果是属于这个用户的 才能编辑，否则不能编辑

//------------- 用户系统
// 使用用户信息 向 我么自己的系统 的user 表进行记录
const registerUser = async (event, context) => {
  const { openid } = await getOpenid();
  //注册
  const reqInfo = {
    _openid: openid,
    _id: Date.now() + lodash.random(100, 999),
    ...event.data,
  }
  console.log("info", reqInfo);

  const userRow = await db.collection("users").add({
    data:reqInfo
  });

  return Res.res({
    data: userRow,
    message: "注册成功",
  });
};

// 获取用户信息
const getUserInfo = async (event, context) => {
  const { openid } = await getOpenid();

  const userRes = await db
    .collection("users")
    .where({
      _openid: openid,
    })
    .get();

  const res = {
    data: {},
  };

  if (userRes.data.length > 0) {
    res.data = userRes.data[0];
  } else {
    res.data = null;
  }

  return Res.res(res);
};

//获取openid
const getOpenid = async (event, context) => {
  const wxContext = cloud.getWXContext();
  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  };
};

// 更新用户信息
const updateUserInfo = async (event, context) => {
    delete event.data._id;
    const {data} = event;

    const res =  await db.collection("users").where({
        _openid: data._openid
    }).update({
      data:data
    })

    return Res.res({
        data:res,
        message:"更新成功"
    })

};

//-------------- 打卡系统


const EVENT_MAP = {
  FIND_USER_BY_OPENID: getUserInfo, //查询用户
  REGISTER_USER: registerUser, //注册用户
  UPDATE_USER_INFO_BY_OPENID: updateUserInfo, //更新用户信息
  GET_OPENID: getOpenid, //获取openid
};

// 用参数区分不同的API 逻辑好啦 简单些
exports.main = async (event, context) => {
  console.log("event -->", event);
  console.log("context -->", context);

  const value = await EVENT_MAP[event.type](event, context);
  return value;
};




/**

//注册
{
  "type": "REGISTER_USER",
  "data": {
    "nickName": "微信昵称",
    "avatarUrl": "头像地址",
    "realName": "张三", 
    "role": "worker"
  }
}

// 查用户 信息
{
 "type": "FIND_USER_BY_OPENID",
}

//编辑用户信息
{
    "type": "UPDATE_USER_INFO_BY_OPENID",
    "data": {
        "avatarUrl": "头像地址",
        "nickName": "微信昵称",
        "realName": "张三",
        "role": "worker",
        "_id": 1764218534267,
        "_openid": "oaiG55bI63xzaKMAmE3Avk39Vr8o"
    }
}
 */