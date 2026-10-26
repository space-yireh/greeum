# 캐리커처 GPT Image A/B 비교

상태: 구현/모의 테스트 완료. 원본 사진과 그림체 파일 경로가 지정되지 않아 실제 유료 생성 및 품질 판정은 대기 중입니다. 모의 테스트의 비용·시간을 실제 모델 측정치로 사용하지 않습니다.

## 비교 대상과 검증된 지원

2026-10-25 OpenRouter 공개 Image Models API와 모델별 endpoints를 직접 조회했습니다.

| 후보 | OpenRouter 모델 ID | 이미지 입출력 | 최대 참고 이미지 | 비교 설정 |
| --- | --- | --- | --- | --- |
| 기존 설정 유지 | google/gemini-nano-banana-2.1 | 지원 | 14 | 1K, 1:1, n=1 |
| 우선 후보 | openai/gpt-image-2.5-sunburst | 지원 | 16 | 1024×1024, medium, n=1 |
| 두 번째 후보 | openai/gpt-image-2.5-flare | 지원 | 16 | 1024×1024, medium, n=1 |

OpenAI 공식 문서는 Sunburst를 정밀 편집, Flare를 빠른 고품질 일상 생성용으로 안내합니다. 이 설명은 이 앱의 얼굴 유사성 실험 결과를 대신하지 않습니다. 같은 medium 설정으로 두 GPT 후보를 비교하되 Gemini 1K와 품질 척도가 동일하지 않다는 점을 보고서에 기록합니다.

Sunburst와 Flare의 조회된 OpenRouter 단가는 동일합니다: 이미지 입력 $8/100만 토큰, 텍스트 입력 $5/100만 토큰, 이미지 출력 $30/100만 토큰. 기존 Nano Banana 2.1의 이미지 출력도 $30/100만 토큰이지만 모델별 사용 토큰 수와 입력 과금이 달라 장당 가격은 다를 수 있습니다. 고정 장당 비용을 만들어 표시하지 않습니다. 6장의 실제 과금은 각 응답 usage.cost에서 수집합니다. 자동 유료 재시도와 자동 모델 대체는 없습니다.

## 실행

프로젝트 폴더 `/Users/misolab/Documents/Project/greeum`에서:

```sh
npm run compare -- \
  --photo /절대경로/원본사진.jpg \
  --reference /절대경로/흑백그림체.png \
  --out /절대경로/새로운비교결과폴더
```

두 입력은 JPG/PNG/WebP, 각 5MiB 이하, 정지 이미지, 1,600만 화소 이하입니다. `--out`의 부모 폴더는 존재해야 하고 결과 폴더 자체는 아직 없어야 합니다. 기존 결과를 덮어쓰지 않습니다. `.env.local`의 OPENROUTER_API_KEY로 OpenRouter를 사용합니다. OPENROUTER_MODEL은 기존 모델로 유지하고 실제 `.env.local`을 비교 도구가 변경하지 않습니다.

실행하면 동일한 사진과 그림체로 세 모델 × cute/similar의 6개 요청을 순서대로 보냅니다. 원본은 인물 참고용 이미지 1, 예시는 그림체 참고용 이미지 2입니다. 레퍼런스의 얼굴·복장·포즈를 복사하지 않도록 명시합니다. 실행 직전 모델 능력을 다시 조회하며, 참고 이미지가 1개만 지원되면 원본만 보내고 프롬프트에서도 두 번째 이미지 지시를 제거합니다. 이미지 입력이 불가능하면 과금 요청 전에 중단합니다.

## 결과 확인

결과 폴더의 `index.html`을 브라우저에서 열면:

- 모델별 귀엽게/비슷하게 결과: 모델 원본과 앱의 흑백 후처리 결과를 나란히 표시
- 원본 결과/흑백 결과 PNG 다운로드
- 실제 전송 영어 프롬프트 전체
- 모델 ID, 품질·크기, 참조 이미지 수와 공급자 제한 설정
- API 왕복 시간(초): 요청부터 응답 JSON 수신까지, 모델 순수 추론 시간과는 다름
- OpenRouter 보고 비용(USD): usage.cost 미제공은 알 수 없음으로 표시

