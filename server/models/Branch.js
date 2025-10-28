const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '지점명은 필수입니다'],
    trim: true,
    unique: true,
    maxlength: [100, '지점명은 100자를 초과할 수 없습니다']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, '주소는 500자를 초과할 수 없습니다']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\d-+().\s]+$/, '올바른 전화번호 형식이 아닙니다']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true, // createdAt, updatedAt 자동 생성
  versionKey: false
});

// 인덱스 설정
branchSchema.index({ name: 1 });
branchSchema.index({ isActive: 1 });
branchSchema.index({ createdAt: -1 });

// 가상 필드 - ID를 문자열로 변환
branchSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// JSON 변환 시 설정
branchSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// 지점명 중복 체크를 위한 사전 저장 미들웨어
branchSchema.pre('save', async function(next) {
  if (this.isModified('name')) {
    const existingBranch = await this.constructor.findOne({
      name: this.name,
      _id: { $ne: this._id }
    });
    
    if (existingBranch) {
      const error = new Error('이미 존재하는 지점명입니다');
      error.statusCode = 400;
      return next(error);
    }
  }
  next();
});

// 삭제 전 관련 데이터 체크를 위한 미들웨어
branchSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  // 여기서 직원, 회원 등 관련 데이터가 있는지 체크할 수 있음
  // const Staff = mongoose.model('Staff');
  // const hasStaff = await Staff.findOne({ branchId: this._id });
  // if (hasStaff) {
  //   const error = new Error('직원이 등록된 지점은 삭제할 수 없습니다');
  //   error.statusCode = 400;
  //   return next(error);
  // }
  next();
});

// 스태틱 메소드 - 활성 지점만 조회
branchSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ createdAt: 1 });
};

// 인스턴스 메소드 - 지점 활성/비활성 토글
branchSchema.methods.toggleActive = function() {
  this.isActive = !this.isActive;
  return this.save();
};

module.exports = mongoose.model('Branch', branchSchema);