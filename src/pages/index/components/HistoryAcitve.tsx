import { useEffect, useState } from "react";
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './StatsDashboard.scss';

// 1. Mock 数据生成器

// 生成过去一年的热力图数据 (GitHub Style)
// const generateHeatmapData = () => {
//   const data: { date: string; level: number }[] = [];
//   const today = new Date();
//   // 生成 52 周 * 7 天 = 364 个格子
//   for (let i = 0; i < 364; i++) {
//     // 随机生成活跃度 0-4
//     // 0: 无记录, 4: 高强度
//     const rand = Math.random();
//     let level = 0;
//     if (rand > 0.8) level = 4;
//     else if (rand > 0.6) level = 3;
//     else if (rand > 0.4) level = 2;
//     else if (rand > 0.2) level = 1;
    
//     data.push({
//       date: `Day ${i}`,
//       level: level
//     });
//   }
//   return data;
// };
// 生成 2025 年热力图数据 (二元状态)
const generateHeatmapData = () => {
  const data: { date: string; isDone: boolean }[] = [];
  // 模拟 2025 全年 (52周 * 7天 = 364格)
  for (let i = 0; i < 364; i++) {
    // 模拟数据：30% 的概率是“练了”
    const isDone = Math.random() > 0.7; 
    
    data.push({
      date: `2025-Day-${i}`,
      isDone: isDone
    });
  }
  return data;
};

// 生成周统计数据 (直方图)
const generateWeeklyData = () => {
  return [
    { day: '周一', value: 30 },
    { day: '周二', value: 60 },
    { day: '周三', value: 45 },
    { day: '周四', value: 80 },
    { day: '周五', value: 20 },
    { day: '周六', value: 90 },
    { day: '周日', value: 50 },
  ];
};

// 2. 主组件

const  StatsDashboard = () => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [totalDays, setTotalDays] = useState(128); // 模拟坚持了128天
  const [viewMode, setViewMode] = useState<'year' | 'week'>('year');
  
  // 数据状态
  const [heatmapData, setHeatmapData] = useState<{ date: string; level?: number, isDone?:boolean }[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ day: string; value?: number, isDone?:boolean }[]>([]);

  // 初始化加载数据
  useEffect(() => {
    setHeatmapData(generateHeatmapData());
    setWeeklyData(generateWeeklyData());
  }, []);

  // 处理打卡逻辑
  const handleCheckIn = () => {
    if (isCheckedIn) return;

    // 震动反馈
    Taro.vibrateShort();
    
    // 交互反馈
    setIsCheckedIn(true);
    setTotalDays(prev => prev + 1);
    
    // 弹窗提示
    Taro.showToast({
      title: '今日打卡成功！',
      icon: 'success',
      duration: 2000
    });

    // 可以在这里更新 heatmap 最后一个数据为高亮
    const newData = [...heatmapData];
    if(newData.length > 0) {
        newData[newData.length - 1].level = 4;
        setHeatmapData(newData);
    }
  };

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
      <View className="card">
        <View className="chart-header">
          <Text className="chart-title">训练趋势</Text>
          
          {/* 切换开关 */}
          <View className="toggle-switch">
            <View 
              className={`toggle-item ${viewMode === 'year' ? 'active' : ''}`}
              onClick={() => setViewMode('year')}
            >
              年
            </View>
            <View 
              className={`toggle-item ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              周
            </View>
          </View>
        </View>

        {/* 条件渲染图表 */}
        {viewMode === 'year' ? (
          // <ScrollView scrollX className="heatmap-scroll" enableFlex>
          //   <View className="heatmap-grid">
          //     {heatmapData.map((item, index) => (
          //       <View 
          //         key={index} 
          //         className={`heatmap-cell level-${item.level}`} 
          //         // 可以在这里添加点击事件显示具体日期详情
          //       />
          //     ))}
          //   </View>
          //   <Text className="days-label" style={{fontSize: '20rpx', marginTop: '10rpx', display:'block', textAlign:'right'}}>
          //     Less ■ ■ ■ ■ ■ More
          //   </Text>
          // </ScrollView>
          <ScrollView scrollX className="heatmap-scroll" enableFlex>
          <View className="heatmap-grid">
            {heatmapData.map((item, index) => (
              <View 
                key={index} 
                // 修改这里：只有 active 和空两种状态
                className={`heatmap-cell ${item.isDone ? 'active' : ''}`} 
              />
            ))}
          </View>
          <Text className="year-label">666</Text>
          </ScrollView>
        ) : (
          <View className="bar-chart">
            {weeklyData.map((item, index) => (
              <View key={index} className="bar-col">
                {/* 动态高度 */}
                <View 
                  className="bar" 
                  style={{ height: `${item.value}%` }} 
                />
                <Text className="bar-label">{item.day}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
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