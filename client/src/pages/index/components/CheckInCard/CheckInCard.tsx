import React, { useState, useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import './CheckInCard.scss'; // 假设你的样式文件在这里
import { useTraining } from 'src/core/business/history';

const CheckInCard = () => {
  
  // 新增状态
  // const [mode, setMode] = useState<'simple' | 'frequency'>('simple'); // 'simple' | 'frequency'
  // const [progress, setProgress] = useState({ current: 1, target: 3 }); // 进度数据

  // // 计算进度百分比 (用于 CSS 宽度)
  // const progressPercent = useMemo(() => {
  //   if (mode === 'simple') return isCheckedIn ? 100 : 0;
  //   return Math.min((progress.current / progress.target) * 100, 100);
  // }, [mode, progress, isCheckedIn]);

  // const handleCheckIn = () => {
  //   // 这里调用你的 PKDay 逻辑
  //   console.log('点击打卡');
  // };


  //----
  const {
    heatmapData,
    weeklyData,
    addCheckIn,
    refresh,
    totalDays,
    isCheckedIn,
    mode,
    progress,
    switchMode
  } = useTraining()
  const {progressPercent, current, target } = progress

  // 处理打卡逻辑
  const handleCheckIn = async () => {
    if(isCheckedIn) return
    await addCheckIn()
    await refresh()
  };

  return (
    <View className="card">
      {/* 1. 头部区域保持不变 */}
      <View className="header-section">
        <Text className="welcome-text">坚持就是胜利 💪</Text>
        <Text className="days-count">{totalDays}</Text>
        <Text className="days-label">累计打卡天数</Text>
      </View>

      {/* 2. 新增：模式选择器 (Segmented Control) */}
      <View className="mode-selector">
        <View 
          className={`mode-item ${mode === 'simple' ? 'active' : ''}`}
          onClick={() => switchMode('simple')}
        >
          <Text>习惯模式</Text>
        </View>
        <View 
          className={`mode-item ${mode === 'frequency' ? 'active' : ''}`}
          onClick={() => switchMode('frequency')}
        >
          <Text>进度模式</Text>
        </View>
      </View>

     {/* 3. 改造：按钮区域 */}
      <View className="button-wrapper">
        {mode === 'simple' ? (
          // ==============================
          // 模式 A: 简单模式 (经典显眼大按钮)
          // ==============================
          <Button 
            className={`checkin-btn simple-mode ${isCheckedIn ? 'completed' : ''}`} 
            onClick={handleCheckIn}
            disabled={isCheckedIn}
          >
            <Text className="btn-text">
              {isCheckedIn ? '✅ 今日已完成' : '🚀 立即打卡'}
            </Text>
          </Button>
        ) : (
          // ==============================
          // 模式 B: 进度模式 (带进度条的容器按钮)
          // ==============================
          <Button 
            className={`checkin-btn frequency-mode ${isCheckedIn ? 'completed' : ''}`} 
            onClick={handleCheckIn}
            disabled={isCheckedIn}
          >
            {/* 进度条背景层 (绝对定位) */}
            <View 
              className="progress-fill" 
              style={{ width: `${progressPercent}%` }} 
            />
            
            {/* 按钮文字层 (层级最高) */}
            <View className="btn-content">
              {isCheckedIn ? (
                <Text>✅ 今日已完成</Text>
              ) : (
                <View className="progress-text-row">
                  <Text>🚀 增加进度</Text>
                  <Text className="progress-nums">
                    {progress.current} / {progress.target}
                  </Text>
                </View>
              )}
            </View>
          </Button>
        )}
      </View>

    </View>
  );
};

export default CheckInCard;