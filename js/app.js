/* 앱 동작 코드. 문구와 문제 카드는 content.js에서 고치세요. */

const ALL_LIBS = LIBS.flatMap(g => g.items);
const blank = () => ({
  step: 1, filter: '전체', problem: null, ownTitle: '',
  place: '', who: '', when: '', pain: '', evType: '', evidence: '', gap: '',
  appName: '', primaryUser: '', approach: '', features: [], customFeature: '', realData: '',
  gameIdea: '', gameMode: '', playMode: '', elements: [], loopAct: '', loopReward: '', loopNext: '', realLink: '',
  techMode: '', core: [], libs: [], device: '', access: [], mood: '', moodOwn: '', success: '', extra: '',
  draftBase: '', editedPrompt: '', prevEdited: '', review: {}, revWhat: '', revTo: '', revWhy: '',
  fixType: 'bug', fixA: '', fixB: '', tested: '', nextFix: ''
});
const KEY = 'life-prompt-lab-v1';
let S = blank();
try { const saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved) S = Object.assign(blank(), saved); } catch (e) {}
if (!FIXTYPES[S.fixType]) S.fixType = 'bug';
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

const $ = id => document.getElementById(id);
const T = s => (s || '').trim();
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const P = () => PROBLEMS.find(p => p.id === S.problem) || null;
const problemTitle = () => { const p = P(); if (!p) return ''; return p.own ? T(S.ownTitle) : p.title; };
const moodValue = () => T(S.moodOwn) || S.mood;
const chosenTech = () => S.techMode !== 'plus' ? [] : CORE_TECH.filter(t => S.core.includes(t.id)).concat(ALL_LIBS.filter(l => S.libs.includes(l.id)));

/* ---------- 문제 문장 ---------- */
function statement() {
  return [['place', S.place, '어디에서'], ['who', T(S.who), '누가'], ['when', T(S.when), '언제'], ['pain', T(S.pain), '어떤 어려움을 겪는지']];
}
function statementText() {
  const v = Object.fromEntries(statement().map(x => [x[0], x[1] || '[' + x[2] + ']']));
  return v.place + '에서 ' + v.who + '은(는) ' + v.when + ' ' + v.pain + '.';
}
const reasonText = () => (T(S.revWhat) && T(S.revTo) && T(S.revWhy)) ? '나는 "' + T(S.revWhat) + '"을(를) "' + T(S.revTo) + '"(으)로 바꿨어요. 왜냐하면 ' + T(S.revWhy) : '';

function checks() {
  return [
    {t: '문제 고르기', ok: !!problemTitle(), step: 1},
    {t: '문제 문장', ok: statement().every(x => x[1]), step: 2},
    {t: '내가 확인한 것', ok: !!(S.evType && T(S.evidence)), step: 2},
    {t: '아직 불편한 점', ok: !!T(S.gap), step: 2},
    {t: '앱 이름과 사용자', ok: !!(T(S.appName) && S.primaryUser), step: 3},
    {t: '핵심 기능', ok: S.features.length > 0, step: 3},
    {t: '게임 장르와 게임 요소', ok: !!(S.gameMode && S.elements.length), step: 3},
    {t: '게임 반복 구조와 현실 연결', ok: !!(T(S.loopAct) && T(S.loopReward) && T(S.loopNext) && T(S.realLink)), step: 3},
    {t: '기술 정하기', ok: !!S.techMode && (S.techMode !== 'plus' || chosenTech().length > 0), step: 3},
    {t: '사용 기기와 조건', ok: !!(S.device && S.access.length), step: 3},
    {t: '성공 기준', ok: !!T(S.success), step: 3}
  ];
}
const pct = () => { const c = checks(); return Math.round(c.filter(x => x.ok).length / c.length * 100); };

/* ---------- 프롬프트: 학생이 고치는 부분 ---------- */
function buildPrompt() {
  const segs = [];
  const add = (t, c) => segs.push({t, c: c || ''});
  const val = (v, label, c) => { if (T(v)) add(T(v), c); else add('[' + label + ']', 's-blank'); };
  const head = t => add('\n# ' + t + '\n', 's-head');
  const p = P();
  add('너는 초등학생 개발자와 함께 웹앱을 만드는 친절한 개발 파트너야. 아래 내용을 바탕으로 생활 속 문제를 해결하는 웹앱 첫 버전을 만들어 줘.\n');
  head('앱 이름'); val(S.appName, '앱 이름', 's-problem'); add('\n');
  head('해결할 문제');
  add('- 주제: '); val(problemTitle(), '문제 주제', 's-problem');
  add('\n- 문제 문장: '); add(statementText(), statement().every(x => x[1]) ? 's-problem' : 's-blank');
  add('\n- 내가 확인한 것: '); if (S.evType) add('(' + S.evType + ') ', 's-problem'); val(S.evidence, '직접 확인한 내용', 's-problem');
  if (p && p.fact && SRC[p.src]) { add('\n- 참고 자료: '); add(p.fact + ' (출처: ' + SRC[p.src][0] + ')', 's-problem'); }
  add('\n- 지금 쓰는 방법과 아직 불편한 점: '); if (p && p.now) add(p.now + ' / ', 's-problem'); val(S.gap, '아직 불편한 점', 's-problem'); add('\n');
  head('사용자');
  add('- 앱을 쓰는 사람: '); val(S.primaryUser, '사용자', 's-user');
  add('\n- 사용 기기: '); val(S.device, '사용 기기', 's-user');
  add('\n- 꼭 지킬 조건: '); val(S.access.join(', '), '사용 조건', 's-user'); add('\n');
  head('핵심 기능');
  add('- 앱이 도와주는 방식: '); val(S.approach, '도와주는 방식', 's-feature'); add('\n');
  if (S.features.length) S.features.forEach((f, i) => add((i + 1) + '. ' + f + '\n', 's-feature'));
  else { add('1. '); add('[핵심 기능]', 's-blank'); add('\n'); }
  add('이 기능과 아래 게임 요소 말고는 첫 버전에 넣지 마.\n');
  head('게임으로 만들기');
  add('- 게임 장르: '); val(S.gameMode, '게임 장르', 's-game');
  add('\n- 함께 하는 방법: '); val(S.playMode, '혼자 또는 함께', 's-game');
  add('\n- 게임 요소: '); val(S.elements.join(', '), '게임 요소 3~4개', 's-game');
  add('\n- 반복 구조: '); val(S.loopAct, '플레이어가 하는 행동', 's-game'); add(' → '); val(S.loopReward, '받는 보상', 's-game'); add(' → '); val(S.loopNext, '다음 목표', 's-game');
  add('\n- 현실에서 달라지는 점: '); val(S.realLink, '게임을 하면 현실에서 달라지는 점', 's-game'); add('\n');
  head('앱에 들어갈 자료');
  add('- 필요한 항목: '); val(p ? p.data : '', '자료 항목', 's-data');
  add('\n- 내가 확인한 실제 자료: '); add(T(S.realData) || '아직 없음. 예시 데이터로 시작해 줘.', 's-data'); add('\n');
  head('화면 분위기'); val(moodValue(), '화면 분위기', 's-feature'); add('\n');
  head('사용할 기술');
  const chosen = chosenTech();
  if (!S.techMode) { add('[특별한 기술을 넣을지 정하기]', 's-blank'); add('\n'); }
  else if (S.techMode === 'basic') add('- HTML, CSS, JavaScript만 사용해 줘.\n', 's-tech');
  else if (S.techMode === 'recommend') add('- 이 문제와 게임에 가장 알맞은 기술을 추천해 줘.\n', 's-tech');
  else if (!chosen.length) { add('[사용할 기술 고르기]', 's-blank'); add('\n'); }
  else add('- ' + chosen.map(t => t.n).join(', ') + '\n', 's-tech');
  head('이렇게 되면 성공'); add('- '); val(S.success, '성공 기준', 's-user'); add('\n');
  if (T(S.extra)) { head('추가 요청'); add(T(S.extra) + '\n', 's-user'); }
  return segs;
}
const plain = segs => segs.map(s => s.t).join('');

