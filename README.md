# keep-super

## 说明
> 这是一个用于记录 Joney 健身成效的 小程序，由 Taro + Wepp 云开发 + Gemini3pro 构建

## 如何开始
1.clone 本项目
2.cd client 和 cloudbase/具体的云函数处 ，然后 yarn 下载依赖
3.在client 处进行 dev 模式的开发 或者 product的打包
4.把整个文件夹 丢到 “微信小程序开发IDE”中


## 项目结构
### 云函数如何用
1. 直接点这个开启和创建云函数
   
2. 把项目结构改一下 编程 client+cloudbase 结构 然后把 project.config.js 改成云函数的配置
```json
 "cloudbaseRoot": "cloudbase/",
  "cloudfunctionRoot": "cloudbase/cloudfunctions/",
  "cloudfunctionTemplateRoot": "cloudbase/cloudfunctionTemplateRoot/",
```

3.重新导入到 小程序IDE 中（会自动识别为云开发) ，右键云函数文件夹 选择一下环境就好 了

4.在 小程序 IDE中选择 创建云函数，然后在你自己的文件夹中写对应的文件夹就好啦
调试也是在 小程序IDE 中调试
```js
// 例子 in cloudBase/couldFunctions/getOpenId[你的云函数名]/index.js
// 在这里yarn init 安装依赖

const cloud = require("wx-server-sdk");
const lodash = require("lodash");

// 初始化
cloud.init({
    env: "keep-sport-5gn0lvxn1a592b35",
});
const db = cloud.database();
const _ = db.command; // 引入数据库操作符

const getOpenid = async () => {
  const wxContext = cloud.getWXContext();
  return { openid: wxContext.OPENID };
};

exports.main = async (event, context) => {
    return getOpenid();// 这样就行啦
};
```

5.客户端使用(Taro)
```cpp
举例子
const PKDay = async () => {
  const history = await Taro.cloud.callFunction({
    name: "getOpenId", // 云函数 名字
    data: {
        //你的参数 就是 event 的字段
      type: "ADD_CHECK_IN",
      data: {
        dateStr: dayjs().format("YYYY-MM-DD"),
        duration: 45,
        comment: "状态不错",
      },
    },
  });
  const res = history as any;
  ret urn res.result;
};
```
6. 云函数本地调试开发完之后 你需要邮件云函数文件夹 上传(云端安装依赖) 这样
体验版才能用

## Issues

### 001.问题 Tab 滚动问题 
在版本 v1.0.4 中首页的 顶部tab 会被上下滚动这不对，我们把整个容器的 Container 固定了高度，然后再然 Active 自己去控制自己的滚动就好了 这样 Active 本体就不会被外部干扰了


## 更新日志
v1.0.0 
第一个可用版本

v1.0.1
优化包 体积

v1.0.2
新增 云函数

v1.0.3
新增 自定义训练计划

v1.0.4
优化展示UI 最终的 版本 Release 1.0.4 tag 1.0.4

v1.0.5
-BUG:
  1.BUG 首页Tab 固定BUG
-Feature:
  1.训练计划要目前只能编写力量训练 有氧循环编辑不了 需要修改
  2.训练计划 的 Edit 和 Delete 要+上
  3.打卡+一个早上和晚上 两次打卡 (可自定义 目前固定两次)

v1.0.6
-BUG:
  1.BUG 数据统计页面 热力图 不渲染问题
