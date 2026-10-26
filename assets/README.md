# 그림체 참고 이미지

`style-reference-cute.png`와 `style-reference-similar.png`는 제공된 비교 예시를 각각 한 장씩 분리한 파일입니다. 앱은 귀엽게에 전자, 비슷하게에 후자를 사용합니다. 익살스럽게 전용 예시는 없어 귀엽게 참고 이미지의 선화와 익살스럽게 프롬프트를 함께 사용합니다. 두 파일을 배포에 포함해야 합니다.

기존 `CARICATURE_STYLE_REFERENCE_PATH=assets/style-reference.png` 설정은 참고 이미지 사용을 켜는 호환 설정으로 유지됩니다. 앱은 이 설정이 있으면 위의 개별 파일을 읽습니다. 설정이 없으면 참고 이미지 없이 작동합니다. `CARICATURE_STYLE_REFERENCE_LAYOUT`은 앱에서 더 이상 사용하지 않습니다. 방문자의 원본 사진과 생성 결과는 앱에서 저장하지 않습니다.

공통 모델은 Sunburst high, 정사각형 비율 (size 미지정)입니다. 결과는 그레이스케일 PNG이며 미세한 선과 부드러운 가장자리를 보존합니다.