/* ---------- 프롬프트: 자동으로 붙는 규칙 ---------- */
function rulesText() {
  const p = P(), chosen = chosenTech(), L = [];
  L.push('# 꼭 지킬 규칙 (프롬프트 제작소가 자동으로 붙인 내용)');
  L.push('- index.html 한 파일 안에 HTML, CSS, JavaScript를 모두 담아 줘. 따로 설치하거나 서버를 실행하지 않아도 바로 열려야 해.');
  L.push('- 자료, 점수, 레벨 기준, 보상 값은 코드 맨 위의 DATA 객체 하나에 모아서 내가 직접 고치기 쉽게 해 줘.');
  L.push('- 확인되지 않은 전화번호, 주소, 가격, 사람 이름, 사실을 실제처럼 지어내지 마. 예시 데이터는 화면에 "예시 데이터"라고 표시해 줘.');
  L.push('- 이름, 전화번호, 집 주소, 학교 이름, 사진 같은 개인정보를 입력받거나 저장하지 마. 기록이 필요하면 닉네임만 써.');
  L.push('- 로그인, 결제, 광고, 외부 서버, API 키는 쓰지 마.');
  L.push('- 진행 상황은 이 기기의 localStorage에 저장하고 초기화 버튼을 넣어 줘. 저장이 막힌 환경에서도 오류 없이 동작해야 해.');
  L.push('- 태블릿과 휴대폰 너비에서도 화면이 깨지지 않게 하고, 글씨와 버튼은 크게 만들어 줘.');
  L.push('- 첫 화면에서 규칙을 3문장 이내로 설명하고, 시작한 뒤 30초 안에 첫 보상을 받게 해 줘.');
  L.push('- 보상은 화면을 오래 보는 시간이 아니라 현실 문제를 해결하는 행동에 줘. 틀렸을 때는 벌주지 말고 이유와 다음에 할 행동을 알려 줘.');
  L.push('- 한 번 하는 데 5분을 넘지 않게 하고, 끝나면 결과와 현실에서 해 볼 행동 1개를 보여 줘. 계속하라고 재촉하지 마.');
  L.push('- 대결과 기록은 같은 기기 안에서만 하고, 실명 대신 닉네임을 써.');
  if (S.techMode === 'basic') L.push('- 외부 라이브러리 없이 만들어 줘.');
  else if (S.techMode === 'recommend') {
    L.push('- CSS 3D, Canvas API, Three.js, MediaPipe 가운데 알맞은 기술을 추천하되, 필요 없으면 기본 웹 기술만 써도 돼. 코드를 쓰기 전에 추천 이유와 한 차시 안에 만들 수 있는지 먼저 말해 줘.');
    L.push('- 카메라는 문제 해결에 꼭 필요할 때만 써. 라이브러리를 쓰면 정확한 버전을 고정한 CDN 주소로 불러와 줘.');
  } else if (chosen.length) {
    chosen.forEach(t => L.push('- ' + t.n + ': ' + t.prompt));
    if (chosen.some(t => t.net)) L.push('- 외부 라이브러리는 정확한 버전을 고정한 CDN 주소로 불러와 줘. 불러오지 못하면 안내 문구를 보여 주고 기본 기능은 계속 동작하게 해 줘.');
    if (chosen.some(t => t.camera)) L.push('- 카메라는 이 도구나 기기에서 막혀 있을 수 있어. 카메라 없이도 버튼으로 끝까지 할 수 있게 해 줘.');
    if (chosen.some(t => t.hard)) L.push('- 전체를 만들기 전에 이 기술이 동작하는 가장 작은 화면부터 만들어 줘. 어려우면 이유를 말하고 더 쉬운 방법을 제안해 줘.');
  }
  if (p && p.safety) L.push('- 앱 화면에 다음 안내를 항상 보이게 넣어 줘: "' + p.safety + '"');
  if (S.elements.some(e => EXPLORE.includes(e))) L.push('- 보물 찾기는 교실과 학교 안에서만 하도록 만들고, 위치 추적과 사진 업로드는 넣지 마.');
  L.push('');
  L.push('# 일하는 순서');
  L.push('1. 코드를 쓰기 전에 네가 이해한 내용을 3줄로 먼저 말해 줘. 꼭 필요한 정보가 없을 때만 질문하고, 그렇지 않으면 바로 만들어.');
  L.push('2. 앱을 만든 뒤 초등학생이 읽을 수 있는 쉬운 말로 사용 방법을 3줄로 설명해 줘.');
  L.push('3. 확인한 것과 확인하지 못한 것을 말하고, 내가 직접 해 볼 테스트 3가지를 알려 줘.');
  return L.join('\n');
}
const fullPrompt = () => T(S.editedPrompt) + '\n\n' + rulesText();

function paint(el, segs) {
  el.textContent = '';
  segs.forEach(s => { const n = document.createElement('span'); if (s.c) n.className = s.c; n.textContent = s.t; el.appendChild(n); });
}

