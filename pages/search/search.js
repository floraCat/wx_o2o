
Page({

  data: {
    pageTitle: '搜索页',
    items: []
	},

  onLoad: function (options) {
    let _opts = getCurrentPages()[getCurrentPages().length-1].options
    this.search(_opts.keyword)
  },

  /*路由*/
  goHome () { wx.reLaunch({url: '/pages/home/home'})},
  goShop (e) {
    let _id = e.currentTarget.dataset.opt
    wx.navigateTo({url: '/pages/shop/shop?shopId=' + _id})
  },

  /*搜索操作*/
  search (kw) {
    let self = this
    let _opts = {
      tenantId: wx.getStorageSync('xmTenantId'),
      name: kw,
    }
    wx.showLoading({title: '加载中'})
    wx.request({
      url: getApp().globalData.httpHost + '/business/item/search' + getApp().globalData.suf,
      data: _opts,
      success: function (res) {
        console.log("搜索结果")
        console.log(res)
        wx.hideLoading()
        if (res.data.status === '') {
          // window.location.href = ''
        }
        if (res.data.status === 'failure') {
          console.log('错误提示：' + res.data.message)
          wx.showToast({
            title: '获取搜索结果失败',
            icon: 'none',
            duration: 3000
          })
        }
        if (res.data.status === 'success') {
          self.setData({
            items : res.data.list
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

})