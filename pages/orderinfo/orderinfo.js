var _funs = require("../../utils/functions.js")

Page({
  data: {
    pageTitle: '订单详情',
    info: {
      delivery: {},
      mall: {},
      other: {}
    },
    openCancel: false,
    cancelImage: null,
    orderCode: null
  },
  
  onShow: function (options) {

    /*判断是否弹扫一扫*/
    let _opts = getCurrentPages()[getCurrentPages().length-1].options
    if (!wx.getStorageSync('xmInO2O')) {
      if (!wx.getStorageSync('hadSao')) {
        this.saoOpen()
      } else {
        this.checkCharge()
      }
    }
    wx.setStorageSync('xmInO2O',true)

    this.data.orderCode = _opts.orderCode
    this.getInfo()
  },

  /*路由*/
  goHome () { wx.reLaunch({url: '/pages/home/home'})},
  goDetail (e) {
    let _id = e.currentTarget.dataset.opt
    wx.navigateTo({url: '/pages/detail/detail?id=' + _id})
  },
  goPay (e) {
    let _code = e.currentTarget.dataset.opt
    wx.navigateTo({url: '/pages/pay/pay?orderCode=' + _code})
  },

  // 获取订单信息
  getInfo () {
    let self = this
    let _opts = {
      tenantId: wx.getStorageSync('xmTenantId'),
      userId: wx.getStorageSync('xmUserId'),
      orderCode: self.data.orderCode
    }
    wx.showLoading({title: '加载中'})
    wx.request({
      url: getApp().globalData.httpHost + '/business/order/vistorderget' + getApp().globalData.suf,
      data: _opts,
      success: function (res) {
        console.log("获取订单信息")
        console.log(res)
        wx.hideLoading()
        if (res.data.status === '') {
          // window.location.href = ''
        }
        if (res.data.status === 'failure') {
          console.log('错误提示：' + res.data.message)
          wx.showToast({
            title: '获取订单信息失败',
            icon: 'none',
            duration: 3000
          })
        }
        if (res.data.status === 'success') {
          let _rs = res.data.jsonobject
          /*增加订单状态中文字段*/
          _rs["statusTxt"] = _funs.orderStatusTxt(_rs.orderStatus)
          /*增加支付方式中文字段*/
          _rs.other["payTypeTxt"] = _funs.payTypeTxt(_rs.other.payType)
          self.setData({
            info : _rs
          })
        }
      },
      fail: function (res) {
        console.log(res)
        wx.hideLoading()
        wx.showToast({
          title: '请求失败',
          icon: 'none',
          duration: 3000
        })
      }
    })
  },

  /*取消订单*/
  cancelOrder () {
    this.setData({
      openCancel: true,
      cancelImage: this.data.info.goodsList[0].thumbnailName
    })

    this.setData({
      openCancel : true
    })
  },

  /*关闭弹窗*/
  closeWin () {
    this.setData({
      openCancel: false
    })
  },

  /*确认取消订单*/
  confirmCancel () {
    let self = this
    let _opts = {
      tenantId: wx.getStorageSync('xmTenantId'),
      userId: wx.getStorageSync('xmUserId'),
      orderCode: self.data.orderCode
    }
    wx.showLoading({title: '取消中'})
    wx.request({
      url: getApp().globalData.httpHost + '/business/order/vistordercancel' + getApp().globalData.suf,
      method: 'POST',
      data: _opts,
      success: function (res) {
        console.log("取消订单")
        console.log(res)
        wx.hideLoading()
        if (res.data.status === '') {
          // window.location.href = ''
        }
        if (res.data.status === 'failure') {
          console.log('错误提示：' + res.data.message)
          wx.showToast({
            title: '取消订单失败',
            icon: 'none',
            duration: 3000
          })
        }
        if (res.data.status === 'success') {
          wx.showToast({
            title: '订单取消成功',
            icon: 'none',
            duration: 2000
          })
          self.data.info.orderStatus = 102
          self.data.info.statusTxt = '已取消'
          self.setData({
            info: self.data.info,
            openCancel : false
          })
          // wx.navigateTo({url: '/pages/order/order'})
        }
      },
      fail: function (res) {
        console.log(res)
        wx.hideLoading()
        wx.showToast({
          title: '请求失败',
          icon: 'none',
          duration: 3000
        })
      }
    })
  },
  
})