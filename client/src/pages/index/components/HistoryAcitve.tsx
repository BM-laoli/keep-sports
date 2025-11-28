import { useEffect, useState } from "react";
import { View, Text, Button, ScrollView } from '@tarojs/components';
import './StatsDashboard.scss';
import { useTraining } from "src/core/business/history";
import TrainingChart from "./TrainingChart/TrainingChart";

const  StatsDashboard = () => {
  const [viewMode, setViewMode] = useState<'year' | 'week'>('year');
  const {heatmapData, weeklyData, addCheckIn, refresh,totalDays,isCheckedIn} = useTraining()

  // 处理打卡逻辑
  const handleCheckIn = async () => {
    if(isCheckedIn) return
    await addCheckIn()
    await refresh()
  };

  useEffect(() => {
    refresh()
  },[])

  return (
    <View className="stats-container">
      
      {/* 区域 1: 概览与打卡 */}
      <View className="card">
        <View className="header-section">
          <Text className="welcome-text">坚持就是胜利 💪</Text>
          <Text className="days-count">{totalDays}</Text>
          <Text className="days-label">累计打卡天数</Text>
        </View>

        <Button 
          className={`checkin-btn ${isCheckedIn ? 'checked' : ''}`} 
          onClick={handleCheckIn}
        >
          {isCheckedIn ? '✅ 今日已完成' : '🚀 立即打卡'}
        </Button>
      </View>

      {/* 区域 2: 统计图表 (GitHub 风格热力图 / 直方图) */}
      <TrainingChart 
        heatmapData={heatmapData} 
        weeklyData={weeklyData} 
      />
    </View>
  );
}

const HistoryActive = () => {
    return (
        <StatsDashboard></StatsDashboard>
    )
}

export {
  HistoryActive
}