function fixPrompt() {
  const name = T(S.appName) || '내 웹앱', f = FIXTYPES[S.fixType];
  const a = T(S.fixA) || '[' + f.a + ']', b = T(S.fixB) || '[' + f.b + ']';
  const tail = '\n\n고친 뒤에는 무엇을 왜 바꿨는지 초등학생이 이해할 수 있는 쉬운 말로 알려 주고, 내가 직접 확인할 방법을 말해 줘. 처음 프롬프트의 "꼭 지킬 규칙"은 계속 지키고, 고친 index.html 전체를 다시 보여 줘.';
  switch (S.fixType) {
    case 'bug': return '"' + name + '"에 고장 난 곳이 있어.\n\n[이렇게 눌렀더니 문제가 생겼어]\n' + a + '\n\n[원래는 이렇게 되어야 해]\n' + b + '\n\n고치기 전에 원인을 먼저 찾아 짧게 설명해 줘. 관련된 부분만 고치고, 새 기능은 넣지 마.' + tail;
    case 'user': return '"' + name + '"을(를) 친구에게 시험해 봤어.\n\n[친구가 멈추거나 헷갈린 곳]\n' + a + '\n\n[친구가 한 말]\n' + b + '\n\n이 중에서 가장 중요한 문제 1개만 골라 이유를 말하고, 그 문제만 고쳐 줘. 처음 쓰는 사람도 다음에 무엇을 누를지 바로 알 수 있어야 해.' + tail;
    case 'game': return '"' + name + '"을(를) 더 재미있게 만들고 싶어.\n\n[지루해한 순간]\n' + a + '\n\n[가장 재미있어한 순간]\n' + b + '\n\n먼저 행동, 보상, 다음 목표 중 어디가 약한지 알려 줘. 그다음 재미있어한 순간을 살리는 변경 1개만 적용해 줘. DATA 객체의 값으로 조절할 수 있으면 코드보다 값을 먼저 바꾸고, 현실 문제 해결과 상관없는 보상은 늘리지 마.' + tail;
    case 'learn': return '"' + name + '"의 코드를 바꾸지 말고 설명만 해 줘.\n\n[알고 싶은 기능]\n' + a + '\n\n[궁금한 점]\n' + b + '\n\n버튼을 누른 순간부터 화면이 바뀔 때까지 순서대로, 초등학생이 이해할 수 있는 말로 설명해 줘. 마지막에 내가 DATA 객체의 값을 바꿔 볼 작은 실험 1개와, 결과를 미리 맞혀 볼 질문 2개를 내 줘.';
  }
}
function reflectPrompt() {
  return '나는 초등학생이고, 생활 속 문제를 해결하는 웹앱을 만들기 전에 문제를 점검하고 있어.\n\n[문제 문장]\n' + statementText() + '\n\n[내가 확인한 것]\n' + (T(S.evidence) || '[직접 확인한 내용]') + '\n\n해결 방법이나 앱 아이디어는 말하지 마. 이 문제에서 확인이 더 필요한 부분을 초등학생이 이해할 수 있는 질문 3개로 알려 줘. 그리고 내가 친구나 가족에게 직접 물어볼 질문 2개를 추천해 줘.';
}
function cardText() {
  const how = [S.approach, S.features.join(', '), S.gameMode ? S.gameMode + ' 게임' : ''].filter(Boolean).join(' / ');
  return '[' + (T(S.appName) || '앱 이름') + ']\n우리가 찾은 문제: ' + statementText() + '\n직접 확인한 것: ' + (T(S.evidence) || '-') + '\n우리의 해결 방법: ' + (how || '-') + '\n현실에서 달라지는 점: ' + (T(S.realLink) || '-') + '\n프롬프트에서 고친 점: ' + (reasonText() || '-') + '\n친구가 써 보고 한 말: ' + (T(S.tested) || '-') + '\n다음에 고칠 점: ' + (T(S.nextFix) || '-');
}

/* ---------- 화면 조각 ---------- */
const chip = (group, value, on, extra, label) => '<button type="button" class="chip" id="' + group + '-' + esc(value).replace(/[^\w가-힣]/g, '_') + '" data-chip="' + group + '" data-val="' + esc(value) + '" aria-pressed="' + (on ? 'true' : 'false') + '"' + (extra || '') + '>' + esc(label || value) + '</button>';
const inp = (key, label, ph, hint) => '<div class="field"><label for="f-' + key + '">' + label + '</label>' + (hint ? '<span class="hint">' + hint + '</span>' : '') + '<input type="text" id="f-' + key + '" data-bind="' + key + '" value="' + esc(S[key]) + '" placeholder="' + esc(ph || '') + '"></div>';
const area = (key, label, ph, hint) => '<div class="field"><label for="f-' + key + '">' + label + '</label>' + (hint ? '<span class="hint">' + hint + '</span>' : '') + '<textarea id="f-' + key + '" data-bind="' + key + '" placeholder="' + esc(ph || '') + '">' + esc(S[key]) + '</textarea></div>';
const nav = (prev, next, nextLabel) => '<div class="navrow"><span>' + (prev ? '<button type="button" class="btn" data-go="' + prev + '">이전 단계</button>' : '') + '</span><span class="err" id="navErr" role="alert"></span>' + (next ? '<button type="button" class="btn primary" data-go="' + next + '">' + nextLabel + '</button>' : '') + '</div>';

function renderStep1() {
  const list = PROBLEMS.filter(p => S.filter === '전체' || p.field === S.filter);
  return '<div class="sec-head"><h2>어떤 문제를 풀어 볼까요?</h2><p>카드에 적힌 내용은 “이럴 것 같다”는 생각이에요. 내 경험과 가장 가까운 문제를 고르고, 다음 단계에서 정말 그런지 확인해 보세요.</p></div>' +
  '<div class="filters" role="group" aria-label="분야 고르기">' + FIELDS.map(f => chip('filter', f, S.filter === f)).join('') + '</div>' +
  '<div class="cards">' + list.map(p => {
    const sel = S.problem === p.id;
    return '<article class="card' + (sel ? ' sel' : '') + '"><span class="tag">' + esc(p.field) + '</span><h3>' + esc(p.title) + '</h3>' +
      '<p><span class="lab">이럴 것 같아요</span>' + esc(p.guess) + '</p>' +
      (p.fact && SRC[p.src] ? '<p><span class="lab">자료에서 확인한 사실</span>' + esc(p.fact) + '</p><a class="src" href="' + esc(SRC[p.src][1]) + '" target="_blank" rel="noopener">출처: ' + esc(SRC[p.src][0]) + '</a>' : '') +
      (p.own && sel ? inp('ownTitle', '내가 찾은 문제', '예: 비 오는 날 복도가 미끄러워요') : '') +
      '<button type="button" class="btn pick' + (sel ? ' primary' : '') + '" id="pick-' + p.id + '" data-pick="' + p.id + '" aria-pressed="' + sel + '">' + (sel ? '골랐어요' : '이 문제 고르기') + '</button></article>';
  }).join('') + '</div>' + nav(null, 2, '문제 문장 쓰러 가기');
}

function renderStep2() {
  const p = P();
  return '<div class="sec-head"><h2>내 말로 문제 문장을 써 보세요</h2><p>예시를 그대로 옮기지 말고 내가 확인한 내용으로 쓰세요. 좁고 구체적일수록 AI가 좋은 앱을 만들어요.</p></div>' +
  '<div class="ref"><b>' + esc(problemTitle() || p.title) + '</b><span><span class="lab">이렇게 확인해 보세요</span>' + esc(p.check) + '</span>' + (p.now ? '<span><span class="lab">지금 쓰는 방법 예시</span>' + esc(p.now) + '</span>' : '') + '</div>' +
  '<div class="panel"><div class="grid2"><div class="field"><label for="f-place">어디에서 생기는 문제인가요?</label><select id="f-place" data-bind="place"><option value="">장소 고르기</option>' + PLACES.map(a => '<option' + (S.place === a ? ' selected' : '') + '>' + a + '</option>').join('') + '</select></div>' + inp('who', '누가 겪나요?', '예: ' + p.who) + '</div>' +
  '<div class="grid2">' + inp('when', '언제 생기나요?', '예: ' + p.when) + inp('pain', '어떤 어려움을 겪나요?', '예: ' + p.pain) + '</div>' +
  '<div class="sentence" id="sentence"></div></div>' +
  '<div class="panel"><h3>정말 그런지 확인하기</h3><div class="field"><span class="flabel">어떻게 확인했나요?</span><div class="chips">' + EVTYPES.map(e => chip('evType', e, S.evType === e)).join('') + '</div></div>' +
  area('evidence', '내가 확인한 것', '예: 우리 반 친구 5명에게 물어보니 3명이 이번 주에 준비물을 잊었다고 했어요', '몇 명에게 무엇을 물었는지 숫자로 적어 보세요. 친구 이름, 전화번호, 집 주소는 적지 마세요.') +
  area('gap', '지금은 어떻게 해결하고 있나요? 그런데도 아직 불편한 점은 무엇인가요?', '예: 알림장이 있지만 아침에 다시 보지 않아서 또 잊어요') +
  '<div class="field"><span class="flabel">AI에게 내 문제 점검받기 (선택)</span><span class="hint">정답을 받는 질문이 아니에요. 선생님이 알려 준 AI 도구에 붙여 넣고, 지적받은 부분을 위 칸에서 직접 고치세요.</span><div><button type="button" class="btn" data-copy="reflect">점검 질문 복사</button></div></div></div>' +
  nav(1, 3, '앱 설계하러 가기');
}

