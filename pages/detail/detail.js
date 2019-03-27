
Page({

  data: {
    pageTitle: '商品详情',
    /*店铺navigateBack返回时的商品id，为不增加导航记录数*/
    backId: null,
    /*商品数据*/
    info: {},
    /*单条数据*/
    goodsInfo: {},
    /*添加购物车提示弹窗*/
    showAddCart: false,
    /*规格弹窗开闭*/
    openRule: false,
    /*当前处理的所有规格*/
    curRules: [],
    /*选中规格index*/
    ruleIndex: 0,
    /*购物车缓存*/
    orderStorage: {
      sumNum: 0,
      sumPrice: 0,
      list: [],
      shopIds: []
    },

    canAddCart: true,

    /*加入购物车动画*/
    timer: null,
    hide_good_box: true,
    bus_x: 0,
    bus_y: 0
	},

  onShow: function () {
    
    // 购物车缓存默认值
    if (wx.getStorageSync('xmOrderStorage')) {
      let _storage = wx.getStorageSync('xmOrderStorage')
      this.setData({
        orderStorage : _storage ? _storage : this.data.orderStorage
      })
    }
    // 缓存中获取默认值
    if (this.data.info.id) {
      this.defStorage(this.data.info)
    }

  },

  onLoad: function (options) {

    let self = this

    /*传参清缓存 start*/
    if (options.action === 'clear') {
      wx.removeStorageSync('xmOrderStorage')
      wx.removeStorageSync('xmSettleStorage')
      wx.removeStorageSync('xmTenantId')
      wx.removeStorageSync('xmUserId')
      wx.removeStorageSync('xmMac')
      wx.showToast({
        title: '缓存已清空',
        icon: 'none',
        duration: 3000
      })
      return
    }
    /*传参清缓存 end*/

    let _id = this.data.backId ? this.data.backId : options.id
    this.getData(_id)

    /*加入购物车动画*/
    this.busPos = {};
    this.busPos['x'] = 45;
    this.busPos['y'] = getApp().globalData.hh - 56;
    
  },

  /*路由*/
  goHome () { wx.reLaunch({url: '/pages/home/home'})},
  goCart () { wx.navigateTo({url: '/pages/cart/cart'})},
  goShop (e) {
    if (this.data.canAddCart) {
      this.data.backId =  null
      let _id = e.currentTarget.dataset.opt
      wx.navigateTo({url: '/pages/shop/shop?shopId=' + _id})
    } else {
      wx.showToast({
        title: '此商品不在配送范围',
        icon: 'none'
      })
    }
    
  },

  ifCanAddCart () {
    if (wx.getStorageSync('hadSao')) {
      let _shopIds = wx.getStorageSync('shopIds')
      if (_shopIds.length > 0) {
        let flag = false
        for (let x = 0; x < _shopIds.length; x ++) {
          if (_shopIds[x] === parseInt(this.data.goodsInfo.shopId)) {
            flag = true
          }
        }
        if (!flag) {
          wx.showToast({
            title: '此商品不在配送范围',
            icon: 'none'
          })
          this.setData({
            canAddCart: false
          })
        }
      }
    }
  },


  touchOnGoods: function (e, callback) {
    this.finger = {}; var topPoint = {};
    this.finger['x'] = e.touches["0"].clientX;//点击的位置
    this.finger['y'] = e.touches["0"].clientY;
    if (this.finger['y'] < this.busPos['y']) {
      topPoint['y'] = this.finger['y'] - 150;
    } else {
      topPoint['y'] = this.busPos['y'] - 150;
    }
    topPoint['x'] = Math.abs(this.finger['x'] - this.busPos['x']) / 2;

    if (this.finger['x'] > this.busPos['x']) {
      topPoint['x'] = (this.finger['x'] - this.busPos['x']) / 2 + this.busPos['x'];
    } else {//
      topPoint['x'] = (this.busPos['x'] - this.finger['x']) / 2 + this.finger['x'];
    }
    this.linePos = getApp().bezier([this.busPos, topPoint, this.finger], 30);
    this.startAnimation(e, callback);
  },
  startAnimation: function (e, callback) {
    var index = 0, that = this,
    bezier_points = that.linePos['bezier_points'];
    this.setData({
      hide_good_box: false,
      bus_x: that.finger['x'],
      bus_y: that.finger['y']
    })
    var len = bezier_points.length;
    index = len
    this.data.timer = setInterval(function () {
      index--;
      that.setData({
        bus_x: bezier_points[index]['x'],
        bus_y: bezier_points[index]['y']
      })
      if (index < 1) {
        clearInterval(that.data.timer);
        that.setData({
          hide_good_box: true
        })
      }
    }, 1);
    if (callback && 'function' === typeof callback) {
      callback()
    }
  },

  /*关闭规格弹窗*/
  closeWin: function () {
    this.setData({
      openRule: false,
      openGood: false
    })
  },
  /*规格弹窗*/
  popRule () {
    this.setData({
      curRules: this.data.info.goodsTypes,
      openRule: true
    })
  },
  /*规格切换*/
  switchRule (e) {
    let _index = e.currentTarget.dataset.opt
    this.setData({
      ruleIndex: _index
    })
  },

  /*缓存中获取默认值*/
  defStorage: function (_info) {
    let _sList = this.data.orderStorage.list
    // 加goodsNumber默认值
    _info.goodsNumber = 0 //初始值
    let _rules = _info.goodsTypes
    // 有规格
    for (let z = 0; z < _rules.length; z ++) {
      _info.goodsTypes[z].goodsNumber = 0 //初始值
      if (_sList.length > 0) {
        for (let x = 0; x < _sList.length; x ++) { // 遍历缓存
          if (_rules[z].id === _sList[x].prodId) {
            _info.goodsNumber += _sList[x].goodsNumber
            _rules[z].goodsNumber += _sList[x].goodsNumber
          }
        }
      }
    }
    this.setData({
      info: _info,
      goodsInfo: _info && _info.goodsTypes && _info.goodsTypes[0]
    }) 
    this.ifCanAddCart()
  },

  /*获取商品信息*/
  getData: function (id) {
    let self = this
    let _opts = {
      tenantId: wx.getStorageSync('xmTenantId'),
      goodsId: id
    }
    wx.showLoading({title: '加载中'})
    wx.request({
      url: getApp().globalData.httpHost + '/business/item/vistget' + getApp().globalData.suf,
      data: _opts,
      success: function (res) {
        console.log("商品信息")
        console.log(res)
        wx.hideLoading()
        if (res.data.status === '') {
          // window.location.href = ''
        }
        if (res.data.status === 'failure') {
          console.log('错误提示：' + res.data.message)
          wx.showToast({
            title: '获取商品信息失败',
            icon: 'none',
            duration: 3000
          })
        }
        if (res.data.status === 'success') {
          let _list = res.data.list
          /*------数据结构处理 start------*/
          let _temp = {}
          _temp.id = _list[0].id
          _temp.goodsTypes = []
          for (let x = 0; x < _list.length; x ++) {
            _temp.goodsTypes.push(_list[x])
          }
          /*------数据结构处理 end------*/
          self.defStorage(_temp)
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

  /*加入购物车*/
  addCartE: function (e) {
    if (!this.data.canAddCart) {
      wx.showToast({
        title: '此商品不在配送范围',
        icon: 'none'
      })
      return
    }
    let _opts = e.currentTarget.dataset.opt.split(',')
    console.log(_opts)
    let _num = _opts[0]
    let index2 = _opts[1]
    this.addCart(_num, index2, e)
  },
  addCart: function (_num, index2, e) {
    let self = this;
    if (self.data.timer) { // 加入购物车动画
      clearInterval(self.data.timer)
    }
    let _info = self.data.info
    let _sList = self.data.orderStorage.list
    if (_num >= _info.goodsTypes[index2].inventory) {
      wx.showToast({
        title: '此规格没有库存了~',
        icon: 'none',
        duration: 2000
      })
    } else {
      let _callback = function () {
        _info.goodsNumber ++
        self.data.orderStorage.sumNum ++
        self.data.orderStorage.sumPrice += parseInt(_info.goodsTypes[index2].goodsPrice)
        _info.goodsTypes[index2].goodsNumber ++
        let flag = false
        if (_sList.length > 0) {
          for (let x = 0; x < _sList.length; x ++) {
            if (_info.goodsTypes[index2].id === _sList[x].prodId) {
              flag = true // 有此prodId
              _sList[x].goodsNumber ++
            }
          }
        }
        if (!flag) { // 没此prodId
          let _obj = {}
          let _type = _info.goodsTypes[index2].goodsType && "(" +_info.goodsTypes[index2].goodsType + ")" || ''
          _obj.shopId = _info.goodsTypes[index2].shopId
          _obj.shopName = _info.goodsTypes[index2].shopName
          _obj.shopLogo = _info.goodsTypes[index2].shopLogo
          _obj.goodsId = _info.id
          _obj.thumbnailName = _info.goodsTypes[index2].thumbnailName
          _obj.prodId = _info.goodsTypes[index2].id
          _obj.goodsName = _info.goodsTypes[index2].goodsName + _type
          _obj.goodsNumber = 1
          _obj.goodsPrice = _info.goodsTypes[index2].goodsPrice
          _obj.inventory = _info.goodsTypes[index2].inventory
          self.data.orderStorage.list.push(_obj)
        }
        self.delShopId('add',_info.goodsTypes[0].shopId)

        console.log('self.orderStorage')
        console.log(self.data.orderStorage)
        self.setData({
          info: self.data.info,
          curRules: self.data.info.goodsTypes,
          orderStorage: self.data.orderStorage
        })
        wx.setStorageSync('xmOrderStorage',self.data.orderStorage)
      }
      if (e) {
        self.touchOnGoods(e, function () {
           _callback()
        })
      } else {
        _callback()
      }
    } 
  },

  /*减数量*/
  subCart: function (e) {
    let self = this
    let _opts = e.currentTarget.dataset.opt.split(',')
    let _num = _opts[0]
    let index2 = _opts[1]

    let _info = this.data.info
    let _sList = this.data.orderStorage.list
    if (_num > 0) { // 大于最小值
      _info.goodsNumber --
      self.data.orderStorage.sumNum --
      self.data.orderStorage.sumPrice -= parseInt(_info.goodsTypes[index2].goodsPrice)
      _info.goodsTypes[index2].goodsNumber --
      if (_sList.length > 0) {
        for (let x = 0; x < _sList.length; x ++) {
          if (_info.goodsTypes[index2].id === _sList[x].prodId) {
            _sList[x].goodsNumber --
            if (_sList[x].goodsNumber === 0) {
              self.delShopId('del',_sList[x].shopId)
              this.data.orderStorage.list.splice(x,1)
            }
          }
        }
      }
      self.setData({
        info: self.data.info,
        curRules: self.data.info.goodsTypes,
        orderStorage: self.data.orderStorage
      })
      wx.setStorageSync('xmOrderStorage',self.data.orderStorage) 
    }
  },

  // 缓存shopIds数组处理
  delShopId: function (act,shopId) {
    let _sList = this.data.orderStorage.list
    let flag1 = 0
    if (_sList.length > 0) {
      for (let x = 0; x < _sList.length; x ++) {
        if (parseInt(_sList[x].shopId) === parseInt(shopId)) {
          flag1 ++
        }
      }
    }
    let _shopIds = this.data.orderStorage.shopIds
    let flag2 = false
    if (_shopIds.length > 0) {
      for (let z = 0; z < _shopIds.length; z ++) {
        if (parseInt(_shopIds[z]) === parseInt(shopId)) {
          flag2 = true
          if (flag1 < 2) { // 缓存list未删前有1条此shopId数据(即删后没记录)时才删
            if (act === 'del') {
              this.data.orderStorage.shopIds.splice(z,1)
            }
          }
        }
      }
    }
    if (!flag2) { // 缓存没prodId
      if (act === 'add') {
        this.data.orderStorage.shopIds.push(parseInt(shopId))
      }
    }
  },

  /*结算*/
  settle () {
    if (!wx.getStorageSync('xmOrderStorage') || !wx.getStorageSync('xmOrderStorage').sumNum) {
      wx.showToast({
        title: '您的购物车还没有东西，请先添加商品',
        icon: 'none',
        duration: 2000
      })
      return
    }
    wx.setStorageSync('xmSettleStorage',wx.getStorageSync('xmOrderStorage'))
    wx.navigateTo({url: '/pages/settle/settle'})
  },

})