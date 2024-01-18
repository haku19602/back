import { Schema, model, ObjectId, Error } from 'mongoose'
import validator from 'validator'
import bcrypt from 'bcrypt'
import UserRole from '../enums/UserRole.js'

// ===== 購物車
const cartSchema = new Schema({
  product: {
    type: ObjectId,
    ref: 'products',
    required: [true, '缺少商品欄位']
  },
  quantity: {
    type: Number,
    required: [true, '缺少商品數量']
  }
})

// ===== 使用者
const schema = new Schema(
  {
    account: {
      type: String,
      required: [true, '缺少使用者帳號'],
      minlength: [4, '使用者帳號長度不符'],
      maxlength: [20, '使用者帳號長度不符'],
      unique: true,
      validate: {
        validator (value) {
          return validator.isAlphanumeric(value)
        },
        message: '使用者帳號格式錯誤'
      }
    },
    email: {
      type: String,
      required: [true, '缺少使用者信箱'],
      unique: true,
      validate: {
        validator (value) {
          return validator.isEmail(value)
        },
        message: '使用者信箱格式錯誤'
      }
    },
    password: {
      type: String,
      required: [true, '缺少使用者密碼']
    },
    tokens: {
      type: [String]
    },
    cart: {
      type: [cartSchema]
    },
    role: {
      type: Number,
      // 0 =會員，1 =管理員，缺少程式可讀性
      // 另外寫一個檔案 UserRole.js 再 import
      default: UserRole.USER
    }
  },
  {
    // 加入時間戳，記錄更新時間
    timestamps: true,
    // 關掉 __v，關閉記錄修改次數
    versionKey: false
  }
)

// ===== mongoose 的虛擬欄位
schema.virtual('cartQuantity').get(function () {
  return this.cart.reduce((total, current) => {
    return total + current.quantity
  }, 0)
})

// =====
schema.pre('save', function (next) {
  const user = this
  if (user.isModified('password')) {
    if (user.password.length < 4 || user.password.length > 20) {
      const error = new Error.ValidationError(null)
      error.addError('password', new Error.ValidatorError({ message: '密碼長度不符' }))
      next(error)
      return
    } else {
      user.password = bcrypt.hashSync(user.password, 10)
    }
  }
  next()
})

export default model('users', schema)
