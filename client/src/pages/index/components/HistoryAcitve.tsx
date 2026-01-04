import { useEffect, useState } from "react";
import { View, Text, Button, ScrollView } from '@tarojs/components';
import './StatsDashboard.scss';
import { useTraining } from "src/core/business/history";
import TrainingChart from "./TrainingChart/TrainingChart";
import CheckInCard from "./CheckInCard/CheckInCard";

const  StatsDashboard = () => {
  const [viewMode, setViewMode] = useState<'year' | 'week'>('year');
  const {heatmapData, weeklyData, addCheckIn, refresh,totalDays,isCheckedIn} = useTraining()

  useEffect(() => {
    refresh()
  },[])

  return (
    <View className="stats-container">
      
      {/* 区域 1: 概览与打卡 */}
      <CheckInCard></CheckInCard>

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