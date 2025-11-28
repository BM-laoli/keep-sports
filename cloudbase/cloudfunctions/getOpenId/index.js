const cloud = require("wx-server-sdk");
const lodash = require("lodash");

// 初始化
cloud.init({
    env: "keep-sport-5gn0lvxn1a592b35",
});
const db = cloud.database();
const _ = db.command; // 引入数据库操作符
const COL_PLANE = "training-plane";

class Res {
  static CodeEnum = { SUCCESS: 200, ERROR: 500 };
  static res = (data = {}) => ({
    code: Res.CodeEnum.SUCCESS,
    success: true,
    message: "ok",
    data: {},
    ...data,
  });
  static error = (msg = "操作失败") => ({
    code: Res.CodeEnum.ERROR,
    success: false,
    message: msg
  });
}

// 通用：获取OpenID（这是权限控制的核心）
const getOpenid = async () => {
  const wxContext = cloud.getWXContext();
  return { openid: wxContext.OPENID };
};

// ------------- 1. 用户系统 -------------

const registerUser = async (event) => {
  const { openid } = await getOpenid();
  // 查重：防止重复注册
  const check = await db.collection("users").where({ _openid: openid }).count();
  if (check.total > 0) {
    return Res.error("您已注册，请直接登录");
  }

  const reqInfo = {
    ...event.data,
    _openid: openid, // 强制使用当前环境的openid
    createTime: Date.now(),
    // 注意：_id 建议由系统生成，或确保唯一。这里保留你的逻辑
    _id: Date.now() + lodash.random(100, 999), 
  };

  await db.collection("users").add({ data: reqInfo });
  const v = await getUserInfo()
  return Res.res({ data: v.data, message: "注册成功" });
};

const getUserInfo = async () => {
  const { openid } = await getOpenid();
  const userRes = await db.collection("users").where({ _openid: openid }).get();
  return Res.res({ data: userRes.data[0] || null });
};

const updateUserInfo = async (event) => {
  const { openid } = await getOpenid();
  const { data } = event;
  
  // 安全性剔除：不允许前端传 _id 和 _openid 来篡改关键建
  delete data._id;
  delete data._openid; 

  // ❗重要修正：查询条件必须使用 wxContext.OPENID，而不是前端传来的 data._openid
  // 否则黑客可以传别人的 openid 修改别人的数据
  const res = await db.collection("users").where({
    _openid: openid 
  }).update({
    data: data
  });

  return Res.res({ data: res, message: "更新成功" });
};


// ------------- 2. 打卡系统 (Training History) -------------

/**
 * 新增打卡
 * 前端传参示例：
 * {
 *   "type": "ADD_CHECK_IN",
 *   "data": {
 *      "dateStr": "2025-05-20", // 必填：前端根据时区生成的日期字符串
 *      "duration": 45,          // 必填：时长/数值
 *      "comment": "状态不错"
 *   }
 * }
 */
const addCheckIn = async (event) => {
  const { openid } = await getOpenid();
  const { dateStr, duration, comment } = event.data;

  if (!dateStr) return Res.error("缺少日期参数");

  const collection = db.collection("training-history");

  // 逻辑分支：是“每天只能打卡一次”还是“多次”？
  // 这里假设：同一天如果已经打卡，则覆盖（更新），否则新增。
  
  // 1. 先查有没有当天的记录
  const existRecord = await collection.where({
    _openid: openid,
    dateStr: dateStr
  }).get();

  if (existRecord.data.length > 0) {
    // 2. 如果有，更新它
    const docId = existRecord.data[0]._id;
    await collection.doc(docId).update({
      data: {
        duration: duration,
        comment: comment,
        updateTime: Date.now()
      }
    });
    return Res.res({ message: "今日打卡数据已更新" });
  } else {
    // 3. 如果没有，新增
    await collection.add({
      data: {
        _openid: openid,
        dateStr: dateStr,
        duration: duration || 0,
        comment: comment || "",
        isDone: true,
        createTime: Date.now()
      }
    });
    return Res.res({ message: "打卡成功" });
  }
};

/**
 * 获取打卡记录（用于生成热力图和周报）
 * 前端传参示例：
 * {
 *   "type": "GET_CHECK_IN_LIST",
 *   "data": {
 *      "startDate": "2025-01-01",
 *      "endDate": "2025-12-31"
 *   }
 * }
 */
const getCheckInList = async (event) => {
  const { openid } = await getOpenid();
  const { startDate, endDate } = event.data;

  // 每次最多取100条，如果一年数据很多，建议前端分月拉取或者云函数做聚合
  // 这里为了演示简单，直接拉取该范围内的所有数据
  
  const result = await db.collection("training-history")
    .where({
      _openid: openid,
      dateStr: _.gte(startDate).and(_.lte(endDate)) // dateStr 字符串比较在 YYYY-MM-DD 格式下是有效的
    })
    .orderBy('dateStr', 'asc') // 按日期排序
    .limit(366) // 防止数据过多
    .get();

  return Res.res({
    data: result.data,
    message: "获取记录成功"
  });
};


