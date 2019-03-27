
Page({

  data: {

    pageTitle: '提交订单',
    // 定位
    address: '请扫描小享座椅二维码获取定位',
    curArea: null,
    areaFlags: [],
    // 缓存手机号
    storageMobile: null,
    // 显示手机号
    mobile: null,
    hasMobile: false,
    /*验证倒计时*/
    setTimeObj: null,
    setTime: 60,
    setTimeMax: 60,
    // 填写的验证码
    yzm: null,
    status: {
      updated: true, // 点修改
      getPhoned: false, // 点修改
      yzmSendPre: false, // 发送后未返回（防止多次提交）
      yzmSended: false, // 验证码已发送且返回
      yzmConfirmed: false, // 已验证通过
    },    
    /*结算订单缓存*/
    settleStorage: {},
    // 订单列表
    orderLists: []
	},

  onShow: function (options) {

    let self = this

    /*无xmSettle缓存时返回首页*/
    if (!wx.getStorageSync('xmSettleStorage')) {
      wx.reLaunch({url: '/pages/home/home'})
      return
    }

    wx.showLoading({title: '加载中'})
    setTimeout(function() {wx.hideLoading()}, 1000)

    // 结算订单缓存已清空
    let _xmOrderStorage = wx.getStorageSync('xmOrderStorage')
    if (!_xmOrderStorage || _xmOrderStorage === 'undefined') {
      wx.navigateTo({ url: '/shopping/home/home'})
      return
    }

    /*手机号传参判断操作状态*/
    let _userInfo = wx.getStorageSync('userInfo')
    let _mobile = _userInfo && _userInfo.mobileNo
    if (_mobile) {
      this.switchStatus(_mobile)
    }
    
    /*缓存的地址*/
    let _address = wx.getStorageSync('address')
    let _area = wx.getStorageSync('area')
    this.setData({
      // address: _address || '请扫描小享座椅二维码获取定位',
      address: _address || '请填写送货地址',
      curArea: _area || null
    })
    this.createOrder()

  },

  /*路由*/
  goHome () { wx.reLaunch({url: '/pages/home/home'})},
  goCart () { wx.redirectTo({url: '/pages/cart/cart'})},
  goDetail (e) {
    let _id = e.currentTarget.dataset.opt
    wx.navigateTo({url: '/pages/detail/detail?id=' + _id})
  },

  /*扫码定位*/
  sao:function(){
    let self = this
    wx.scanCode({
      onlyFromCamera: true,
      success: (res) => {
        console.log(res)
        let optArr = res.result.substr(res.result.indexOf('wx2/') + 4).split('&')
        if (optArr.length) {
          wx.setStorageSync('xmMac', optArr[1])
          let _opts = {
            tenantId: wx.getStorageSync('xmTenantId'),
            userId: wx.getStorageSync('xmUserId'),
            mac: optArr[1]
          }
          wx.showLoading({title: '请求中'})
          wx.request({
            url: getApp().globalData.httpHost + '/business/customerorder/vistsettleget' + getApp().globalData.suf,
            data: _opts,
            success: function (res) {
              console.log("获取配送信息")
              console.log(res)
              wx.hideLoading()
              if (res.data.status === '') {
                // window.location.href = ''
              }
              if (res.data.status === 'failure') {
                console.log('错误提示：' + res.data.message)
              }
              if (res.data.status === 'success') {
                wx.setStorageSync('address',res.data.result.address)
                wx.setStorageSync('area',res.data.result.area)
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
          wx.setStorageSync('hadSao', true)
          wx.setStorageSync('xmInO2O',true)
          self.getInfo(function (res) {
            wx.setStorageSync('shopIds',res.data.list)
            let _areaFlags = self.ifInArea(self.data.orderLists,res.data.list)
            self.setData({
              curArea : res.data.result.area,
              areaFlags : _areaFlags
            })
          })
        } else {
          wx.showToast({
            title: '请扫小享科技的二维码',
            icon: 'none',
            duration: 2000
          })          
        }
      }
    })
  },

  /*是否在配送范围*/
  ifInArea (_list,_shops) {
    let _areaFlags = []
    if (!this.data.address || this.data.address === '请扫描小享座椅二维码获取定位') {
      for (let i = 0; i < _list.length; i ++) {
        _areaFlags[i] = true
      }
    } else {
      if (_shops.length > 0) {
        for (let i = 0; i < _list.length; i ++) {
          let _flag = false
          for (let j = 0; j < _shops.length; j ++) {
            if (parseInt(_list[i].shopId) === _shops[j]) {
              _flag = true
              break
            }
          }
          if(_flag) {
            _areaFlags[i] = true
          } else {
            _areaFlags[i] = false
          }
        }
      } else {
        for (let i = 0; i < _list.length; i ++) {
          _areaFlags[i] = false
        }
      }
    }   
    return _areaFlags
  },

  /*切换操作状态*/
  switchStatus (mobile) {
    let _updated = 'status.updated'
    let _yzmSended = 'status.yzmSended'
    let _yzmConfirmed = 'status.yzmConfirmed'
    if (mobile) {
      this.setData({
        storageMobile:  mobile,
        mobile : mobile,
        hasMobile : true,
        [_updated] : false,
        [_yzmSended] : true,
        [_yzmConfirmed] : true,
      })
    } else {
      this.setData({
        storageMobile:  mobile,
        mobile : mobile,
        hasMobile : false,
        [_updated] : true,
        [_yzmSended] : false,
        [_yzmConfirmed] : false,
      })
    }
  },

  /*获取手机号*/
  getPhoneNumber: function (e) {
    let self = this
    let _opts = getCurrentPages()[getCurrentPages().length-1].options
    wx.login({
      success: function (res) {
        if (res.code) {
          let _data = {
            code: res.code,
            encryptedData: e.detail.encryptedData,
            iv: e.detail.iv,
            xcxName: 'simple'
          }
          wx.showLoading({title: '请求中'})
          wx.request({
            url: getApp().globalData.httpHost + '/weixin/getusermobileno' + getApp().globalData.suf,
            data: _data,
            method: 'GET',
            success: function (res) {
              console.log('获取手机回调')
              console.log(res)
              wx.hideLoading()
              if (res.data.status === '') {
                // window.location.href = ''
              }
              if (res.data.status === 'failure') {
                console.log('错误提示：' + res.data.message)
                wx.showToast({
                  title: '获取手机号失败',
                  icon: 'none',
                  duration: 3000
                })
              }
              if (res.data.status === 'success') {
                let _mobile = res.data.result.mobileNo
                let _userInfo = wx.getStorageSync('userInfo')
                _userInfo.mobileNo = _mobile
                wx.setStorageSync('userInfo', _userInfo)
                self.switchStatus(_mobile)
                let _getPhoned = 'status.getPhoned'
                self.setData({
                  [_getPhoned]: true
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
        } else {
          wx.showToast({
            title: '请求失败',
            icon: 'none',
            duration: 3000
          })
        }
      }
    })          
  },

  /*获取配送信息*/
  getInfo:function (callback) {
    let self = this
    let _yzmSended = 'status.yzmSended'
    let _yzmConfirmed = 'status.yzmConfirmed'
    let _opts = {
      tenantId: wx.getStorageSync('xmTenantId'),
      userId: wx.getStorageSync('xmUserId'),
      mac: wx.getStorageSync('xmMac')
    }
    wx.showLoading({title: '请求中'})
    wx.request({
      url: getApp().globalData.httpHost + '/business/customerorder/vistsettleget' + getApp().globalData.suf,
      data: _opts,
      success: function (res) {
        console.log("获取配送信息")
        console.log(res)
        wx.hideLoading()
        if (res.data.status === '') {
          // window.location.href = ''
        }
        if (res.data.status === 'failure') {
          console.log('错误提示：' + res.data.message)
        }
        if (res.data.status === 'success') {
          self.setData({
            address: res.data.result.address,
            curArea : res.data.result.area
          })
          if (callback && 'function' === typeof callback) {
            callback(res)
          }
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

  /*缓存中创建订单数据*/
  createOrder: function () {
    let _sList = []
    let _shopIds = []
    if (wx.getStorageSync('xmSettleStorage')) {
      this.setData({
        settleStorage : wx.getStorageSync('xmSettleStorage')
      })
      _sList = this.data.settleStorage.list
      _shopIds = this.data.settleStorage.shopIds
    }
    let _orderObj = {}
    _orderObj.sumNum = this.data.settleStorage.sumNum
    _orderObj.sumPrice = this.data.settleStorage.sumPrice
    _orderObj.list = []
    if (_shopIds.length > 0) {
      for (let i = 0; i <_shopIds.length; i ++) {
        _orderObj.list[i] = {}
        _orderObj.list[i].sumNum = 0
        _orderObj.list[i].sumPrice = 0
        _orderObj.list[i].goodsList = []
        for (let j = 0; j < _sList.length; j ++) {
          if (parseInt(_sList[j].shopId) === _shopIds[i]) {
            _orderObj.list[i].shopId = parseInt(_sList[j].shopId)
            _orderObj.list[i].shopName = _sList[j].shopName
            _orderObj.list[i].shopLogo = _sList[j].shopLogo
            _orderObj.list[i].sumNum += _sList[j].goodsNumber
            _orderObj.list[i].sumPrice += _sList[j].goodsPrice * _sList[j].goodsNumber
            _orderObj.list[i].goodsList.push(_sList[j])
          }
        }
      }
    }
    this.setData({
      orderLists : _orderObj.list
    })
    let _areaFlags = this.ifInArea(this.data.orderLists,wx.getStorageSync('shopIds'))
    this.setData({
      areaFlags : _areaFlags
    })
  },

  /*删除此店铺*/
  delShop (e) {
    let self = this
    let _index = e.currentTarget.dataset.opt
    let _handle = function (newObj,_shopId) {
      let _newObj = {}
      _newObj.list = []
      for (let x = 0; x < newObj.list.length; x ++) {
        if (parseInt(newObj.list[x].shopId) === _shopId) {
          newObj.sumNum -= newObj.list[x].goodsNumber
          newObj.sumPrice -= newObj.list[x].goodsPrice * newObj.list[x].goodsNumber
        } else {
          _newObj.list.push(newObj.list[x])
        }
      }
      _newObj.shopIds = []
      for (let y = 0; y < newObj.shopIds.length; y ++) {
        if (newObj.shopIds[y] != _shopId) {
          _newObj.shopIds.push(newObj.shopIds[y])
        }
      }
      _newObj.sumNum = newObj.sumNum
      _newObj.sumPrice = newObj.sumPrice
      return _newObj    
    }
    wx.showModal({
      content: "确定要清空此店铺的商品吗？",
      success: function (res) {
        if (res.confirm) {
          let _order = self.data.orderLists[_index]
          let _shopId = parseInt(_order.shopId)
          self.data.settleStorage.sumNum -= _order.sumNum
          self.data.settleStorage.sumPrice -= _order.sumPrice
          // xmOrderStorage处理
          let _objOrder = wx.getStorageSync('xmOrderStorage')
          let _testOrder = _handle(_objOrder,_shopId)
          wx.setStorageSync('xmOrderStorage',_testOrder)
          // xmSettleStorage处理
          let _objSettle = wx.getStorageSync('xmSettleStorage')
          let _testSettle = _handle(_objSettle,_shopId)
          if (_testSettle.sumNum <= 0) {
            wx.setStorageSync('xmSettleStorage','')
            wx.showToast({
              title: '要提交的订单已被清空',
              icon: 'none',
              duration: 2000
            })
            setTimeout(function () {
              wx.reLaunch({
                url: '/pages/cart/cart'
              })
            }, 2000)
          } else {
            wx.setStorageSync('xmSettleStorage',_testSettle)
          }
          self.data.areaFlags.splice(_index,1) 
          self.data.orderLists.splice(_index,1)
          self.setData({
            areaFlags: self.data.areaFlags,
            orderLists: self.data.orderLists,
            settleStorage: self.data.settleStorage
          })
        }
      }
    })
  },

  /*input输入手机号*/
  mobileInput: function (e) {
    let _input = e.detail.value
    this.setData({
      mobile: _input
    })
  },

  /*input输入验证码*/
  yzmInput: function (e) {
    this.setData({
      yzm: e.detail.value
    })
  },

  /*修改验证码*/
  updateMobile:function () {
    let _updated = 'status.updated'
    let _yzmSended = 'status.yzmSended'
    let _yzmConfirmed = 'status.yzmConfirmed'
    let _getPhoned = 'status.getPhoned'
    this.setData({
      yzm : null,
      [_updated] : true,
      [_yzmSended] : false,
      [_yzmConfirmed] : false,
      [_getPhoned]: true
    })
  },

  /*发送验证码*/
  checkMobile:function (e) {
    let _mobile = e.currentTarget.dataset.opt
    let self = this
    var regex =  /^(((13[0-9]{1})|(15[0-9]{1})|(18[0-9]{1}))+\d{8})$/;
    if (!regex.test(_mobile)) {
      wx.showToast({
        title: '手机号格式不正确，请重新填写',
        icon: 'none',
        duration: 2000
      })
      return  
    }
    let _yzmSendPre = 'status.yzmSendPre'
    let _yzmSended = 'status.yzmSended'
    if (!self.yzmSendPre) {
      self.setData({
        [_yzmSendPre]: true
      })
      if (self.data.storageMobile != _mobile) {
        let _opts = {
        tenantId: wx.getStorageSync('xmTenantId'),
        userId: wx.getStorageSync('xmUserId'),
        mobileNo: _mobile
        }
        wx.showLoading({title: '处理中'})
        wx.request({
          url: getApp().globalData.httpHost + '/customer/sendCode' + getApp().globalData.suf,
          method: 'POST',
          data: _opts,
          success: function (res) {
            console.log("发送验证码")
            console.log(res)
            wx.hideLoading()
            if (res.data.status === '') {
              // window.location.href = ''
            }
            if (res.data.status === 'failure') {
              console.log('错误提示：' + res.data.message)
              wx.showToast({
                title: '发送验证码失败',
                icon: 'none',
                duration: 3000
              })
            }
            if (res.data.status === 'success') {
              self.setData({
                [_yzmSended] : true,
              })
              self.data.setTimeObj = setInterval(function () {
                if (self.data.setTime < 1) {
                  console.log(self.data.setTime)
                  clearInterval(self.data.setTimeObj)
                  self.setData({
                    [_yzmSendPre] : false,
                    [_yzmSended] : false,
                    setTime : self.data.setTimeMax
                  })
                }
                self.data.setTime --
                self.setData({
                  setTime : self.data.setTime
                })
              }, 1000)
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
      } else {
        self.setData({
          [_yzmSendPre] : false,
        })
        wx.showToast({
          title: '此手机号码已验证过了~',
          icon: 'none',
          duration: 2000
        })
      }
    }
      
  },

  /*确认验证码*/
  confirmYZM:function (e) {
    let yzm = e.currentTarget.dataset.opt
    if (!yzm) {
        wx.showToast({
          title: '您还没有输入验证码？',
          icon: 'none',
          duration: 2000
        })
        return
    }
    let self = this
    let _yzmConfirmed = 'status.yzmConfirmed'
    let _opts = {
      tenantId: wx.getStorageSync('xmTenantId'),
      userId: wx.getStorageSync('xmUserId'),
      mobileNo: self.mobile,
      identifyingCode: yzm
    }
    wx.showLoading({title: '验证中'})
    wx.request({
      url: getApp().globalData.httpHost + '/customer/identify' + getApp().globalData.suf,
      method: 'POST',
      data: _opts,
      success: function (res) {
        console.log("确认验证码")
        console.log(res)
        wx.hideLoading()
        if (res.data.status === '') {
          // window.location.href = ''
        }
        if (res.data.status === 'failure') {
          console.log('错误提示：' + res.data.message)
          wx.showToast({
            title: '确认验证码失败',
            icon: 'none',
            duration: 3000
          })
        }
        if (res.data.status === 'success') {
          clearInterval(self.data.setTimeObj)
          wx.showModal({
            title: '提示',
            content: '手机号'+res.data.result.mobileNo+'已验证成功！',
            success: function (rs) {
              if (rs.confirm) {
                console.log('用户点击确定')
              }
            }
          })
          self.setData({
            [_yzmConfirmed]: true
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

  // 缓存删除shopId
  delShopId:function (obj,shopId) {
    let _sList = obj.list
    let flag1 = 0
    if (_sList.length > 0) {
      for (let x = 0; x < _sList.length; x ++) {
        if (parseInt(_sList[x].shopId) === parseInt(shopId)) {
          flag1 ++
        }
      }
    }
    let _shopIds = obj.shopIds
    if (_shopIds.length > 0) {
      for (let z = 0; z < _shopIds.length; z ++) {
        if (parseInt(_shopIds[z]) === parseInt(shopId)) {
          if (flag1 < 2) { // 缓存list未删前有1条此shopId数据(即删后没记录)
            obj.shopIds.splice(z,1)
            console.log(90)
          }
        }
      }
    }
  },

  /*提交订单处理*/
  confirmHandle () {
    if (this.data.address && this.data.address != '请扫描小享座椅二维码获取定位') {
      let _flag = true
      let _areaFlags = this.data.areaFlags
      for (let x = 0; x < _areaFlags.length; x ++) {
        if (!_areaFlags[x]) {
          _flag = false
        }
        break
      }
      if (_flag) {
        this.confirmPay()
      } else {
        wx.showToast({
          title: '请删除不在配送范围的商品再提交',
          icon: 'none'
        })
      }
    } else {
      wx.showToast({
        title: '请先扫码获取您的定位',
        icon: 'none'
      })
    }
      
  },

  // 确认订单
  confirmPay:function () {
    let self = this
    let _data = {
      tenantId: wx.getStorageSync('xmTenantId'),
      mac: wx.getStorageSync('xmMac'),
      userId: wx.getStorageSync('xmUserId'),
      mobileNo: self.data.mobile,
      distrAddr: '',
      totalNum: wx.getStorageSync('xmOrderStorage').sumNum,
      totalPrice: wx.getStorageSync('xmOrderStorage').sumPrice,
      list: [],
    }
    console.log(_data)
    if (!self.data.status.yzmConfirmed) {
      wx.showToast({
        title: '请先验证您的手机号码',
        icon: 'none',
        duration: 2000
      })
      return
    }

    let _list = JSON.parse(JSON.stringify(this.data.orderLists))
    /*---------字段方便后端 start-----*/
    for (let i = 0; i < _list.length; i ++) {
      let _list2 = _list[i].goodsList
      for (let j = 0; j < _list2.length; j ++) {
        _list2[j].totalNumber = _list2[j].goodsNumber
        _list2[j].totalPrice = _list2[j].goodsPrice
        delete _list2[j].goodsNumber
        delete _list2[j].goodsPrice
      }
    }
    /*---------字段方便后端 end-----*/
    _data.list = _list
    _data.totalNum = this.data.settleStorage.sumNum
    _data.totalPrice = this.data.settleStorage.sumPrice
    // console.log('this.data.submitData')
    // console.log(this.data.submitData)
    // return
    wx.showLoading({title: '提交中'})
    wx.request({
      url: getApp().globalData.httpHost + '/business/customerorder/vistsettlesave' + getApp().globalData.suf,
      method: 'POST',
      data: _data,
      success: function (res) {
        console.log("确认订单")
        console.log(res)
        wx.hideLoading()
        if (res.data.status === '') {
          // window.location.href = ''
        }
        if (res.data.status === 'failure') {
          console.log('错误提示：' + res.data.message)
          wx.showToast({
            title: '确认订单失败',
            icon: 'none',
            duration: 3000
          })
        }
        if (res.data.status === 'success') {
          let settleStorage = wx.getStorageSync('xmSettleStorage')
          let orderStorage = wx.getStorageSync('xmOrderStorage')
          for (let i = 0; i < orderStorage.list.length; i ++) {
            for (let j = 0; j < settleStorage.list.length; j ++) {
              if (orderStorage.list[i].prodId === settleStorage.list[j].prodId) {
                self.delShopId(orderStorage,settleStorage.list[j].shopId)
                orderStorage.list.splice(i,1)
              }
            }
          }
          orderStorage.sumNum -= settleStorage.sumNum
          orderStorage.sumPrice -= settleStorage.sumPrice
          wx.setStorageSync('xmOrderStorage',orderStorage)
          wx.setStorageSync('xmSettleStorage',undefined)
          wx.navigateTo({url: '/pages/pay/pay?createDate='+res.data.result.orderDate})
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