function gameNotes() {
  const p = P(), e = S.elements, notes = [];
  if (e.length && e.length < 3) notes.push('게임 요소는 3~4개가 알맞아요. 성장 요소 하나와 협력 요소 하나를 함께 넣어 보세요.');
  if (e.includes('친구와 대결')) notes.push('대결은 같은 기기 안에서 해요. 실명 대신 닉네임을 써요.');
  if (p && p.safety && e.some(x => COMPETE.includes(x))) notes.push('안전과 관련된 주제예요. 위험한 상황을 점수 경쟁으로 만들지 말고, 미리 준비하는 행동에 보상을 주세요.');
  if (e.some(x => EXPLORE.includes(x))) notes.push('보물 찾기는 교실과 학교 안에서만 하도록 규칙이 자동으로 들어가요.');
  return notes;
}
function renderGame() {
  const p = P(), full = S.elements.length >= 5;
  return '<div class="panel gpanel"><div class="sec-head"><h3>게임으로 만들기</h3><p class="hint">추천 아이디어를 고른 뒤 내 문제에 맞게 고쳐 보세요. 처음부터 직접 설계해도 좋아요.</p></div>' +
  '<div class="field"><span class="flabel">이 문제에 어울리는 게임 아이디어</span><div class="gcards">' + (p.games || []).map((g, i) => {
    const on = S.gameIdea === g.n;
    return '<article class="gcard' + (on ? ' sel' : '') + '"><span class="gtag">' + esc(g.m) + '</span><h4>' + esc(g.n) + '</h4><p>' + esc(g.a) + ' → ' + esc(g.r) + ' → ' + esc(g.x) + '</p><p class="hint">' + esc(g.e.join(' · ')) + '</p><button type="button" class="btn' + (on ? ' primary' : '') + '" id="idea-' + i + '" data-idea="' + i + '" aria-pressed="' + on + '">' + (on ? '적용했어요' : '이 아이디어 쓰기') + '</button></article>';
  }).join('') + '</div></div>' +
  '<div class="grid2"><div class="field"><span class="flabel">게임 장르</span><div class="chips">' + GAME_MODES.map(m => chip('gameMode', m, S.gameMode === m)).join('') + '</div></div>' +
  '<div class="field"><span class="flabel">누구와 함께 하나요?</span><div class="chips">' + PLAY_MODES.map(m => chip('playMode', m, S.playMode === m)).join('') + '</div></div></div>' +
  '<div class="field"><span class="flabel">게임 요소 (' + S.elements.length + '/5)</span><span class="hint">3~4개가 알맞아요.</span>' + ELEMENT_GROUPS.map(g => '<div class="egroup"><b>' + g.t + '<span>' + g.d + '</span></b><div class="chips">' + g.items.map(it => { const on = S.elements.includes(it); return chip('elements', it, on, !on && full ? ' disabled' : ''); }).join('') + '</div></div>').join('') + '</div>' +
  (gameNotes().length ? '<ul class="notes">' + gameNotes().map(n => '<li>' + esc(n) + '</li>').join('') + '</ul>' : '') +
  '<div class="field"><span class="flabel">재미가 반복되는 구조</span><span class="hint">행동하면 보상을 받고, 보상이 다음 목표로 이어져야 계속 하고 싶어져요.</span><div class="loop">' +
  inp('loopAct', '1. 플레이어가 하는 행동', '예: 전날 밤 체크리스트 확인하기') + inp('loopReward', '2. 받는 보상', '예: 탐정 배지') + inp('loopNext', '3. 다음 목표', '예: 일주일 연속 도전') + '</div></div>' +
  inp('realLink', '게임을 하면 현실에서 무엇이 달라지나요?', '예: 아침에 허둥대지 않고 준비물을 챙긴다', '이 칸이 비어 있으면 재미만 있고 문제는 그대로인 게임이 돼요.') + '</div>';
}
function techNotes() {
  const c = chosenTech(), notes = [];
  if (c.some(t => t.camera)) notes.push('카메라 기술은 학교 기기와 AI 도구에서 카메라가 되는지 선생님과 먼저 시험해 보세요.');
  if (c.some(t => t.net)) notes.push('고른 기술은 인터넷에 연결되어 있어야 동작해요.');
  if (S.core.includes('three') && S.core.includes('mediapipe')) notes.push('Three.js와 MediaPipe를 함께 쓰는 것은 가장 어려운 조합이에요. 손 인식 하나와 도형 하나만 연결하는 것부터 해 보세요.');
  if (c.some(t => t.hard)) notes.push('어려운 기술은 AI 도구가 한 번에 완성하지 못할 수도 있어요. 가장 작은 화면부터 확인하라는 규칙이 자동으로 들어가요.');
  if (c.some(t => t.hard) && S.features.length >= 3) notes.push('어려운 기술을 쓸 때는 핵심 기능을 1~2개로 줄이는 것이 안전해요.');
  return notes;
}
function renderTech() {
  const plus = S.techMode === 'plus', coreFull = S.core.length >= 2, libFull = S.libs.length >= 3;
  return '<div class="panel gpanel"><div class="sec-head"><h3>사용할 기술</h3><p class="hint">기술은 앱을 더 멋지게 만들지만, 어려울수록 고칠 시간이 줄어들어요. 설명을 읽고 내 문제에 정말 필요한지 생각해 보세요.</p></div>' +
  '<div class="field"><span class="flabel">이 앱에 특별한 기술을 넣을까요?</span><div class="chips">' + Object.keys(TECH_MODES).map(k => chip('techMode', k, S.techMode === k, '', TECH_MODES[k])).join('') + '</div></div>' +
  '<div class="field"><span class="flabel">화면을 만드는 핵심 기술 (' + S.core.length + '/2)</span><div class="tcards">' + CORE_TECH.map(t => {
    const on = S.core.includes(t.id) && plus;
    return '<article class="tcard' + (on ? ' sel' : '') + '"><div class="thead"><h4>' + esc(t.n) + '</h4><span class="level' + (t.hard ? ' hard' : '') + '">' + esc(t.level) + '</span></div>' +
      '<p>' + esc(t.what) + '</p><p><span class="lab">이럴 때 좋아요</span>' + esc(t.good) + '</p><p><span class="lab">앱 예시</span>' + esc(t.ex) + '</p><p><span class="lab">필요한 것</span>' + esc(t.need) + '</p><p><span class="lab">주의할 점</span>' + esc(t.caution) + '</p>' +
      '<button type="button" class="btn' + (on ? ' primary' : '') + '" id="core-' + t.id + '" data-core="' + t.id + '" aria-pressed="' + on + '"' + (!on && plus && coreFull ? ' disabled' : '') + '>' + (on ? '넣었어요' : '이 기술 넣기') + '</button></article>';
  }).join('') + '</div></div>' +
  '<div class="field"><span class="flabel">추천 무료 라이브러리 (' + S.libs.length + '/3)</span><span class="hint">꼭 필요한 것만 고르세요. 재미 효과는 어떤 앱에든 쉽게 더할 수 있어요.</span>' + LIBS.map(g => '<div class="lgroup"><b>' + g.g + '</b><div class="lcards">' + g.items.map(l => {
    const on = S.libs.includes(l.id) && plus;
    return '<article class="gcard' + (on ? ' sel' : '') + '"><div class="thead"><h4>' + esc(l.n) + '</h4><span class="gtag">' + esc(l.license) + '</span></div><p>' + esc(l.what) + '</p><p class="hint">예: ' + esc(l.ex) + '</p>' + (l.camera ? '<p class="hint">카메라 필요</p>' : '') + (l.note ? '<p class="hint">' + esc(l.note) + '</p>' : '') +
      '<button type="button" class="btn' + (on ? ' primary' : '') + '" id="lib-' + l.id + '" data-lib="' + l.id + '" aria-pressed="' + on + '"' + (!on && plus && libFull ? ' disabled' : '') + '>' + (on ? '넣었어요' : '넣기') + '</button></article>';
  }).join('') + '</div></div>').join('') + '</div>' +
  (techNotes().length ? '<ul class="notes">' + techNotes().map(n => '<li>' + esc(n) + '</li>').join('') + '</ul>' : '') + '</div>';
}
function renderStep3() {
  const p = P();
  const suggested = p.features.concat(S.features.filter(f => !p.features.includes(f)));
  const full = S.features.length >= 3;
  return '<div class="sec-head"><h2>어떤 게임 같은 앱으로 풀어 볼까요?</h2><p>짧은 시간 안에 만들려면 작게 시작해야 해요. 핵심 기능은 3개까지 고르고, 그 기능을 하고 싶게 만드는 게임 구조를 설계하세요.</p></div>' +
  '<div class="panel">' + inp('appName', '앱 이름', '예: 준비물 탐정') +
  '<div class="field"><span class="flabel">앱을 쓰는 사람은 누구인가요?</span>' + (p.users ? '<span class="hint">이 문제에는 ' + esc(p.users.join(', ')) + ' 쪽을 먼저 생각해 보세요.</span>' : '') + '<div class="chips">' + USERS.map(u => chip('primaryUser', u, S.primaryUser === u)).join('') + '</div></div>' +
  '<div class="field"><span class="flabel">앱이 어떤 방식으로 도와주나요?</span><div class="chips">' + APPROACH.map(a => chip('approach', a, S.approach === a)).join('') + '</div></div></div>' +
  '<div class="panel"><div class="field"><span class="flabel">핵심 기능 (' + S.features.length + '/3)</span><div class="chips">' + suggested.map(f => { const on = S.features.includes(f); return chip('features', f, on, !on && full ? ' disabled' : ''); }).join('') + '</div>' +
  '<div class="addrow"><input type="text" id="f-customFeature" data-bind="customFeature" value="' + esc(S.customFeature) + '" placeholder="내가 생각한 기능 적기" aria-label="내가 생각한 기능"' + (full ? ' disabled' : '') + '><button type="button" class="btn" id="addFeature"' + (full ? ' disabled' : '') + '>추가</button></div>' + (full ? '<span class="hint">3개를 모두 골랐어요. 다른 기능을 넣으려면 하나를 빼세요.</span>' : '') + '</div>' +
  '<div class="field"><span class="flabel">앱에 들어갈 자료</span><span class="hint">필요한 항목: ' + esc(p.data) + '</span></div>' +
  area('realData', '내가 확인한 실제 자료 (없으면 비워 두세요)', '예: 우리 반 요일별 시간표', '비워 두면 AI가 “예시 데이터”로 시작해요.') + '</div>' +
  renderGame() + renderTech() +
  '<div class="panel"><div class="grid2"><div class="field"><span class="flabel">사용 기기</span><div class="chips">' + DEVICES.map(d => chip('device', d, S.device === d)).join('') + '</div></div>' +
  '<div class="field"><span class="flabel">꼭 지킬 조건</span><div class="chips">' + ACCESS.map(a => chip('access', a, S.access.includes(a))).join('') + '</div></div></div>' +
  '<div class="field"><span class="flabel">화면 분위기</span><div class="chips">' + MOODS.map(m => chip('mood', m, S.mood === m && !T(S.moodOwn))).join('') + '</div><input type="text" id="f-moodOwn" data-bind="moodOwn" value="' + esc(S.moodOwn) + '" placeholder="직접 적기: 예) 하늘색 구름이 떠 있는 화면" aria-label="화면 분위기 직접 적기"></div>' +
  inp('success', '이렇게 되면 성공', '예: ' + p.success, '누가, 무엇을, 몇 분 안에 할 수 있으면 성공인가요?') +
  area('extra', '추가 요청 (선택)', '예: 첫 화면에 요일 고르기 버튼만 크게 보여 줘') + '</div>' +
  nav(2, 4, '프롬프트 다듬으러 가기');
}

