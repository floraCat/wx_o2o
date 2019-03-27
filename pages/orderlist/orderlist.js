var _funs = require("../../utils/functions.js")

Page({

  data: {
    pageTitle: '订单列表',
    /*tab个数*/
    // tabNum: 4,
    /*列表数组*/
    items       : [],
    // 控制没内容样式
    noContent : false,
    // 当前页数
    curPage   : 1,
    // // 总条数
    itemCount : 0,
    // 总页数
    pageCount : 0,
    // 是否加载完
    isEnd: false,
    /*当前下标*/
    tabActive   : 0,
    /*上拉加载 or 下拉刷新*/
    action      : 'refresh',
    /*取消弹窗*/
    openCancel: false,
    /*当前处理的订单index*/
    handleIndex: null
	},

  onShow: function (options) {

    let _opts = getCurrentPages()[getCurrentPages().length-1].options
    if (_opts.tab) {
      this.setData({
        tabActive: parseInt(_opts.tab)
      })
      this.getList()
    } else {
      this.setData({
        tabActive: 0
      })
      this.getList()
    }

  },

  /*路由*/
  goHome () { wx.reLaunch({url: '/pages/home/home'})},
  goOrderlist (e) {
    let _tab = e.currentTarget.dataset.opt
    wx.navigateTo({url: '/pages/orderlist/orderlist?tab=' + _tab})
  },
  goOrderinfo (e) {
    let _code = e.currentTarget.dataset.opt
    wx.navigateTo({url: '/pages/orderinfo/orderinfo?orderCode=' + _code})
  },
  goPay (e) {
    let _code = e.currentTarget.dataset.opt
    wx.navigateTo({url: '/pages/pay/pay?orderCode=' + _code})
  },
  goShop (e) {
    let _id = e.currentTarget.dataset.opt
    wx.navigateTo({url: '/pages/shop/shop?shopId=' + _id})
  },

  // 获取各tab的状态码
  getStateCode (index) {
    switch(index) {
      case 0: // 全部
        return 0;
        break;
      case 1: // 待付款
        return 100;
        break;
      case 2: // 已付款
        return 300;
        break;
      case 3: // 已取消
        return 102;
        break;
      default:
        return 0;
    }
  },

  getList (callback) {
    let self = this;
    let _opts = {
      tenantId: wx.getStorageSync('xmTenantId'),
      userId: wx.getStorageSync('xmUserId'),
      state : self.getStateCode(self.data.tabActive) || '',
      page : self.data.curPage,
    }
    wx.showLoading({title: '加载中'})
    wx.request({
      url: getApp().globalData.httpHost + '/business/order/vistorderpage' + getApp().globalData.suf,
      data: _opts,
      success: function (res) {
        console.log("订单列表")
        console.log(res)
        wx.hideLoading()
        if (res.data.status === '') {
          // window.location.href = ''
        }
        if (res.data.status === 'failure') {
          console.log('错误提示：' + res.data.message)
          wx.showToast({
            title: '获取订单列表失败',
            icon: 'none',
            duration: 3000
          })
        }
        if (res.data.status === 'success') {
          if (!res.data.page || !res.data.page.list || 0 >= res.data.page.list.length) {
            self.setData({
              noContent : true
            })
          }
          let _list = res.data.page.list
          /*增加订单状态中文字段*/
          for (let i = 0; i < _list.length; i ++) {
            _list[i]["statusTxt"] = _funs.orderStatusTxt(_list[i].orderStatus)
          }
          if ('refresh' === self.data.action) {
            self.data.items = _list
          }
          if ('infinite' === self.data.action) {
            self.data.items = self.data.items.concat(_list)
          }
          self.setData({
            items: self.data.items
          })
          self.data.pageCount = res.data.page.totalPage
          self.data.itemCount = res.data.page.totalCount
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

  /*tab切换*/
  tabTo (e) {
    let _index = e.currentTarget.dataset.opt
    if (parseInt(_index) != this.data.tabActive) {
      this.setData({
        tabActive: parseInt(_index)
      })
      this.onPullDownRefresh()
    }
  },

  /*关闭弹窗*/
  closeWin () {
    this.setData({
      openCancel: false
    })
  },

  /*取消订单*/
  cancelOrder (e) {
    let _index = e.currentTarget.dataset.opt
    this.setData({
      openCancel: true,
      handleIndex: _index,
      cancelImage: this.data.items[_index].goodsList[0].thumbnailName
    })
  },
  /*确认取消订单*/
  confirmCancel () {
    let self = this
    let _opts = {
      tenantId: wx.getStorageSync('xmTenantId'),
      userId: wx.getStorageSync('xmUserId'),
      orderCode: self.data.items[self.data.handleIndex].orderCode
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
          self.data.items.splice(self.data.handleIndex,1)
          self.setData({
            items: self.data.items,
            openCancel : false
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

  //下拉刷新
  onPullDownRefresh:function() {
    this.data.action = 'refresh'
    this.setData({
      noContent : false,
      isEnd : false
    })
    this.data.curPage = 1
    this.getList()
  },

  //加载更多
  onReachBottom: function () {
    console.log('加载更多')
    this.data.action = 'infinite'
    if (this.data.curPage < this.data.pageCount) {
      this.data.curPage += 1
      this.getList()
    } else {
      this.setData({
        isEnd: true
      })
    }    
  }

})