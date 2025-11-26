import React, { useState, useEffect } from 'react';
import { View, Text, Image, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './Mime.scss';

const UserPage = () => {
  // 状态管理
  const [userInfo, setUserInfo] = useState({
    name: 'Design Guru',
    id: '88888888',
    avatar: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  // 初始化：生成随机头像和ID
  useEffect(() => {
    const randomId = Math.floor(10000000 + Math.random() * 90000000).toString();
    // 使用 DiceBear API 生成高质量随机头像
    const randomSeed = Math.random().toString(36).substring(7);
    const randomAvatar = `https://api.dicebear.com/9.x/notionists/svg?seed=${randomSeed}`;

    setUserInfo(prev => ({
      ...prev,
      id: randomId,
      avatar: randomAvatar
    }));
  }, []);

  // 处理名字修改
  const handleNameChange = (e) => {
    setUserInfo({ ...userInfo, name: e.detail.value });
  };

  // 切换编辑模式
  const toggleEdit = () => {
    setIsEditing(true);
  };

  // 失去焦点保存
  const handleBlur = () => {
    setIsEditing(false);
    Taro.showToast({ title: '修改成功', icon: 'success', duration: 1500 });
  };

  // 导航跳转
  const handleNavigateToAbout = () => {
    // 这里假设你有一个 about 页面，如果没有可以先 log
    console.log('Go to About Page');
    Taro.navigateTo({ url: '/pages/about/index' }).catch(() => {
      Taro.showToast({ title: '详情页开发中', icon: 'none' });
    });
  };

  return (
    <View className="user-page">
      {/* 背景装饰球，增加设计感 */}
      <View className="bg-circle-1" />
      <View className="bg-circle-2" />

      {/* 区域 1: 用户信息卡片 */}
      <View className="card profile-card">
        <View className="avatar-wrapper">
          <Image className="avatar" src={userInfo.avatar} mode="aspectFill" />
        </View>

        <View className="info-section">
          {/* 名字编辑区域 */}
          <View className="name-row">
            {isEditing ? (
              <Input
                className="name-input"
                value={userInfo.name}
                onInput={handleNameChange}
                onBlur={handleBlur}
                focus
                confirmType="done"
              />
            ) : (
              <View className="name-display" onClick={toggleEdit}>
                <Text className="name-text">{userInfo.name}</Text>
                <View className="edit-icon">✎</View>
              </View>
            )}
          </View>
          
          {/* 用户 ID */}
          <Text className="user-id">ID: {userInfo.id}</Text>
        </View>
      </View>

      {/* 区域 2: 功能按钮卡片 */}
      <View className="card action-card">
        {/* 3.1 联系我们 (仅展示) */}
        <View className="action-item">
          <View className="icon-box contact-icon">📞</View>
          <View className="action-content">
            <Text className="action-title">联系我们</Text>
            <Text className="action-desc">工作日 9:00 - 18:00</Text>
          </View>
          {/* 仅展示，无箭头 */}
        </View>

        <View className="divider" />

        {/* 3.2 关于我们 (点击跳转) */}
        <View className="action-item hover-effect" onClick={handleNavigateToAbout}>
          <View className="icon-box about-icon">ℹ️</View>
          <View className="action-content">
            <Text className="action-title">关于我们</Text>
            <Text className="action-desc">用户条款与隐私政策</Text>
          </View>
          <Text className="arrow">›</Text>
        </View>
      </View>
      
      <Text className="footer-text">v1.0.0 Designed by Taro</Text>
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