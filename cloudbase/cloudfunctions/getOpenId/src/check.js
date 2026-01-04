// 打卡系统的拓展
const cloud = require('wx-server-sdk');
cloud.init({
    env: "keep-sport-5gn0lvxn1a592b35",
});
const db = cloud.database();
const _ = db.command;

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

// --- 内部私有：原来的 addCheckIn 逻辑 (保持不变，仅封装) ---
const _addToHistory = async (openid, dateStr, duration, comment) => {
  const collection = db.collection("training-history");
  const existRecord = await collection.where({ _openid: openid, dateStr }).get();

  if (existRecord.data.length > 0) {
    const docId = existRecord.data[0]._id;
    await collection.doc(docId).update({
      data: {
        duration: duration, 
        comment: comment,
        updateTime: Date.now()
      }
    });
    return { status: 'UPDATED' };
  } else {
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
    return { status: 'CREATED' };
  }
};

// --- 1. TrainingConfig 模块 ---

const setConfig = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { targetCount = 1, mode = 'simple' } = event.data;

  const res = await db.collection('training-config').where({ _openid: OPENID }).get();

  if (res.data.length > 0) {
    await db.collection('training-config').doc(res.data[0]._id).update({
      data: { targetCount, mode, updateTime: Date.now() }
    });
    return  Res.res({data:{},message:"Config Updated" });
  } else {
    await db.collection('training-config').add({
      data: { _openid: OPENID, targetCount, mode, createTime: Date.now() }
    });
    return  Res.res({data:{},message:"Config Created" });
  }
};

const getConfig = async () => {
  const { OPENID } = cloud.getWXContext();
  const res = await db.collection('training-config').where({ _openid: OPENID }).get();
  return  Res.res({data:res.data[0] || null,message:"Config Updated" }); 
};

// --- 2. TrainingLog 模块 ---

const getTodayProgress = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { dateStr } = event.data;
  
  const logs = await db.collection('training-log').where({ _openid: OPENID, dateStr }).get();
  const config = await db.collection('training-config').where({ _openid: OPENID }).get();
  
  const target = config.data.length > 0 ? config.data[0].targetCount : 1;
  const current = logs.data.length;

  resData = Res.res({data:{
    currentCount: current,
      targetCount: target,
      logs: logs.data,
      isDone: current >= target
  } || null,message:"" });

  return resData;
};

const addLog = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { dateStr, duration, comment } = event.data;

    // +++ [新增] 兜底检查：如果 history 表已存在当天记录，直接阻断 +++
  // 防止用户在已完成的情况下（比如网络延迟或并发）重复打卡
  const historyExist = await db.collection('training-history').where({
    _openid: OPENID,
    dateStr: dateStr
  }).count();

  if (historyExist.total > 0) {
    // 直接返回错误信息，前端接收到后会提示用户
    return Res.error("今日已完成打卡，无需重复提交");
  }

  await db.collection('training-log').add({
    data: {
      _openid: OPENID,
      dateStr,
      duration: duration || 0,
      comment: comment || "",
      timestamp: Date.now()
    }
  });

  const countRes = await db.collection('training-log').where({ _openid: OPENID, dateStr }).count();
  const currentCount = countRes.total;

  const configRes = await db.collection('training-config').where({ _openid: OPENID }).get();
  const targetCount = configRes.data.length > 0 ? configRes.data[0].targetCount : 1;

  if (currentCount >= targetCount) {
    await _addToHistory(OPENID, dateStr, duration, comment);
    const redData = Res.res({
      data:{
        isDone: true,
        currentCount,
        targetCount
      },
      message:"Goal Reached! History Updated."
    })
    return redData;
  }

  return Res.res({
      data:{
        isDone: false,
        currentCount,
        targetCount
      },
      message:"Log Added"
    });
};


module.exports = {
  setConfig,
  getConfig,
  getTodayProgress,
  addLog
}

// exports.main = async (event, context) => {
//   switch (event.type) {
//     case 'SET_CONFIG': return await setConfig(event);
//     case 'GET_CONFIG': return await getConfig(event);
//     case 'ADD_LOG':    return await addLog(event);
//     case 'GET_TODAY_PROGRESS': return await getTodayProgress(event);
//     default: return { code: -1, msg: 'Unknown Type' };
//   }
// };