/* ---------- 4단계: 비교와 관문 ---------- */
function diffLines(a, b) {
  const x = String(a || '').split('\n').map(s => s.trimEnd()), y = String(b || '').split('\n').map(s => s.trimEnd());
  const t = Array.from({length: x.length + 1}, () => new Array(y.length + 1).fill(0));
  for (let i = x.length - 1; i >= 0; i--) for (let j = y.length - 1; j >= 0; j--) t[i][j] = x[i] === y[j] ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1]);
  const out = []; let i = 0, j = 0;
  while (i < x.length || j < y.length) {
    if (i < x.length && j < y.length && x[i] === y[j]) { i++; j++; }
    else if (j < y.length && (i === x.length || t[i][j + 1] >= t[i + 1][j])) { if (y[j]) out.push({k: 'add', s: y[j]}); j++; }
    else { if (x[i]) out.push({k: 'del', s: x[i]}); i++; }
  }
  return out;
}
const diffHtml = ops => ops.map(o => '<div class="dline ' + o.k + '"><span class="dmark">' + (o.k === 'add' ? '새로 쓴 말' : '지운 말') + '</span><span>' + esc(o.s) + '</span></div>').join('');
function gateState() {
  const answered = REVIEW.filter(m => S.review[m.id]).length, edits = diffLines(S.draftBase, S.editedPrompt).length, blanks = (S.editedPrompt.match(/\[[^\]\n]+\]/g) || []).length;
  const items = [
    {t: '검토 질문에 답하기 (' + answered + '/' + REVIEW.length + ')', ok: answered === REVIEW.length},
    {t: '프롬프트를 직접 고치기' + (edits ? ' (' + edits + '줄 바뀜)' : ''), ok: edits > 0},
    {t: '고친 점과 이유를 문장으로 쓰기', ok: !!reasonText()},
    {t: blanks ? '[ ] 빈칸 ' + blanks + '곳 채우기' : '[ ] 빈칸 채우기', ok: !blanks}
  ];
  return {items, done: items.every(x => x.ok)};
}
function updateReview() {
  const g = gateState(), ops = diffLines(S.draftBase, S.editedPrompt);
  $('gate').innerHTML = g.items.map(x => '<li><span>' + esc(x.t) + '</span><span class="pill ' + (x.ok ? 'ok">완료' : 'wait">아직') + '</span></li>').join('');
  $('diffBox').innerHTML = ops.length ? diffHtml(ops) : '<p class="hint">아직 고친 줄이 없어요. 위 프롬프트를 직접 고치면 여기에 나타나요.</p>';
  $('edCount').textContent = S.editedPrompt.length.toLocaleString('ko-KR') + '자';
  $('copyPrompt').disabled = !g.done;
  $('dlPrompt').disabled = !g.done;
  $('copyMsg').textContent = g.done ? '이제 내가 고친 프롬프트를 복사하거나 내려받을 수 있어요.' : '위 항목을 모두 마치면 복사와 내려받기 버튼이 열려요.';
  $('rulesBox').textContent = rulesText();
}
function runSteps() {
  const net = chosenTech().some(t => t.net) || S.techMode === 'recommend';
  return '<ol class="runsteps"><li>선생님이 알려 준 AI 도구를 열어요. (예: 캔바 AI, 마주온 헬피챗)</li><li>복사한 프롬프트를 입력창에 붙여 넣고 보내요. 내려받은 .txt 파일을 열어 복사해도 돼요.</li><li>앱 화면이 바로 보이면 직접 눌러 봐요. 코드만 나오면 선생님과 함께 코드를 <b>index.html</b> 파일로 저장해 브라우저로 열어요.</li>' + (net ? '<li>고른 기술은 <b>인터넷이 연결되어 있어야</b> 동작해요.</li>' : '') + '<li>처음 결과가 마음에 들지 않아도 괜찮아요. 5단계에서 한 가지씩 고쳐요.</li></ol>';
}
function renderStep4() {
  const gen = plain(buildPrompt());
  if (!S.editedPrompt || S.editedPrompt === S.draftBase) { S.draftBase = gen; S.editedPrompt = gen; }
  else if (gen !== S.draftBase) {
    /* 앞 단계 내용이 바뀌면 새 초안을 먼저 보여 주고, 전에 고친 프롬프트는 따로 보관합니다. */
    S.prevEdited = S.editedPrompt; S.draftBase = gen; S.editedPrompt = gen;
  }
  const stale = !!T(S.prevEdited);
  const miss = checks().filter(x => !x.ok);
  return '<div class="sec-head"><h2>초안을 직접 고쳐 내 프롬프트로 만들어요</h2><p>지금 프롬프트는 내가 고른 내용으로 자동으로 만든 초안이에요. 한 줄씩 소리 내어 읽고, 내 문제에 맞지 않거나 흐릿한 부분을 직접 고치세요. 안전 규칙은 복사할 때 자동으로 붙어요.</p></div>' +
  (stale ? '<div class="panel stale"><h3>앞 단계 내용으로 새 초안을 만들었어요</h3><p>앱 설계에서 바꾼 내용이 아래 “내 프롬프트”에 반영됐어요. 전에 고친 프롬프트는 따로 보관했으니, 필요한 문장은 아래에서 복사해 옮기세요.</p><details><summary>전에 고친 프롬프트 보기</summary><pre class="promptbox darkbox" tabindex="0">' + esc(S.prevEdited) + '</pre></details><div class="chips"><button type="button" class="btn" id="staleOk">새 초안으로 계속하기</button><button type="button" class="btn quiet" id="staleRestore">전에 고친 프롬프트로 되돌리기</button></div></div>' : '') +
  (miss.length ? '<ul class="notes">' + miss.map(x => '<li>' + esc(x.t) + ' 칸이 비어 있어요. <button type="button" class="linkbtn" data-go="' + x.step + '">채우러 가기</button></li>').join('') + '</ul>' : '') +
  '<div class="revgrid"><div class="promptcard"><div class="promptbar"><label for="promptEditor"><b>내 프롬프트</b></label><span class="count" id="edCount"></span><button type="button" class="btn quiet" id="revertBtn" data-restart="1" data-label="자동 초안으로 되돌리기">자동 초안으로 되돌리기</button></div><textarea class="promptedit" id="promptEditor" data-bind="editedPrompt" spellcheck="false">' + esc(S.editedPrompt) + '</textarea>' +
  '<details class="rules"><summary>자동으로 붙는 안전 규칙 보기</summary><pre class="promptbox" id="rulesBox" tabindex="0"></pre></details></div>' +
  '<div class="panel"><h3>검토 질문</h3><p class="hint">답은 앱이 알려 주지 않아요. 질문을 읽고 “내 프롬프트”를 직접 고쳐 보세요.</p>' + REVIEW.map(m => '<div class="review"><span class="gtag">' + esc(m.q) + '</span><p>' + esc(m.t) + '</p><details><summary>막히면 힌트 보기</summary><p class="hint">' + esc(m.hint) + '</p></details><div class="chips">' + ['고쳤어요', '이대로 괜찮아요'].map(v => '<button type="button" class="chip" id="rev-' + m.id + '-' + (v === '고쳤어요' ? 'fix' : 'ok') + '" data-rev="' + m.id + '" data-val="' + v + '" aria-pressed="' + (S.review[m.id] === v) + '">' + v + '</button>').join('') + '</div></div>').join('') + '</div></div>' +
  '<div class="panel"><h3>내가 바꾼 내용</h3><div class="diff" id="diffBox"></div><div class="field"><span class="flabel">가장 중요하게 고친 점을 문장으로 써 보세요</span><div class="reason">' +
  '<span>나는</span><input type="text" id="f-revWhat" data-bind="revWhat" value="' + esc(S.revWhat) + '" placeholder="예: 기능 3개" aria-label="고치기 전 내용"><span>을(를)</span>' +
  '<input type="text" id="f-revTo" data-bind="revTo" value="' + esc(S.revTo) + '" placeholder="예: 기능 2개" aria-label="고친 뒤 내용"><span>(으)로 바꿨어요. 왜냐하면</span>' +
  '<input type="text" id="f-revWhy" data-bind="revWhy" value="' + esc(S.revWhy) + '" placeholder="예: 친구들이 가장 원한 기능이 준비물 목록이었기 때문이에요" aria-label="고친 이유" class="wide"></div></div></div>' +
  '<details class="teacher"><summary>자동 초안을 색깔별로 읽기</summary><div class="legend"><i class="s-problem cdark">문제</i><i class="s-user cdark">사용자·성공 기준</i><i class="s-feature cdark">기능·화면</i><i class="s-game cdark">게임</i><i class="s-tech cdark">기술</i><i class="s-data cdark">자료</i></div><pre class="promptbox darkbox" id="mainPrompt" tabindex="0"></pre></details>' +
  '<div class="two"><div class="panel"><h3>보내기 전 점검</h3><ul class="checks" id="gate"></ul><div class="chips"><button type="button" class="btn primary" id="copyPrompt" data-copy="prompt">내 프롬프트 복사</button><button type="button" class="btn" id="dlPrompt">.txt로 내려받기</button></div><p class="hint" id="copyMsg" role="status"></p></div>' +
  '<div class="panel"><h3>AI 도구에서 실행하는 법</h3>' + runSteps() + '</div></div>' +
  nav(3, 5, '만들고 고치러 가기');
}
function renderStep5() {
  const f = FIXTYPES[S.fixType];
  return '<div class="sec-head"><h2>시험해 보고 한 가지씩 고쳐요</h2><p>친구에게 설명 없이 앱을 건네고 어디서 멈추는지 지켜보세요. 한 번에 하나만 고치면 무엇이 달라졌는지 알 수 있어요. 개선 프롬프트는 처음 앱을 만든 대화창에 이어서 붙여 넣으세요.</p></div>' +
  '<div class="panel"><div class="field"><span class="flabel">지금 필요한 일</span><div class="chips">' + Object.keys(FIXTYPES).map(k => '<button type="button" class="chip" id="fix-' + k + '" data-fix="' + k + '" aria-pressed="' + (S.fixType === k) + '">' + FIXTYPES[k].t + '</button>').join('') + '</div></div>' +
  '<div class="grid2">' + area('fixA', f.a, f.ap) + area('fixB', f.b, f.bp) + '</div></div>' +
  '<div class="promptcard"><div class="promptbar"><b>개선 프롬프트</b><button type="button" class="btn primary" data-copy="fix">개선 프롬프트 복사</button></div><pre class="promptbox" id="fixPrompt" tabindex="0"></pre></div>' +
  '<div class="panel"><h3>발표 카드</h3><div class="grid2">' + area('tested', '친구가 써 보고 한 말', '예: 배지를 받을 때 재미있었는데, 시작 버튼을 찾기 어려웠대요') + area('nextFix', '다음에 고칠 점', '예: 시작 버튼을 더 크게 만들기') + '</div><pre class="promptbox darkbox" id="cardBox" tabindex="0"></pre><div class="chips"><button type="button" class="btn" data-copy="card">발표 카드 복사</button><button type="button" class="btn" data-print="1">활동지 인쇄</button></div></div>' +
  nav(4, null, '');
}
const RENDER = [null, renderStep1, renderStep2, renderStep3, renderStep4, renderStep5];

