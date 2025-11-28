// 用户的CRUD操作

import Taro from "@tarojs/taro"
import { DEFAULT_USER } from "../business/mine"

const createUser = async () => {
    const newUser = await Taro.cloud.callFunction({
        name:'getOpenId',
        data:{
          type:'REGISTER_USER',
          data:DEFAULT_USER
        }
      });
      const res  = newUser as any
      return res.result
}

const getUser = async () => {
    const userInfo = await Taro.cloud.callFunction({
        name:'getOpenId',
        data:{
          type:'FIND_USER_BY_OPENID'
        }
      })
    const res = userInfo as any
    return res.result
}

const updateUser = async (newUserInfo) => {
    const newUser = await Taro.cloud.callFunction({
        name:'getOpenId',
        data:{
          type:'UPDATE_USER_INFO_BY_OPENID',
          data:newUserInfo
        }
      });
      const res  = newUser as any
      return res.result
}

export {
  createUser,
  getUser,
  updateUser
}