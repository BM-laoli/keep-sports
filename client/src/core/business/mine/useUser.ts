import Taro from "@tarojs/taro";
import { updateUser } from "src/core/http";
import { setter } from "src/core/store/utils";
import { create } from "zustand";
import { combine } from "zustand/middleware";

// 1. 定义用户数据接口
export interface UserInfo {
  avatarUrl: string;
  nickName: string;
  realName: string;
  role: "worker" | "admin" | string;
  _id?: number | string;
  _openid?: string;
}

interface IUserState {
  userInfo: UserInfo;
}

interface IUserAction {
  setUserInfo: (info: UserInfo) => void;
  updateRealName: (name: string) => void; // 单独更新名字的动作
}

// 2. 默认数据 (模拟未登录或初始状态，这里直接填入你提供的数据作为演示)
export const DEFAULT_USER: UserInfo = {
  avatarUrl: "https://api.dicebear.com/9.x/notionists/svg?seed=Felix", // 示例头像
  nickName: "微信昵称",
  realName: "李四",
  role: "worker",
};

const userState = create(
  combine<IUserState, IUserAction>(
    {
      userInfo: DEFAULT_USER,
    },
    (set) => ({
      // 通用 setter，用于替换整个对象 (比如登录后)
      setUserInfo: setter("userInfo")(set),
      
      // 专门用于更新 realName 的 action
      updateRealName: (name: string) => 
        set((state) => ({
          userInfo: { ...state.userInfo, realName: name }
        })),
    })
  )
);

export const setUserInfo = (v) => {
  userState.getState().setUserInfo(v);
};


export const useUser = () => {
  const store = userState();
  
  const updateUserInfo = async (newUser) => {
    Taro.showLoading({title:"更新中"})
    await updateUser(newUser)
    setUserInfo(newUser)
    Taro.hideLoading()
  }

  return {
    ...store,
    // 如果需要可以在这里增加 computed 属性，例如 isAdmin
    isAdmin: store.userInfo.role === 'admin',
    updateUserInfo
  };
};

export const initUser =async () => {
    // 使用 DiceBear API 生成高质量随机头像
  const randomSeed = Math.random().toString(36).substring(7);
  const randomAvatar = `https://api.dicebear.com/9.x/notionists/svg?seed=${randomSeed}`;


  // wx 云开发支持
  await Taro.cloud.init({
    env:'keep-sport-5gn0lvxn1a592b35',
    traceUser:true
  })
  
  //先找一下有没有用户信息
  const userInfo = await Taro.cloud.callFunction({
    name:'getOpenId',
    data:{
      type:'FIND_USER_BY_OPENID'
    }
  })
  let res = userInfo as any
  if(res.result?.data?._id){
    //已经注册 存入数据
    setUserInfo(res.result.data)
  }else {
    // 新用户
    const newUser = await Taro.cloud.callFunction({
      name:'getOpenId',
      data:{
        type:'REGISTER_USER',
        data:{
          ...DEFAULT_USER,
          avatarUrl:randomAvatar,
        }
      }
    });
    const res  = newUser as any
    setUserInfo(res.result.data)
  }

}