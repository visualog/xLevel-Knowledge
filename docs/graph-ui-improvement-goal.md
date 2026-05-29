# Knowledge Graph UI/UX Improvement Goal

`xLevel Knowledge` 사이트의 지식 그래프 화면을 개선한다. 현재 첫 진입 시 노드 전체가 보이지 않고 긴 연결선 일부만 화면에 보여 그래프의 구조, 탐색 가능성, 정보 계층이 제대로 전달되지 않는다. 목표는 지식 그래프를 Obsidian, Cytoscape, Sigma.js 계열의 탐색 가능한 네트워크 UI처럼 첫 화면부터 노드와 관계가 명확히 보이고, 사용자가 자연스럽게 확대, 이동, 선택, 필터링할 수 있는 상태로 만드는 것이다.

## Context

현재 사이트는 여러 출처의 학습 데이터를 자동 분류하고 연결해서 프로젝트 판단 기준으로 재사용하는 지식 베이스다. 특정 출처인 Plus X/플엑익힘책에만 고정된 제품처럼 보이면 안 된다. 타이틀, 카피, UI 용어는 다양한 출처의 지식 수집과 재사용을 전제로 해야 한다.

현재 문제:

- 그래프 첫 화면에서 노드는 거의 보이지 않고 긴 라인만 보인다.
- 전체 노드 bounding box 기준의 fit-to-view가 없다.
- 링크 밀도가 높아 시각적 노이즈가 크다.
- 노드, 링크, 카테고리, 선택 상태의 위계가 약하다.
- 그래프 영역이 탐색 도구라기보다 깨진 시각화처럼 보인다.
- 전반적인 UI 디테일, 타이포그래피, 여백, 인터랙션 완성도가 부족하다.

## Required Workflow

Fabric 전용 도구가 없어도 된다. 이 프로젝트에서는 Fabric 노트를 `notes/` 폴더의 Markdown 파일로 생성한다.

작업 전:

1. `notes/graph-ui-improvement-plan.md` 생성
2. `notes/screenshots/graph-ui-improvement-2026-05-29/` 생성
3. 브라우저에서 `http://localhost:8080/knowledge/site/`를 열고 현재 화면 캡처
4. 캡처 파일: `notes/screenshots/graph-ui-improvement-2026-05-29/before-fullscreen.png`

작업 후:

1. 개선된 화면 캡처: `notes/screenshots/graph-ui-improvement-2026-05-29/after-fullscreen.png`
2. `notes/graph-ui-improvement-completion-report.md` 생성
3. 계획 노트와 완료 리포트에 아래 이미지 링크 포함

```md
![Before](./screenshots/graph-ui-improvement-2026-05-29/before-fullscreen.png)
![After](./screenshots/graph-ui-improvement-2026-05-29/after-fullscreen.png)
```

macOS 캡처는 다음 명령을 사용한다.

```bash
mkdir -p notes/screenshots/graph-ui-improvement-2026-05-29
screencapture -x notes/screenshots/graph-ui-improvement-2026-05-29/before-fullscreen.png
screencapture -x notes/screenshots/graph-ui-improvement-2026-05-29/after-fullscreen.png
```

## External References

다음 레퍼런스를 설계 기준으로 참고한다. 그대로 복제하지 말고 현재 정적 사이트 구조에 맞게 핵심 원칙만 적용한다.

- Cytoscape.js: 그래프를 viewport에 fit하고 pan/zoom 가능한 분석 UI로 다루는 방식  
  https://js.cytoscape.org/
- Cytoscape layout guidance: 노드 수, 관계 밀도, 레이아웃 알고리즘에 따라 적절한 초기 배치와 fit이 중요함  
  https://blog.js.cytoscape.org/2020/05/11/layouts/
- Sigma.js: 대규모 네트워크에서 노드/엣지 렌더링, hover, selection, camera interaction을 분리하는 방식  
  https://www.sigmajs.org/
- Sigma.js interactions: 그래프 클릭, hover, camera 이동, 이벤트 기반 탐색 UX  
  https://v4.sigmajs.org/how-to/interactivity/interactions-events/
- D3 force simulation: 노드 간 충돌, 링크 거리, 중심력, 클러스터링을 통한 안정적인 그래프 배치  
  https://d3js.org/d3-force
- Apple Human Interface Guidelines - Motion: 인터랙션은 과하지 않게, 상태 변화와 공간 관계를 이해시키는 수준으로 사용  
  https://developer.apple.com/design/human-interface-guidelines/motion
