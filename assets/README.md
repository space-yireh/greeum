# 과거 그림체 참고 이미지

이 폴더의 `style-reference.png`, `style-reference-cute.png`, `style-reference-similar.png`는 이전 그림체 실험 자료입니다. 현재 웹앱은 **귀엽게 한 가지**를 텍스트 프롬프트로 생성하며 이 파일들을 읽거나 외부 AI로 보내지 않습니다. `loadStyleReference()`는 항상 `undefined`를 반환합니다.

`CARICATURE_STYLE_REFERENCE_PATH`를 설정해도 웹앱 동작은 바뀌지 않습니다. 이 파일들은 생성 API 배포에 강제로 포함하지 않습니다. 필요하면 과거 비교 도구에 `--reference`로 직접 전달할 수 있으나, 현재 프롬프트는 그림체 참고 이미지를 별도로 설명하지 않습니다. 자세한 제약은 [비교 도구 문서](../AB_TEST.md)를 참고하세요.
