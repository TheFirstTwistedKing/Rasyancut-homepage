# 사령관 통신 대화 데이터

메인 화면에서 **왼쪽 끝(COMMAND LINK)** 또는 **방향키 ←** 로 들어가는 사령관 통신 화면의 대사 파일입니다.
사령관 한 명당 파일 하나이며, 파일 이름은 `index.html`의 `CONFIG.commanders` 의 `id` 와 같습니다.

| id | 사령관 |
|---|---|
| kanehira | 카네히라 마사노리 (Stage Management) |
| avyssion | 아비시온 크리토스 (R.S.S.) |
| shen | 선샤오펑 (Leviathan's Register) |
| memory | 메모리 레크레아토르 - III (Memorial Extraction) |
| lucien | 뤼시앙 에코브냉 (Sovereign's Hand) |
| caeluna | 카엘루나 게미니스 (Unbreakable Shield) |
| solaria | 솔라리아 루브리나타 (Unbreakable Shield) |
| overseer | AI - Class IV : Overseer (Judgement Operation) |
| sender | 발신자 표시 제한 (소속 불명 · 정보와 운세만 이야기함) |

## 형식

```js
(window.CMD_DATA = window.CMD_DATA || {}).kanehira = {
  hello: ["접속했을 때 나오는 첫 인사 5개", …],
  talk:   [ ["질문", ["답변1", "답변2", "답변3", "답변4", "답변5"]], … ],  // 간단한 대화
  ask:    [ … ],  // 질문
  work:   [ … ],  // 일거리
  food:   [ … ],  // 음식
  honest: [ … ],  // 솔직 토크
  hobby:  [ … ],  // 취미
  rel: {          // 관계 탭: 상대 사령관 id → 답변 목록(4개씩), _all = 사령관 전체 분위기
    avyssion: ["…", "…", "…", "…"], … , _all: ["…", "…"]
  }
};
```

- 주제는 6개(연애 주제는 없음). 주제마다 질문 50개, 질문마다 답변 5개(서로 달라야 함). 같은 질문을 다시 고르면 5개를 한 바퀴 다 볼 때까지 중복 없이 무작위로 나옵니다.
- 수정한 뒤에는 `node tools/validate-cmd.js` 로 개수와 중복을 검사하세요.

## 발신자 표시 제한 (`sender.js`)

정보 전달과 운세만 이야기하는 신비한 인물이라 형식이 다릅니다. 일반 주제(talk·ask·work·food·honest·hobby)와 관계 탭은 없습니다.

```js
(window.CMD_DATA = window.CMD_DATA || {}).sender = {
  hello:   ["첫 인사 5개", …],
  vague:   ["대상 없이 '알려 줘'라고만 했을 때의 답변", …],   // 3개 이상
  info:    [ ["질문", ["답변1", … "답변5"], ["키워드", …]], … ],  // 정보 전달 50개
  fortune: [ ["질문", ["답변1", … "답변5"], ["키워드", …]], … ]   // 운세 40개
};
```

- 화면의 입력창에 직접 쓴 말은 **키워드**로 어느 질문인지 찾습니다(공백·구두점 무시, 겹친 키워드 길이만큼 점수). 찾지 못하면 답하지 않고 `읽음`만 남깁니다.
- 키워드는 2글자 이상으로 쓰세요. 한 글자 키워드는 일상 대화에 잘못 걸립니다. `node tools/validate-cmd.js` 가 질문마다 자기 자신이 가장 높은 점수로 잡히는지 확인합니다.
- 정보 답변은 설정집(CODEX)에 적힌 내용만 바탕으로 합니다. 새 설정을 만들었다면 설정집에도 반영하세요.

## index.html 에 넣기

`index.html` 은 대화 데이터를 파일로 따로 불러오지 않고 안에 사본을 갖고 있습니다(파일을 따로 못 불러오는 환경에서도 '통신 회선이 연결되지 않았습니다'가 뜨지 않게). 이 폴더의 파일을 고친 뒤에는 `node tools/inline-cmd.js` 로 사본을 갱신하세요.