/* ---------- 인쇄용 활동지 ---------- */
function fillPrint() {
  const v = (s, n) => T(s) ? '<p class="pv">' + esc(T(s)) + '</p>' : '<div class="lines">' + '<span></span>'.repeat(n || 2) + '</div>';
  const row = (label, s, n) => '<div class="prow"><b>' + label + '</b>' + v(s, n) + '</div>';
  const loop = (T(S.loopAct) || T(S.loopReward) || T(S.loopNext)) ? [S.loopAct, S.loopReward, S.loopNext].map(x => T(x) || '____').join(' → ') : '';
  $('printSheet').innerHTML =
    '<header class="phead"><h1>생활 문제 프롬프트 제작소 활동지</h1><p>____학년 ____반 ____번 &nbsp; 이름: ______________ &nbsp; 모둠: ________</p></header>' +
    '<section><h2>1. 내가 고른 문제</h2>' + row('문제 주제', problemTitle(), 1) + row('문제 문장', statement().every(x => x[1]) ? statementText() : '', 2) + '</section>' +
    '<section><h2>2. 정말 그런지 확인하기</h2>' + row('확인 방법', S.evType, 1) + row('내가 확인한 것', S.evidence, 3) + row('아직 불편한 점', S.gap, 2) + '</section>' +
    '<section><h2>3. 앱 설계</h2>' + row('앱 이름', S.appName, 1) + row('쓰는 사람', S.primaryUser, 1) + row('핵심 기능', S.features.join(', '), 2) + row('게임 장르와 요소', S.gameMode ? S.gameMode + ' / ' + S.elements.join(', ') : '', 1) + row('행동 → 보상 → 다음 목표', loop, 1) + row('현실에서 달라지는 점', S.realLink, 1) + row('이렇게 되면 성공', S.success, 1) + '</section>' +
    '<section><h2>4. 프롬프트에서 고친 점</h2>' + row('나는 ___을 ___로 바꿨어요. 왜냐하면 ___', reasonText(), 3) + '</section>' +
    '<section><h2>5. 발표 카드</h2>' + row('친구가 써 보고 한 말', S.tested, 2) + row('다음에 고칠 점', S.nextFix, 2) + '</section>';
}