// ---------------------------------------------------------
//  Plan 业务逻辑 (Training Plane)
// ---------------------------------------------------------

/**
 * 创建新的训练计划
 * 入参 event.data: 包含 plan_overview, phases 等完整对象
 */
const createPlan = async (event, context) => {
    const { openid } = await getOpenid();
    const planData = event.data || {};
  
    // 移除可能混入的 _id 或 _openid，确保安全
    delete planData._id;
    delete planData._openid;
  
    // 自动补全 plan_overview 中的创建日期 (如果前端没传)
    if (!planData.plan_overview) planData.plan_overview = {};
    if (!planData.plan_overview.created_at) {
      planData.plan_overview.created_at = dayjs().format('YYYY-MM-DD');
    }
  
    const res = await db.collection(COL_PLANE).add({
      data: {
        ...planData,
        _openid: openid,           // 强制绑定当前用户
        createTime: db.serverDate(), // 系统创建时间 (用于排序)
        updateTime: db.serverDate()  // 系统更新时间
      }
    });
  
    return Res.res({
      _id: res._id,
      message: "计划创建成功"
    });
  };
  
  /**
   * 获取我的计划列表
   * 仅返回概要信息（plan_overview），减少网络传输量
   */
  const getPlanList = async (event, context) => {
    const { openid } = await getOpenid();
    
    const res = await db.collection(COL_PLANE)
      .where({
        _openid: openid
      })
      .orderBy('createTime', 'desc') // 按创建时间倒序
    //   .field({ // 返回所有数据
    //     // 列表页通常不需要 phases 这种超长的大数据，只取概要和ID即可
    //     // 如果你需要全部数据，注释掉 field 这部分即可
    //     _id: true,
    //     plan_overview: true,
    //     "phases.phase_name": true, // 也可以只取部分 phase 信息
    //     createTime: true
    //   })
      .get();
    return Res.res({
      data: res.data
    });
  };
  
  /**
   * 获取单个计划的完整详情
   * 入参 event.data.planId
   */
  const getPlanDetail = async (event, context) => {
    const { openid } = await getOpenid();
    const { planId } = event.data;
  
    if (!planId) return Res.err("缺少 planId");
  
    const res = await db.collection(COL_PLANE)
      .where({
        _id: planId,
        _openid: openid // 安全校验：只能看自己的
      })
      .get();
  
    if (res.data.length === 0) {
      return Res.err("计划不存在或无权访问");
    }
  
    return Res.res(res.data[0]);
  };
  
  /**
   * 更新计划
   * 入参 event.data.planId
   * 入参 event.data.payload: 要更新的数据对象 (例如整个 phases 数组，或者 plan_overview)
   */
  const updatePlan = async (event, context) => {
    const { openid } = await getOpenid();
    const { planId, payload } = event.data;
  
    if (!planId) return Res.err("缺少 planId");
    if (!payload) return Res.err("缺少更新数据 payload");
  
    // 防止用户恶意修改 _id 或 _openid
    delete payload._id;
    delete payload._openid;
  
    // 更新时间
    payload.updateTime = db.serverDate();
  
    // 使用 set 指令还是 update?
    // 既然结构很复杂，通常建议 update，但如果是 phases 数组变动，直接覆盖比较安全
    const res = await db.collection(COL_PLANE)
      .where({
        _id: planId,
        _openid: openid
      })
      .update({
        data: payload
      });
  
    return Res.res({
      updated: res.stats.updated,
      message: "计划更新成功"
    });
  };
  
  /**
   * 删除计划
   * 入参 event.data.planId
   */
  const deletePlan = async (event, context) => {
    const { openid } = await getOpenid();
    const { planId } = event.data;
  
    if (!planId) return Res.err("缺少 planId");
  
    const res = await db.collection(COL_PLANE)
      .where({
        _id: planId,
        _openid: openid
      })
      .remove();
  
    return Res.res({
      removed: res.stats.removed,
      message: "计划已删除"
    });
  };

// ------------- 入口分发 -------------

const EVENT_MAP = {
  // 用户相关
  FIND_USER_BY_OPENID: getUserInfo,
  REGISTER_USER: registerUser,
  UPDATE_USER_INFO_BY_OPENID: updateUserInfo,

  // 打卡相关
  ADD_CHECK_IN: addCheckIn,      // 新增/更新打卡
  GET_CHECK_IN_LIST: getCheckInList, // 获取列表

  CREATE_PLAN: createPlan,        // 创建新计划
  GET_PLAN_LIST: getPlanList,     // 获取我的计划列表
  GET_PLAN_DETAIL: getPlanDetail, // 获取单个计划详情
  UPDATE_PLAN: updatePlan,        // 更新计划
  DELETE_PLAN: deletePlan,        // 删除计划
};

exports.main = async (event, context) => {
  if (!EVENT_MAP[event.type]) {
    return Res.error(`未知的操作类型: ${event.type}`);
  }
  return await EVENT_MAP[event.type](event, context);
};