`report.json`에는 입력 이미지 역할과 해시, 프롬프트 버전, 당시 모델/공급자 능력·가격, 실제 프롬프트·설정·사용 토큰·비용·시간·결과 파일을 기록합니다. API 키와 base64 입력 사진은 보고서에 넣지 않습니다. 업로드 사진 자체는 별도 복사하지 않습니다. 이 로컬 비교 도구는 사용자가 요청한 검증 결과를 파일로 저장하며, 기존 웹앱은 여전히 원본과 결과를 DB/스토리지에 저장하지 않습니다.

모델 원본을 남기는 이유: 흑백 threshold만으로 개인차가 사라진 결과를 좋은 선화처럼 보이게 평가하지 않기 위함입니다. 앱의 기존 순수 흑백 후처리는 별도 결과로 유지합니다. 얼굴/눈·코·입/턱의 차이가 모델 단계에서 사라졌는지, 후처리에서 사라졌는지 함께 확인합니다.

## 프롬프트 변경

프롬프트 버전 `bw-identity-v2`입니다. 기존 모든 스타일에 공통 BASE_STYLE_PROMPT를 사용합니다. 벡터 아이콘처럼 얼굴을 같은 점·쉼표·곡선으로 치환하지 않도록 추가하고, 눈꺼풀 윤곽·코끝·입술·턱 형태를 개인별로 유지하도록 명시했습니다. Cute는 볼과 표정을 부드럽게, Likeness는 눈꺼풀·콧대·콧방울·입술·턱과 비대칭을 더 정밀한 만화 선으로 표현합니다. 반실사·색상·종이질감은 금지합니다. 모델별로 프롬프트를 바꾸지 않아 모델 차이를 분리합니다.

## 평가 기준

1. 모델 원본이 흑백 만화로 생성되었는가 (후처리 효과와 분리).
2. 원본의 눈매, 코, 입, 얼굴형, 헤어스타일과 액세서리 개인차가 살아 있는가.
3. Cute가 더 부드럽고 사랑스러우며 Likeness가 더 구체적으로 닮았는가.
4. 두 옵션이 같은 선화 계열이면서 표현 차이가 읽히는가.
5. 정확한 API 보고 비용과 사용자 체감 응답 시간이 수용 가능한가.

한 사람 × 옵션별 한 장은 탐색적 비교입니다. 기본 모델은 자동 변경하지 않고 결과를 사용자와 확인한 후 결정합니다.

## 변경 파일과 검증

- `scripts/compare-models.ts`: 실제 A/B 요청, 능력 확인, 결과 이미지/HTML/JSON 보고서
- `lib/comparison.ts`: 모델별 비교 설정, 참조 수/비용 판별
- `lib/prompts.ts`: 공통 개인차 보존과 Cute/Likeness 구별 강화
- `package.json`: npm run compare
- `tests/comparison.test.ts`, `tests/comparison-run.test.ts`: 요청 일치, 기본 모델 유지, 단일 레퍼런스 대체, 비용 미제공, 6칸 보고서 통합 검증

테스트 11개 통과. API는 모의 응답을 사용했습니다. 타입 검사와 프로덕션 빌드도 통과했습니다. 실제 인물 사진 생성·비용·속도·화질 검증은 아직 수행하지 않았습니다.

## 출처

- https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst
- https://developers.openai.com/api/docs/models/gpt-image-2.5-flare
- https://openrouter.ai/api/v1/images/models
- https://openrouter.ai/api/v1/images/models/openai/gpt-image-2.5-sunburst/endpoints
- https://openrouter.ai/api/v1/images/models/openai/gpt-image-2.5-flare/endpoints
- https://openrouter.ai/docs/guides/overview/multimodal/image-generation


## 현재 웹앱 그림체 조정 (v3)

기본 생성 모델은 Sunburst입니다. baseline 환경변수는 비교 도구에서만 사용합니다. paired 예시는 서버 메모리에서 스타일별로 한쪽만 선택해 보냅니다. Cute는 좌측, Likeness는 우측, Funny는 별도 예시가 없어 좌측 선화를 참고합니다. 결과의 threshold 이진화는 제거했고, 색상만 제거하여 미세한 회색 선과 안티앨리어싱을 유지합니다. 이전 문서의 순수 두 색 픽셀/threshold 설명은 현재 동작에 적용되지 않습니다. 이번 조정에서는 유료 생성이나 실제 A/B 테스트를 실행하지 않았습니다.