/* ---------- 렌더링 ---------- */
function renderSteps() {
  $('steps').innerHTML = STEPS.map((s, i) => '<li><button type="button" class="stepbtn" id="step-' + (i + 1) + '" data-go="' + (i + 1) + '"' + (S.step === i + 1 ? ' aria-current="step"' : '') + '><small>' + s.w + '</small><b>' + s.t + '</b></button></li>').join('');
}
function updateLive() {
  const segs = buildPrompt();
  paint($('sidePrompt'), segs.concat([{t: '\n+ 안전 규칙과 일하는 순서는 복사할 때 자동으로 붙어요.', c: 's-note'}]));
  const pc = pct(), t = pc / 100, mix = (a, b) => Math.round(a + (b - a) * t);
  $('meter').textContent = '완성도 ' + pc + '% · ' + (pc < 100 ? '새싹이 자라는 중' : '꽃이 활짝 피었어요');
  $('bloom').setAttribute('fill', 'rgb(' + mix(126, 255) + ',' + mix(196, 138) + ',' + mix(120, 76) + ')');
  $('bloom').setAttribute('transform', 'translate(27 11) scale(' + (0.35 + 0.65 * t).toFixed(2) + ') translate(-27 -11)');
  if ($('mainPrompt')) paint($('mainPrompt'), segs);
  if ($('promptEditor')) updateReview();
  if ($('sentence')) {
    const ok = statement().every(x => x[1]);
    $('sentence').innerHTML = '<span class="lab">내 문제 문장</span>' + (ok ? esc(statementText()) : '<span class="blankw">' + esc(statementText()) + '</span>');
  }
  if ($('fixPrompt')) $('fixPrompt').textContent = fixPrompt();
  if ($('cardBox')) $('cardBox').textContent = cardText();
  save();
}
function render(keepFocus) {
  const fid = keepFocus && document.activeElement ? document.activeElement.id : null;
  const oldEd = $('promptEditor'), edTop = oldEd ? oldEd.scrollTop : 0, pageY = window.scrollY;
  renderSteps();
  $('work').innerHTML = RENDER[S.step]();
  if (keepFocus) { if ($('promptEditor')) $('promptEditor').scrollTop = edTop; window.scrollTo(0, pageY); }
  const solo = S.step >= 4;
  $('shell').classList.toggle('solo', solo);
  $('side').hidden = solo;
  updateLive();
  if (fid && $(fid)) $(fid).focus({preventScroll: true});
}
function go(n) {
  if (n > 1 && !problemTitle()) {
    S.step = 1; render();
    $('navErr').textContent = P() && P().own ? '내가 찾은 문제를 먼저 적어 주세요.' : '먼저 문제를 하나 골라 주세요.';
    return;
  }
  S.step = n; render();
  $('steps').scrollIntoView({block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
}

let toastT;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2600); }
function copyText(text, target) {
  const fallback = () => {
    if (target && $(target)) { const r = document.createRange(); r.selectNodeContents($(target)); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast('글을 선택했어요. Ctrl+C로 복사하세요.'); return; }
    const el = document.createElement('textarea'); el.value = text; document.body.appendChild(el); el.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) {} el.remove(); toast(ok ? '복사했어요.' : '복사하지 못했어요. 글을 직접 선택해 복사하세요.');
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast('복사했어요.')).catch(fallback);
  else fallback();
}
function downloadText(text) {
  const name = (T(S.appName) || '내 프롬프트').replace(/[\\/:*?"<>|]/g, '').slice(0, 40) + ' 프롬프트.txt';
  const url = URL.createObjectURL(new Blob(['﻿' + text.replace(/\n/g, '\r\n')], {type: 'text/plain;charset=utf-8'}));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('"' + name + '" 파일을 내려받았어요.');
}

/* ---------- 이벤트 ---------- */
let armedBtn = null, armedT;
document.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.go) { go(+b.dataset.go); return; }
  if (b.dataset.print) { fillPrint(); window.print(); return; }
  if (b.dataset.pick) {
    if (S.problem !== b.dataset.pick) { S.problem = b.dataset.pick; Object.assign(S, {features: [], gameIdea: '', gameMode: '', elements: [], loopAct: '', loopReward: '', loopNext: '', realLink: ''}); }
    render(true); return;
  }
  if (b.dataset.core || b.dataset.lib) {
    const key = b.dataset.core ? 'core' : 'libs', id = b.dataset.core || b.dataset.lib, max = b.dataset.core ? 2 : 3;
    if (S.techMode !== 'plus') { S.techMode = 'plus'; S.core = []; S.libs = []; }
    const arr = S[key], i = arr.indexOf(id);
    if (i >= 0) arr.splice(i, 1); else if (arr.length < max) arr.push(id);
    render(true); return;
  }
  if (b.dataset.idea !== undefined) {
    const g = P().games[+b.dataset.idea];
    Object.assign(S, {gameIdea: g.n, gameMode: g.m, elements: g.e.slice(), loopAct: g.a, loopReward: g.r, loopNext: g.x, realLink: g.l});
    render(true); return;
  }
  if (b.dataset.fix) { S.fixType = b.dataset.fix; S.fixA = ''; S.fixB = ''; render(true); return; }
  if (b.dataset.chip) {
    const g = b.dataset.chip, v = b.dataset.val;
    if (g === 'features' || g === 'access' || g === 'elements') {
      const arr = S[g], i = arr.indexOf(v), max = g === 'features' ? 3 : g === 'elements' ? 5 : 99;
      if (i >= 0) arr.splice(i, 1); else if (arr.length < max) arr.push(v);
    } else if (g === 'filter') S.filter = v;
    else if (g === 'mood') { S.mood = v; S.moodOwn = ''; }
    else { S[g] = S[g] === v ? '' : v; if (g === 'techMode' && S.techMode !== 'plus') { S.core = []; S.libs = []; } }
    render(true); return;
  }
  if (b.id === 'addFeature') {
    const v = T(S.customFeature);
    if (v && S.features.length < 3 && !S.features.includes(v)) { S.features.push(v); S.customFeature = ''; render(); if ($('f-customFeature')) $('f-customFeature').focus(); }
    return;
  }
  if (b.dataset.rev) { S.review[b.dataset.rev] = S.review[b.dataset.rev] === b.dataset.val ? '' : b.dataset.val; render(true); return; }
  if (b.id === 'staleOk') { S.prevEdited = ''; render(true); return; }
  if (b.id === 'staleRestore') { S.editedPrompt = S.prevEdited; S.prevEdited = ''; render(true); toast('전에 고친 프롬프트로 되돌렸어요.'); return; }
  if (b.dataset.restart) {
    if (armedBtn !== b.id) {
      armedBtn = b.id; b.textContent = '한 번 더 누르면 내가 고친 내용이 사라져요';
      clearTimeout(armedT); armedT = setTimeout(() => { const el = $(armedBtn); if (el) el.textContent = el.dataset.label; armedBtn = null; }, 4000);
      return;
    }
    clearTimeout(armedT); armedBtn = null;
    S.draftBase = S.editedPrompt = plain(buildPrompt()); render(); toast('자동 초안으로 다시 시작해요.');
    return;
  }
  if (b.id === 'dlPrompt') { if (gateState().done) downloadText(fullPrompt()); return; }
  if (b.dataset.copy === 'prompt') { if (gateState().done) copyText(fullPrompt()); }
  if (b.dataset.copy === 'reflect') copyText(reflectPrompt());
  if (b.dataset.copy === 'fix') copyText(fixPrompt(), 'fixPrompt');
  if (b.dataset.copy === 'card') copyText(cardText(), 'cardBox');
});
document.addEventListener('input', e => {
  const k = e.target.dataset && e.target.dataset.bind;
  if (!k) return;
  S[k] = e.target.value;
  updateLive();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'f-customFeature') { e.preventDefault(); $('addFeature').click(); }
});
window.addEventListener('beforeprint', fillPrint);

