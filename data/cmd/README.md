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

## 형식

```js
(window.CMD_DATA = window.CMD_DATA || {}).kanehira = {
  hello: ["접속했을 때 나오는 첫 인사 5개", …],
  talk:   [ ["질문", ["답변1", "답변2", "답변3", "답변4", "답변5"]], … ],  // 간단한 대화
  ask:    [ … ],  // 질문
  work:   [ … ],  // 일거리
  love:   [ … ],  // 연애
  food:   [ … ],  // 음식
  honest: [ … ],  // 솔직 토크
  hobby:  [ … ],  // 취미
  rel: {          // 관계 탭: 상대 사령관 id → 답변 목록(4개씩), _all = 사령관 전체 분위기
    avyssion: ["…", "…", "…", "…"], … , _all: ["…", "…"]
  }
};
```

- 주제마다 질문 50개, 질문마다 답변 5개(서로 달라야 함). 같은 질문을 다시 고르면 5개를 한 바퀴 다 볼 때까지 중복 없이 무작위로 나옵니다.
- 수정한 뒤에는 `node tools/validate-cmd.js` 로 개수와 중복을 검사하세요.
