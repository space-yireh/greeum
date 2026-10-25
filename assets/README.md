# Optional style reference

운영자가 사용할 권한이 있는 흑백 기준 그림을 `assets/style-reference.png`에 두고 서버 환경변수 `CARICATURE_STYLE_REFERENCE_PATH=assets/style-reference.png`를 설정합니다. 사용자 사진을 이 폴더에 저장하지 마세요. 기준 그림은 배포 파일에 포함됩니다. 미설정 시 영어 공통 프롬프트만 사용합니다. 설정했는데 파일이 없으면 조용히 무시하지 않고 생성이 실패합니다. 기본 Gemini 모델은 사진 1장+그림체 참조 1장을 지원합니다. 다른 모델로 바꿀 때는 복수 참조 입력과 1:1 비율 지원을 먼저 확인하세요.
