import { Component, PropsWithChildren, useCallback, useMemo, useState } from "react";
import { View, Text } from "@tarojs/components";
import { AtTabBar } from "taro-ui";

import "./index.scss";
import { HomeActive } from "./components/HomeAcitve";
import { HistoryActive } from "./components/HistoryAcitve";
import { MineActive } from "./components/MineAcitve";
import { useHome } from "src/core/business/home/useHome";




const IndexApp = () => {
  const {active,onActiveChange, tabList} = useHome()

  return (
    <View className="page">
      {/* 内容区域 */}
      <View className="page-container">
        <View className={active == 0 ? 'show' : 'not-show'}><HomeActive /></View>
        <View className={active == 1 ? 'show' : 'not-show'}><HistoryActive /></View>
        <View className={active == 2 ? 'show' : 'not-show'}><MineActive /></View>
      </View>
      {/* 底部区域 */}
      <View className="footer">
        <AtTabBar tabList={tabList} onClick={onActiveChange} current={active} />
      </View>
    </View>
  );
};

export default class Index extends Component<PropsWithChildren> {
  componentDidMount() {}

  componentWillUnmount() {}

  componentDidShow() {}

  componentDidHide() {}

  render() {
    return <IndexApp />;
  }
}