- Obsidian Graph View: 전체 그래프와 로컬 그래프를 구분하고, 선택한 노드의 인접 관계를 중심으로 탐색하게 만드는 방식

## Implementation Requirements

### Graph Initial Fit

첫 렌더링 시 전체 노드가 보이도록 한다.

- `graphLayout()` 이후 모든 노드의 `minX`, `maxX`, `minY`, `maxY`를 계산한다.
- 그래프 viewport 크기와 padding을 기준으로 scale과 translate를 계산한다.
- 초기 진입, Reset, Fit 버튼 클릭 시 이 fit-to-view 로직을 사용한다.
- 단순히 `x = width / 2`, `y = height / 2`, `scale = 1`로 중앙 배치하지 않는다.
- 필터 변경, 로컬 포커스 변경, 그래프 탭 진입 시 필요하면 다시 fit한다.

### Node And Link Visibility

- 노드가 링크보다 명확히 위에 보여야 한다.
- 기본 링크 opacity를 낮춰 배경 구조로 보이게 한다.
- 선택된 노드와 연결된 링크는 더 선명하게 표시한다.
- 선택되지 않은 먼 노드와 링크는 살짝 낮은 대비로 처리한다.
- 기본 링크 밀도는 과하지 않게 낮춘다.
- 밀도 슬라이더는 사용자가 더 많은 관계를 보고 싶을 때 확장하는 도구처럼 동작해야 한다.

### Layout And Interaction

- 그래프는 첫 화면에서 전체 구조를 한눈에 볼 수 있는 상태여야 한다.
- 카테고리 클러스터는 은은하게 보여주되 노드를 가리지 않는다.
- zoom/pan은 부드럽고 예측 가능해야 한다.
- hover 시 노드 제목, 카테고리, 연결 수를 간단히 보여준다.
- click 시 우측 패널에 선택 카드 정보가 표시되어야 한다.
- local focus는 선택 노드와 직접 연결된 노드 중심으로 보기 좋게 재구성되어야 한다.
- label은 항상 과하게 보이지 않게 하고, 선택/hover/zoom 상태에서 우선순위를 둔다.

### UI/UX Polish

- 폰트는 한 가지 sans-serif 체계로 정리한다.
- 세리프/산세리프 혼용을 제거한다.
- 여백, 버튼 높이, 카드 radius, border, shadow, text size를 일관되게 맞춘다.
- Apple 제품처럼 과하지 않지만 디테일이 살아 있는 상호작용을 지향한다.
- 인터랙션은 장식이 아니라 상태 이해를 돕는 방식이어야 한다.
- 그래프 영역은 깨끗하고 차분해야 하며, 노드와 관계가 주인공이어야 한다.
- 초록색 계열만 반복되는 단조로운 팔레트는 피하고, 카테고리별 색상은 절제된 다중 팔레트로 조정한다.

## Suggested Code Targets

우선 다음 파일을 확인하고 수정한다.

- `knowledge/site/app.js`
- `knowledge/site/styles.css`
- `knowledge/site/index.html`

예상 수정 포인트:

- `state.graph`에 `nodes`, `needsFit`, `hasFit` 같은 상태 추가
- `fitGraph()`를 bounding-box 기반 `fitGraphToNodes(nodes)`로 교체
- `renderGraph()`에서 layout 후 node bounds 저장
- `Reset`, `Fit`, `filter`, `local focus`, `graph tab` 이벤트에서 fit 재계산
- 링크 기본 opacity와 focus 스타일 조정
- 노드 label 표시 조건 조정
- density 기본값 하향 조정

## Verification

작업 후 반드시 확인한다.

- 첫 그래프 진입 시 노드 전체가 화면 안에 들어오는가
- 긴 링크만 보이는 깨진 상태가 사라졌는가
- Reset/Fit 버튼이 기대대로 동작하는가
- 필터 변경 후 그래프가 보기 좋은 위치로 재정렬되는가
- Local focus가 선택 노드 중심으로 의미 있게 보이는가
- 노드 hover/click/selection 상태가 명확한가
- 전체 UI의 폰트, 여백, 버튼, 카드, 패널 스타일이 일관적인가
- before/after screenshot과 completion report가 생성되었는가

## Output

완료 후 사용자에게 다음을 짧게 보고한다.

- 수정한 핵심 내용
- 확인한 동작
- 생성한 노트와 스크린샷 경로
- 남은 개선 여지가 있다면 1~2개

