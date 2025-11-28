import React, { useState, useEffect } from 'react';
import { View, Text, Image, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './Mime.scss';
import { useUser } from 'src/core/business/mine';

const UserPage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const {userInfo, updateUserInfo, setUserInfo} = useUser()

  // 处理名字修改
  const handleNameChange = (e) => {
    setUserInfo({ ...userInfo, nickName: e.detail.value });
  };

  // 切换编辑模式
  const toggleEdit = () => {
    setIsEditing(true);
  };

  // 失去焦点保存
  const handleBlur = () => {
    setIsEditing(false);
    updateUserInfo(userInfo)
  };

  // 导航跳转
  const handleNavigateToAbout = () => {
  };

  return (
    <View className="user-page">
      {/* 背景装饰球，增加设计感 */}
      <View className="bg-circle-1" />
      <View className="bg-circle-2" />

      {/* 区域 1: 用户信息卡片 */}
      <View className="card profile-card">
        <View className="avatar-wrapper">
          <Image className="avatar" src={userInfo.avatarUrl} mode="aspectFill" />
        </View>

        <View className="info-section">
          {/* 名字编辑区域 */}
          <View className="name-row">
            {isEditing ? (
              <Input
                className="name-input"
                value={userInfo.nickName}
                onInput={handleNameChange}
                onBlur={handleBlur}
                focus
                confirmType="done"
              />
            ) : (
              <View className="name-display" onClick={toggleEdit}>
                <Text className="name-text">{userInfo.nickName}</Text>
                <View className="edit-icon">✎</View>
              </View>
            )}
          </View>
          
          {/* 用户 ID */}
          <Text className="user-id">ID: {userInfo._id}</Text>
        </View>
      </View>

      {/* 区域 2: 功能按钮卡片 */}
      <View className="card action-card">
        {/* 3.1 联系我们 (仅展示) */}
        {/* <View className="action-item">
          <View className="icon-box contact-icon">📞</View>
          <View className="action-content">
            <Text className="action-title">联系我们</Text>
            <Text className="action-desc">工作日 9:00 - 18:00</Text>
          </View>
        </View> */}

        <View className="divider" />

        {/* 3.2 关于我们 (点击跳转) */}
        <View className="action-item hover-effect" onClick={handleNavigateToAbout}>
          <View className="icon-box about-icon">ℹ️</View>
          <View className="action-content">
            <Text className="action-title">关于我们</Text>
            <Text className="action-desc">方便大家使用的一个健身打卡记录器</Text>
          </View>
          <Text className="arrow">›</Text>
        </View>
      </View>
      
      {/* <Text className="footer-text">v1.0.0 Designed by Taro</Text> */}
    </View>
  );
};


const MineActive = () => {
    return (
        <View>
        {/* <Text>MineActive 内容区域2</Text> */}
        <UserPage></UserPage>
      </View>
    )
}

export {
  MineActive
}