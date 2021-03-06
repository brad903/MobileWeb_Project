/* 데이터베이스 스키마를 정의하는 모듈
  - 스키마 객체(UserSchema)를 만들어 호출한 곳으로 반환
*/

// 비밀번호 암호화를 위한 crypto 모듈 불러들이기
var crypto = require('crypto');

//Schema 객체 선언
var Schema = {};

//Schema에 createSchema 함수 선언(mongoose객체는 app.js에서 전달받음)
Schema.createSchema = function(mongoose) {
	console.log('user_schema 호출')

	// 스키마 정의
	// 이메일 인증 가능하게 수정
	var UserSchema = mongoose.Schema({
	    email : {type : String, 'default' : ''}
			, hashed_password : {type : String, 'default' : ''}
			, name : {type : String, index : 'hashed', 'default' : ''}
			, salt : {type : String, 'default' : ''}
			, created_at : {type : Date, index : {unique : false}, 'default' : Date.now}
			, updated_at : {type : Date, index : {unique : false}, 'default' : Date.now}
			, provider : {type : String, 'default' : ''}
      , authToken : {type : String, 'default' : ''}
      , facebook : { }
			, google : { }
	});

	/*  password를 virtual 메소드(가상 속성)로 정의
        - MongoDB에 저장되지 않는 편리한 속성임. 특정 속성을 지정하고 set, get 메소드를 정의함
    */
	UserSchema
	  .virtual('password')//스키마에 password라는 가상속성 설정
	  .set(function(password) {//입력한 비밀번호를 암호화하여 hashed_password에 저장
	    this._password = password;
	    this.salt = this.makeSalt();
	    this.hashed_password = this.encryptPassword(password);
	    console.log('virtual password 호출됨 : ' + this.hashed_password);
	  })
	  .get(function() { return this._password });

	// 스키마에 모델 인스턴스에서 사용할 수 있는 메소드 추가
	// 비밀번호 암호화 메소드
	UserSchema.method('encryptPassword', function(plainText, inSalt) {
		if (inSalt) {
			return crypto.createHmac('sha1', inSalt).update(plainText).digest('hex');
		} else {
			return crypto.createHmac('sha1', this.salt).update(plainText).digest('hex');
		}
	});

	// salt 값 만들기 메소드
	UserSchema.method('makeSalt', function() {
		return Math.round((new Date().valueOf() * Math.random())) + '';
	});

	// 인증 메소드 - 입력된 비밀번호와 비교 (true/false 리턴)
	UserSchema.method('authenticate', function(plainText, inSalt, hashed_password) {
		if (inSalt) {
			console.log('authenticate 호출됨 : %s -> %s : %s', plainText, this.encryptPassword(plainText, inSalt), hashed_password);
			return this.encryptPassword(plainText, inSalt) === hashed_password;
		} else {
			console.log('authenticate 호출됨 : %s -> %s : %s', plainText, this.encryptPassword(plainText), this.hashed_password);
			return this.encryptPassword(plainText) === this.hashed_password;
		}
	});

	// 입력된 칼럼의 값이 있는지 확인
	UserSchema.path('email').validate(function (email) {
		return email.length;
	}, 'email 칼럼의 값이 없습니다.');


	// 모델 객체에서 사용할 수 있는 메소드 정의
	UserSchema.static('findByEmail', function(email, callback) {
		return this.find({email:email}, callback);
	});

	UserSchema.static('findAll', function(callback) {
		return this.find({}, callback);
	});

	console.log('UserSchema 정의함.');

    // UserSchema 객체를 만들어 호출한 곳으로 반환
	return UserSchema;
};

// module.exports에 UserSchema 객체 직접 할당
module.exports = Schema;
