# 조금 다른 나 — 캐리커처 MVP

Next.js App Router + TypeScript, Node 런타임. 사진 선택 → 명시적 전송 동의 → 3개 스타일 중 하나로 생성 → 미리보기와 다운로드. 원본/결과 사진을 DB·스토리지·파일에 쓰지 않고 요청 메모리에서만 처리합니다. 브라우저 메모리의 결과는 새로고침하면 사라집니다.

## 실행

Node.js 22 이상 권장.

```sh
npm ci
cp .env.example .env.local
# .env.local에 OPENROUTER_API_KEY 입력
npm run dev
```

http://localhost:3000 을 엽니다. `.env.local`은 커밋하지 마세요. 키는 `OPENROUTER_API_KEY` 서버 변수로만 사용하며 `NEXT_PUBLIC_` 접두사를 쓰지 않습니다.

```sh
npm test
npm run typecheck
npm run build
npm start
```

## Vercel 배포

이 폴더를 별도 Git 저장소로 업로드해 Vercel에서 Import 하거나 Vercel CLI로 배포합니다. 프레임워크는 Next.js, 빌드 명령은 기본 `npm run build`입니다.

환경변수:

| 이름 | 값 |
| --- | --- |
| `OPENROUTER_API_KEY` | 소액 지출 한도를 설정한 전용 OpenRouter 키 |
| `OPENROUTER_MODEL` | `google/gemini-2.5-flash-image` (선택) |
| `APP_ORIGIN` | 실제 앱 주소, 예: `https://my-portrait.vercel.app` (끝에 `/` 없이) |

Production에서는 APP_ORIGIN이 없으면 생성 요청을 거부합니다. Preview 배포도 해당 Preview URL로 환경변수를 설정하세요. 환경변수를 바꾸면 재배포합니다. 함수 최대 실행 시간 120초를 지원하는 요금제/설정을 사용하세요. 외부 AI 대기는 100초 제한입니다. 사진은 multipart binary로 보내 3MB로 제한하고 결과는 binary로 반환해 Vercel의 4.5MB 요청·응답 제한 안에 둡니다. 결과 4MiB 초과 시 오류 처리합니다. 플랫폼 제한/실행 시간은 배포 시 Vercel 설정에서 확인하세요.

## API 검증 (2026-10-25)

공식 최신 문서와 공개 모델 목록을 확인했습니다. 예전 chat completions 예제 대신 전용 Image API를 사용합니다.

- 문서: https://openrouter.ai/docs/guides/overview/multimodal/image-generation
- 실제 이미지 모델 목록: https://openrouter.ai/api/v1/images/models
- 기본 모델: https://openrouter.ai/google/gemini-2.5-flash-image
- 공급자별 능력/가격: https://openrouter.ai/api/v1/images/models/google/gemini-2.5-flash-image/endpoints

공개 목록에서 기본 모델의 입력 `image,text`, 출력 `image,text`, `input_references` 0~3개, `n` 1개 지원을 확인했습니다. 공급자별 엔드포인트 조회는 이번 환경에서 접근하지 못했습니다. 실서비스 키가 제공되지 않아 유료 이미지 생성은 실행하지 않았습니다. 따라서 모델의 실제 결과 품질과 계정별 공급자 사용 가능 여부는 키 설정 후 확인해야 합니다.

요청: `POST https://openrouter.ai/api/v1/images`, Bearer 인증, JSON `{model, prompt, n:1, input_references:[{type:"image_url", image_url:{url:"data:image/jpeg;base64,..."}}]}`. 응답의 `data[0].b64_json`을 읽고 실제 파일 서명을 확인합니다. `media_type`이 누락될 수도 있으므로 바이트로 형식을 판별합니다. 자동 재시도나 다른 모델 자동 전환은 하지 않습니다.

## 사진 처리와 개인정보

