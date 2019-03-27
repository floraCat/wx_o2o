
Page({

  data: {
    /*商品弹窗*/
	openGood: false,
	/*搜索弹窗*/
	openSearch: false,
	/*搜索关键字*/
	keyword: null,
	keywords: ["星巴克","72街","不怕虎"],
	/*分类*/
	cats: [],
	curCatId: null,
	/*当前分类index*/
	catIndex: 0,
	/*商品列表*/
	goodList: [],
  goodListAll: [],
	curGoodsId: null,
	/*购物车缓存*/
	orderStorage: {
		sumNum: 0,
		sumPrice: 0,
		list: [],
		shopIds: []
	},

	/*当前处理的商品index*/
	handleIndex: 0,
  handleCatIndex: 0,
	/*规格弹窗开闭*/
	openRule: false,
	/*当前处理的所有规格*/
	curRules: [],
	/*选中规格index*/
	ruleIndex: 0,

  /*店铺信息*/
  shopInfo: {},

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
    if (this.data.goodList.length > 0) {
      this.defStorage(this.data.goodList)
    }
  },

  onLoad: function (options) {

    /*url传参*/
    let _opts = getCurrentPages()[getCurrentPages().length-1].options

    /*传参清缓存*/
    let _clearStorage = _opts.storage
    if (_clearStorage === 'clear') {
      wx.removeStorageSync('xmOrderStorage')
      wx.removeStorageSync('xmSettleStorage')
      wx.showToast({
        title: '缓存已清空',
        icon: 'none',
        duration: 2000
      })
      wx.redirectTo({url: '/shopping/home/home'})
    }
  	
    let _shopId = _opts.shopId || 0
    this.getList(_shopId)

    /*加入购物车动画*/
    this.busPos = {};
    this.busPos['x'] = 45;
    this.busPos['y'] = getApp().globalData.hh - 56;

  },

  /*路由*/
  goHome () { wx.reLaunch({url: '/pages/home/home'})},
  goCart () { wx.navigateTo({url: '/pages/cart/cart'})},
  goSearch (e) {
    let _kw = e.currentTarget.dataset.opt
    wx.navigateTo({url: '/pages/search/search?keyword=' + _kw})
  },
  goDetail (e) {
    let _id = e.currentTarget.dataset.opt
    let prevPage = getCurrentPages()[getCurrentPages().length - 2]
    if (prevPage.route === 'pages/shopping/detail/detail') {
      prevPage.setData({backId:_id})
      wx.navigateBack();
    } else {
      wx.navigateTo({url: '/pages/detail/detail?id=' + _id})
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

  /*分类切换*/
  switchCat: function (e) {
    let self = this
    let _index = e.currentTarget.dataset.opt
    this.setData({
      catIndex: _index,
      curCatId: self.data.cats[_index].catId
    })
    let _temp = []
    if (_index != 0) {
      _temp.push(JSON.parse(JSON.stringify(this.data.goodListAll[_index-1])))
    } else {
      _temp = JSON.parse(JSON.stringify(this.data.goodListAll))
    }
    this.setData({
      goodList: _temp
    })
  },

  /*关闭规格弹窗*/
  closeWin: function () {
  	this.setData({
  		openRule: false,
  		openGood: false
  	})
  },

  /*打开规格弹窗*/
  popRule: function (e) {
  	let _opts = e.currentTarget.dataset.opt.split(',')
    let _index0 = _opts[0]
    let _index = _opts[1]
  	this.setData({
      handleCatIndex: _index0,
  		handleIndex: _index,
  		curRules: this.data.goodList[_index0].list[_index].goodsTypes,
  		openRule: true
  	})
  },

  /*规格选择*/
  switchRule: function (e) {
  	let _index = e.currentTarget.dataset.opt
  	this.setData({
  		ruleIndex: _index
  	})
  },

	/*缓存中获取默认值*/
	defStorage: function (_units) {
	  // 缓存list
	  let _sList = this.data.orderStorage.list
    for (let i = 0; i < _units.length; i ++) {
      let _goods = _units[i].list
      // 加goodsNumber默认值
      for (let a = 0; a < _goods.length; a ++) {
        _goods[a].goodsNumber = 0 //初始值
        let _rules = _goods[a].goodsTypes
        // 有规格
        for (let z = 0; z < _rules.length; z ++) {
          _goods[a].goodsTypes[z].goodsNumber = 0 //初始值
          if (_sList.length > 0) {
            for (let x = 0; x < _sList.length; x ++) { // 遍历缓存
              if (_rules[z].id === _sList[x].prodId) {
                _goods[a].goodsNumber += _sList[x].goodsNumber
                _rules[z].goodsNumber += _sList[x].goodsNumber
              }
            }
          }
        }
      }
    }
    this.setData({
      goodList: JSON.parse(JSON.stringify(_units)),
      goodListAll: JSON.parse(JSON.stringify(_units))
    })  
	},

  /*获取商品列表*/
  getList: function (shopId) {
  	let self = this
  	let _opts = {
		tenantId: wx.getStorageSync('xmTenantId'),
		shopId: shopId || null,
  	}
    wx.showLoading({title: '加载中'})
  	wx.request({
  		url: getApp().globalData.httpHost + '/business/shopping/mallshow' + getApp().globalData.suf,
  		data: _opts,
  		success: function (res) {
  			console.log("店铺商品")
        console.log(res)
        wx.hideLoading()
		    if (res.data.status === '') {
		      // window.location.href = ''
		    }
		    if (res.data.status === 'failure') {
		      console.log('错误提示：' + res.data.message)
          wx.showToast({
            title: '获取店铺商品失败',
            icon: 'none',
            duration: 3000
          })
		    }
		    if (res.data.status === 'success') {
          self.setData({
            shopInfo : res.data.shoppingmallfront.shooppingMall
          })
		      let _list = res.data.shoppingmallfront.goods
          /*------数据结构处理 start------*/
          let _rs = []
          for (let x = 0; x < _list.length; x ++) {
            let _obj = {}
            let _arr = []
            let _list2 = _list[x].list
            for (let y = 0; y < _list2.length; y ++) {
              let _index
              for (let k in _obj) {
                if (_list2[y].goodsCode === k) {
                  _index = parseInt(_arr.length-1)
                  break
                }
              }
              if (_index === undefined) {
                let _temp = {}
                _temp.id = _list2[y].id
                _temp.goodsTypes = []
                _temp.goodsTypes.push(_list2[y])
                _arr.push(_temp)
                _obj[_list2[y].goodsCode] = x
              } else {
                _arr[_index].goodsTypes.push(_list2[y])
              }
            }
            for (let z = 0; z < _arr.length; z ++) {
              if (_arr[z].id === parseInt(self.curGoodsId)) {
                this.data.handleIndex = z
              }
            }
            if (_arr.length > 0) {
              let _temp2 = {
                catId: _list[x].catId,
                cateName: _list[x].cateName,
                list: _arr
              }
              _rs.push(_temp2)
            }
          }            
          /*------数据结构处理 end------*/
          self.defStorage(_rs)
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
  addCart: function (e) {
    let self = this;
    if (self.data.timer) { // 加入购物车动画
      clearInterval(self.data.timer)
    }
    let _opts = e.currentTarget.dataset.opt.split(',')
    console.log(_opts)
    let _num = _opts[0]
    let index0 = _opts[1]
    let index1 = _opts[2]
    let index2 = _opts[3]
    this.data.handleIndex = index1
    let _info = self.data.goodList[index0].list[index1]
    let _sList = self.data.orderStorage.list
    if (_num >= _info.goodsTypes[index2].inventory) {
      wx.showToast({
        title: '此规格没有库存了~',
        icon: 'none',
        duration: 2000
      })
    } else {
      self.touchOnGoods(e, function () {
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
          goodList: self.data.goodList,
          curRules: self.data.goodList[index0].list[index1].goodsTypes,
          orderStorage: self.data.orderStorage
        })
        wx.setStorageSync('xmOrderStorage',self.data.orderStorage) 
      })
    } 
  },

  /*减数量*/
  subCart: function (e) {
    let self = this
    let _opts = e.currentTarget.dataset.opt.split(',')
    let _num = _opts[0]
    let index0 = _opts[1]
    let index1 = _opts[2]
    let index2 = _opts[3]

    this.data.handleIndex = index1
    let _info = this.data.goodList[index0].list[index1]
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
      	goodList: self.data.goodList,
      	curRules: self.data.goodList[index0].list[index1].goodsTypes,
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

  /*搜索*/
  popSearch: function () {
    this.setData({
      openSearch: true
    })
  },
  /*搜索focus*/
  searchOn: function (e) {
    e.currentTarget.focus()
  },
  /*关键字输入*/
  kwInput: function (e) {
    this.setData({
      keyword: e.detail.value
    })
  },
  /*搜索提交*/
  searchSubmit: function (e) {
    let _opt = e.detail.value
    wx.navigateTo({url: '/shopping/search/search?keyword='+ _opt})
  },
  /*取消搜索*/
  cancelSearch: function () {
    this.setData({
      openSearch: false,
      keyword: null
    })
  },

})