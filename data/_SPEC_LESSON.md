# 개념 정리(이론) 단원 제작 규격 — 모든 교재 에이전트 공통

## 목적

와이프(베트남인, TOPIK 5급, KIIP 5단계 수료)가 **문제를 풀기 전에 개념을 이해하고 암기**할 수 있는
교재 파트를 만든다. 지금 앱에는 문제 470개만 있고 개념 설명이 없다.

흐름: **정의·개념 읽기 → 암기 포인트 → 예시문제 → 그 단원 문제 풀기**

## 언어 규칙 (가장 중요)

| 요소 | 언어 |
|---|---|
| 용어·고유명사·법령명·인물명 | **한국어 원문 필수** (시험이 한국어로 나오므로) |
| 설명·해설·풀이 | **베트남어** |
| 표 헤더/셀 | 한국어 + 필요시 베트남어 병기 |

- 베트남어 안에 한국어 용어를 그대로 노출할 것: `Quốc hội (국회)`, `nghĩa vụ nộp thuế (납세의 의무)`
- 기계번역투 금지. 자연스러운 베트남어.
- 한국어 용어를 베트남어로만 바꿔 적으면 안 됨. **한국어를 반드시 보여줘야 시험장에서 알아본다.**

## JSON 스키마 (엄격히 준수)

파일 하나에 배열 하나. 각 원소 = 단원 1개.

```json
{
  "id": "history-l04",
  "domain": "history",
  "order": 4,
  "title_ko": "삼국 시대",
  "title_vi": "Thời Tam Quốc",
  "icon": "🏯",
  "summary_vi": "Ba vương quốc Goguryeo, Baekje, Silla cùng tồn tại. Đây là phần ra thi rất đều — nhớ thứ tự thịnh vượng và nhân vật tiêu biểu của từng nước.",
  "est_min": 8,

  "sections": [
    {
      "h_ko": "고구려",
      "h_vi": "Goguryeo",
      "body_vi": "Giải thích bằng tiếng Việt, 2~5 câu. Nêu rõ vị trí, đặc điểm, thời kỳ mạnh nhất. Chèn thuật ngữ tiếng Hàn trong ngoặc.",
      "terms": [
        { "ko": "광개토대왕", "vi": "Gwanggaeto Đại đế",
          "def_vi": "Vua mở rộng lãnh thổ Goguryeo lớn nhất, thế kỷ 5. Bia đá 광개토대왕릉비 ghi công lao của ông." }
      ]
    }
  ],

  "tables": [
    {
      "cap_ko": "삼국 비교",
      "cap_vi": "So sánh ba nước",
      "head": ["나라", "건국", "전성기", "대표 왕"],
      "rows": [
        ["고구려", "기원전 37년", "5세기", "광개토대왕·장수왕"],
        ["백제",   "기원전 18년", "4세기", "근초고왕"],
        ["신라",   "기원전 57년", "6세기", "진흥왕"]
      ]
    }
  ],

  "must_memorize": [
    "삼국 전성기 순서: 백제(4세기) → 고구려(5세기) → 신라(6세기)",
    "불교 전래: 고구려 372년 → 백제 384년 → 신라 527년(공인)"
  ],

  "traps": [
    "'삼국통일'을 한 나라는 신라. 고구려가 아니다 — 자주 나오는 함정."
  ],

  "examples": [
    {
      "q": "삼국시대를 이룬 세 나라의 이름으로 옳은 것은?",
      "choices": ["고려, 백제, 신라", "백제, 신라, 조선", "고구려, 백제, 신라", "고구려, 백제, 조선"],
      "answer": 2,
      "explain_vi": "Đáp án ③. Tam Quốc gồm 고구려·백제·신라. 고려 và 조선 là các triều đại RA ĐỜI SAU, không thuộc thời Tam Quốc."
    }
  ],

  "match": ["삼국", "고구려", "백제", "신라", "삼국의 발전 과정과 문화"]
}
```

### 필드 규칙