- JPG/PNG/WebP, 3MiB 이하, 디코딩 가능한 정지 이미지, 1,600만 화소 이하. 클라이언트와 서버에서 크기·형식을 검사하며 서버에서 파일 서명과 실제 디코딩도 검사합니다.
- 서버는 회전 방향을 적용하고 최대 1536px로 줄여 JPEG 재인코딩합니다. Sharp 기본 동작으로 EXIF/GPS 등 메타데이터를 제거합니다. A 방식의 원본 기반 시각 정보는 외부 AI로 전송됩니다. 얼굴 특징만 보내는 익명화 방식이 아닙니다.
- 앱은 사진·base64·AI 응답 본문·키를 로그에 출력하지 않습니다. 요청/응답은 `no-store`. 외부 분석 도구 없음. 페이지의 외부 글꼴 요청에는 사진이 포함되지 않습니다.
- 동의는 기본 해제이며 사진을 바꿀 때 초기화됩니다. 서버도 동의를 확인합니다. 동의 이력을 DB에 기록하지는 않습니다.
- 사진은 앱 서버, OpenRouter, 선택 모델의 공급자를 거칩니다. 앱 미저장이 외부 업체의 무보관을 뜻하지 않습니다. 외부 처리/보관 정책은 https://openrouter.ai/privacy 및 https://openrouter.ai/docs/guides/privacy/provider-logging 을 확인하세요. 본인 사진 또는 사진 속 인물이 동의한 사진만 사용합니다.
- 서버 메모리 해제는 런타임 GC에 따르며 암호학적 즉시 삭제를 보장하지 않습니다. 호스팅 업체의 접속 메타데이터 로그는 별개입니다. 운영 시 본문 캡처/이미지 로깅 도구를 추가하지 마세요.

## 요청 제한과 비용

메모리에서 IP 해시별 10분에 3회 시도, 동시 1개 요청. Vercel이 제공하는 `x-vercel-forwarded-for`만 사용하며 로컬은 하나의 공통 버킷입니다. 해시는 영구 저장하지 않습니다. 입력 오류와 AI 실패도 시도 횟수에 포함됩니다. 동일 IP의 여러 사용자는 한도를 공유합니다.

**이 제한은 서버 인스턴스별이며 재시작 시 초기화됩니다.** 분산 환경에서 전역 한도나 강한 남용 방지가 아닙니다. Origin 검사도 인증이 아닙니다. 주변 사람에게만 Vercel Deployment Protection 등으로 공유하고 OpenRouter 키의 지출 한도를 낮게 설정하세요. 공개 서비스 확장 시 Vercel Firewall 제한 또는 공유 원자적 카운터를 붙여야 합니다. 사진 저장소는 필요하지 않습니다.

공식 모델 페이지 확인 시 이미지 출력 $30/100만 토큰, 입력 $0.30/100만 토큰이며 텍스트 출력 가격은 별도입니다. 한 장 비용은 출력 토큰/공급자/옵션에 따라 달라지므로 고정 단가를 보장하지 않습니다. 예를 들어 이미지 출력이 1,290토큰이면 출력만 약 $0.0387, 100장은 약 $3.87이며 입력·기타 비용이 추가됩니다. 이 숫자는 계산 예시입니다. 실제 비용은 OpenRouter 대시보드에서 확인하세요. 환율, 결제/크레딧 구매 수수료, Vercel 비용은 별도입니다. 다운로드는 추가 AI 호출이 없습니다. 다시 만들기는 새 유료 요청입니다. 브라우저 새로고침/연결 종료가 완료된 생성의 과금을 반드시 취소하지는 않으므로 자동 재시도하지 않습니다.

## 확인 방법

단위 테스트는 스타일 허용 목록, 위장 파일 서명, 동시성/횟수/기간 제한을 검증합니다. 키 설정 후 실제 사진으로 3가지 스타일, 다운로드, 동의 미선택, 잘못된 파일, 3MB 초과, 4번째 요청, 공급자 오류를 확인하세요. API/모델 스펙 검증과 유료 생성 성공 검증은 별개입니다.

## 이번 작업의 검증 결과

`npm test`: 4개 통과(서버 API는 모의 OpenRouter 응답 사용). `npm run typecheck`, `npm run build` 통과. 로컬 프로덕션 화면에서 스타일 변경, 동의 토글, 사진 미선택 시 생성 비활성화를 확인했습니다. 유료 AI 생성과 실제 Vercel 배포는 실행하지 않았습니다.