let resetArmed = false, resetT;
$('resetBtn').addEventListener('click', () => {
  if (!resetArmed) { resetArmed = true; $('resetBtn').textContent = '한 번 더 누르면 모두 지워져요'; resetT = setTimeout(() => { resetArmed = false; $('resetBtn').textContent = '처음부터 다시'; }, 4000); return; }
  clearTimeout(resetT); resetArmed = false; $('resetBtn').textContent = '처음부터 다시';
  S = blank(); render(); toast('입력 내용을 모두 지웠어요.');
});
let demoArmed = false, demoT;
$('demoBtn').addEventListener('click', () => {
  const hasWork = !!(S.problem || T(S.appName) || T(S.evidence) || T(S.editedPrompt));
  if (hasWork && !demoArmed) { demoArmed = true; $('demoBtn').textContent = '한 번 더 누르면 내 내용이 예시로 바뀌어요'; demoT = setTimeout(() => { demoArmed = false; $('demoBtn').textContent = '예시로 채워 보기'; }, 4000); return; }
  clearTimeout(demoT); demoArmed = false; $('demoBtn').textContent = '예시로 채워 보기';
  const p = PROBLEMS.find(x => x.id === DEMO.problem), g = p.games[DEMO.idea || 0];
  const d = Object.assign({}, DEMO); delete d.idea;
  S = Object.assign(blank(), d, {step: 4, features: DEMO.features.slice(), access: DEMO.access.slice(), core: DEMO.core.slice(), libs: DEMO.libs.slice(), gameIdea: g.n, gameMode: g.m, elements: g.e.slice(), loopAct: g.a, loopReward: g.r, loopNext: g.x, realLink: g.l});
  render(); toast('예시 내용을 채웠어요. 실제 조사 결과가 아니에요.');
  $('steps').scrollIntoView({block: 'start'});
});

const desktop = window.matchMedia('(min-width: 1001px)');
const syncTicket = () => { $('ticket').open = desktop.matches; };
if (desktop.addEventListener) desktop.addEventListener('change', syncTicket);
syncTicket();
if (S.step > 1 && !problemTitle()) S.step = 1;
render();