| 필드 | 필수 | 설명 |
|---|---|---|
| `id` | ✅ | `{domain}-l{2자리}` 예: `history-l04` |
| `domain` | ✅ | 아래 도메인 표의 값만 |
| `order` | ✅ | 해당 도메인 안에서 학습 순서 1부터 |
| `title_ko` / `title_vi` | ✅ | 단원 제목 |
| `icon` | ✅ | 이모지 1개 |
| `summary_vi` | ✅ | 베트남어 1~2문장. 이 단원이 왜 중요한지/시험에 어떻게 나오는지 |
| `est_min` | ✅ | 예상 학습 시간(분), 5~12 |
| `sections` | ✅ | **3~6개**. 각 섹션에 `h_ko`, `h_vi`, `body_vi` 필수, `terms`는 선택 |
| `terms` | — | 섹션당 0~5개. `ko`(한국어 용어), `vi`(베트남어 대응어), `def_vi`(베트남어 정의 1~2문장) |
| `tables` | — | 0~3개. 암기에 도움되는 비교표. `head`와 각 `rows` 길이가 반드시 일치 |
| `must_memorize` | ✅ | **3~8개**. 시험에 그대로 나오는 핵심 사실. 한국어 키워드 포함 |
| `traps` | — | 0~4개. 자주 틀리는 함정·헷갈리는 지점 |
| `examples` | ✅ | **2~3개**. 4지선다. `answer`는 0-based. 선택지에 ①②③④ 넣지 말 것 |
| `match` | ✅ | 이 단원과 연결할 문제를 찾는 키워드 3~8개. 문제은행의 `topic`·`keywords` 값과 겹치도록 |

## 도메인 코드 (문제은행과 동일 — 반드시 일치)

`kor_grammar` `kor_vocab` `society` `education` `culture` `politics` `economy` `law` `history` `geography`
`adv_citizen` `adv_history` `adv_politics` `adv_economy` `adv_law`

## 내용 품질 기준

- ✅ **정의를 먼저, 그 다음 예시.** "국회는 무엇인가" → 역할 → 구성 → 임기 순서.
- ✅ 시험에 나오는 **숫자·연도·명칭**은 표나 `must_memorize`로 뽑아낼 것. 본문에만 묻어두지 말 것.
- ✅ 베트남 학습자 기준으로 설명. 베트남 제도와 비교하면 이해가 빠른 부분은 적극 비교.
- ✅ 분량: 한 단원을 5~12분에 읽을 수 있게. `sections`의 `body_vi`는 각 2~5문장.
- ❌ **사실을 지어내지 말 것.** 확실하지 않으면 WebSearch로 확인. 확인 안 되면 빼기.
- ❌ 자주 바뀌는 금액(최저임금, 지원금)·통계 수치는 넣지 말 것.
- ❌ 특정 정권·정당·최근 정치 사건 금지. 제도와 원리만.
- ❌ 문제은행의 `explain_vi`를 그대로 복붙하지 말 것.

## 주의할 최신 사실

- 2026.7.1. 광주광역시 + 전라남도 → **전남광주통합특별시** 출범. 광역시 개수·광주 지위는 다루지 말 것.
- 2024.5.17. `문화재` → **`국가유산`**, `문화재청` → **`국가유산청`** 으로 법정 용어 변경. 병기 권장.
- 특별자치도: 제주(2006) · 강원(2023) · 전북(2024).
- 만 나이 통일: 2023.6.28. 시행 (단 청소년보호법·병역법·초등학교 입학은 연 나이).

## 마무리 검증 (필수)

```bash
node -e "
const a=require('<파일경로>');
console.log('단원 수:', a.length);
let bad=0;
a.forEach(x=>{
  const e=[];
  if(!x.id||!x.domain||!x.title_ko||!x.title_vi||!x.icon||!x.summary_vi)e.push('필수필드');
  if(!Array.isArray(x.sections)||x.sections.length<3)e.push('sections<3');
  (x.sections||[]).forEach(s=>{if(!s.h_ko||!s.h_vi||!s.body_vi)e.push('section필드')});
  if(!Array.isArray(x.must_memorize)||x.must_memorize.length<3)e.push('must_memorize<3');
  if(!Array.isArray(x.examples)||x.examples.length<2)e.push('examples<2');
  (x.examples||[]).forEach(q=>{
    if(!Array.isArray(q.choices)||q.choices.length!==4)e.push('choices!=4');
    if(!(q.answer>=0&&q.answer<=3))e.push('answer범위');
    if(!q.explain_vi)e.push('explain_vi');
    if(q.choices&&q.choices.some(c=>/^[①②③④]/.test(c)))e.push('원문자');
  });
  (x.tables||[]).forEach(t=>{
    if(!Array.isArray(t.head)||!Array.isArray(t.rows))e.push('table구조');
    else t.rows.forEach(r=>{if(r.length!==t.head.length)e.push('table열수불일치')});
  });
  if(!Array.isArray(x.match)||x.match.length<3)e.push('match<3');
  if(e.length){console.log('BAD',x.id,[...new Set(e)].join(','));bad++;}
});
console.log(bad?('오류 '+bad+'개'):'✅ 전부 통과');
"
```
