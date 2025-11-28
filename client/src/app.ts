import Taro from '@tarojs/taro'
import { Component, PropsWithChildren } from 'react'

import './app.scss'
import { DEFAULT_USER, initUser, setUserInfo } from './core/business/mine';


  class App extends Component<PropsWithChildren> {

  init = async () => {
    //挂一个loading
    Taro.showLoading({
      title:"加载中..."
    });
    
    await initUser();

    //结束loading
    Taro.hideLoading()
  }
  componentDidMount () {
    this.init()
  }

  componentDidShow () {}

  componentDidHide () {}

  // this.props.children 是将要会渲染的页面
  render () {
    return this.props.children
  }
}


export default App
