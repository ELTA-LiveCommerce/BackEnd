# 모바일 앱에서 카카오 로그인 사용하기

## 개요

모바일 앱에서 카카오 로그인을 구현할 때는 일반 웹과 다른 인증 흐름을 사용합니다. 모바일 앱에서는 카카오 SDK를 통해 인증을 진행하고, 발급된 Access Token을 백엔드 서버로 전달하여 인증 처리를 합니다.

## 구현 흐름

1. 모바일 앱에서 카카오 SDK를 통해 로그인 진행
   - iOS: KakaoSDK
   - Android: Kakao SDK
2. 카카오 인증 성공 시 Access Token 획득
3. 획득한 Access Token을 백엔드 서버로 전송
4. 백엔드 서버에서 토큰 검증 및 사용자 정보 획득
5. 사용자 등록/로그인 처리 및 자체 JWT 토큰 발급

## API 엔드포인트

### 카카오 모바일 로그인

```
POST /auth/kakao/mobile
```

#### 요청 본문

```json
{
  "accessToken": "카카오에서 발급받은 액세스 토큰"
}
```

#### 응답

```json
{
  "access_token": "서버에서 발급한 JWT 액세스 토큰",
  "refresh_token": "서버에서 발급한 JWT 리프레시 토큰",
  "expires_in": 900, // 15분 (초 단위)
  "token_type": "bearer"
}
```

#### 에러 응답

```json
{
  "statusCode": 401,
  "message": "카카오 모바일 로그인에 실패했습니다.",
  "error": "Unauthorized"
}
```

## 모바일 앱 구현 가이드

### iOS (Swift)

1. KakaoSDK 설치

```swift
// Podfile
pod 'KakaoSDK'
```

2. 카카오 로그인 구현

```swift
import KakaoSDK

// 로그인 함수
func loginWithKakao() {
    if UserApi.isKakaoTalkLoginAvailable() {
        // 카카오톡 앱으로 로그인
        UserApi.shared.loginWithKakaoTalk { (oauthToken, error) in
            if let error = error {
                print("카카오톡 로그인 실패: \(error)")
                return
            }

            // 성공 시 토큰 서버로 전달
            guard let token = oauthToken?.accessToken else { return }
            self.sendTokenToServer(token: token)
        }
    } else {
        // 웹 뷰로 로그인
        UserApi.shared.loginWithKakaoAccount { (oauthToken, error) in
            if let error = error {
                print("카카오 계정 로그인 실패: \(error)")
                return
            }

            // 성공 시 토큰 서버로 전달
            guard let token = oauthToken?.accessToken else { return }
            self.sendTokenToServer(token: token)
        }
    }
}

// 서버로 토큰 전송
func sendTokenToServer(token: String) {
    let url = URL(string: "https://api.example.com/auth/kakao/mobile")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.addValue("application/json", forHTTPHeaderField: "Content-Type")

    let body = ["accessToken": token]
    request.httpBody = try? JSONSerialization.data(withJSONObject: body)

    URLSession.shared.dataTask(with: request) { data, response, error in
        // 응답 처리
        if let data = data {
            let decoder = JSONDecoder()
            do {
                let authResponse = try decoder.decode(AuthResponse.self, from: data)
                // 로그인 성공, 서버에서 발급한 토큰 저장
                self.saveTokens(authResponse)
            } catch {
                print("서버 응답 파싱 실패: \(error)")
            }
        }
    }.resume()
}
```

### Android (Kotlin)

1. Kakao SDK 설치

```gradle
// build.gradle
dependencies {
    implementation "com.kakao.sdk:v2-user:2.x.x"
}
```

2. 카카오 로그인 구현

```kotlin
import com.kakao.sdk.auth.LoginClient
import com.kakao.sdk.auth.model.OAuthToken

// 로그인 함수
fun loginWithKakao() {
    // 카카오톡 설치 여부 확인
    if (LoginClient.instance.isKakaoTalkLoginAvailable(context)) {
        // 카카오톡 로그인
        LoginClient.instance.loginWithKakaoTalk(context) { token, error ->
            if (error != null) {
                Log.e("KakaoLogin", "카카오톡 로그인 실패", error)
                return@loginWithKakaoTalk
            }

            // 성공 시 토큰 서버로 전달
            token?.accessToken?.let { sendTokenToServer(it) }
        }
    } else {
        // 웹 뷰 로그인
        LoginClient.instance.loginWithKakaoAccount(context) { token, error ->
            if (error != null) {
                Log.e("KakaoLogin", "카카오 계정 로그인 실패", error)
                return@loginWithKakaoAccount
            }

            // 성공 시 토큰 서버로 전달
            token?.accessToken?.let { sendTokenToServer(it) }
        }
    }
}

// 서버로 토큰 전송
fun sendTokenToServer(token: String) {
    val url = "https://api.example.com/auth/kakao/mobile"
    val jsonObject = JSONObject()
    jsonObject.put("accessToken", token)

    val client = OkHttpClient()
    val requestBody = jsonObject.toString().toRequestBody("application/json".toMediaType())

    val request = Request.Builder()
        .url(url)
        .post(requestBody)
        .build()

    client.newCall(request).enqueue(object : Callback {
        override fun onFailure(call: Call, e: IOException) {
            Log.e("KakaoLogin", "서버 요청 실패", e)
        }

        override fun onResponse(call: Call, response: Response) {
            val responseBody = response.body?.string()
            if (response.isSuccessful && responseBody != null) {
                // 로그인 성공, 서버에서 발급한 토큰 저장
                val authResponse = Gson().fromJson(responseBody, AuthResponse::class.java)
                saveTokens(authResponse)
            } else {
                Log.e("KakaoLogin", "서버 응답 오류: ${response.code}")
            }
        }
    })
}
```

## 주의사항

1. 모바일 앱에서 얻은 카카오 Access Token은 보안을 위해 반드시 백엔드 서버에서 유효성을 검증해야 합니다.
2. 클라이언트에서 서버로 전송 시 HTTPS를 사용하여 통신하세요.
3. 앱 등록 시 카카오 개발자 콘솔에서 iOS/Android 플랫폼을 등록해야 합니다.
4. 각 플랫폼별 카카오 로그인 설정(네이티브 앱 키, 리다이렉트 URI 등)을 올바르게 구성해야 합니다.
