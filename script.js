// 전역 상태
let gameState = {
    survivors: [],
    logs: [],
    turn: 0,
    gamePhase: 'initial',
    subGameType: null,
    subGameTurn: 0,
    isRunning: false,
    timer: null,
    pendingAlliances: [],
    turnDialogues: {},
    hasStarted: false,
    initialTrialPopupsShown: {},
    mainGameTurn: 0,
    usedTrialEvents: [],
    pendingDiceRolls: 0,
    laptopEventOccurred: false
};
// 상수
const GENDERS = ['남성', '여성', '기타'];

//직업 분류
const JOB_CATEGORIES = {
    '교육': ['초등학생', '중학생', '고등학생', '대학생', '대학원생','교수'],
    '전문직/공공 서비스': ['의사', '간호사', '약사', '수의사', '변호사', '판사', '연구원', '환경미화원', '정비공'],
    '사회 안전': ['경찰', '군인', '경호원', '소방관', '용병', '경비원'],
    '사회 혼란': ['암살자', '스파이', '도박꾼', '조폭', '야쿠자', '도굴꾼'],
    '산업': ['회사원', '비서', '기자', '농부', '요리사', '바리스타', '바텐더', '미용사', '조향사', '호텔리어', '마사지사', '메이드'],
    '엔터테인먼트': ['예술가', '아이돌', '화가', '배우', '광대', '가수', '기타리스트', '드러머', '댄서', '무용수', '운동선수'],
    '기타': ['주부', '환자', '죄수', '거지', '무직', '아르바이트', '스님', '신부', '수녀', '무당', '일용직 근로자']
};
const JOBS = Object.values(JOB_CATEGORIES).flat();

// 성격 타입 분류
const PERSONALITY_TYPES = {
    activist: ['대범한', '열정적인', '사차원', '감정적인', '단세포', '운동광'],
    anxious: ['의존적인', '맹목적인', '편집증', '이기적인', '허언증', '회피성', '트라우마가 있는'],
    stable: ['신중한', '평범한', '다정한', '희생적인', '무던한', '이타적인', '강단있는', '멍한','사랑스러운'],
    egocentric: ['냉정한', '지능적인', '사이코패스', '소시오패스', '생명경시', '염세적인']
};
// 드롭다운 표시용 카테고리
const PERSONALITY_CATEGORIES = {
    '활동가형': PERSONALITY_TYPES.activist,
    '불안형': PERSONALITY_TYPES.anxious,
    '안정형': PERSONALITY_TYPES.stable,
    '자기중심형': PERSONALITY_TYPES.egocentric
};



// 기존 PERSONALITIES 배열
const PERSONALITIES = Object.values(PERSONALITY_TYPES).flat();

// 성격 타입 판별 함수
function getPersonalityType(personality) {
    for (const [type, personalities] of Object.entries(PERSONALITY_TYPES)) {
        if (personalities.includes(personality)) return type;
    }
    return null;
}

// 직업 스킬 체크 함수
function isJobSkill(survivor, skillName) {
    const jobSkill = JOB_SKILLS[survivor.job];
    return jobSkill && jobSkill.name === skillName;
}

// 특수 스킬 획득 가능 여부 체크
function getAvailableSpecialSkills(survivor) {
    const available = [];
    const personalityType = getPersonalityType(survivor.personality);
    
    // 성격 기반 스킬
    if (SPECIAL_SKILLS.personality[personalityType]) {
        SPECIAL_SKILLS.personality[personalityType].forEach(skill => {
            if (skill.condition(survivor) && !survivor.skills.includes(skill.name)) {
                available.push(skill);
            }
        });
    }
    
    // 스탯 기반 스킬
    SPECIAL_SKILLS.stats.forEach(skill => {
        if (skill.condition(survivor) && !survivor.skills.includes(skill.name)) {
            available.push(skill);
        }
    });
    
    return available;
}

// 직업별 스킬 정의
const JOB_SKILLS = {
    '':{name: '생존본능',
        description: '체력/정신력 최대치 100 증가'},
    '초등학생': {
        name: '순수한 양보',
        description: '[신뢰매매] 토큰 상실 시 자신을 제외한 전원의 호감도 +2'
    },
    '중학생': {
        name: '예민한 감각',
        description: '[신체찾기] 행동 시 민첩 비례 확률로 인형의 신체 1개 추가 발견'
    },
    '고등학생': {
        name: '학습 효과',
        description: '서브게임에서 스탯 획득 시 해당 스탯이 추가로 +1 상승'
    },
    '대학생': {
        name: '벼락치기',
        description: '[신체찾기] 종료 2턴 전부터 신체 발견 확률 2배 상승'
    },
    '대학원생': {
        name: '오차 분석',
        description: '[신뢰매매] 행동 시 지능 수치에 비례해 토큰 하락폭 50% 감소'
    },
    '교수': {
        name: '권위적 교환',
        description: '[신체찾기] 타인과 신체 부위 교환 시 카리스마 판정으로 무조건 승리'
    },
    '의사': {
        name: '정밀 집도',
        description: '[신체찾기] 완성 시 획득하는 보너스 스탯이 무조건 2개로 고정'
    },
    '간호사': {
        name: '헌신적 간호',
        description: '치료 행동 시 정신력을 지능의 50%만큼 추가 회복'
    },
    '약사': {
        name: '각성제',
        description: '[연회] 관에 갇힌 아군에게 사용 시 1턴간 탈출 확률 20% 증가'
    },
    '수의사': {
        name: '교감 능력',
        description: '[연회] 인간 상태일 때 더미즈 캐릭터들과의 호감도 상승치 1.5배'
    },
    '변호사': {
        name: '공정 거래',
        description: '[신뢰매매] 토큰 최하위일 때 받는 체력/정신력 데미지 30% 감소'
    },
    '판사': {
        name: '최후 판결',
        description: '메인게임 투표 시 카리스마 비례 확률로 특정 인물 득표수 1표 무효화'
    },
    '연구원': {
        name: '논리 회로',
        description: '[신뢰매매] 행동 시 지능 수치만큼 토큰 추가 획득'
    },
    '환경미화원': {
        name: '자원 재활용',
        description: '[신체찾기] 중복 부위 2개를 소모해 토큰 3개로 교환 가능'
    },
    '정비공': {
        name: '장치 분석',
        description: '[신체찾기] 행동 시 민첩 수치에 비례해 신체 발견 확률 상승'
    },
    '경찰': {
        name: '질서 유지',
        description: '[신뢰매매] 자신의 토큰이 타인에게 강탈당하는 것을 무효화'
    },
    '군인': {
        name: '강철 정신',
        description: '패닉 상태 돌입 시 3턴간 체력 감소 면제'
    },
    '경호원': {
        name: '전담 방어',
        description: '지정 아군이 서브게임 페널티로 입는 데미지를 대신 흡수'
    },
    '소방관': {
        name: '인명 구조',
        description: '[연회] 관에 갇힌 아군 구출 행동 시 힘 수치 비례 성공률 보너스'
    },
    '용병': {
        name: '생존 약탈',
        description: '[신체찾기] 행동 시 낮은 확률로 타인의 신체를 강탈 - 신뢰도 -10'
    },
    '경비원': {
        name: '구역 감시',
        description: '[신체찾기] 타인이 자신의 구역에서 탐색 시 토큰 1개 징수'
    },
    '암살자': {
        name: '급소 타격',
        description: '[신뢰매매] 토큰 1위를 차지할 확률 상승, 성공 시 무조건 스킬 획득'
    },
    '스파이': {
        name: '정보 조작',
        description: '메인게임에서 자신의 신뢰도를 카리스마 비례 수치만큼 높게 위장'
    },
    '도박꾼': {
        name: '올 인',
        description: '[신뢰매매] 행동 시 토큰 변동치가 0 아니면 2배로 적용 (랜덤)'
    },
    '조폭': {
        name: '공포 분위기',
        description: '[연회] 인간 상태일 때 관 탈출 판정 중인 더미즈를 위협해 신뢰도 강탈'
    },
    '야쿠자': {
        name: '조직의 의리',
        description: '[연회] 자신과 호감도가 높은 더미즈의 사망을 1회 방지 (자신 체력 -30)'
    },
    '도굴꾼': {
        name: '부품 끼워맞추기',
        description: '[신체찾기] 부위 1개가 부족해도 완성한 것으로 인정 (성공 보상 50%)'
    },
    '회사원': {
        name: '초과 근무',
        description: '서브게임 중 정신력 수치 5를 써서 해당 턴 행동을 한 번 더 수행'
    },
    '비서': {
        name: '일정 관리',
        description: '호감도 1위 대상이 행동할 때마다 자신의 토큰도 1개씩 상승'
    },
    '기자': {
        name: '약점 노출',
        description: '메인게임 득표 시 자신을 찍은 사람의 신뢰도를 지능만큼 깎음'
    },
    '농부': {
        name: '결실의 계절',
        description: '서브게임 종료 시 체력/정신력 회복량이 힘 수치에 비례해 증가'
    },
    '요리사': {
        name: '영양 식단',
        description: '치료/휴식 행동 시 아군 전체의 체력을 5씩 추가 회복'
    },
    '바리스타': {
        name: '카페인 충전',
        description: '[연회] 관에 갇힌 아군에게 사용 시 정신력 감소 페널티 무효화'
    },
    '바텐더': {
        name: '취중 진담',
        description: '휴식 중 대화 시 상대방의 호감도 상승폭 2배'
    },
    '미용사': {
        name: '이미지 메이킹',
        description: '매 턴 종료 시 매력 수치에 비례해 신뢰도 소폭 자동 상승'
    },
    '조향사': {
        name: '심신 안정',
        description: '패닉 상태인 아군의 정신력 회복 수치를 매 턴 +5 추가'
    },
    '호텔리어': {
        name: '최고의 서비스',
        description: '자신과 대화한 캐릭터는 다음 턴 [신뢰매매] 토큰 획득량 +1'
    },
    '마사지사': {
        name: '피로 회복',
        description: '[신체찾기] 중 휴식 시 민첩 수치가 다음 턴에 1.5배 상승'
    },
    '메이드': {
        name: '완벽한 시중',
        description: '휴식 행동 시 랜덤한 동맹의 정신력 +5 회복 (동맹 없으면 자신 정신력 +5)'
    },
    '예술가': {
        name: '영감의 원천',
        description: '[신체찾기] 완료 시 새로운 스킬을 획득할 확률 2배 상승'
    },
    '아이돌': {
        name: '팬덤 형성',
        description: '메인게임 투표 시 호감도 50 이상인 캐릭터들은 자신을 투표 불가'
    },
    '화가': {
        name: '정밀 묘사',
        description: '[신체찾기] 보유하지 않은 부위가 탐색될 확률 지능 비례 상승'
    },
    '배우': {
        name: '페르소나',
        description: '패닉 상태에서도 신뢰도 하락 및 메인게임 득표율 패널티 무시'
    },
    '광대': {
        name: '시선 분산',
        description: '[신뢰매매] 토큰 꼴찌일 때 페널티를 무작위 타인에게 전가 - 신뢰도 -20'
    },
    '가수': {
        name: '위로의 노래',
        description: '[연회] 5턴 동안 매 턴 생존본능 상태인 아군 정신력 +10'
    },
    '기타리스트': {
        name: '불협화음',
        description: '메인게임 중 특정 캐릭터의 발언권(카리스마)을 1턴간 봉쇄'
    },
    '드러머': {
        name: '비트 조절',
        description: '서브게임 턴 진행 속도를 자신만 1턴 늦추거나 빠르게 조절'
    },
    '댄서': {
        name: '유연한 회피',
        description: '서브게임 데미지 판정 시 민첩 비례 확률로 데미지 0화'
    },
    '무용수': {
        name: '유연한 회피',
        description: '서브게임 데미지 판정 시 민첩 비례 확률로 데미지 0화'
    },
    '운동선수': {
        name: '한계 돌파',
        description: '체력이 30% 이하일 때 모든 서브게임 성공 확률 1.5배'
    },
    '주부': {
        name: '알뜰살뜰',
        description: '[신뢰매매] 토큰 소모 행동 시 30% 확률로 토큰을 소모하지 않음'
    },
    '환자': {
        name: '동정 유발',
        description: '자신을 공격하거나 투표한 대상은 정신력이 매력 수치만큼 감소'
    },
    '죄수': {
        name: '탈옥 본능',
        description: '[연회] 관 탈출 판정 시 필요한 신뢰도 요구치 20% 감소'
    },
    '거지': {
        name: '적선 구걸',
        description: '매 턴 종료 시 무작위 생존자로부터 토큰 1개 획득'
    },
    '무직': {
        name: '기적의 요행',
        description: '서브게임에서 아무 보상을 못 얻을 시 다음 서브게임 보상 확률 3배'
    },
    '아르바이트': {
        name: '추가 수당',
        description: '[신뢰매매] 게임 중 휴식/치료를 포기하고 행동 시 토큰 +3'
    },
    '스님': {
        name: '살생 유택',
        description: '서브게임에서 타인에게 데미지를 주지 않으면 매 턴 정신력 +5'
    },
    '신부': {
        name: '고해 성사',
        description: '신뢰도가 낮은 캐릭터와 대화 시 서로의 정신력 +15'
    },
    '수녀': {
        name: '고해 성사',
        description: '신뢰도가 낮은 캐릭터와 대화 시 서로의 정신력 +15'
    },
    '무당': {
        name: '영적 강림',
        description: '[신체찾기] 신체 획득 시 랜덤하게 생존본능 스킬 1턴 획득'
    },
    '일용직 근로자': {
        name: '고된 노동',
        description: '[신뢰매매] 행동 시 체력 -5, 토큰 +2 추가 획득'
    }
};

const SPECIAL_SKILLS = {
    // 성격 기반 스킬
    personality: {
        activist: [
            { name: '불굴의 의지', description: '체력 20% 이하일 때 모든 행동 성공률 1.5배', condition: s => s.strength >= 7 },
            { name: '카리스마', description: '호감도 상승량 1.3배', condition: s => s.charisma >= 7 }
        ],
        anxious: [
            { name: '위기 감지', description: '패닉 상태 진입 시점을 5턴 미리 경고', condition: s => s.intelligence >= 7 },
            { name: '생존 본능', description: '체력/정신력 30% 이하일 때 자동 회복량 2배', condition: s => s.agility >= 7 }
        ],
        stable: [
            { name: '중재자', description: '호감도 하락 이벤트 발생 시 50% 확률로 무효화', condition: s => s.charisma >= 7 },
            { name: '철벽 방어', description: '서브게임 페널티 데미지 30% 감소', condition: s => s.strength >= 7 }
        ],
        egocentric: [
            { name: '냉혹한 판단', description: '신뢰도가 낮아도 메인게임 득표율 페널티 무시', condition: s => s.intelligence >= 7 },
            { name: '독단적 행동', description: '혼자 행동 시 모든 능력치 +10%', condition: s => s.charm >= 7 }
        ]
    },
    // 스탯 기반 스킬 (복합)
    stats: [
        { name: '완력', description: '물리적 행동 성공률 +20%', condition: s => s.strength >= 8 && s.agility >= 6 },
        { name: '전략가', description: '서브게임에서 보너스 획득 확률 2배', condition: s => s.intelligence >= 8 && s.charisma >= 6 },
        { name: '사교술', description: '모든 생존자의 초기 호감도 +20', condition: s => s.charisma >= 8 && s.charm >= 7 },
        { name: '민첩한 손놀림', description: '[신체찾기] 신체 발견 확률 +30%', condition: s => s.agility >= 8 && s.intelligence >= 6 },
        { name: '천부적 매력', description: '신뢰도 자동 상승량 2배', condition: s => s.charm >= 9 && s.charisma >= 7 },
        { name: '강철 체력', description: '최대 체력 +50', condition: s => s.strength >= 9 },
        { name: '천재', description: '모든 지능 판정 자동 성공', condition: s => s.intelligence >= 9 },
        { name: '초인적 반사신경', description: '모든 회피 판정 성공률 +50%', condition: s => s.agility >= 9 }
    ]
};

const FREE_ACTION_SCRIPTS = [
    { message: "혼자 조용히 명상을 했다.", hp: 0, mental: 15, trust: 5 },
    { message: "다른 생존자들과 대화를 나눴다.", hp: 0, mental: 10, trust: 8 },
    { message: "식량을 찾아 헤맸다.", hp: -5, mental: -5, trust: 3 },
    { message: "방을 탐색하다 넘어져 다쳤다.", hp: -10, mental: -8, trust: -2 },
    { message: "누군가와 충돌했다.", hp: -8, mental: -15, trust: -10 },
    { message: "음악을 흥얼거리며 긴장을 풀었다.", hp: 5, mental: 12, trust: 0 },
    { message: "악몽을 꾸고 깨어났다.", hp: 0, mental: -18, trust: -5 },
    { message: "좋은 꿈을 꿨다.", hp: 5, mental: 20, trust: 5 },
    { message: "다른 사람을 도와줬다.", hp: -3, mental: 5, trust: 12 },
    { message: "자신의 과거를 회상했다.", hp: 0, mental: -10, trust: 0 },
    { message: "게임의 규칙을 다시 생각해봤다.", hp: 0, mental: 8, trust: 3 },
    { message: "운동으로 몸을 풀었다.", hp: 10, mental: 5, trust: 2 },
    { message: "무언가에 부딪혀 멍이 들었다.", hp: -12, mental: -5, trust: 0 },
    { message: "다른 사람의 고민을 들어줬다.", hp: 0, mental: -5, trust: 15 },
    { message: "혼자만의 시간을 가졌다.", hp: 3, mental: 18, trust: -3 },
    { message: "누군가와 작은 다툼이 있었다.", hp: -5, mental: -12, trust: -8 },
    { message: "물건을 정리하며 시간을 보냈다.", hp: 0, mental: 8, trust: 4 },
    { message: "이상한 소리를 들었다.", hp: 0, mental: -20, trust: -5 },
    { message: "좋은 소식을 들었다.", hp: 5, mental: 15, trust: 8 },
    { message: "누군가와 농담을 주고받았다.", hp: 0, mental: 10, trust: 10 },
    { message: "불안한 마음에 잠을 설쳤다.", hp: -5, mental: -15, trust: 0 },
    { message: "음식을 나눠 먹었다.", hp: 8, mental: 5, trust: 12 },
    { message: "길을 잃고 헤맸다.", hp: -8, mental: -10, trust: -5 },
    { message: "유용한 물건을 발견했다.", hp: 0, mental: 12, trust: 5 },
    { message: "그림을 그리며 시간을 보냈다.", hp: 0, mental: 15, trust: 3 },
    { message: "다른 사람과 게임을 했다.", hp: 0, mental: 8, trust: 7 },
    { message: "책을 읽었다.", hp: 0, mental: 10, trust: 2 },
    { message: "춤을 추며 스트레스를 풀었다.", hp: 5, mental: 12, trust: 5 },
    { message: "누군가의 비밀을 알게 되었다.", hp: 0, mental: -8, trust: -10 },
    { message: "평화로운 시간을 가졌다.", hp: 8, mental: 18, trust: 8 }
];

const SKILL_GAIN_SCRIPTS = [
    { message: "위기 상황에서 새로운 능력을 깨달았다.", skill: 'random' },
    { message: "동료의 조언으로 새로운 기술을 배웠다.", skill: 'random' },
    { message: "과거의 경험이 떠올라 특별한 능력을 얻었다.", skill: 'random' },
    { message: "극한의 상황에서 잠재력이 발현되었다.", skill: 'random' },
    { message: "반복된 훈련 끝에 새로운 스킬을 익혔다.", skill: 'random' },
    { message: "우연히 발견한 메모에서 유용한 정보를 얻었다.", skill: 'random' },
    { message: "다른 생존자의 행동을 보고 배웠다.", skill: 'random' },
    { message: "절박한 순간에 본능이 깨어났다.", skill: 'random' },
    { message: "명상 중 깨달음을 얻었다.", skill: 'random' },
    { message: "위험한 실험이 성공적으로 끝났다.", skill: 'random' },
    { message: "오랜 고민 끝에 해결책을 찾았다.", skill: 'random' },
    { message: "신비로운 경험을 통해 능력을 얻었다.", skill: 'random' },
    { message: "극도의 집중 상태에서 새로운 감각을 깨달았다.", skill: 'random' },
    { message: "동료와의 협력으로 새로운 기술을 터득했다.", skill: 'random' },
    { message: "위기를 넘기며 정신적으로 성장했다.", skill: 'random' },
    { message: "특별한 물건을 발견하고 사용법을 익혔다.", skill: 'random' },
    { message: "과거의 트라우마를 극복하며 강해졌다.", skill: 'random' },
    { message: "생존 본능이 새로운 능력으로 발현되었다.", skill: 'random' },
    { message: "체계적인 분석 끝에 효율적인 방법을 찾았다.", skill: 'random' },
    { message: "순간의 영감으로 획기적인 아이디어를 얻었다.", skill: 'random' }
];

const SKILL_LOSS_SCRIPTS = [
    { message: "극심한 스트레스로 집중력을 잃었다.", type: 'mental' },
    { message: "부상으로 인해 능력을 발휘할 수 없게 되었다.", type: 'injury' },
    { message: "트라우마가 재발하며 기술을 잊어버렸다.", type: 'trauma' },
    { message: "과로로 인해 기량이 떨어졌다.", type: 'exhaustion' },
    { message: "실수로 중요한 도구를 잃어버렸다.", type: 'loss' },
    { message: "자신감 상실로 능력을 사용할 수 없게 되었다.", type: 'mental' },
    { message: "예전처럼 몸이 움직이지 않는다.", type: 'aging' },
    { message: "너무 오래 사용하지 않아 감을 잃었다.", type: 'neglect' },
    { message: "정신적 충격으로 기억이 흐릿해졌다.", type: 'shock' },
    { message: "부상이 회복되지 않아 능력이 약해졌다.", type: 'injury' },
    { message: "극도의 공포로 제대로 집중할 수 없다.", type: 'fear' },
    { message: "중요한 순간에 실패하며 자신감을 잃었다.", type: 'failure' },
    { message: "지속된 불안으로 기술이 녹슬었다.", type: 'anxiety' },
    { message: "영양 부족으로 체력이 약해졌다.", type: 'malnutrition' },
    { message: "수면 부족으로 판단력이 흐려졌다.", type: 'insomnia' },
    { message: "동료의 죽음에 충격받아 의욕을 잃었다.", type: 'grief' },
    { message: "계속된 실패로 포기하고 싶어졌다.", type: 'despair' },
    { message: "필요한 장비를 잃어 능력을 쓸 수 없다.", type: 'equipment' },
    { message: "부정적인 생각이 능력을 방해한다.", type: 'negativity' },
    { message: "긴장이 풀리며 예리함을 잃었다.", type: 'complacency' }
];

const FAVORABILITY_UP_SCRIPTS = [
    { message: "와 함께 식사를 하며 친해졌다.", change: 24 },
    { message: "을(를) 도와주며 신뢰를 쌓았다.", change: 28 },
    { message: "와(과) 좋은 대화를 나눴다.", change: 21 },
    { message: "와(과) 농담을 주고받으며 웃었다.", change: 50 },
    { message: "와(과) 과거 이야기를 나누며 가까워졌다.", change: 26 },
    { message: "을(를) 위험한 상황에서 지켜줬다.", change: 100 },
    { message: "이(가) 자신과 같은 취미가 있다는 것을 알게 되었다.", change: 23 },
    { message: "와(과) 서로를 칭찬하며 기분이 좋아졌다.", change: 22 },
    { message: "와(과) 서로의 고민을 들어줬다.", change: 29 },
    { message: "에게 작은 선물을 받았다.", change: 25 },
    { message: "와(과) 함께 운동을 했다.", change: 20 },
    { message: "에게 응원받았다.", change: 27 },
    { message: "와(과) 좋은 추억을 공유했다.", change: 24 },
    { message: "이(가) 고마움을 표현했다.", change: 22 }
];

const FAVORABILITY_DOWN_SCRIPTS = [
    { message: "과(와) 사소한 일로 다퉜다.", change: -11 },
    { message: "과(와) 의견 충돌이 있었다.", change: -13 },
    { message: "에게 오해가 생겼다.", change: -10 },
    { message: "을(를) 믿지 못하게 되었다.", change: -26 },
    { message: "에게 이기적인 행동을 보였다.", change: -12 },
    { message: "이(가) 약속을 지키지 않았다는 것을 깨달았다.", change: -14 },
    { message: "이(가) 상처 주는 말을 했다.", change: -22 },
    { message: "을(를) 무시했다.", change: -15 },
    { message: "에게 배신감을 느꼈다.", change: -28 },
    { message: "에게 불공평한 대우를 받았다.", change: -12 },
    { message: "이(가) 자신의 비밀을 누설했음을 알게 되었다.", change: -30 },
    { message: "을(를) 차갑게 대했다.", change: -11 },
    { message: "에게 도움을 거절당했다.", change: -14 },
    { message: "에게 질투심을 느꼈다.", change: -21 },
    { message: "이(가) 신뢰를 저버렸다고 느꼈다.", change: -25 } 
];

const BIG_FIGHT_SCRIPTS = [
    { message: "큰 싸움이 일어났다.", change: -55 },
    { message: "격렬하게 다퉜다.", change: -72 },
    { message: "심한 말다툼을 했다.", change: -64 },
    { message: "돌이킬 수 없는 말을 했다.", change: -80 }
];

// 메인게임 전용 자유행동 스크립트
const MAIN_GAME_FREE_ACTION_SCRIPTS = [
    { message: "논쟁에서 {target}을(를) 도와줬다.", hp: 0, mental: 10, trust: 5 },
    { message: "{target}을(를) 의심하기 시작했다.", hp: 0, mental: -8, trust: -5 },
    { message: "{target}의 수상한 증거를 발견했다.", hp: 0, mental: -12, trust: -8 },
    { message: "{target}이(가) 더 이상 필요없다고 말했다.", hp: 0, mental: -15, trust: -10 },
    { message: "{target}와(과) 투표에 대해 논의했다.", hp: 0, mental: 5, trust: 8 },
    { message: "자신의 역할에 대해 고민했다.", hp: 0, mental: -5, trust: 0 },
    { message: "모두를 구할 방법을 생각했다.", hp: 0, mental: 10, trust: 5 },
    { message: "{target}의 진심을 느꼈다.", hp: 0, mental: 12, trust: 10 },
    { message: "{target}에게 배신당한 기분이 들었다.", hp: 0, mental: -10, trust: -12 },
    { message: "투표 결과에 대한 불안감이 엄습했다.", hp: 0, mental: -8, trust: 0 },
    { message: "{target}을(를) 믿기로 결심했다.", hp: 0, mental: 8, trust: 12 },
    { message: "혼자서라도 살아남겠다고 다짐했다.", hp: 0, mental: 5, trust: -8 },
    { message: "{target}와(과) 동맹에 대해 이야기했다.", hp: 0, mental: 5, trust: 10 },
    { message: "누군가 거짓말을 하고 있다는 확신이 들었다.", hp: 0, mental: -10, trust: -5 },
    { message: "{target}의 행동이 수상하다고 느꼈다.", hp: 0, mental: -7, trust: -8 },
    { message: "모두와 함께 나갈 방법을 찾았다고 믿었다.", hp: 0, mental: 15, trust: 8 },
    { message: "{target}을(를) 설득하려 했다.", hp: 0, mental: 3, trust: 5 },
    { message: "자신의 선택이 옳았기를 바랐다.", hp: 0, mental: 5, trust: 0 },
    { message: "{target}이(가) 자신을 의심하는 것 같았다.", hp: 0, mental: -8, trust: -5 },
    { message: "게임의 진실에 대해 생각했다.", hp: 0, mental: -5, trust: 0 },
    { message: "{target}와(과) 미래에 대해 이야기했다.", hp: 0, mental: 10, trust: 8 },
    { message: "혼란스러운 마음을 정리했다.", hp: 0, mental: 8, trust: 0 },
    { message: "{target}의 말에 동요했다.", hp: 0, mental: -7, trust: -3 },
    { message: "희망을 잃지 않으려 애썼다.", hp: 0, mental: 12, trust: 3 },
    { message: "{target}을(를) 지키기로 마음먹었다.", hp: 0, mental: 8, trust: 15 },
    { message: "누가 희생되어야 하는지 고민했다.", hp: 0, mental: -12, trust: -5 },
    { message: "{target}에게 진실을 물었다.", hp: 0, mental: 5, trust: 3 },
    { message: "최선의 선택이 무엇인지 혼란스러웠다.", hp: 0, mental: -8, trust: 0 },
    { message: "{target}와(과) 서로를 위로했다.", hp: 0, mental: 15, trust: 12 },
    { message: "자신의 역할을 다하기로 다짐했다.", hp: 0, mental: 10, trust: 5 },
    
    // 안정형 전용 특수 스크립트
    { message: "모두를 격려하며 함께 나갈 수 있다고 말했다.", hp: 0, mental: 0, trust: 10, isStableSpecial: true }
];

// 성격별 엔딩 대사
const ENDING_QUOTES = {
    activist: [
        "너희들을 영원히 기억할거야. 잊지 않을게.",
        "모두들... 내가 살아남았어. 그곳에서 나를 지켜봐줘.",
        "이 빌어먹을 게임을 만든 자를 반드시 찾아내서 복수해줄게. 그러니 나는 살아가야해.",
        "승리라는 건 생각보다 시시하네... 너희들의 목숨을 대가로 얻은 것치고는 말이야.",
        "누가 뭐래도 우린 포기하지 않았어. 죽은 애들의 몫까지 내가 두 배로 즐겁게 살아줄게!"
    ],
    anxious: [
        "드디어... 드디어 끝난 건가? 나는 탈출 한거야...?",
        "미안해요... 나는 그저... 혼자 죽는 게 무서웠을 뿐이었는데...",
        "죽고 싶지 않았어, 절대로... 다른 사람들이 어떻게 됐든 난 상관없어.",
        "내가 살아남은 건 다 당신 덕분이에요. 그러니까... 나를 버리지 마세요, 네?",
        "나는 결국...."
    ],
    stable: [
        "나 혼자서 얻어낸 생이 아니야. 나는 희생된 동료들의 몫까지 살아갈거야.",
        "...이 피 묻은 손으로 다시 일상을 살아갈 수 있을까요?",
        "모두가 원했던 결과는 아니겠지만, 적어도 우리가 선택한 최선의 결말이네. 이제 잠시 쉴까...",
        "원망해도 괜찮습니다. 하지만 살아남았다는 사실 자체를 죄악시하지는 않을거에요..."
    ],
    egocentric: [
        "결국 마지막에 서 있는 건 나로군. 이렇게 쉽게 우승하는 건 확실히 예상 밖의 일이네.",
        "슬퍼할 이유가 있나? 이건 그저 게임이었을 뿐이다.",
        "내 계획에 오차는 없었어. 죽은 녀석들은 그저 자기 역할에 충실했던 소모품일 뿐이지.",
        "아직도 이해가 안 돼나요? 내가 살아남는 건 당연한 일이었어요.",
        "응? 왜 그런 표정이야? 이겼으니까 웃어야지! 자, 빨리 여기서 나가자!"
    ]
};

const RELATIONSHIPS = {
    hatred: { name: '증오', min: -200, canLove: false },
    rival: { name: '라이벌', min: -80, canLove: false },
    awkward: { name: '어색함', min: -10, canLove: true },
    stranger: { name: '낯선 사람', min: 0, canLove: true },
    colleague: { name: '동료', min: 60, canLove: true },
    friend: { name: '친구', min: 150, canLove: true },
    lover: { name: '연인', min: 500, canLove: true },
    married: { name: '부부', min: 800, canLove: true },
    sibling: { name: '형제/자매', min: 0, canLove: false },
    parent: { name: '부모/자식', min: 0, canLove: false },
    crush: { name: '짝사랑', min: 0, canLove: true },
    pseudoFamily: { name: '유사가족', min: 0, canLove: false },
    relative: { name: '친척', min: 0, canLove: false }
};

const INITIAL_RELATIONSHIP_VALUES = {
    '증오': -200,
    '라이벌': -80,
    '어색함': -10,
    '낯선 사람': 0,
    '서먹함': 30,
    '동료': 60,
    '친구': 150,
    '연인': 500,
    '부부': 800,
    '형제/자매': 200,
    '부모/자식': 250,
    '짝사랑': 100,
    '유사가족': 220,
    '친척': 120
};

// 성격별 대사 목록
const CHARACTER_DIALOGUES = {
    anger: [
        { personality:'대범한', line: '뭐? 고작 그 정도로 날 막겠다고? 하, 비켜. 다 박살 내버리기 전에.' },
        { personality:'열정적인', line: '장난해? 이 정도로 포기할 거였으면 시작도 안 했어!' },
        { personality:'사차원', line: '나도 내가 화가 났다는 건 알아. 심장에 금이 가서, 소리가 새고 있거든.' },
        { personality:'감정적인', line: '어떻게 나한테 이래?! 내가 너한테 어떻게 했는데! 네가 사람이면 그러면 안 되지!!' },
        { personality:'단세포', line: '아 몰라! 짜증 나! 야, 너 일로 와! 한 대 맞자!' },
        { personality:'운동광', line: '야, 그딴식으로 굴거면 말로만 그러지말고 한 판 붙어보자고.' },
        { personality:'의존적인', line: '네가 없으면 안 된다고 했잖아! 근데 왜 자꾸 내 손을 놓으려고 해?!' },
        { personality:'맹목적인', line: '네까짓 게 뭘 안다고 떠들어! 내가 무슨 생각을 하는지 너는 모르잖아!' },
        { personality:'편집증', line: '거봐, 너도 한패지? 처음부터 날 망가뜨리려고 계획한 거잖아. 다 알고 있어!' },
        { personality:'이기적인', line: '짜증나게 하지마. 나도 어울려주고 있는거니까!!' },
        { personality:'허언증', line: '너 내가 누군지 알아? 내 말 한마디면 넌 이 바닥에서 매장이야. 감히 누굴 가르쳐!' },
        { personality:'회피성', line: '아 진짜 짜증 나게... 왜 자꾸 대답을 강요해? 너만 없으면 되잖아!' },
        { personality:'신중한', line: '이건 명백히 당신의 잘못입니다. 이런식으로 행동하시면 앞으로는 당신을 배제하겠어요.' },
        { personality:'평범한', line: '사람 좋게 봐주니까 진짜... 저기요, 적당히 좀 하세요. 저도 화낼 줄 압니다.' },
        { personality:'다정한', line: '당신 때문에 소중한 사람들이 다치고 있잖아요. 더 이상은 지켜만 보지 않겠어요.' },
        { personality:'희생적인', line: '그렇게 말씀하셔선 안됐어요. 모두 겨우 버티고 있는데... 난 당신을 용서할 수 없어요.' },
        { personality:'무던한', line: '음, 그건 사과하셔야겠는데요. 반복되면 저도 가만히 있을 순 없으니까요.' },
        { personality:'이타적인', line: '모두를 위한 길을 네가 망치고 있어. 네 이기심이 얼마나 많은 사람을 힘들게 했는지 알아?!' },
        { personality:'강단있는', line: '기까지 하죠. 내 인내심도, 당신에 대한 예우도 끝났으니까.' },
        { personality:'멍한', line: '어... 방금 그거, 조금 화나려고 하는데...' },
        { personality:'사랑스러운', line: '정말 너무해! 나 삐칠 거야!' },
        { personality:'냉정한', line: '이딴식으로 언쟁하는 것도 피곤해. 알아서 잘 좀했으면 좋겠네.' },
        { personality:'지능적인', line: '그 머리는 장식이야? 너야말로 머리가 있다면 생각을 해!' },
        { personality:'사이코패스', line: '화난 거 아닌데. 그냥 네가 숨 쉬는 소리가 거슬려서.' },
        { personality:'소시오패스', line: '...하! 말은 조심하는 게 좋아.' },
        { personality:'생명경시', line: '어차피 다 끝날 목숨인데, 이딴 걸로 싸움질 할 마음도 안들어.' },
        { personality:'염세적인', line: '그래, 결국 이렇게 뒤통수를 치는군. 세상이 다 그렇지 뭐. 역겨워.' },
        { personality:'트라우마가 있는', line: '오지 마! 내 몸에 손대지 마! 죽여버릴 거야, 가까이 오지 말라고!' }
    ],
    happiness: [
        { personality:'대범한', line: '하하하! 봤지? 내가 된다고 했잖아! 오늘은 끝까지 가는 거야!' },
        { personality:'열정적인', line: '와! 드디어 해냈어! 이 짜릿한 기분!' },
        { personality:'사차원', line: '지금 내 머릿속에서 설탕 가루가 내리고 있어. 구름들이 나한테 윙크하는 것 같아!' },
        { personality:'감정적인', line: '너무 좋아... 정말 꿈만 같아. 나 지금 눈물 날 것 같아, 어떡해!' },
        { personality:'단세포', line: '우와! 신난다! 오늘 진짜 최고!' },
        { personality:'운동광', line: '와! 컨디션 최고다! 심장 터질 것 같아! 오늘 한 세트 더 갈 수 있겠는데?' },
        { personality:'의존적인', line: '네가 웃으니까 나도 너무 행복해. 우리 평생 이렇게만 있자, 응?' },
        { personality:'맹목적인', line: '당신이 좋다면 나도 좋아. 당신의 선택이 틀릴 리 없잖아?' },
        { personality:'편집증', line: '잠깐 괜찮네… 이상할 정도로. 오히려 더 수상해.' },
        { personality:'이기적인', line: '특별히 그쪽한테도 드릴게요. 오늘은 기분이 나쁘지 않으니까.' },
        { personality:'허언증', line: '거봐, 내 능력이라면 이 정도는 당연한 결과지. 다들 나만 믿으라니까?' },
        { personality:'회피성', line: '아무 일도 안 일어나서 다행이다... 그냥 이대로 조용히 지나갔으면.' },
        { personality:'신중한', line: '내 선택이 좋은 결과를 나은 것 같네. 다행이야.' },
        { personality:'평범한', line: '소소하지만 이런 게 행복이죠. 날씨도 좋고, 다 좋네요.' },
        { personality:'다정한', line: '널 위해서 준비해봤어. 하하, 마음에 들어하니 기쁘네.' },
        { personality:'희생적인', line: '모두가 웃고 있네요. 네, 저는 이런 모습을 보고싶었어요. 정말 기뻐요.' },
        { personality:'무던한', line: '좋네요. 이 정도면 충분하죠.' },
        { personality:'이타적인', line: '드디어 웃어주셨네요! 당신이 기뻐보이니 나도 기쁘네요.' },
        { personality:'강단있는', line: '이 순간을 보려고 그 고생을 했나 봐. 정말 좋다.' },
        { personality:'멍한', line: '나비가 지나갔어... 예쁘다... 헤헤.' },
        { personality:'사랑스러운', line: '너랑 있으니까 마음이 몽글몽글해졌어...!' },
        { personality:'냉정한', line: '정은 안주려고 했는데... 상관없겠지.' },
        { personality:'지능적인', line: '하, 멍청해지는 기분이야. ...뭐, 가끔은 멍청하게 즐기는 것도 나쁘진 않네.' },
        { personality:'사이코패스', line: '망가지는 모습이 꽤 예쁘네. 다음엔 어떤 표정을 지어줄 거야?' },
        { personality:'소시오패스', line: '그래. 내가 성공할 줄 알았지. 하하!' },
        { personality:'생명경시', line: '삶은 덧없지만, 가끔은 웃어보는 것도 나쁘진 않은 것 같아요.' },
        { personality:'염세적인', line: '뭐, 잠시는 좋겠지. 조만간 또 망가지겠지만 지금은 즐겨두자고.' },
        { personality:'트라우마가 있는', line: '이렇게 웃어도 되는 걸까...? 정말... 나 안전한 거 맞지?' }
    ],
    relief: [
        { personality:'대범한', line:'휴, 살았네. 죽을 고비 한 번 넘기니까 더 팔팔해지는데?' },
        { personality:'열정적인', line:'다시 기회가 왔어! 이번엔 진짜 제대로 보여준다!' },
        { personality:'사차원', line:'음, 우주가 오늘은 내 편인 것 같아.' },
        { personality:'감정적인', line:'주, 죽는 줄 알았어... 너, 너무 무서워서...!' },
        { personality:'단세포', line:'아~ 살았다! 배고파!' },
        { personality:'운동광', line: '휴, 땀 한 판 쭉 빼고 나니까 살 것 같네. 역시 스트레스에는 움직이는 게 최고야.' },
        { personality:'의존적인', line:'다행이야... 당신이 옆에 있어서 정말 다행이에요.' },
        { personality:'맹목적인', line:'아아, 역시 나를 도와줄 줄 알았어...!' },
        { personality:'편집증', line:'일단은 따돌린 건가? 아니, 안심하긴 일러. 다른 함정이 있을지도 몰라.' },
        { personality:'이기적인', line:'휴, 나만 아니면 됐어. 쟤네가 어떻게 됐든 일단 난 살았으니까.' },
        { personality:'허언증', line:'뭐, 내가 다 예상하고 대처한 거야. 이 정도 위기쯤이야 우습지.' },
        { personality:'회피성', line:'지나갔나? 다행이다...' },
        { personality:'신중한', line:'철저히 대비하길 잘했군요. 예상치 못한 변수가 있었지만 최악은 면했습니다.' },
        { personality:'평범한', line:'아이고, 십년감수했네. 이제야 숨 좀 쉬겠어요.' },
        { personality:'다정한', line:'다친 곳은 없죠? 정말 걱정했어요. 무사해서 다행이에요.' },
        { personality:'희생적인', line:'다행이다. 아무도 다치지 않았어. 정말로… 다행이야.' },
        { personality:'무던한', line:'뭐, 어떻게든 되네요. 다행이에요.' },
        { personality:'이타적인', line:'다른 사람들도 다 무사한 거죠? 아, 정말 다행이다... 고생 많으셨어요.' },
        { personality:'강단있는', line: '됐어. 최악의 고비는 넘겼네.' },
        { personality:'멍한', line:'아, 끝난 건가... 이제 자도 되겠지...' },
        { personality:'사랑스러운', line:'휴우~ 정말 다행이다~! 이걸로 한동안은 안심이겠네!' },
        { personality:'냉정한', line:'잠시 쉴 수 있겠네. 나쁘지는 않아.' },
        { personality:'지능적인', line:'역시, 내 계산이 틀리지 않았어.' },
        { personality:'사이코패스', line:'재미없게 벌써 끝났어? 좀 더 버텨줄 줄 알았는데.' },
        { personality:'소시오패스', line:'그래, 내가 이딴 곳에서 흔들릴 리가 없잖아?' },
        { personality:'생명경시', line:'살아보려고 아등바등 하는 기분... 별로야.' },
        { personality:'염세적인', line:'이번만 운이 좋았던 거야. 다음엔 더 큰 게 터지겠지.' },
        { personality:'트라우마가 있는', line:'하아... 하아... 끝난 거야? 진짜 끝난 거 맞아?' }
    ],
    sorrow: [
        { personality:'대범한', line:'별거 아니라고 생각했는데... 가슴 한쪽이 뻥 뚫린 것 같네. 하하...' },
        { personality:'열정적인', line:'모든 걸 다 쏟았는데... 왜 안 되는 거야?' },
        { personality:'사차원', line:'내 마음속의 무지개가 까맣게 변해서 바닥으로 뚝뚝 떨어지고 있어.' },
        { personality:'감정적인', line:'어, 어떡하지....? 흡... 내가, 나도 이런 걸 원한게 아니야...!' },
        { personality:'단세포', line:'흐앙! 슬퍼! 눈물이 안 멈춰!' },
        { personality:'운동광', line: '흡, 울면 안 돼... 근손실 난단말이야...' },
        { personality:'의존적인', line:'내, 내가 잘못했어...! 이제 시키는대로 할 게...!' },
        { personality:'맹목적인', line:'나, 날 버릴거야...? 네가 없으면 난...!' },
        { personality:'편집증', line:'결국 이럴 줄 알았어. 다들 날 비웃고 있겠지? 이게 당신들 계획이었지?' },
        { personality:'이기적인', line:'아무리 나라도 그런식으로 말하면 상처받아. 어떻게 그런 말을 할 수가 있어?' },
        { personality:'허언증', line: '어, 음. 나도 너 별로 안좋아했어. 그리고 난 너 말고도 친구 많거든?' },
        { personality:'회피성', line:'그냥 다 없었던 일이면 좋겠다. 너도, 나도 모르는 사여였다면...' },
        { personality:'신중한', line:'어디서부터 잘못된 걸까. 좀 더 신중했어야 했는데...' },
        { personality:'평범한', line:'다 보니 이런 날도 오는구나. 역시 마음이 좀 허전하다...' },
        { personality:'다정한', line:'내가 더 잘해줬어야 했나 봐...' },
        { personality:'희생적인', line:'괜찮아... 나만 참으면 다들 편해질 텐데. 혼자 있는 게 익숙해.' },
        { personality:'무던한', line:'네가 나를 그렇게 느꼈다니. 의외네. 조금 슬프다.' },
        { personality:'이타적인', line:'내가 더 도울 수 있는 게 없어서... 그게 너무 미안하고 괴로워요.' },
        { personality:'강단있는', line: '네가 준 상처 때문에 모든 걸 포기하지는 않을 거야.' },
        { personality:'멍한', line:'... 나... 가볼게...' },
        { personality:'사랑스러운', line:'어, 어떻게 그런 말을 할 수가 있어...? 너무해!' },
        { personality:'냉정한', line:'너...... 흠, 그래. 알았어.' },
        { personality:'지능적인', line:'네가 뭔데 나를 그렇게 판단해?! 저리 꺼져!' },
        { personality:'사이코패스', line:'상실은 논리적으로 피할 수 없는 현상이지. 하지만... 잔상이 오래 남는군.' },
        { personality:'소시오패스', line:'짜증나게... 감히 나를 갖고 놀다니...' },
        { personality:'생명경시', line:'결국 사라질 거면서 왜 그렇게 아등바등 살았나 몰라. 덧없네.' },
        { personality:'염세적인', line:'역시, 이럴줄 알았다니까? 기대를 하니까 실망을 하는 거야.' },
        { personality:'트라우마가 있는', line:'또... 또 시작이야. 어둠 속에 나만 혼자 버려진 기분이야. 무서워...' }
    ],
    exhausted: [
        { personality:'대범한', line:'나도 사람인가 보다. 오늘은 그냥 아무것도 안 하고 잠만 자고 싶네.' },
        { personality:'열정적인', line:'한 걸음도 더 못 가겠어. 잠시만... 쉬게 해줘' },
        { personality:'사차원', line:'내 영혼이 투명해지고 있어. 곧 공기 중으로 흩어져서 사라질지도 몰라.' },
        { personality:'감정적인', line:'이제 울 힘도 없어. 마음이 닳고 닳아서 구멍이 난 것 같아.' },
        { personality:'단세포', line:'졸려. 배고파. 힘들어. 나 잘래.' },
        { personality:'운동광', line: '하얗게 불태웠어... 근섬유 마디마디가 비명을 지르네...' },
        { personality:'의존적인', line:'나 너무 힘들어... 네가 나 좀 안아주면 안 돼? 아무 말도 하지 말고...' },
        { personality:'맹목적인', line:'시키는 대로 다 했는데... 왜 내 영혼은 점점 말라가는 걸까.' },
        { personality:'편집증', line:'사방이 적인데 도망칠 기력도 없어.' },
        { personality:'이기적인', line:'남들 비위 맞추는 척하는 것도 질린다. 이제 내 맘대로 하고 잠이나 잘래.' },
        { personality:'허언증', line:'난 멀쩡해! 정말인야.' },
        { personality:'회피성', line:'그냥 아무도 모르는 곳으로 사라지고 싶어. 모든 게 다 버거워.' },
        { personality:'신중한', line:'하아, 그래... 하루쯤은 쉬어도 괜찮겠지.' },
        { personality:'평범한', line:'아이고, 삭신이야.' },
        { personality:'다정한', line:'모두를 챙기고 싶지만... 지금은 제 마음도 돌봐야 할 것 같아요' },
        { personality:'희생적인', line:'더 이상 줄 게 없네요. 저도... 이제는 쉬어도 되겠죠?' },
        { personality:'무던한', line:'좀 피곤하네... 자고 일어나면 나아지겠지.' },
        { personality:'이타적인', line:'오늘은 정말 힘들었어... 잠시 쉬어야 겠네.' },
        { personality:'강단있는', line: '잠시 숨 좀 돌리자. 오늘만 날이 있는 건 아니잖아? 더 멀리를 봐야지.' },
        { personality:'멍한', line:'하암... 너무 졸린데... 나 잠깐만 잘게...' },
        { personality:'사랑스러운', line:'으음... 조금 힘들지만, 힘내볼게!' },
        { personality:'냉정한', line:'내가 쉬겠다는데 허락이 필요해? 하! 저리 꺼져.' },
        { personality:'지능적인', line:'정말이지, 다들 멍청해서는! 나도 이젠 좀 쉬어야겠어.' },
        { personality:'사이코패스', line:'사람들 비위 맞춰주는 연기도 이젠 지루하네. 다 죽이고 끝낼까.' },
        { personality:'소시오패스', line:'뭐, 목표를 위해서는 한 박자 쉬어 갈 때도 필요한 법이지.' },
        { personality:'생명경시', line:'하, 계속 버텨야 할 이유가 정말 있는 걸까.' },
        { personality:'염세적인', line:'애써봤자 뭐 해. 결국 다 똑같은데. 지친다, 지쳐.' },
        { personality:'트라우마가 있는', line:'머릿속에서 그때 목소리가 계속 들려... 제발 그만해... 나 좀 살려줘...' }
    ],
    awe: [
        { personality:'대범한', line:'하하, 괜찮을 줄 알았는데...' },
        { personality:'열정적인', line:'어어? 내, 내가 잘못한거야?' },
        { personality:'사차원', line:'저기 봐, 그림자들이 나를 보고 속삭여. 저 사람들이 내 이름을 다 가져가버리면 어떡하지...?' },
        { personality:'감정적인', line:'무서워! 너무 무서워! 나, 나는 이런 거 못 버텨!!' },
        { personality:'단세포', line:'으아악!' },
        { personality:'운동광', line: '이, 이건 내 근성으로도 안 되겠는데? ... 무서워!' },
        { personality:'의존적인', line:'싫어.. 싫어...! 혼자 남기 싫어...!! 무서워...!' },
        { personality:'맹목적인', line:'내가 바라는 건 하나 뿐이었는데... 대체 왜...!!' },
        { personality:'편집증', line:'뭐야, 도대체 뭐냐고! 왜, 왜 이렇게 된거야...!' },
        { personality:'이기적인', line:'나, 나는 아니야...! 난 잘못한 거 없어!!' },
        { personality:'허언증', line:'하, 하하... 내가 뭘 그렇게 잘못했지?' },
        { personality:'회피성', line:'싫어... 도망, 도망가야해. 싫어...!!' },
        { personality:'신중한', line:'역시 다시 한 번 생각했어야 했어. 내가 잘 선택했더라면...!' },
        { personality:'평범한', line:'허억, 이, 이런 건 나는 감당 못해...!' },
        { personality:'다정한', line:'지금은... 일단 나를 우선해야겠어.' },
        { personality:'희생적인', line:'이미 각오했던 일이잖아..... 진정해야해.' },
        { personality:'무던한', line:'후, 침착하자. 괜찮아. 괜찮을거야.....' },
        { personality:'이타적인', line:'어, 어째서...? 어째서 다들 이런 선택을 하는거야...?' },
        { personality:'강단있는', line: '떨리냐고? 당연하지. 하지만 그게 물러설 이유가 되는 건 아니야.' },
        { personality:'멍한', line:'음... 오늘은 악몽을 꾸려나... 하암...' },
        { personality:'사랑스러운', line:'꺄아악-! 너무 무서워! 도와줘~!' },
        { personality:'냉정한', line:'젠장! 이렇게 될 줄 알았어!' },
        { personality:'지능적인', line:'내가 틀릴리가 없어... 내가 틀렸을리 없는데...!' },
        { personality:'사이코패스', line:'별 거 아니야.' },
        { personality:'소시오패스', line:'하, 내, 내가 실패할리가 없잖아!!' },
        { personality:'생명경시', line:'죽음은 당연한거야. 그러니까 나도...' },
        { personality:'염세적인', line:'이, 이럴줄 알았어...!' },
        { personality:'트라우마가 있는', line:'히익..! 하, 하지마...! 저리가...!!' }
    ]
};

// 최초의 시련 전용 팝업 이벤트 (완전히 교체)
const INITIAL_TRIAL_EVENTS = {
    // 1인 시련들
    solo: [
            // 카드 설치
            {
                id: 'soloTrial1',
                getMessage: (character) => `눈을 떠보니 ${character.name}의 앞에는 네모난 상자 하나와 여러장의 카드가 있었다.\n'이 방을 나가서 이 카드들을 곳곳에 숨겨두세요. 다른 사람에게 들키게 되면 죽습니다.'\n 라는 메모가 상자의 위에 적혀있었다.\n어떻게 할까요?`,
                choices: [
                    {
                        text: '시키는 대로 몰래 숨겨둔다. (민첩 판정)',
                        effect: async (character) => {
                            const bonus = character.agility * 2;
                            const target = 50;
                            const result = await rollDiceWithAnimation(target, "민첩", bonus);
                            const total = result.roll + bonus;
                            const isSuccess = total >= target;
                            
                            addLog(`${character.name}의 민첩 판정: ${total} : ${target} (민첩 보너스: ${bonus})`, isSuccess ? 'success' : 'error');
                            
                            if (isSuccess) {
                                addLog(`${character.name}은(는) 성공적으로 카드를 숨겼다.`, 'event');
                            } else {
                                character.trust = Math.max(0, character.trust - 3);
                                addLog(`${character.name}은(는) 카드를 숨기는 것을 들켰다. - 신뢰도 -3`, 'penalty');
                            }
                        }
                    },
                    {
                        text: '다른 사람이 나타나길 기다렸다가 사실대로 말한다.(매력 판정)',
                        effect: async (character) => {
                            const bonus = character.charm * 2;
                            const target = 90;
                            const result = await rollDiceWithAnimation(target, "매력", bonus);
                            const total = result.roll + bonus;
                            const isSuccess = total >= target;
                            
                            addLog(`${character.name}의 매력 판정: ${total} : ${target} (매력 보너스: ${bonus})`, isSuccess ? 'success' : 'error');
                            
                            if (isSuccess) {
                                character.trust = Math.min(100, character.trust + 1);
                                addLog(`${character.name}의 말을 듣고 사람들은 카드를 한 장씩 나눠가졌다. - 신뢰도 +1`, 'heal');
                            } else {
                                character.trust = Math.max(0, character.trust - 8);
                                addLog(`${character.name}의 말을 아무도 믿어주지 않았다. - 신뢰도 -8`, 'penalty');
                            }
                        }
                    }
                ]
            },
            // 벽 너머의 스위치
            {
                id: 'soloTrial2',
                getMessage: (character) => `눈을 떠보니 ${character.name}은(는) 좁은 방 안에 있었다.\n잠시 후 올바른 스위치를 누르기 전까지 벽이 좁아진다는 안내 방송이 흘러나온다.\n어떻게 할까요?`,
                choices: [
                    {
                        text: '방 안의 스위치를 빠르게 전부 누른다. (민첩 판정)',
                        effect: async (character) => {
                            const bonus = character.agility * 2;
                            const target = Math.floor(Math.random() * 11) + 70; // 70~80
                            const result = await rollDiceWithAnimation(target, "민첩", bonus);
                            const total = result.roll + bonus;
                            const isSuccess = total >= target;
                            
                            addLog(`${character.name}의 민첩 판정: ${total} : ${target} (민첩 보너스: ${bonus})`, isSuccess ? 'success' : 'error');
                            
                            if (isSuccess) {
                                const personalityType = getPersonalityType(character.personality);
                                if (personalityType !== 'activist') {
                                    character.hp = Math.max(0, character.hp - 10);
                                    addLog(`${character.name}은(는) 아슬아슬하게 올바른 스위치를 눌렀다. - HP -10`, 'event');
                                } else {
                                    addLog(`${character.name}은(는) 아슬아슬하게 올바른 스위치를 눌렀다.`, 'event');
                                }
                            } else {
                                gameState.survivors = gameState.survivors.map(s => 
                                    s.id === character.id 
                                        ? { ...s, status: '더미즈' }
                                        : s
                                );
                                addLog(`${character.name}은(는) 다가오는 벽에 압사했다.`, 'death');
                                addLog(`${character.name}은(는) 더미즈가 되었다.`, 'event');
                            }
                        }
                    },
                    {
                        text: '방 안을 자세히 관찰하여 진짜 스위치를 누른다. (지능 판정)',
                        effect: async (character) => {
                            const bonus = character.intelligence * 2;
                            const target = Math.floor(Math.random() * 11) + 70; // 70~80
                            const result = await rollDiceWithAnimation(target, "지능", bonus);
                            const total = result.roll + bonus;
                            const isSuccess = total >= target;
                            
                            addLog(`${character.name}의 지능 판정: ${total} : ${target} (지능 보너스: ${bonus})`, isSuccess ? 'success' : 'error');
                            
                            if (isSuccess) {
                                const personalityType = getPersonalityType(character.personality);
                                if (personalityType !== 'egocentric') {
                                    character.mental = Math.max(0, character.mental - 10);
                                    addLog(`${character.name}은(는) 아슬아슬하게 올바른 스위치를 눌렀다. - 정신력 -10`, 'event');
                                } else {
                                    addLog(`${character.name}은(는) 아슬아슬하게 올바른 스위치를 눌렀다.`, 'event');
                                }
                            } else {
                                gameState.survivors = gameState.survivors.map(s => 
                                    s.id === character.id 
                                        ? { ...s, status: '더미즈' }
                                        : s
                                );
                                addLog(`${character.name}은(는) 다가오는 벽에 압사했다.`, 'death');
                                addLog(`${character.name}은(는) 더미즈가 되었다.`, 'event');
                            }
                        }
                    }
                ]
            },
            // 러시안 룰렛
            {
                id: 'soloTrial3',
                getMessage: (character) => `눈을 떠보니 ${character.name}은(는) 어두운 방 안에 있었다.\n방의 중심에 있는 테이블에는 두 개의 권총이 놓여있었다.\n안내방송에서는 둘 중 하나의 권총에만 총알이 들어있으며,\n 권총을 머리에 겨눈 채 사용해야 문이 열린다고 한다.\n어떻게 해야할까요?`,
                choices: [
                    {
                        text: '오른쪽 권총을 사용한다. (행운 판정)',
                        effect: async (character) => {
                            const target = 50;
                            const result = await rollDiceWithAnimation(target, "행운", 0);
                            const isSuccess = result.roll >= target;
                            
                            addLog(`${character.name}의 행운 판정: ${result.roll} : ${target}`, isSuccess ? 'success' : 'error');
                            
                            if (isSuccess) {
                                character.mental = Math.max(0, character.mental - 15);
                                addLog(`${character.name}은(는) 자신이 살아있음에 안도했다. - 정신력 -15`, 'event');
                            } else {
                                gameState.survivors = gameState.survivors.map(s => 
                                    s.id === character.id 
                                        ? { ...s, status: '더미즈' }
                                        : s
                                );
                                addLog(`${character.name}은(는) 잘못된 선택을 했다.`, 'death');
                                addLog(`${character.name}은(는) 더미즈가 되었다.`, 'event');
                            }
                        }
                    },
                    {
                        text: '왼쪽 권총을 사용한다. (행운 판정)',
                        effect: async (character) => {
                            const target = 50;
                            const result = await rollDiceWithAnimation(target, "행운", 0);
                            const isSuccess = result.roll >= target;
                            
                            addLog(`${character.name}의 행운 판정: ${result.roll} : ${target}`, isSuccess ? 'success' : 'error');
                            
                            if (isSuccess) {
                                character.mental = Math.max(0, character.mental - 15);
                                addLog(`${character.name}은(는) 자신이 살아있음에 안도했다. - 정신력 -15`, 'event');
                            } else {
                                gameState.survivors = gameState.survivors.map(s => 
                                    s.id === character.id 
                                        ? { ...s, status: '더미즈' }
                                        : s
                                );
                                addLog(`${character.name}은(는) 잘못된 선택을 했다.`, 'death');
                                addLog(`${character.name}은(는) 더미즈가 되었다.`, 'event');
                            }
                        }
                    }
                ]
            },
            // 가시밭 길
            {
                id: 'soloTrial4',
                getMessage: (character) => `눈을 떠보니 ${character.name}은(는) 발목이 구속된 채로 방 한 가운데에 놓여있었다.\n제한시간이 종료되면 천장에 설치된 가시 트랩이 발동할 것이라는 안내 방송이 흘러나온다.\n어떻게 할까요?`,
                choices: [
                    {
                        text: '두려움에 떨며 구속구를 푸는 법을 찾는다. (정신력 판정)',
                        effect: async (character) => {
                            const bonus = character.mental >= 95 ? 50 : 0;
                            const target = Math.floor(Math.random() * 11) + 60; // 60~70
                            const result = await rollDiceWithAnimation(target, "정신력", bonus);
                            const total = result.roll + bonus;
                            const isSuccess = total >= target;
                            
                            addLog(`${character.name}의 정신력 판정: ${total} : ${target} (보너스: ${bonus})`, isSuccess ? 'success' : 'error');
                            
                            if (isSuccess) {
                                character.mental = Math.max(0, character.mental - 10);
                                addLog(`${character.name}은(는) 가까스로 구속을 풀어냈다. - 정신력 -10`, 'event');
                            } else {
                                gameState.survivors = gameState.survivors.map(s => 
                                    s.id === character.id 
                                        ? { ...s, status: '더미즈' }
                                        : s
                                );
                                addLog(`${character.name}은(는) 두려움을 이겨내지 못했다.`, 'death');
                                addLog(`${character.name}은(는) 더미즈가 되었다.`, 'event');
                            }
                        }
                    },
                    {
                        text: '침착하게 구속구를 푸는 법을 찾는다. (지능 판정)',
                        condition: (character) => {
                            const personalityType = getPersonalityType(character.personality);
                            return personalityType !== 'anxious';
                        },
                        disabledText: '(불안형 성격은 선택 불가)',
                        effect: async (character) => {
                            const bonus = character.intelligence * 2;
                            const target = Math.floor(Math.random() * 11) + 60;
                            const result = await rollDiceWithAnimation(target, "지능", bonus);
                            const total = result.roll + bonus;
                            const isSuccess = total >= target;
                            
                            addLog(`${character.name}의 지능 판정: ${total} : ${target} (지능 보너스: ${bonus})`, isSuccess ? 'success' : 'error');
                            
                            if (isSuccess) {
                                character.mental = Math.max(0, character.mental - 10);
                                addLog(`${character.name}은(는) 무사히 구속을 풀어냈다. - 정신력 -10`, 'event');
                            } else {
                                gameState.survivors = gameState.survivors.map(s => 
                                    s.id === character.id 
                                        ? { ...s, status: '더미즈' }
                                        : s
                                );
                                addLog(`${character.name}은(는) 결국 구속을 풀지 못했다.`, 'death');
                                addLog(`${character.name}은(는) 더미즈가 되었다.`, 'event');
                            }
                        }
                    }
                ]
            }
        ],
    
    // 2인 시련들
    duo: [
        {
            id: 'oneKey',
            condition: (char1, char2) => {
                const fav1 = char1.favorability[char2.id] || 0;
                const fav2 = char2.favorability[char1.id] || 0;
                return fav1 >= 150 || fav2 >= 150; // 친구 이상
            },
            getMessage: (char1, char2) => 
                `${char1.name}와(과) ${char2.name}은(는) 낯선 방의 침대 위에서 깨어났습니다.\n` +
                `안내에 따르면 제한시간 이내에 자신이 고정되어있는 침대의 잠금장치를 풀어야 합니다.\n 그러나 사용할 수 있는 열쇠는 단 하나 뿐입니다. 누가 사용할까요?`,
            choices: [
                {
                    getText: (char1, char2) => `${char1.name}이(가) 열쇠를 사용하게 한다. (민첩 판정)`,
                    effect: async (char1, char2, selectedIndex) => {
                        const selected = selectedIndex === 0 ? char1 : char2;
                        const other = selectedIndex === 0 ? char2 : char1;
                        
                        const bonus = selected.agility * 2;
                        const target = 50;
                        const result = await rollDiceWithAnimation(target, "민첩", bonus);
                        
                        const total = result.roll + bonus;
                        const isSuccess = total >= target;

                        addLog(`${selected.name}의 민첩 판정: ${total} : ${target} (민첩 보너스: ${bonus})`, isSuccess ? 'success' : 'error');
                        
                        if (isSuccess) {
                            char1.favorability[char2.id] = Math.min(1500, (char1.favorability[char2.id] || 50) + 20);
                            char2.favorability[char1.id] = Math.min(1500, (char2.favorability[char1.id] || 50) + 20);
                            addLog(`${selected.name}은(는) 트릭을 풀어내 ${other.name}을(를) 무사히 구해냈다. - 호감도 +20`, 'heal');
                        } else {
                            gameState.survivors = gameState.survivors.map(s => 
                                    s.id === other.id 
                                        ? { ...s, hp: 0, isAlive: false }
                                        : s
                                );
                            selected.mental = Math.max(0, (selected.mental || 100) - 30);
                            addLog(`${selected.name}은(는) 트릭을 풀어내지 못했고, ${other.name}은(는) 절명했다. - 정신력 -30`, 'death');
                            processDeathRelationships(other);
                        }
                        updateDisplay();
                    }
                },
                {
                    getText: (char1, char2) => `${char2.name}이(가) 열쇠를 사용하게 한다. (민첩 판정)`,
                    effect: async (char1, char2, selectedIndex) => {
                        const selected = selectedIndex === 0 ? char1 : char2;
                        const other = selectedIndex === 0 ? char2 : char1;
                        
                        const bonus = selected.agility * 2;
                        const target = 50;
                        const result = await rollDiceWithAnimation(target, "민첩", bonus);
                        
                        const total = result.roll + bonus;
                        const isSuccess = total >= target;

                        addLog(`${selected.name}의 민첩 판정: ${total} : ${target} (민첩 보너스: ${bonus})`, isSuccess ? 'success' : 'error');
                        
                        if (isSuccess) {
                            char1.favorability[char2.id] = Math.min(1500, (char1.favorability[char2.id] || 50) + 20);
                            char2.favorability[char1.id] = Math.min(1500, (char2.favorability[char1.id] || 50) + 20);
                            addLog(`${selected.name}은(는) 트릭을 풀어내 ${other.name}을(를) 무사히 구해냈다. - 호감도 +20`, 'heal');
                        } else {
                            gameState.survivors = gameState.survivors.map(s => 
                                    s.id === other.id 
                                        ? { ...s, hp: 0, isAlive: false }
                                        : s
                                );
                            selected.mental = Math.max(0, (selected.mental || 100) - 30);
                            addLog(`${selected.name}은(는) 트릭을 풀어내지 못했고, ${other.name}은(는) 절명했다. - 정신력 -30`, 'death');
                            processDeathRelationships(other);
                        }
                        updateDisplay();
                    }
                }
            ]
        },
        {
            id: 'twoLegs',
            condition: () => true, // 조건 없음
            getMessage: (char1, char2) => 
                `${char1.name}와(과) ${char2.name}은(는) 홀로 방 안에서 깨어났습니다.\n` +
                `깨어났을 때 눈앞에 있던 무전기에서는 안내 음성이 흘러나옵니다.\n 들어보니 두 사람이 협력하여 이 최초의 시련을 통과해야한다는 내용이었습니다.\n 어떻게 해야할까요?`,
            choices: [
                {
                    getText: (char1, char2) => `${char1.name}이(가) 의심스러우니 경계한다. (지능 판정)`,
                    effect: async (char1, char2) => {
                        const suspected = char1;
                        const suspector = char2;
                        
                        const bonus = suspector.intelligence * 2;
                        const target = 50;
                        
                        // 주사위 애니메이션 실행
                        const result = await rollDiceWithAnimation(target, "지능", bonus);
                        const total = result.roll + bonus;
                        const isSuccess = total >= target;

                        addLog(`${suspector.name}의 지능 판정: ${total} : ${target} (지능 보너스: ${bonus})`, isSuccess ? 'success' : 'error');
                        
                        if (isSuccess) {
                            suspected.trust = Math.min(100, (suspected.trust || 50) + 10);
                            suspector.trust = Math.min(100, (suspector.trust || 50) + 10);
                            addLog(`${suspector.name}은(는) ${suspected.name}이(가) 의심스러웠지만, 협력하여 시련을 클리어했다. - 신뢰도 +10`, 'heal');
                        } else {
                            gameState.survivors = gameState.survivors.map(s => 
                                    s.id === suspected.id 
                                        ? { ...s, hp: 0, isAlive: false }
                                        : s
                                );
                            suspector.trust = Math.max(0, (suspector.trust || 50) - 10);
                            addLog(`${suspector.name}은(는) ${suspected.name}이(가) 의심스러워 열려있는 문을 열고 도망쳤다.`, 'event');
                            addLog(`${suspected.name}은(는) 절명했다. \n${suspector.name} 신뢰도 -10`, 'death');
                            processDeathRelationships(suspected);
                        }
                        updateDisplay();
                    }
                },
                {
                    getText: (char1, char2) => `${char2.name}이(가) 의심스러우니 경계한다. (지능 판정)`,
                    effect: async (char1, char2) => {
                        const suspected = char2;
                        const suspector = char1;
                        
                        const bonus = suspector.intelligence * 2;
                        const target = 50;
                        
                        // 주사위 애니메이션 실행
                        const result = await rollDiceWithAnimation(target, "지능", bonus);
                        const total = result.roll + bonus;
                        const isSuccess = total >= target;

                        addLog(`${suspector.name}의 지능 판정: ${total} : ${target} (지능 보너스: ${bonus})`, isSuccess ? 'success' : 'error');
                        
                        if (isSuccess) {
                            suspector.trust = Math.min(100, (suspector.trust || 50) + 10);
                            suspected.trust = Math.min(100, (suspected.trust || 50) + 10);
                            addLog(`${suspector.name}은(는) ${suspected.name}이(가) 의심스러웠지만, 협력하여 시련을 클리어했다. - 신뢰도 +10`, 'heal');
                        } else {
                            gameState.survivors = gameState.survivors.map(s => 
                                    s.id === suspected.id 
                                        ? { ...s, hp: 0, isAlive: false }
                                        : s
                                );
                            suspector.trust = Math.max(0, (suspector.trust || 50) - 10);
                            addLog(`${suspector.name}은(는) ${suspected.name}이(가) 의심스러워 열려있는 문을 열고 도망쳤다.`, 'event');
                            addLog(`${suspected.name}은(는) 절명했다. \n${suspector.name} 신뢰도 -10`, 'death');
                            processDeathRelationships(suspected);
                        }
                        updateDisplay();
                    }
                }
            ]
        }
    ]
};

// 팝업 이벤트 정의
const POPUP_EVENTS = {
    humanChoice: {
        id: 'humanChoice',
        name: '마지막 선택',
        checkCondition: () => {
            const candidates = gameState.survivors.filter(s => 
                s.isAlive && 
                s.status === '인간' && 
                (s.hp / s.maxHp) <= 0.4
            );
            return candidates.length > 0 ? candidates : null;
        },
        probability: 0.01,
        getMessage: (character) => `
            <div style="text-align: center; margin-bottom: 10px;">
                <strong>${character.name}은(는) 자신의 생명이 얼마 남지 않았음을 직감했다.</strong>
                <br>
                동료의 도움을 받아 자신의 인형에 ai콜링을 하여 자신의 죽음을 숨기고 모두를 도울지, 죽음을 받아들일지 고민한다...
                <br>
            </div>
        `,
        choices: [
            {
                text: 'ai콜링을 진행한다.',
                condition: (character) => {
                    const allies = gameState.survivors.filter(s => 
                        s.isAlive && 
                        s.id !== character.id && 
                        (character.favorability[s.id] || 0) >= 80
                    );
                    return allies.length > 0;
                },
                disabledText: '(호감도가 80 이상인 캐릭터가 필요합니다)',
                effect: (character) => {
                    const allies = gameState.survivors.filter(s => 
                        s.isAlive && 
                        s.id !== character.id && 
                        (character.favorability[s.id] || 0) >= 80
                    );
                    
                    if (allies.length === 0) return;
                    
                    const bestAlly = allies.reduce((max, s) => 
                        (character.favorability[s.id] || 0) > (character.favorability[max.id] || 0) ? s : max
                    );

                    gameState.survivors = gameState.survivors.map(s => {
                        if (s.id === bestAlly.id) {
                            return {
                                ...s,
                                favorability: {
                                    ...s.favorability,
                                    [character.id]: Math.min(1500, (s.favorability[character.id] || 50) + 100)
                                }
                            };
                        }
                        if (s.id === character.id) {
                            return {
                                ...s,
                                status: '더미즈',
                                hp: s.maxHp
                            };
                        }
                        return s;
                    });
                    
                    addLog(`${character.name}이(가) ai콜링을 진행했다!`, 'penalty');
                    addLog(`${character.name}의 체력이 완전히 회복되었다. - HP +${character.maxHp - character.hp}`, 'heal');
                    addLog(`${bestAlly.name}의 ${character.name}에 대한 호감도가 크게 상승했다. - ${character.name} 호감도 +100`, 'favorability');
                }
            },
            {
                text: '죽음을 받아들인다.',
                condition: () => true,
                effect: (character) => {
                    const oldMental = character.mental;
                    
                    gameState.survivors = gameState.survivors.map(s => {
                        if (s.id === character.id) {
                            const newMental = Math.max(0, s.mental - 10);
                            return { ...s, mental: newMental };
                        }
                        return s;
                    });
                    
                    addLog(`${character.name}이(가) 죽음을 받아들였다.`, 'event');
                    addLog(`${character.name}의 정신력이 감소했다. - 정신력 -10`, 'damage');
                }
            }
        ]
    },
    escapeRoute: {
        id: 'escapeRoute',
        name: '탈출구 발견',
        checkCondition: () => {
            const candidates = gameState.survivors.filter(s => 
                s.isAlive && 
                (s.mental / s.maxMental) >= 0.8
            );
            return candidates.length > 0 ? candidates : null;
        },
        probability: 0.01,
        getMessage: (character) => `
            <div style="text-align: center; margin-bottom: 10px;">
                <strong>${character.name}은(는) 탈출구를 발견했다.</strong>
                <br>
                이곳을 통해서 안전하게 나갈 수 있지만, 한 사람이 나가게되면 무너질 것 같다.
                <br>
            </div>
        `,
        choices: [
            {
                text: '탈출구에 대한 정보를 다른 모두와 공유한다.',
                condition: (character) => {
                    const personalityType = getPersonalityType(character.personality);
                    return personalityType === 'stable';
                },
                disabledText: '(안정형 성격만 선택 가능)',
                effect: (character) => {
                    gameState.survivors = gameState.survivors.map(s => {
                        if (s.id === character.id) {
                            return {
                                ...s,
                                trust: Math.min(100, s.trust + 10)
                            };
                        }
                        return s;
                    });
                    
                    gameState.survivors.forEach(s => {
                        if (s.isAlive && s.id !== character.id) {
                            s.favorability[character.id] = Math.min(1500, (s.favorability[character.id] || 50) + 150);
                        }
                    });
                    
                    addLog(`${character.name}이(가) 탈출구 정보를 모두와 공유했다!`, 'event');
                    addLog(`${character.name}의 신뢰도가 상승했다. - 신뢰도 +10`, 'event');
                    addLog(`모든 캐릭터의 ${character.name}에 대한 호감도가 크게 상승했다. - 호감도 +150`, 'event');
                    addLog(`모든 캐릭터들이 탈출구를 알게되었지만, 탈출구는 한 명이 통과하면 무너질 것 처럼 위태로웠다.`, 'event');
                    addLog(`결국 모두 마음을 모아 탈출구를 통한 탈출을 포기했다.`, 'event');
                }
            },
            {
                text: '탈출구를 통해서 망설임 없이 탈출한다.',
                condition: (character) => {
                    const personalityType = getPersonalityType(character.personality);
                    return personalityType === 'egocentric' || personalityType === 'anxious';
                },
                disabledText: '(자기중심형/불안형 성격만 선택 가능)',
                effect: async (character) => {
                    const target = 80;
                    const result = await rollDiceWithAnimation(80, "탈출", 0);
                    const total = result.roll;
                    
                    addLog(`${character.name}이(가) 탈출을 시도한다...`, 'event');
                    addLog(`탈출 다이스: ${total} : ${target}`, total >= target ? 'success' : 'error');
                    
                    if (total >= target) {
                        addLog(`${character.name}이(가) 성공적으로 탈출했다. (${total}/80)`, 'escape');
                        updateDisplay(); 
                        
                        gameState.isRunning = false;
                        addLog(`${character.name}의 단독 승리!`, 'game-end');
                        updateDisplay();
                        setTimeout(() => showEndingScreen([character]), 3500);
                    } else {
                        addLog(`탈출구의 끝이 막혀있었다. 탈출 실패 (${total}/80)`, 'event');
                        
                        gameState.survivors = gameState.survivors.map(s => {
                            if (s.id === character.id) {
                                return {
                                    ...s,
                                    trust: Math.max(0, s.trust - 10)
                                };
                            }
                            return s;
                        });
                        
                        gameState.survivors.forEach(s => {
                            if (s.isAlive && s.id !== character.id) {
                                s.favorability[character.id] = Math.max(-200, (s.favorability[character.id] || 50) - 50);
                            }
                        });
                        
                        addLog(`${character.name}의 신뢰도가 하락했다. -정신력 -10`, 'penalty');
                        addLog(`모든 캐릭터의 ${character.name}에 대한 호감도가 크게 하락했다. -전 생존자의 호감도 -50`, 'favorability');
                        updateDisplay();
                    }
                }
            },
            {
                text: '탈출을 고민한다.',
                condition: () => true,
                effect: async (character) => {
                    const threshold = Math.floor(Math.random() * 11) + 60;
                    const result1 = await rollDiceWithAnimation(threshold, "결심", 0);
                    const total1 = result1.roll;
                    
                    addLog(`${character.name}이(가) 탈출을 고민한다...`, 'event');
                    addLog(`결심 다이스: ${total1} : ${threshold}`, total1 >= threshold ? 'success' : 'error');
                    
                    if (total1 < threshold) {
                        addLog(`${character.name}은(는) 탈출구로 들어가기를 포기했다. (${total1}/${threshold})`, 'event');
                        updateDisplay();
                        return;
                    }
                    
                    addLog(`${character.name}은(는) 탈출구로 들어가기로 결정했다!(${total1}/${threshold})`, 'event');

                    addLog(`${character.name}은(는) 탈출구가 있는 곳으로 향한다...(잠시 대기)`, 'event');
                    
                    await new Promise(resolve => setTimeout(resolve, 1500));

                    const result2 = await rollDiceWithAnimation(95, "탈출", 0);
                    const escapeTotal = result2.roll;
                    
                    addLog(`탈출 다이스: ${escapeTotal} : 95`, escapeTotal >= 95 ? 'success' : 'error');
                    
                    if (escapeTotal >= 95) {
                        addLog(`${character.name}이(가) 성공적으로 탈출했다. (${escapeTotal}/95)`, 'escape');
                        updateDisplay(); 
                        
                        gameState.isRunning = false;
                        addLog(`${character.name}의 단독 승리!`, 'game-end');
                        updateDisplay();
                        setTimeout(() => showEndingScreen([character]), 3500);
                    } else {
                        addLog(`탈출구의 끝이 막혀있었다! 탈출 실패 (${escapeTotal}/95)`, 'event');
                        
                        gameState.survivors = gameState.survivors.map(s => {
                            if (s.id === character.id) {
                                return {
                                    ...s,
                                    trust: Math.max(0, s.trust - 10)
                                };
                            }
                            return s;
                        });
                        
                        gameState.survivors.forEach(s => {
                            if (s.isAlive && s.id !== character.id) {
                                s.favorability[character.id] = Math.max(-200, (s.favorability[character.id] || 50) - 50);
                            }
                        });
                        
                        addLog(`${character.name}의 신뢰도가 하락했다. -정신력 -10`, 'penalty');
                        addLog(`모든 캐릭터의 ${character.name}에 대한 호감도가 크게 하락했다. -전 생존자의 호감도 -50`, 'favorability');
                        updateDisplay();
                    }
                }
            }
        ]
    },
    preciousYou: {
        id: 'preciousYou',
        name: '소중한 당신에게',
        checkCondition: () => {
            // 신뢰매매게임이 아니면 발생하지 않음
            if (gameState.subGameType !== 'trust') return null;
            
            const candidates = gameState.survivors.filter(survivor => {
                if (!survivor.isAlive) return false;

                if (survivor.experiencedPreciousYou) return false;
                
                // 죽은 캐릭터 중 친구 이상인 캐릭터가 있는지 확인
                const deadFriends = gameState.survivors.filter(dead => {
                    if (dead.isAlive) return false;
                    const fav = survivor.favorability[dead.id] || 0;
                    return fav >= 150; // 친구 이상
                });
                
                return deadFriends.length > 0;
            });
            
            if (candidates.length === 0) return null;
            
            // 각 후보자별로 확률 계산하여 필터링
            const validCandidates = candidates.filter(survivor => {
                const baseProbability = 0.95; // 5%
                const panicBonus = survivor.isPanic ? 0.05 : 0; // 패닉 시 5% 추가
                const totalProbability = baseProbability + panicBonus;
                
                return Math.random() < totalProbability;
            });
            
            return validCandidates.length > 0 ? validCandidates : null;
        },
        probability: 1, // checkCondition에서 이미 확률 처리
        getMessage: (character) => {
            // 죽은 친구 중 랜덤 선택
            const deadFriends = gameState.survivors.filter(dead => {
                if (dead.isAlive) return false;
                const fav = character.favorability[dead.id] || 0;
                return fav >= 150;
            });
            
            const deadFriend = deadFriends[Math.floor(Math.random() * deadFriends.length)];
            
            // 임시로 저장 (선택지에서 사용)
            character._tempDeadFriend = deadFriend;
            
            return `
                <div style="text-align: center; margin-bottom: 10px;">
                    <strong>${character.name}은(는) 모니터룸에서 ${deadFriend.name}의 AI를 발견했습니다.</strong>
                    <br>
                    ${deadFriend.name}은(는)...
                </div>
            `;
        },
        choices: [
            {
                text: `내가 죽은 이유는 당신의 탓이라고 말한다.`,
                condition: () => true,
                effect: (character) => {
                    const oldMental = character.mental;
                    gameState.survivors = gameState.survivors.map(s => {
                        if (s.id === character.id) {
                            return {
                                ...s,
                                mental: Math.max(0, s.mental - 50),
                                experiencedPreciousYou: true
                            };
                        }
                        return s;
                    });
                    const deadFriend = character._tempDeadFriend;
                    addLog(`${character.name}이(가) ${deadFriend ? deadFriend.name : '누군가'} AI의 말에 충격을 받았다. - 정신력 -50`, 'damage');
                    
                    // 임시 데이터 정리
                    delete character._tempDeadFriend;
                }
            },
            {
                text: `진짜 '나'는 당신이 살아남아서 다행이라고 생각했을 것이라고 말한다.`,
                condition: () => true,
                effect: (character) => {
                    const isPanic = character.isPanic;
                    const mentalGain = isPanic ? 50 : 25;
                    
                    gameState.survivors = gameState.survivors.map(s => {
                        if (s.id === character.id) {
                            return {
                                ...s,
                                mental: Math.min(s.maxMental, s.mental + mentalGain),
                                experiencedPreciousYou: true  // 플래그 설정
                            };
                        }
                        return s;
                    });
                    const deadFriend = character._tempDeadFriend;
                if (isPanic) {
                    addLog(`비록 AI의 위로이지만, ${character.name}이(가) ${deadFriend ? deadFriend.name : '누군가'}의 말에 위로받았다. - 정신력 +${mentalGain}`, 'heal');
                } else {
                    addLog(`비록 AI의 위로이지만, ${character.name}이(가) ${deadFriend ? deadFriend.name : '누군가'}의 말에 위로받았다. - 정신력 +${mentalGain}`, 'heal');
                }
                    
                    // 임시 데이터 정리
                    delete character._tempDeadFriend;
                }
            }
        ]
    },
    
    mysteryLaptop: {
        id: 'mysteryLaptop',
        name: '누구의 노트북이지?',
        checkCondition: () => {
            // 이미 발생했으면 다시 발생하지 않음
            if (gameState.laptopEventOccurred) return null;
            
            const candidates = gameState.survivors.filter(survivor => {
                if (!survivor.isAlive) return false;
                if (survivor.intelligence < 8) return false;
                if (survivor.hasLaptop) return false; // 이미 노트북을 가진 경우 제외
                
                // 친구 이상의 관계인 생존자가 있는지 확인
                const hasFriend = gameState.survivors.some(other => {
                    if (!other.isAlive || other.id === survivor.id) return false;
                    const fav = survivor.favorability[other.id] || 0;
                    return fav >= 150; // 친구 이상
                });
                
                return hasFriend;
            });
            
            return candidates.length > 0 ? candidates : null;
        },
        probability: 0.2, // 20%
        getMessage: (character) => `
            <div style="text-align: center; margin-bottom: 10px;">
                <strong>${character.name}은(는) 수색 중 우연히 노트북을 발견했습니다.</strong>
                <br>
                이 노트북은 유용하게 사용될 것 같습니다.
            </div>
        `,
        choices: [
            {
                text: '노트북을 챙긴다.',
                condition: () => true,
                effect: (character) => {
                    character.hasLaptop = true;
                    gameState.laptopEventOccurred = true; // 이벤트 발생 기록
                    
                    addLog(`${character.name}이(가) 노트북을 획득했다.`, 'reward');
                }
            }
        ]
    }
};

// 자동 저장 함수
function autoSaveToLocalStorage() {
    try {
        // 현재 턴의 로그만 필터링
        const currentTurnLogs = gameState.logs.filter(log => log.turn === gameState.turn);
        
        const data = {
            survivors: gameState.survivors,
            logs: currentTurnLogs,  // 현재 턴 로그만 저장
            turn: gameState.turn,
            gamePhase: gameState.gamePhase,
            subGameType: gameState.subGameType,
            subGameTurn: gameState.subGameTurn,
            turnDialogues: gameState.turnDialogues,
            hasStarted: gameState.hasStarted,
            initialTrialPopupsShown: gameState.initialTrialPopupsShown,
            mainGameTurn: gameState.mainGameTurn,
            usedTrialEvents: gameState.usedTrialEvents,
            laptopEventOccurred: gameState.laptopEventOccurred,
            savedAt: new Date().toISOString()
        };
        
        localStorage.setItem('yttd_simulator_autosave', JSON.stringify(data));
        console.log('자동 저장 완료:', gameState.turn, '턴');
    } catch (error) {
        console.error('자동 저장 실패:', error);
    }
}

// 자동 로드 함수
function loadAutoSaveFromLocalStorage() {
    try {
        const saved = localStorage.getItem('yttd_simulator_autosave');
        if (!saved) return;
        
        const data = JSON.parse(saved);
        
        // 데이터가 유효한지 확인
        if (!data.survivors || !Array.isArray(data.survivors)) return;
        
        gameState.survivors = data.survivors || [];
        gameState.logs = data.logs || [];
        gameState.turn = data.turn || 0;
        gameState.gamePhase = data.gamePhase || 'initial';
        gameState.subGameType = data.subGameType || null;
        gameState.subGameTurn = data.subGameTurn || 0;
        gameState.turnDialogues = data.turnDialogues || {};
        gameState.hasStarted = data.hasStarted || false;
        gameState.initialTrialPopupsShown = data.initialTrialPopupsShown || {};
        gameState.mainGameTurn = data.mainGameTurn || 0;
        gameState.usedTrialEvents = data.usedTrialEvents || [];
        gameState.laptopEventOccurred = data.laptopEventOccurred || false;
        
        addLog('자동 저장된 데이터를 불러왔습니다.', 'system');
        console.log('자동 로드 완료:', data.turn, '턴');
    } catch (error) {
        console.error('자동 로드 실패:', error);
        localStorage.removeItem('yttd_simulator_autosave');
    }
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.setAttribute('data-lucide', isLight ? 'moon' : 'sun');
        lucide.createIcons();
    }
}

// 초기화
function init() {
    // DOM 요소 존재 확인
    const themeIcon = document.getElementById('themeIcon');
    const toggleBtn = document.getElementById('toggleBtn');
    const nextTurnBtn = document.getElementById('nextTurnBtn');
    const addSurvivorBtn = document.getElementById('addSurvivorBtn');
    const actionsBtn = document.getElementById('actionsBtn');
    const relationshipsBtn = document.getElementById('relationshipsBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    
    // 필수 요소가 없으면 조기 종료
    if (!toggleBtn || !nextTurnBtn || !addSurvivorBtn) {
        console.error('필수 DOM 요소를 찾을 수 없습니다.');
        return;
    }
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }

    loadAutoSaveFromLocalStorage();
    
    if (themeIcon) {
        lucide.createIcons();
    }
    
    setupEventListeners();
    updateDisplay();
}

// 이벤트 리스너 설정
function setupEventListeners() {
    const elements = {
        toggleBtn: document.getElementById('toggleBtn'),
        nextTurnBtn: document.getElementById('nextTurnBtn'),
        addSurvivorBtn: document.getElementById('addSurvivorBtn'),
        actionsBtn: document.getElementById('actionsBtn'),
        relationshipsBtn: document.getElementById('relationshipsBtn'),
        settingsBtn: document.getElementById('settingsBtn')
    };
    
    // 각 요소가 존재할 때만 이벤트 리스너 추가
    if (elements.toggleBtn) {
        elements.toggleBtn.addEventListener('click', toggleSimulation);
    }
    if (elements.nextTurnBtn) {
        elements.nextTurnBtn.addEventListener('click', () => !gameState.isRunning && processTurn());
    }
    if (elements.addSurvivorBtn) {
        elements.addSurvivorBtn.addEventListener('click', () => showAddSurvivorPopup());
    }
    if (elements.actionsBtn) {
        elements.actionsBtn.addEventListener('click', () => showPopup('actions'));
    }
    if (elements.relationshipsBtn) {
        elements.relationshipsBtn.addEventListener('click', () => showPopup('relationships'));
    }
    if (elements.settingsBtn) {
        elements.settingsBtn.addEventListener('click', () => showPopup('settings'));
    }
}

// 시뮬레이션 토글
function toggleSimulation() {
    
    const btn = document.getElementById('toggleBtn');
    const totalSurvivors = gameState.survivors.length; // 이 줄 추가
    
    if (!gameState.isRunning && gameState.turn === 0 && totalSurvivors < 3) {
        addLog('참가자가 부족합니다.', 'vote');
        addLog('시뮬레이션을 시작할 수 없습니다.', 'vote');
        addLog(`(최소 3명 필요, 현재 ${totalSurvivors}명)`, 'vote');
        updateDisplay();
        return;
    }

    gameState.isRunning = !gameState.isRunning;
    
    if (gameState.isRunning) {
        btn.innerHTML = '<i data-lucide="pause"></i><span>일시정지</span>';
        runSimulation();
    } else {
        btn.innerHTML = '<i data-lucide="play"></i><span>자동진행</span>';
        if (gameState.timer) {
            clearTimeout(gameState.timer);
            gameState.timer = null;
        }
    }
    
    lucide.createIcons();
    updateDisplay();
}

// 시뮬레이션 실행
function runSimulation() {
    if (!gameState.isRunning) return;
    
    gameState.timer = setTimeout(() => {
        processTurn();
        runSimulation();
    }, 2000);
}

// 턴 처리
function processTurn() {
    
    const totalSurvivors = gameState.survivors.length;
        
    if (!gameState.isRunning && gameState.turn === 0 && totalSurvivors < 3) {
        addLog('참가자가 부족합니다.', 'vote');
        addLog('시뮬레이션을 시작할 수 없습니다.', 'vote');
        addLog(`(최소 3명 필요, 현재 ${totalSurvivors}명)`, 'vote');
        updateDisplay();
        return;
    }

    // 0턴
    if (gameState.turn === 0) {
        gameState.hasStarted = true;
        addLog('=== 시뮬레이션 시작 ===', 'phase');
        addLog('=== 턴 1: 최초의 시련 시작 ===', 'phase');
        
        gameState.turn = 1;
        updateDisplay();
        
        const aliveSurvivors = gameState.survivors.filter(s => s.isAlive);
        const remainingSurvivors = aliveSurvivors.filter(s => !gameState.initialTrialPopupsShown[s.id]);
        
        if (remainingSurvivors.length > 0) {
            setTimeout(() => {
                processInitialTrial();
            }, 300);
        } else {
            addLog(`=== 턴 ${gameState.turn}: 최초의 시련 완료 ===`, 'phase');
        }
        
        return;
    }
    
    initializeTurnDialogues();

    const aliveSurvivors = gameState.survivors.filter(s => s.isAlive);
    if (aliveSurvivors.length <= 2 && aliveSurvivors.length > 0) {
        addLog('생존자가 2명 이하가 되었다!', 'game-end');
        gameState.isRunning = false;
        updateDisplay();
        setTimeout(() => showEndingScreen(aliveSurvivors), 3500);
        return;
    }
    
    if (aliveSurvivors.length === 0) {
        addLog('모든 생존자가 절명했다.', 'game-end');
        gameState.isRunning = false;
        updateDisplay();
        return;
    }

    if (gameState.turn !== 0) {
        checkPopupEvents();
    }
    
    gameState.survivors.forEach(s => {
        if (s.isAlive && !s.isPanic) {
            if (!s.currentAction || s.currentAction === 'free') {
                processSingleFreeAction(s);
            }
        }
    });
    
    processFavorabilityChanges();
    checkPanicState();

    // === 게임 페이즈별 처리 수정 ===
   const cyclePosition = ((gameState.turn - 1) % 13) + 1;

   if (cyclePosition === 1) {
        // 1, 14, 27... 턴: 서브게임 시작
        startSubGame();
    } 
    else if (cyclePosition >= 2 && cyclePosition <= 10) {
        // 2~10, 15~23... 턴: 서브게임 진행
        processSubGame();
    }
    else if (cyclePosition >= 11 && cyclePosition <= 13) {
        // 11~13, 24~26... 턴: 메인게임 진행
        processMainGame();
    }

    // 턴 종료 처리
    gameState.survivors.forEach(s => {
        if (!s.isAlive) return;
        const jobSkill = JOB_SKILLS[s.job];
        
        if (jobSkill && jobSkill.name === '적선 구걸') {
            const others = gameState.survivors
                .filter(other => other.isAlive && other.id !== s.id)
                .sort((a, b) => (a.favorability[s.id] || 50) - (b.favorability[s.id] || 50));
            
            if (others.length > 0) {
                const target = others[0];
                if (target.tokens > 0) {
                    target.tokens--;
                    s.tokens = (s.tokens || 0) + 1;
                    addLog(`${s.name}의 '적선 구걸' 발동! ${target.name}에게서 토큰 1개 획득`, 'event');
                }
            }
        }
        
        if (jobSkill && jobSkill.name === '이미지 메이킹') {
            const trustBonus = Math.floor(s.charm * 0.5);
            s.trust = Math.min(100, s.trust + trustBonus);
            if (trustBonus > 0) {
                addLog(`${s.name}의 '이미지 메이킹' 발동! - 신뢰도 +${trustBonus}`, 'event');
            }
        }
        
        if (jobSkill && jobSkill.name === '심신 안정') {
            gameState.survivors.forEach(target => {
                if (target.isAlive && target.isPanic && target.id !== s.id) {
                    target.mental = Math.min(target.maxMental, target.mental + 5);
                    addLog(`${s.name}의 '심신 안정' 발동! ${target.name}의 정신력 +5`, 'event');
                }
            });
        }
        
        if (jobSkill && jobSkill.name === '일정 관리') {
            let maxFav = -Infinity;
            let topTarget = null;
            Object.keys(s.favorability).forEach(targetId => {
                const fav = s.favorability[targetId];
                if (fav > maxFav) {
                    maxFav = fav;
                    topTarget = gameState.survivors.find(sv => sv.id == targetId);
                }
            });
            
            if (topTarget && topTarget.currentAction && topTarget.currentAction !== 'free') {
                s.tokens = (s.tokens || 0) + 1;
                addLog(`${s.name}의 '일정 관리' 발동! (토큰 +1)`, 'event');
            }
        }
        
        if (jobSkill && jobSkill.name === '위로의 노래' && gameState.subGameType === 'banquet') {
            gameState.survivors.forEach(target => {
                if (target.isAlive && target.skills.includes('생존본능') && target.id !== s.id) {
                    target.mental = Math.min(target.maxMental, target.mental + 10);
                    addLog(`${s.name}의 '위로의 노래' 발동! ${target.name}의 정신력 +10`, 'event');
                }
            });
        }
        
        if (jobSkill && jobSkill.name === '살상 유택') {
            s.mental = Math.min(s.maxMental, s.mental + 5);
            addLog(`${s.name}의 '살상 유택' 발동! - 정신력 +5`, 'event');
        }
    });

    gameState.turn++;

    assignFreeActions();
    updateDisplay();
    localStorage.removeItem('yttd_simulator_autosave');
    autoSaveToLocalStorage();
}

// 팝업 이벤트 체크 및 실행
function checkPopupEvents() {
    // 각 이벤트를 순회하면서 체크
    Object.values(POPUP_EVENTS).forEach(event => {
        // 확률 체크
        if (Math.random() > event.probability) return;
        
        // 조건 체크
        const candidates = event.checkCondition();
        if (!candidates || candidates.length === 0) return;
        
        // 랜덤하게 한 명 선택
        const character = candidates[Math.floor(Math.random() * candidates.length)];
        
        // 팝업 표시
        showPopupEvent(event, character);
        
        // 게임 일시정지
        if (gameState.isRunning) {
            gameState.isRunning = false;
            const btn = document.getElementById('toggleBtn');
            btn.innerHTML = '<i data-lucide="play"></i><span>자동진행</span>';
            if (gameState.timer) {
                clearTimeout(gameState.timer);
                gameState.timer = null;
            }
            lucide.createIcons();
        }
    });
}

// 팝업 이벤트 UI 표시
function showPopupEvent(event, character) {
    const container = document.getElementById('popupContainer');
    
    // 선택 가능한 옵션들 생성
    const choicesHTML = event.choices.map((choice, index) => {
        const isDisabled = !choice.condition(character);
        return `
            <button 
                class="btn ${isDisabled ? 'btn-gray' : 'btn-green'}" 
                style="width: 100%; margin-bottom: 0.5rem; color: var(--text-primary);"
                ${isDisabled ? 'disabled' : ''}
                onclick="selectPopupChoice(${index}, ${character.id}, '${event.id}')">
                ${choice.text}
                ${isDisabled && choice.disabledText ? `<br><span style="font-size: 0.75rem;color: var(--border-color);word-break: keep-all;">${choice.disabledText}</span>` : ''}
            </button>
        `;
    }).join('');
    
    container.innerHTML = `
        <div class="popup-overlay">
            <div class="popup" onclick="event.stopPropagation()">
                <div class="popup-header">
                    <h2 class="popup-title">${event.name}</h2>
                </div>
                <div class="popup-content">
                    <div class="form">
                        ${character.image && character.image !== 'data:,' && character.image !== '' 
                            ? `<img src="${character.image}" alt="${character.name}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; display: block; margin: 0 auto 1rem;">`
                            : `<div style="width: 100px; height: 100px; border-radius: 50%; background-color: ${getRandomColor(character.id)}; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                                <i data-lucide="user" size="48" color="white"></i>
                            </div>`
                        }
                        <p style="text-align: center; margin-bottom: 1.5rem; font-size: 1.1rem; line-height: 1.6;">
                            ${event.getMessage(character)}
                        </p>
                        ${choicesHTML}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    lucide.createIcons();
}

// 팝업 선택 처리
function selectPopupChoice(choiceIndex, characterId, eventId) {
    const event = POPUP_EVENTS[eventId];
    const character = gameState.survivors.find(s => s.id === characterId);
    
    if (!event || !character) return;
    
    const choice = event.choices[choiceIndex];
    
    // effect 실행
    choice.effect(character);
    
    // 팝업 닫기
    document.getElementById('popupContainer').innerHTML = '';
    
    // 화면 업데이트
    updateDisplay();
}

// 새로운 함수: 단일 생존자의 자유 행동 처리
function processSingleFreeAction(s) {
    const scriptArray = gameState.gamePhase === 'main' ? MAIN_GAME_FREE_ACTION_SCRIPTS : FREE_ACTION_SCRIPTS;
    const script = scriptArray[Math.floor(Math.random() * scriptArray.length)];
    const personalityType = getPersonalityType(s.personality);

        // 안정형의 특수 스크립트 처리
    if (personalityType === 'stable' && script.isStableSpecial) {
        gameState.survivors.forEach(survivor => {
            if (survivor.isAlive && survivor.id !== s.id) {
                survivor.mental = Math.min(survivor.maxMental, survivor.mental + 15);
            }
        });
        addLog(`${s.name}이(가) ${script.message} 모두의 정신력이 회복되었다! (+15)`, 'free-action');
        return;
    }

    let message = script.message;
    if (message.includes('{target}')) {
        const others = gameState.survivors.filter(other => other.isAlive && other.id !== s.id);
        if (others.length > 0) {
            const target = others[Math.floor(Math.random() * others.length)];
            message = message.replace('{target}', target.name);
        } else {
            message = message.replace('{target}', '누군가');
        }
    }
        
    let hpChange = script.hp;
    let mentalChange = script.mental;
    let trustChange = script.trust;

    // 서브게임 중 자유행동 보너스
    if (gameState.gamePhase === 'sub') {
        if (gameState.subGameType === 'trust') {
            // 신뢰매매: 토큰 획득/손실 (-2 ~ +3)
            const tokenChange = Math.floor(Math.random() * 6) - 2;
            s.tokens = Math.max(0, (s.tokens || 0) + tokenChange);
            
            if (tokenChange > 0) {
                const gainScripts = [
                    '누군가 떨어트린 토큰을 주웠다.',
                    '다른 사람과의 거래에서 이득을 봤다.',
                    '숨겨진 어트랙션을 클리어했다.',
                    '토큰을 교환했다.',
                    '어트랙션을 클리어했다.'
                ];
                const script = gainScripts[Math.floor(Math.random() * gainScripts.length)];
                addLog(`${s.name}이(가) ${script} +${tokenChange}토큰`, 'reward');
            } else if (tokenChange < 0) {
                const lossScripts = [
                    '토큰으로 상점에서 물건을 교환했다.',
                    '다른 사람에게 토큰을 빼앗겼다.',
                    '어트랙션에서 실패했다.',
                    '토큰을 떨어뜨려 잃어버렸다.'
                ];
                const script = lossScripts[Math.floor(Math.random() * lossScripts.length)];
                addLog(`${s.name}이(가) ${script} ${tokenChange}토큰)`, 'penalty');
            }
        } else if (gameState.subGameType === 'body') {
            // 신체보물찾기: 낮은 확률로 신체 부위 발견
            if (Math.random() < 0.15) { // 15% 확률
                const parts = ['leftArm', 'rightArm', 'leftLeg', 'rightLeg', 'head', 'torso'];
                const partNames = {
                    leftArm: '왼팔', rightArm: '오른팔',
                    leftLeg: '왼다리', rightLeg: '오른다리',
                    head: '머리', torso: '몸통'
                };
                const randomPart = parts[Math.floor(Math.random() * parts.length)];
                s.bodyParts[randomPart] = true;
                
                const discoveryScripts = [
                    '우연히 신체 부위를 발견했다.',
                    '어두운 곳에서 신체를 찾아냈다.',
                    '다른 사람이 놓친 부위를 발견했다.',
                    '숨겨진 장소에서 신체를 찾았다.',
                    '운좋게 신체 부위를 획득했다.'
                ];
                const script = discoveryScripts[Math.floor(Math.random() * discoveryScripts.length)];
                addLog(`${s.name}이(가) ${script} [${partNames[randomPart]}]`, 'reward');
            }
        } else if (gameState.subGameType === 'banquet' && s.status === '더미즈' && s.inCoffin) {
            // 연회 중 관에 갇힌 더미즈: 호감도 추가 상승
            const sympathyScripts = [
                '반박을 납득했다.',
                '논리에 빈틈이 없었다.',
                '절망적인 상황에 마음이 움직였다.',
                '관에 갇힌 모습이 안쓰러웠다.',
                '울부짖는 모습에 안타까움을 느꼈다.'
            ];
            const script = sympathyScripts[Math.floor(Math.random() * sympathyScripts.length)];

            let totalIncrease = 0;
            const increases = [];
            
            gameState.survivors.forEach(other => {
                if (other.isAlive && other.status === '인간' && other.id !== s.id) {
                const oldFav = other.favorability[s.id] || 50;
                
                // 기본 증가량
                let increase = Math.floor(Math.random() * 8) + 3;
                
                // 매력 보너스 (매력 7 이상일 때)
                if (s.charm >= 7) {
                    increase += Math.floor((s.charm - 6) * 0.5); // 매력 7: +0.5, 8: +1, 9: +1.5, 10: +2
                }
                
                // 지능 보너스 (지능 7 이상일 때)
                if (s.intelligence >= 7) {
                    increase += Math.floor((s.intelligence - 6) * 0.3); // 지능 7: +0.3, 8: +0.6, 9: +0.9, 10: +1.2
                }
                
                increase = Math.floor(increase); // 정수로 변환
                
                other.favorability[s.id] = Math.min(1500, oldFav + increase);
                increases.push(`${other.name} +${increase}`);
                totalIncrease += increase;
            }
            });
            
            if (totalIncrease > 0) {
                addLog(`${s.name}의 ${script} -호감도 +${increases.join(', ')}`, 'favorability');
            }
        }
    }
    
    // 성격별 보정
    if (personalityType === 'activist') {
        if (hpChange < 0) hpChange -= 10;
        if (trustChange > 0) trustChange += 2;
    }
    
    if (personalityType === 'anxious') {
        if (mentalChange < 0) mentalChange -= 10;
        if (trustChange < 0) trustChange -= 2;
        if (s.hp <= s.maxHp * 0.6) {
            hpChange += 20;
            addLog(`${s.name}은(는) 스스로의 체력을 회복했다. (+20 HP)`, 'heal');
        }
    }
    
    if (personalityType === 'stable') {
        if (mentalChange < 0) mentalChange += 10;
    }
    
    if (personalityType === 'egocentric') {
        if (trustChange > 0) trustChange -= 2;
        if (trustChange < 0) trustChange -= 2;
    }

    const jobSkill = JOB_SKILLS[s.job];
    if (jobSkill && jobSkill.name === '알뜰살뜰' && script.trust > 0) {
        if (Math.random() < 0.3) {
            addLog(`${s.name}의 '알뜰살뜰' 발동! - 신뢰도 추가 상승`, 'event');
            trustChange += 5;
        }
    }

    const oldHp = s.hp;
    const oldMental = s.mental;
    const oldTrust = s.trust;
    
    s.hp = Math.max(0, Math.min(s.maxHp, s.hp + hpChange));
    s.mental = Math.max(0, Math.min(s.maxMental, s.mental + mentalChange));
    s.trust = Math.max(0, Math.min(100, s.trust + trustChange));

    if (s.hp > oldHp || s.mental > oldMental) {
        addDialogue(s, 'relief', 0.8);
    }
    if (s.mental < oldMental) {
        addDialogue(s, 'awe', 0.3);
    }
    if (s.hp < oldHp) {
        addDialogue(s, 'exhausted', 0.3);
    }
    
    const changes = [];
    if (s.hp !== oldHp) {
        const diff = s.hp - oldHp;
        changes.push(`HP ${diff > 0 ? '+' : ''}${diff}`);
    }
    if (s.mental !== oldMental) {
        const diff = s.mental - oldMental;
        changes.push(`정신력 ${diff > 0 ? '+' : ''}${diff}`);
    }
    if (s.trust !== oldTrust) {
        const diff = s.trust - oldTrust;
        changes.push(`신뢰도 ${diff > 0 ? '+' : ''}${diff}`);
    }
    
    const changeText = changes.length > 0 ? ` (${changes.join(', ')})` : '';
    addLog(`${s.name}이(가) ${message}${changeText}`, 'free-action');

    // 랜덤 스킬 획득/상실 체크
    if (Math.random() < 0.03) {
        const availableSkills = getAvailableSpecialSkills(s);
        if (availableSkills.length > 0) {
            const newSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
            s.skills.push(newSkill.name);
            const skillScript = SKILL_GAIN_SCRIPTS[Math.floor(Math.random() * SKILL_GAIN_SCRIPTS.length)];
            addLog(`${s.name}은(는) ${skillScript.message} +[${newSkill.name}] 스킬 획득`, 'reward');
        }
    }
    
    if (Math.random() < 0.02) {
        const loseableSkills = s.skills.filter(skill => !isJobSkill(s, skill));
        if (loseableSkills.length > 0) {
            const lostSkill = loseableSkills[Math.floor(Math.random() * loseableSkills.length)];
            s.skills = s.skills.filter(sk => sk !== lostSkill);
            const skillScript = SKILL_LOSS_SCRIPTS[Math.floor(Math.random() * SKILL_LOSS_SCRIPTS.length)];
            addLog(`${s.name}은(는) ${skillScript.message} -[${lostSkill}] 스킬 상실`, 'penalty');
        }
    }
    
    if (s.hp === 0) {
        addLog(`${s.name}은(는) 절명했다.`, 'death');
        s.isAlive = false;

        processDeathRelationships(s);
        
        // 사망 직후 생존자 수 체크
        const aliveSurvivors = gameState.survivors.filter(sv => sv.isAlive);
        if (aliveSurvivors.length <= 2 && aliveSurvivors.length > 0) {
            gameState.isRunning = false;
            setTimeout(() => {
                addLog('생존자가 2명 이하가 되었다!', 'game-end');
                setTimeout(() => showEndingScreen(aliveSurvivors), 3500);
            }, 500);
        }
    }
}

// 패닉 상태 체크 및 처리
function checkPanicState() {
    gameState.survivors = gameState.survivors.map(s => {
        if (!s.isAlive) return s;
        
        const mentalPercent = (s.mental / s.maxMental) * 100;
        
        // 정신력 30% 이하면 패닉 상태
        if (mentalPercent <= 30 && !s.isPanic) {
            s.isPanic = true;
            s.currentAction = null; // 행동 준비 취소
            addLog(`${s.name}이(가) 패닉 상태에 빠졌다!`, 'panic');
        }
        // 정신력이 30% 초과로 회복되면 패닉 해제
        else if (mentalPercent > 30 && s.isPanic) {
            s.isPanic = false;
            addLog(`${s.name}이(가) 패닉 상태에서 벗어났다.`, 'heal');
        }
        
        return s;
    });
}

// 패닉 상태 효과 처리
function processPanicEffects() {
    gameState.survivors = gameState.survivors.map(s => {
        if (!s.isAlive || !s.isPanic) return s;
        
        const oldHp = s.hp;
        const oldMental = s.mental;
        
        let hpDamage = 5;

        // 민첩 8 이상: 체력 감소 시 5포인트 방어
        if (s.agility >= 8) {
            hpDamage = 0;
            addLog(`${s.name}의 높은 민첩으로 패닉 체력 피해 방어!`, 'event');
        }

        const newHp = Math.max(0, s.hp - hpDamage);
        const newMental = Math.min(s.maxMental, s.mental + 1);

        if (hpDamage > 0) {
            addLog(`${s.name}은(는) 패닉 상태로 체력이 감소하고 정신력이 회복되었다. (HP -${hpDamage}, 정신력 +1)`, 'panic');
        } else {
            addLog(`${s.name}은(는) 패닉 상태지만 체력 피해를 받지 않았다. - 정신력 +1`, 'panic');
        }
        
        // 체력이 0이 되면 즉시 사망 처리 및 로그 추가
        if (newHp === 0) {
            addLog(`${s.name}은(는) 절명했다.`, 'death');

             processDeathRelationships(s);
            return { ...s, hp: 0, mental: newMental, isAlive: false, isPanic: false };
        }
        
        return { ...s, hp: newHp, mental: newMental };
    });
    
    // 패닉으로 인한 사망 후 생존자 수 체크
    const aliveSurvivors = gameState.survivors.filter(s => s.isAlive);
    if (aliveSurvivors.length <= 2 && aliveSurvivors.length > 0) {
        gameState.isRunning = false;
        setTimeout(() => {
            addLog('생존자가 2명 이하가 되었다!', 'game-end');
            setTimeout(() => showEndingScreen(aliveSurvivors), 3500);
        }, 500);
    }
}

// 자유 행동 처리
function processFreeActions() {
    gameState.survivors = gameState.survivors.map(s => {
        // 사망했거나, 자유행동('free')이 아니거나, 패닉 상태면 처리 안함
        if (!s.isAlive || s.currentAction !== 'free' || s.isPanic) return s;
        
        const script = FREE_ACTION_SCRIPTS[Math.floor(Math.random() * FREE_ACTION_SCRIPTS.length)];
        const personalityType = getPersonalityType(s.personality);
        
        let hpChange = script.hp;
        let mentalChange = script.mental;
        let trustChange = script.trust;
        
        // [활동가형] 체력 하락 시 추가 하락, 신뢰도 상승 시 추가 상승
        if (personalityType === 'activist') {
            if (hpChange < 0) hpChange -= 10;
            if (trustChange > 0) trustChange += 2;
        }
        
        // [불안형] 정신력 하락 시 추가 하락, 신뢰도 하락 시 추가 하락, 체력 60% 이하일 때 자가회복
        if (personalityType === 'anxious') {
            if (mentalChange < 0) mentalChange -= 10;
            if (trustChange < 0) trustChange -= 2;
            if (s.hp <= s.maxHp * 0.6) {
                hpChange += 20;
                addLog(`${s.name}은(는) 스스로의 체력을 회복했다. (+20 HP)`, 'heal');
            }
        }
        
        // [안정형] 정신력 하락 시 감소량 완화
        if (personalityType === 'stable') {
            if (mentalChange < 0) mentalChange += 10;
        }
        
        // [자기중심형] 신뢰도 상승 시 감소, 하락 시 추가 하락
        if (personalityType === 'egocentric') {
            if (trustChange > 0) trustChange -= 2;
            if (trustChange < 0) trustChange -= 2;
        }

        // 직업 스킬 효과
        const jobSkill = JOB_SKILLS[s.job];

        // 주부: [알뜰살뜰]
        if (jobSkill && jobSkill.name === '알뜰살뜰' && script.trust > 0) {
            if (Math.random() < 0.3) {
                addLog(`${s.name}의 '알뜰살뜰' 발동! - 신뢰도 추가 상승`, 'event');
                trustChange += 5;
            }
        }

        // 랜덤 스킬 획득 이벤트
        function processSkillGainEvent(survivor) {
            if (Math.random() < 0.03) { // 3% 확률
                const script = SKILL_GAIN_SCRIPTS[Math.floor(Math.random() * SKILL_GAIN_SCRIPTS.length)];
                const availableSkills = getAvailableSpecialSkills(survivor);
                
                if (availableSkills.length > 0) {
                    const newSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
                    survivor.skills.push(newSkill.name);
                    addLog(`${survivor.name}은(는) ${script.message} +[${newSkill.name}] 스킬 획득`, 'reward');
                    return true;
                }
            }
            return false;
        }

        // 랜덤 스킬 상실 이벤트
        function processSkillLossEvent(survivor) {
            if (Math.random() < 0.02) { // 2% 확률
                // 직업 스킬을 제외한 스킬만 선택
                const loseableSkills = survivor.skills.filter(skill => {
                    // 직업 스킬은 상실 불가
                    if (isJobSkill(survivor, skill)) return false;
                    // 관에 갇혀있을 때 생존본능 스킬은 상실 불가
                    if (survivor.inCoffin && skill === '생존본능') return false;
                    return true;
                });
                
                if (loseableSkills.length > 0) {
                    const script = SKILL_LOSS_SCRIPTS[Math.floor(Math.random() * SKILL_LOSS_SCRIPTS.length)];
                    const lostSkill = loseableSkills[Math.floor(Math.random() * loseableSkills.length)];
                    survivor.skills = survivor.skills.filter(s => s !== lostSkill);
                    addLog(`${survivor.name}은(는) ${script.message} -[${lostSkill}] 스킬 상실`, 'penalty');
                    return true;
                }
            }
            return false;
        }
        
        const oldHp = s.hp;
        const oldMental = s.mental;
        const oldTrust = s.trust;
        
        const newHp = Math.max(0, Math.min(s.maxHp, s.hp + hpChange));
        const newMental = Math.max(0, Math.min(s.maxMental, s.mental + mentalChange));
        const newTrust = Math.max(0, Math.min(100, s.trust + trustChange));
        
        // 변동사항 문자열 생성
        const changes = [];
        if (newHp !== oldHp) {
            const diff = newHp - oldHp;
            changes.push(`HP ${diff > 0 ? '+' : ''}${diff}`);
        }
        if (newMental !== oldMental) {
            const diff = newMental - oldMental;
            changes.push(`정신력 ${diff > 0 ? '+' : ''}${diff}`);
        }
        if (newTrust !== oldTrust) {
            const diff = newTrust - oldTrust;
            changes.push(`신뢰도 ${diff > 0 ? '+' : ''}${diff}`);
        }
        
        const changeText = changes.length > 0 ? ` (${changes.join(', ')})` : '';
        addLog(`${s.name}이(가) ${script.message}${changeText}`, 'free-action');

        // 스킬 획득/상실 이벤트 체크
        processSkillGainEvent(s);
        processSkillLossEvent(s);
        
        // 체력이 0이 되면 사망 처리
        if (newHp === 0) {
            addLog(`${s.name}은(는) 절명했다.`, 'death');

             processDeathRelationships(s);
            return { ...s, hp: 0, mental: newMental, trust: newTrust, isAlive: false, currentAction: null };
        }
        
        return { ...s, hp: newHp, mental: newMental, trust: newTrust, currentAction: null };
    });

    updateDisplay();
}

function addDialogue(survivor, emotionType, probability) {
    if (!survivor || !survivor.isAlive) return;
    if (Math.random() > probability) return;
    
    // 턴별 대사 초기화
    if (!gameState.turnDialogues[gameState.turn]) {
        gameState.turnDialogues[gameState.turn] = {};
    }
    
    const turnData = gameState.turnDialogues[gameState.turn];
    
    // 해당 캐릭터가 이번 턴에 이미 2회 대사를 했는지 체크
    if (!turnData[survivor.id]) {
        turnData[survivor.id] = [];
    }
    
    if (turnData[survivor.id].length >= 2) return;
    
    // 같은 감정의 대사를 이미 했는지 체크
    if (turnData[survivor.id].includes(emotionType)) return;
    
    // 성격에 맞는 대사 찾기
    const dialogues = CHARACTER_DIALOGUES[emotionType];
    const matchingDialogue = dialogues.find(d => d.personality === survivor.personality);
    
    if (!matchingDialogue) return;
    
    // 대사 기록
    turnData[survivor.id].push(emotionType);
    
    // 이미지 HTML 생성
    const imageHTML = survivor.image && survivor.image !== 'data:,' && survivor.image !== ''
        ? `<img src="${survivor.image}" alt="${survivor.name}" style="width: 1.5em; height: 1.5em; border-radius: 50%; object-fit: cover; vertical-align: middle; margin-left: 0.5em; border: 1px solid var(--border-color);">`
        : `<span style="display: inline-flex; width: 1.5em; height: 1.5em; border-radius: 50%; background-color: ${getRandomColor(survivor.id)}; vertical-align: middle; margin-left: 0.5em; align-items: center; justify-content: center; font-size: 0.8em;">👤</span>`;
    
    // 대사 로그 추가
    addLog(` ${imageHTML} "${matchingDialogue.line}"`, 'dialogue');
}

// 턴 시작 시 대사 초기화
function initializeTurnDialogues() {
    // turnDialogues 객체가 없으면 생성
    if (!gameState.turnDialogues) {
        gameState.turnDialogues = {};
    }
    
    // 현재 턴의 대사 기록 초기화
    if (!gameState.turnDialogues[gameState.turn]) {
        gameState.turnDialogues[gameState.turn] = {};
    }
}

// 호감도에 따른 관계 파악
function getRelationshipStatus(favorability, baseRelation) {
    if (baseRelation && !RELATIONSHIPS[getRelationshipKey(baseRelation)]?.canLove) {
        return baseRelation;
    }
    
    if (favorability >= 800) return '부부';
    if (favorability >= 500) return '연인';
    if (favorability >= 150) return '친구';
    if (favorability >= 60) return '동료';
    if (favorability >= 30) return '서먹함';
    if (favorability >= 0) return '낯선 사람';
    if (favorability >= -10) return '어색함';
    if (favorability >= -80) return '라이벌';
    return '증오';
}

function getRelationshipKey(relationName) {
    return Object.keys(RELATIONSHIPS).find(key => RELATIONSHIPS[key].name === relationName);
}

// 사망 처리 시 관계 체크 함수
function processDeathRelationships(deadSurvivor) {
    const familyRelations = ['형제/자매', '부모/자식', '연인', '부부', '유사가족'];
    
    gameState.survivors.forEach(s => {
        if (!s.isAlive || s.id === deadSurvivor.id) return;
        
        const relation = s.relationshipTypes?.[deadSurvivor.id];
        if (relation && familyRelations.includes(relation)) {
            s.mental = Math.max(0, s.mental === 30);
            addLog(`${s.name}은(는) ${deadSurvivor.name}의 죽음에 큰 충격을 받았다. - 패닉 상태 돌입`, 'damage');
        }
    });
}

// 연회 중 더미즈 피해
if (gameState.subGameType === 'banquet') {
    gameState.survivors = gameState.survivors.map(s => {
        if (s.status === '더미즈' && s.inCoffin && s.isAlive) {
            const oldHp = s.hp;
            const oldMental = s.mental;
            
            let hpDamage = 10;
            let mentalDamage = 15;
            
            // 스탯 특성 적용
            if (s.agility >= 8) {
                hpDamage = Math.max(0, hpDamage - 5);
            }
            if (s.strength >= 8) {
                mentalDamage = Math.max(0, mentalDamage - 5);
            }
            
            s.hp = Math.max(0, s.hp - hpDamage);
            s.mental = Math.max(0, s.mental - mentalDamage);
            
            if (s.hp === 0 || s.mental === 0) {
                addLog(`${s.name}은(는) 관 속에서 절명했다.`, 'death');
                return { ...s, isAlive: false, inCoffin: false };
            } else {
                addLog(`${s.name}은(는) 관 속에서 체력 ${hpDamage}, 정신력 ${mentalDamage}를 잃었다.`, 'damage');
            }
        }
        return s;
    });
}

// 호감도 변화 처리
function processFavorabilityChanges() {
    const aliveSurvivors = gameState.survivors.filter(s => s.isAlive);
    if (aliveSurvivors.length < 2) return;

    if (gameState.subGameType === 'banquet') {
        gameState.survivors.forEach(dummy => {
            if (dummy.isAlive && dummy.status === '더미즈' && dummy.inCoffin) {
                gameState.survivors.forEach(human => {
                    if (human.isAlive && human.status === '인간' && human.id !== dummy.id) {
                        const oldFav = human.favorability[dummy.id] || 50;
                        const increase = Math.floor(Math.random() * 5) + 3; // 3~7 상승
                        human.favorability[dummy.id] = Math.min(1500, oldFav + increase);
                    }
                });
            }
        });
    }

    const changeCount = Math.floor(Math.random() * 3) + 2;
    
    for (let i = 0; i < changeCount; i++) {
        const person1 = aliveSurvivors[Math.floor(Math.random() * aliveSurvivors.length)];
        let person2 = aliveSurvivors[Math.floor(Math.random() * aliveSurvivors.length)];
        
        while (person2.id === person1.id && aliveSurvivors.length > 1) {
            person2 = aliveSurvivors[Math.floor(Math.random() * aliveSurvivors.length)];
        }
        
        if (person1.id === person2.id) continue;
        
        const currentFav = person1.favorability[person2.id] || 50;
        const currentRelation = person1.relationshipTypes?.[person2.id];
        const isAwkward = person1.awkwardWith?.[person2.id] > 0;
        const isBigFight = !isAwkward && currentFav >= 80 && Math.random() < 0.05;
        
        let script, change;
        
        if (isBigFight) {
            const bigFight = BIG_FIGHT_SCRIPTS[Math.floor(Math.random() * BIG_FIGHT_SCRIPTS.length)];
            script = bigFight.message;
            change = bigFight.change;
            
            const person1Type = getPersonalityType(person1.personality);
            const person2Type = getPersonalityType(person2.personality);
            const trustPenalty1 = person1Type === 'stable' ? 0 : -15;
            const trustPenalty2 = person2Type === 'stable' ? 0 : -15;
            
            gameState.survivors = gameState.survivors.map(s => {
                if (s.id === person1.id) {
                    return { 
                        ...s, 
                        awkwardWith: { ...s.awkwardWith, [person2.id]: 2 },
                        trust: Math.max(0, s.trust + trustPenalty1)
                    };
                }
                if (s.id === person2.id) {
                    return { 
                        ...s, 
                        awkwardWith: { ...s.awkwardWith, [person1.id]: 2 },
                        trust: Math.max(0, s.trust + trustPenalty2)
                    };
                }
                return s;
            });
            
            addLog(`${person1.name}와(과) ${person2.name}은(는) ${script} - 호감도 ${change} [어색함 2턴]`, 'favorability');
            
            // 큰 싸움 발생 시 분노 대사
            addDialogue(person1, 'anger', 0.8);
            addDialogue(person2, 'anger', 0.8);
            
        } else {
            const isPositive = Math.random() > 0.5;
            const scriptData = isPositive 
                ? FAVORABILITY_UP_SCRIPTS[Math.floor(Math.random() * FAVORABILITY_UP_SCRIPTS.length)]
                : FAVORABILITY_DOWN_SCRIPTS[Math.floor(Math.random() * FAVORABILITY_DOWN_SCRIPTS.length)];
            
            script = scriptData.message;
            change = scriptData.change;
            
            const person1Type = getPersonalityType(person1.personality);
            const person2Type = getPersonalityType(person2.personality);
            const person2Relation = person1.relationshipTypes?.[person2.id];
            
            if (change > 0) {
                if (person1Type === 'activist' && ['형제/자매', '부모/자식', '친구', '동료', '유사가족'].includes(person2Relation)) {
                    change = Math.round(change * 1.3);
                }
                if (person1Type === 'anxious' && person2Type === 'stable') {
                    change = Math.round(change * 1.3);
                }
                if (person1Type === 'stable' && person2Type === 'activist') {
                    change = Math.round(change * 1.2);
                }
                
                // 호감도 상승 시 행복 대사
                addDialogue(person1, 'happiness', 0.3);
            } else {
                // 호감도 하락 시 슬픔 대사
                addDialogue(person1, 'sorrow', 0.3);
            }
            
            addLog(`${person1.name}은(는) ${person2.name}${script} - 호감도 ${change > 0 ? '+' : ''}${change}`, 'favorability');
        }
        
        gameState.survivors = gameState.survivors.map(s => {
            if (s.id === person1.id) {
                const newFav = Math.max(0, currentFav + change);
                return { 
                    ...s, 
                    favorability: { ...s.favorability, [person2.id]: newFav }
                };
            }
            return s;
        });
    }
    
    gameState.survivors = gameState.survivors.map(s => {
        if (s.awkwardWith) {
            const newAwkward = {};
            Object.keys(s.awkwardWith).forEach(id => {
                const turns = s.awkwardWith[id] - 1;
                if (turns > 0) {
                    newAwkward[id] = turns;
                }
            });
            return { ...s, awkwardWith: newAwkward };
        }
        return s;
    });
}

// 자유 행동 배정
function assignFreeActions() {
    gameState.survivors = gameState.survivors.map(s => {
        // 사망했거나 패닉 상태면 행동 초기화
        if (!s.isAlive || s.isPanic) {
            return { ...s, currentAction: null };
        }
        
        return { ...s, currentAction: 'free' };
        
        return s;
    });
}

// 최초의 시련 처리 함수
function processInitialTrial() {
    const aliveSurvivors = gameState.survivors.filter(s => s.isAlive);
    const remainingSurvivors = aliveSurvivors.filter(s => !gameState.initialTrialPopupsShown[s.id]);
    
    if (gameState.isRunning) stopSimulation();

    const shuffledSurvivors = [...remainingSurvivors].sort(() => Math.random() - 0.5);

    // --- [최우선 단계] 친구 이상(호감도 150+) 관계 2인 매칭 ---
    // 섞인 순서에서 찾기 때문에 매번 다른 순서로 체크됨
    let specialPair = null;
    for (let i = 0; i < shuffledSurvivors.length; i++) {
        for (let j = i + 1; j < shuffledSurvivors.length; j++) {
            const s1 = shuffledSurvivors[i];
            const s2 = shuffledSurvivors[j];
            
            const f1 = s1.favorability[s2.id] || 0;
            const f2 = s2.favorability[s1.id] || 0;
            
            if (f1 >= 150 || f2 >= 150) { 
                specialPair = [s1, s2];
                break; 
            }
        }
        if (specialPair) break;
    }

    if (specialPair) {
        const char1 = specialPair[0];
        const char2 = specialPair[1];
        const trial = INITIAL_TRIAL_EVENTS.duo.find(e => e.id === 'oneKey');
        startDuoTrial(trial, char1, char2);
        return;
    }

    // --- [일반 단계] 친구 관계가 없을 때 ---
    const totalCount = aliveSurvivors.length;
    const completedCount = Object.keys(gameState.initialTrialPopupsShown).length;
    const isOverHalf = completedCount <= Math.ceil(totalCount / 5);

    if (!isOverHalf) {
        // 과반수 미만: 1인 시련 우선 (호감도 80 미만인 사람)
        const soloCandidate = shuffledSurvivors.find(survivor => {
            return !aliveSurvivors.some(other => 
                other.id !== survivor.id && (survivor.favorability[other.id] || 0) >= 60
            );
        });

        if (soloCandidate) {
            startSoloTrial(soloCandidate);
            return;
        }
    }

    // 과반수 이상이거나 1인 대상이 없으면 2인 시련
    if (shuffledSurvivors.length >= 2) {
        const char1 = shuffledSurvivors[0];
        const char2 = shuffledSurvivors[1];

        let trial = INITIAL_TRIAL_EVENTS.duo.find(e => e.condition && e.condition(char1, char2));

        if (!trial) {
            trial = INITIAL_TRIAL_EVENTS.duo.find(e => e.id === 'twoLegs');
        }

        startDuoTrial(trial, char1, char2);
    } else if (shuffledSurvivors.length === 1) {
        // 한 명만 남았으면 1인 시련
        startSoloTrial(shuffledSurvivors[0]);
    }
}

// 가독성을 위한 헬퍼 함수들
function startSoloTrial(survivor) {
    // 사용 가능한 이벤트 필터링 (이미 사용된 이벤트 제외)
    const availableEvents = INITIAL_TRIAL_EVENTS.solo.filter(event => 
        !gameState.usedTrialEvents.includes(event.id)
    );
    
    // 사용 가능한 이벤트가 없으면 전체에서 선택
    const eventPool = availableEvents.length > 0 ? availableEvents : INITIAL_TRIAL_EVENTS.solo;
    
    const trial = eventPool[Math.floor(Math.random() * eventPool.length)];
    
    // 카드 숨기기 이벤트(soloTrial1)는 사용 기록에 추가
    if (trial.id === 'soloTrial1') {
        gameState.usedTrialEvents.push(trial.id);
    }
    
    showSoloTrialPopup(trial, survivor);
    gameState.initialTrialPopupsShown[survivor.id] = true;
}

function startDuoTrial(trial, c1, c2) {
    showDuoTrialPopup(trial, c1, c2);
    gameState.initialTrialPopupsShown[c1.id] = true;
    gameState.initialTrialPopupsShown[c2.id] = true;
}

function stopSimulation() {
    gameState.isRunning = false;
    const btn = document.getElementById('toggleBtn');
    if (btn) {
        btn.innerHTML = '<i data-lucide="play"></i><span>시작</span>';
        lucide.createIcons();
    }
    if (gameState.timer) {
        clearTimeout(gameState.timer);
        gameState.timer = null;
    }
}

// 1인 시련 팝업
function showSoloTrialPopup(event, character) {
    const container = document.getElementById('popupContainer');
    
    // 이벤트 제목 매핑
    const eventTitles = {
        'soloTrial1': '최초의 시련 - 카드 숨기기',
        'soloTrial2': '최초의 시련 - 벽 너머의 스위치',
        'soloTrial3': '최초의 시련 - 러시안 룰렛',
        'soloTrial3': '최초의 시련 - 가시밭길'
    };
    
    const choicesHTML = event.choices.map((choice, index) => `
        <button 
            class="btn btn-green" 
            style="width: 100%; margin-bottom: 0.5rem; color: var(--text-primary);"
            onclick="selectSoloTrialChoice(${index}, ${character.id}, '${event.id}')">
            ${choice.text}
        </button>
    `).join('');
    
    container.innerHTML = `
        <div class="popup-overlay">
            <div class="popup" onclick="event.stopPropagation()">
                <div class="popup-header">
                    <h2 class="popup-title">${eventTitles[event.id] || '최초의 시련'}</h2>
                </div>
                <div class="popup-content">
                    <div class="form">
                        ${character.image && character.image !== 'data:,' && character.image !== '' 
                            ? `<img src="${character.image}" alt="${character.name}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; display: block; margin: 0 auto 1rem;">`
                            : `<div style="width: 100px; height: 100px; border-radius: 50%; background-color: ${getRandomColor(character.id)}; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                                <i data-lucide="user" size="48" color="white"></i>
                            </div>`
                        }
                        <p style="text-align: center; margin-bottom: 1.5rem; font-size: 1.1rem; line-height: 1.6; white-space: pre-line;">
                            ${event.getMessage(character)}
                        </p>
                        ${choicesHTML}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    lucide.createIcons();
}

// 2인 시련 팝업
function showDuoTrialPopup(event, char1, char2) {
    const container = document.getElementById('popupContainer');
    
    // 이벤트 제목 매핑
    const eventTitles = {
        'oneKey': '최초의 시련 - 하나의 열쇠',
        'twoLegs': '최초의 시련 - 2인 1각'
    };
    
    const choicesHTML = event.choices.map((choice, index) => `
        <button 
            class="btn btn-green" 
            style="width: 100%; margin-bottom: 0.5rem; color: var(--text-primary);"
            onclick="selectDuoTrialChoice(${index}, ${char1.id}, ${char2.id}, '${event.id}')">
            ${choice.getText(char1, char2)}
        </button>
    `).join('');
    
    container.innerHTML = `
        <div class="popup-overlay">
            <div class="popup" onclick="event.stopPropagation()">
                <div class="popup-header">
                    <h2 class="popup-title">${eventTitles[event.id] || '최초의 시련'}</h2>
                </div>
                <div class="popup-content">
                    <div class="form">
                        <div style="display: flex; justify-content: center; gap: 2rem; margin-bottom: 1rem;">
                            <div style="text-align: center;">
                                ${char1.image && char1.image !== 'data:,' && char1.image !== '' 
                                    ? `<img src="${char1.image}" alt="${char1.name}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;">`
                                    : `<div style="width: 80px; height: 80px; border-radius: 50%; background-color: ${getRandomColor(char1.id)}; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                                        <i data-lucide="user" size="40" color="white"></i>
                                    </div>`
                                }
                                <div style="margin-top: 0.5rem; font-weight: bold;">${char1.name}</div>
                            </div>
                            <div style="text-align: center;">
                                ${char2.image && char2.image !== 'data:,' && char2.image !== '' 
                                    ? `<img src="${char2.image}" alt="${char2.name}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;">`
                                    : `<div style="width: 80px; height: 80px; border-radius: 50%; background-color: ${getRandomColor(char2.id)}; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                                        <i data-lucide="user" size="40" color="white"></i>
                                    </div>`
                                }
                                <div style="margin-top: 0.5rem; font-weight: bold;">${char2.name}</div>
                            </div>
                        </div>
                        <p style="text-align: center; margin-bottom: 1.5rem; font-size: 1.1rem; line-height: 1.6; white-space: pre-line;">
                            ${event.getMessage(char1, char2)}
                        </p>
                        ${choicesHTML}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    lucide.createIcons();
}

// 1인 시련 선택 처리
function selectSoloTrialChoice(choiceIndex, characterId, eventId) {
    const event = INITIAL_TRIAL_EVENTS.solo.find(e => e.id === eventId);
    const character = gameState.survivors.find(s => s.id === characterId);
    
    if (!event || !character) return;
    
    const choice = event.choices[choiceIndex];
    
    gameState.survivors = gameState.survivors.map(s => 
        s.id === characterId ? character : s
    );
    
    choice.effect(character);
    
    document.getElementById('popupContainer').innerHTML = '';
    updateDisplay();
    
    // 생존자 체크
    const aliveSurvivors = gameState.survivors.filter(s => s.isAlive);
    if (aliveSurvivors.length <= 2 && aliveSurvivors.length > 0) {
        gameState.isRunning = false;
        setTimeout(() => {
            addLog('생존자가 2명 이하가 되었다.', 'game-end');
            setTimeout(() => showEndingScreen(aliveSurvivors), 3500);
        }, 500);
        return;
    }
    
    // 다음 생존자 시련 진행
    const nextRemaining = gameState.survivors.filter(s => s.isAlive && !gameState.initialTrialPopupsShown[s.id]);
    if (nextRemaining.length > 0) {
        setTimeout(processInitialTrial, 1500); // 1초 뒤 다음 사람 시작
    }
}

// 2인 시련 선택 처리
function selectDuoTrialChoice(choiceIndex, char1Id, char2Id, eventId) {
    const event = INITIAL_TRIAL_EVENTS.duo.find(e => e.id === eventId);
    const char1 = gameState.survivors.find(s => s.id === char1Id);
    const char2 = gameState.survivors.find(s => s.id === char2Id);
    
    if (!event || !char1 || !char2) return;
    
    const choice = event.choices[choiceIndex];
    
    gameState.survivors = gameState.survivors.map(s => {
        if (s.id === char1Id) return char1;
        if (s.id === char2Id) return char2;
        return s;
    });
    
    choice.effect(char1, char2, choiceIndex);
    
    document.getElementById('popupContainer').innerHTML = '';
    updateDisplay();
    
    // 생존자 체크
    const aliveSurvivors = gameState.survivors.filter(s => s.isAlive);
    if (aliveSurvivors.length <= 2 && aliveSurvivors.length > 0) {
        gameState.isRunning = false;
        setTimeout(() => {
            addLog('생존자가 2명 이하가 되었다.', 'game-end');
            setTimeout(() => showEndingScreen(aliveSurvivors), 3500);
        }, 500);
        return;
    }
    
    // 다음 생존자 시련 진행
    const nextRemaining = gameState.survivors.filter(s => s.isAlive && !gameState.initialTrialPopupsShown[s.id]);
    if (nextRemaining.length > 0) {
        setTimeout(processInitialTrial, 1500); // 1초 뒤 다음 사람 시작
    }
}



// 서브게임 시작
function startSubGame() {
    const games = ['trust', 'body', 'banquet'];
    const selectedGame = games[Math.floor(Math.random() * games.length)];
    gameState.subGameType = selectedGame;
    gameState.gamePhase = 'sub';

    gameState.survivors = gameState.survivors.map(s => ({ ...s, tokens: 0 }));

    const gameNames = { trust: '신뢰매매게임', body: '신체보물찾기', banquet: '연회' };

    if (selectedGame === 'banquet') {
        gameState.survivors = gameState.survivors.map(s => {
            if (s.isAlive && s.status === '더미즈') {
                if (!s.skills.includes('생존본능')) {
                    s.skills.push('생존본능');
                }
                return {
                    ...s,
                    inCoffin: true,
                    maxHp: s.maxHp + 100,
                    maxMental: s.maxMental + 100,
                    hp: s.hp + 100,
                    mental: s.mental + 100
                };
            }
            return s;
        });
        
        addLog('더미즈는 관에 갇혔다.', 'event');
        gameState.survivors.filter(s => s.status === '더미즈').forEach(s => {
            addLog(`${s.name}이(가) 생존본능 스킬을 획득했다! (체력/정신력 최대치 +100)`, 'reward');
        });
    }
    
    addLog(`=== 턴 ${gameState.turn}: ${gameNames[selectedGame]} 시작 ===`, 'phase');
    
    // 게임 설명 추가
    if (selectedGame === 'trust') {
        addLog('【신뢰매매게임 규칙】 행동 시마다 토큰을 획득/분실한다. 게임 종료 시 토큰이 가장 낮은 자는 체력과 정신력을 크게 잃고, 가장 높은 자는 스탯이나 스킬을 얻는다.', 'event');
    } else if (selectedGame === 'body') {
        addLog('【신체보물찾기 규칙】 행동 시마다 인형의 신체 부위(팔2, 다리2, 머리, 몸통)를 찾는다. 가장 먼저 완성한 자는 체력을 잃거나 스탯/스킬을 얻는다.', 'event');
    } else if (selectedGame === 'banquet') {
        addLog('【연회 규칙】 더미즈는 관에 갇히며 치료/휴식이 불가능해진다. 게임 종료 시 신뢰도가 가장 낮은 더미즈는 사망한다.', 'event');
    }
    
    gameState.subGameTurn = 2;
}

// 대화하기 행동 처리
function processTalkAction(survivor) {
    const others = gameState.survivors.filter(s => s.isAlive && s.id !== survivor.id);
    
    if (others.length === 0) {
        addLog(`${survivor.name}은(는) 대화할 상대가 없다.`, 'fail');
        return;
    }
    
    // 랜덤한 상대 선택
    const target = others[Math.floor(Math.random() * others.length)];
    
    // 호감도 변화량: -80 ~ +120
    const favorabilityChange = Math.floor(Math.random() * 251) - 100;
    
    // 성격 타입에 따른 보정
    const survivorType = getPersonalityType(survivor.personality);
    const targetType = getPersonalityType(target.personality);
    
    let finalChange = favorabilityChange;
    
    // 활동가형 + 안정형 조합: 긍정적 변화 증폭
    if (survivorType === 'activist' && targetType === 'stable' && favorabilityChange > 0) {
        finalChange = Math.floor(favorabilityChange * 1.3);
    }
    
    // 불안형 + 자기중심형 조합: 부정적 변화 증폭
    if (survivorType === 'anxious' && targetType === 'egocentric' && favorabilityChange < 0) {
        finalChange = Math.floor(favorabilityChange * 1.3);
    }
    
    // 호감도 적용
    const oldFav = survivor.favorability[target.id] || 50;
    const newFav = Math.max(-200, Math.min(1500, oldFav + finalChange));
    survivor.favorability[target.id] = newFav;
    
    // 상대방도 영향 받음 (절반 정도)
    const targetOldFav = target.favorability[survivor.id] || 50;
    const targetChange = Math.floor(finalChange * 0.5);
    target.favorability[survivor.id] = Math.max(-200, Math.min(1500, targetOldFav + targetChange));
    
    // 대화 결과에 따른 메시지
    let resultMessage = '';
    if (finalChange >= 80) {
        resultMessage = '매우 유쾌한 대화를 나눴다!';
        addDialogue(survivor, 'happiness', 0.7);
        addDialogue(target, 'happiness', 0.5);
    } else if (finalChange >= 40) {
        resultMessage = '좋은 대화를 나눴다.';
        addDialogue(survivor, 'happiness', 0.4);
    } else if (finalChange >= 0) {
        resultMessage = '평범한 대화를 나눴다.';
    } else if (finalChange >= -40) {
        resultMessage = '어색한 대화를 나눴다.';
        addDialogue(survivor, 'sorrow', 0.3);
    } else {
        resultMessage = '심하게 언쟁을 벌였다!';
        addDialogue(survivor, 'anger', 0.7);
        addDialogue(target, 'anger', 0.5);
    }
    
    addLog(`${survivor.name}이(가) ${target.name}와(과) 대화했다. ${resultMessage} - 호감도 ${finalChange > 0 ? '+' : ''}${finalChange}`, 'action');
    
    // 바텐더 스킬: 취중 진담
    const jobSkill = JOB_SKILLS[survivor.job];
    if (jobSkill && jobSkill.name === '취중 진담' && survivor.currentAction === 'rest') {
        addLog(`${survivor.name}의 '취중 진담' 발동! 대화 효과 2배`, 'event');
    }
}

// 서브게임 처리
function processSubGame() {
    gameState.survivors = gameState.survivors.map(s => {
        if (!s.isAlive || !s.currentAction || s.currentAction === 'free') return s;
        if (s.inCoffin && (s.currentAction === 'rest' || s.currentAction === 'heal')) {
            addLog(`${s.name}은(는) 관에 갇혀 ${s.currentAction === 'rest' ? '휴식' : '치료'}할 수 없다.`, 'fail');
            return s;
        }

        const updated = { ...s };
        const oldHp = s.hp;
        const oldMental = s.mental;
        const oldTrust = s.trust;
        const oldTokens = s.tokens;
        
        switch (s.currentAction) {
            case 'explore':
                updated.trust += Math.floor(Math.random() * 10) - 2;
                updated.mental = Math.max(0, updated.mental - Math.floor(Math.random() * 10));
                processSubGameAction(updated, 1);
                break;
            case 'active':
                updated.trust += Math.floor(Math.random() * 15) - 5;
                processSubGameAction(updated, 2);
                break;
            case 'rest':
                updated.mental = Math.min(updated.maxMental, updated.mental + 20 + Math.floor(Math.random() * 15));
                // 메이드 스킬: 완벽한 시중
                const restJobSkill = JOB_SKILLS[s.job];
                if (restJobSkill && restJobSkill.name === '완벽한 시중') {
                    const allies = gameState.survivors.filter(target => 
                        target.isAlive && 
                        target.id !== s.id && 
                        (s.favorability[target.id] || 0) >= 80
                    );
                    
                    if (allies.length > 0) {
                        const randomAlly = allies[Math.floor(Math.random() * allies.length)];
                        randomAlly.mental = Math.min(randomAlly.maxMental, randomAlly.mental + 5);
                        addLog(`${s.name}의 '완벽한 시중' 발동! ${randomAlly.name}의 정신력 +5`, 'event');
                    } else {
                        updated.mental = Math.min(updated.maxMental, updated.mental + 5);
                        addLog(`${s.name}의 '완벽한 시중' 발동! (자신 정신력 +5)`, 'event');
                    }
                }
                break;
            case 'heal':
                updated.hp = Math.min(updated.maxHp, updated.hp + 25 + Math.floor(Math.random() * 20));
                break;
            case 'talk':
                // 대화하기 행동 처리
                processTalkAction(updated);
                break;
            case 'alliance':
                const aliveCandidates = gameState.survivors.filter(t => t.isAlive && t.id !== s.id);
                if (aliveCandidates.length > 0) {
                    const target = aliveCandidates[Math.floor(Math.random() * aliveCandidates.length)];
                    
                    // 신뢰도 기반 수락 확률 계산
                    const targetFavorability = target.favorability[s.id] || 0;
                    const baseAcceptChance = Math.max(0, (targetFavorability + 200) / 1000);
                    const trustBonus = s.trust / 500;
                    const finalAcceptChance = Math.min(0.95, baseAcceptChance + trustBonus);
                    
                    // 성격별 보정
                    const targetPersonalityType = getPersonalityType(target.personality);
                    let acceptModifier = 1.0;
                    if (targetPersonalityType === 'stable') acceptModifier = 1.2;
                    if (targetPersonalityType === 'egocentric') acceptModifier = 0.7;
                    if (targetPersonalityType === 'anxious' && targetFavorability >= 80) acceptModifier = 1.3;
                    
                    const adjustedChance = Math.min(0.98, finalAcceptChance * acceptModifier);
                    
                    if (Math.random() < adjustedChance) {
                        // 수락
                        const currentFav = updated.favorability[target.id] || 50;
                        const targetCurrentFav = target.favorability[s.id] || 50;
                        
                        updated.favorability[target.id] = Math.min(1500, Math.min(currentFav + 20, currentFav + 25));
                        target.favorability[s.id] = Math.min(1500, Math.min(targetCurrentFav + 20, targetCurrentFav + 25));
                        
                        if (!updated.allianceWith) updated.allianceWith = [];
                        if (!target.allianceWith) target.allianceWith = [];
                        
                        if (!updated.allianceWith.includes(target.id)) {
                            updated.allianceWith.push(target.id);
                        }
                        if (!target.allianceWith.includes(s.id)) {
                            target.allianceWith.push(s.id);
                        }
                        
                        const trustIncrease = Math.min(20, 8);
                        const targetTrustIncrease = Math.min(20, 5);
                        
                        updated.trust = Math.min(100, updated.trust + trustIncrease);
                        target.trust = Math.min(100, target.trust + targetTrustIncrease);
                        
                        addLog(`${s.name}의 동맹 제의를 ${target.name}이(가) 수락했다. - 호감도 +20, 신뢰도 +8`, 'alliance');
                    } else {
                        // 거절
                        const currentFav = updated.favorability[target.id] || 50;
                        const targetCurrentFav = target.favorability[s.id] || 50;
                        
                        updated.favorability[target.id] = Math.max(-200, Math.max(currentFav - 20, currentFav - 10));
                        target.favorability[s.id] = Math.max(-200, Math.max(targetCurrentFav - 20, targetCurrentFav - 5));
                        
                        const trustDecrease = Math.min(20, 5);
                        const mentalDecrease = Math.min(20, 10);
                        
                        updated.trust = Math.max(0, updated.trust - trustDecrease);
                        updated.mental = Math.max(0, updated.mental - mentalDecrease);
                        
                        addLog(`${s.name}의 동맹 제의를 ${target.name}이(가) 거절했다. - 호감도 -10, 신뢰도 -5, 정신력 -10`, 'alliance');
                    }
                } else {
                    addLog(`${s.name}은(는) 이미 모두와 동맹상태다.`, 'fail');
                }
                break;
        }
        const jobSkill = JOB_SKILLS[s.job];
        if (jobSkill && jobSkill.name === '초과 근무' && updated.mental >= 10) {
            updated.mental -= 5;
            addLog(`${s.name}의 '초과 근무' 발동! - 정신력 -5, 추가 행동`, 'event');
        }

        updated.trust = Math.max(0, Math.min(100, updated.trust));
        
        // 변동사항 문자열 생성
        const changes = [];
        if (updated.hp !== oldHp) {
            const diff = updated.hp - oldHp;
            changes.push(`HP ${diff > 0 ? '+' : ''}${diff}`);
        }
        if (updated.mental !== oldMental) {
            const diff = updated.mental - oldMental;
            changes.push(`정신력 ${diff > 0 ? '+' : ''}${diff}`);
        }
        if (updated.trust !== oldTrust) {
            const diff = updated.trust - oldTrust;
            changes.push(`신뢰도 ${diff > 0 ? '+' : ''}${diff}`);
        }
        if (updated.tokens !== oldTokens) {
            const diff = updated.tokens - oldTokens;
            changes.push(`코인 ${diff > 0 ? '+' : ''}${diff}`);
        }
        
        const actionNames = {
            explore: '정보를 탐색했다',
            active: '적극적으로 행동했다',
            rest: '휴식을 취했다',
            heal: '치료를 받았다'
        };
        
        if (s.currentAction !== 'alliance' && actionNames[s.currentAction]) {
            const changeText = changes.length > 0 ? ` (${changes.join(', ')})` : '';
            addLog(`${s.name}이(가) ${actionNames[s.currentAction]}.${changeText}`, 'action');
        }

        return updated;
    });

    updateDisplay();

    // 연회 5턴 이후 탈출 시도
    if (gameState.subGameType === 'banquet' && gameState.subGameTurn >= 5) {
        gameState.survivors = gameState.survivors.map(s => {
            if (s.status === '더미즈' && s.inCoffin && s.isAlive) {
                const humans = gameState.survivors.filter(h => h.isAlive && h.status === '인간');
                if (humans.length === 0) return s;
                
                let totalTrust = 0;
                humans.forEach(h => {
                    if (h.favorability && h.favorability[s.id] !== undefined) {
                        totalTrust += h.favorability[s.id];
                    } else {
                        totalTrust += 0; // 기본값
                    }
                });
                const avgTrust = totalTrust / humans.length;
                
                const escapeChance = avgTrust / 200;
                
                const jobSkill = JOB_SKILLS[s.job];
                const finalEscapeChance = jobSkill && jobSkill.name === '탈옥 본능' 
                    ? escapeChance * 1.2 
                    : escapeChance;
                
                if (Math.random() < finalEscapeChance) {
                    s.inCoffin = false;
                    s.skills = s.skills.filter(skill => skill !== '생존본능');
                    s.maxHp -= 100;
                    s.maxMental -= 100;
                    s.hp = Math.min(s.hp, s.maxHp);
                    s.mental = Math.min(s.mental, s.maxMental);
                    
                    addLog(`${s.name}이(가) 관에서 탈출했다!`, 'escape');
                    
                    if (jobSkill && jobSkill.name === '탈옥 본능') {
                        addLog(`${s.name}의 '탈옥 본능' 발동!`, 'event');
                    }
                }
            }
            return s;
        });
    }
 
    gameState.subGameTurn++;

    if (gameState.subGameTurn >= 11) {
        endSubGame();
        addLog(`=== 서브게임 종료 ===`, 'phase');
        gameState.subGameType = null;
        gameState.subGameTurn = 0;

    } else {
        addLog(`=== 턴 ${gameState.turn}: 서브게임 진행 중 ===`, 'phase');
    }
}

// 서브게임 액션 처리
function processSubGameAction(survivor, actionLevel) {
    const jobSkill = JOB_SKILLS[survivor.job];
    
    switch (gameState.subGameType) {
        case 'trust':
            let tokenChange = Math.floor(Math.random() * 10 * actionLevel) - 3;
            
            // 연구원 스킬: 논리 회로
            if (jobSkill && jobSkill.name === '논리 회로') {
                tokenChange += survivor.intelligence;
                addLog(`${survivor.name}의 '논리 회로' 발동! (토큰 +${survivor.intelligence})`, 'event');
            }
            
            // 대학원생 스킬: 오차 분석
            if (jobSkill && jobSkill.name === '오차 분석' && tokenChange < 0) {
                const reduction = Math.floor(Math.abs(tokenChange) * 0.5 * (survivor.intelligence / 10));
                tokenChange += reduction;
                addLog(`${survivor.name}의 '오차 분석' 발동! (토큰 하락폭 감소)`, 'event');
            }
            
            // 도박꾼 스킬: 올 인
            if (jobSkill && jobSkill.name === '올 인' && tokenChange !== 0) {
                if (Math.random() < 0.5) {
                    tokenChange *= 2;
                    addLog(`${survivor.name}의 '올 인' 발동! (토큰 변동 2배)`, 'event');
                } else {
                    tokenChange = 0;
                    addLog(`${survivor.name}의 '올 인' 실패! (토큰 변동 없음)`, 'event');
                }
            }
            
            // 암살자 스킬: 급소 타격 (토큰 1위 확률 상승)
            if (jobSkill && jobSkill.name === '급소 타격') {
                tokenChange += 5;
            }
            
            // 아르바이트 스킬: 추가 수당
            if (jobSkill && jobSkill.name === '추가 수당' && (survivor.currentAction === 'explore' || survivor.currentAction === 'active')) {
                tokenChange += 3;
                addLog(`${survivor.name}의 '추가 수당' 발동! (토큰 +3)`, 'event');
            }

            // 일용직 근로자 스킬: 고된 노동
            if (jobSkill && jobSkill.name === '고된 노동') {
                tokenChange += 2;
                survivor.hp = Math.max(0, survivor.hp - 5);
                addLog(`${survivor.name}의 '고된 노동' 발동! (체력 -5, 토큰 +2)`, 'event');
            }
            
            survivor.tokens += tokenChange;
            
            // 초등학생 스킬: 순수한 양보
            if (jobSkill && jobSkill.name === '순수한 양보' && tokenChange < 0) {
                gameState.survivors = gameState.survivors.map(s => {
                    if (s.id !== survivor.id && s.isAlive) {
                        Object.keys(s.favorability).forEach(key => {
                            if (key == survivor.id) {
                                s.favorability[key] = Math.min(1500, s.favorability[key] + 2);
                            }
                        });
                    }
                    return s;
                });
                addLog(`${survivor.name}의 '순수한 양보' 발동! (전원의 호감도 +2)`, 'event');
            }
            break;
            
        case 'body':
            const parts = ['leftArm', 'rightArm', 'leftLeg', 'rightLeg', 'head', 'torso'];
            let randomPart = parts[Math.floor(Math.random() * parts.length)];
            
            // 힘 스탯이 높으면 추가 발견 확률
            if (survivor.strength >= 7) {
                const bonusChance = (survivor.strength - 6) * 0.08; // 힘 7: 8%, 8: 16%, 9: 24%, 10: 32%
                if (Math.random() < bonusChance) {
                    const bonusPart = parts[Math.floor(Math.random() * parts.length)];
                    survivor.bodyParts[bonusPart] = true;
                    addLog(`${survivor.name}의 높은 힘으로 신체 추가 발견!`, 'event');
                }
            }

            // 도굴꾼: [부품 끼워맞추기]
            if (jobSkill && jobSkill.name === '부품 끼워맞추기') {
                const parts = Object.values(survivor.bodyParts).filter(v => v).length;
                if (parts === 5) { // 5개면 6개로 간주
                    addLog(`${survivor.name}의 '부품 끼워맞추기' 발동! (5개로 완성 인정)`, 'event');
                }
            }

            // 환경미화원: [자원 재활용] - UI에서 별도 버튼 필요 (여기서는 자동 처리)
            if (jobSkill && jobSkill.name === '자원 재활용') {
                const duplicates = [];
                parts.forEach(part => {
                    if (survivor.bodyParts[part]) {
                        duplicates.push(part);
                    }
                });
                if (duplicates.length >= 2 && Math.random() < 0.1) {
                    duplicates.slice(0, 2).forEach(part => {
                        survivor.bodyParts[part] = false;
                    });
                    survivor.tokens = (survivor.tokens || 0) + 3;
                    addLog(`${survivor.name}의 '자원 재활용' 발동! (중복 부위 → 토큰 3개)`, 'event');
                }
            }
                        
            // 정비공 스킬: 장치 분석 (발견 확률 상승)
            if (jobSkill && jobSkill.name === '장치 분석') {
                const bonusChance = survivor.agility * 0.05;
                if (Math.random() < bonusChance) {
                    randomPart = parts[Math.floor(Math.random() * parts.length)];
                }
            }
            
            // 화가 스킬: 정밀 묘사 (미보유 부위 확률 상승)
            if (jobSkill && jobSkill.name === '정밀 묘사') {
                const unownedParts = parts.filter(p => !survivor.bodyParts[p]);
                if (unownedParts.length > 0 && Math.random() < (survivor.intelligence * 0.08)) {
                    randomPart = unownedParts[Math.floor(Math.random() * unownedParts.length)];
                }
            }
            
            // 대학생 스킬: 벼락치기 (종료 2턴 전부터 발견 확률 2배)
            if (jobSkill && jobSkill.name === '벼락치기' && gameState.turn >= 10) {
                if (Math.random() < 0.5) {
                    const secondPart = parts[Math.floor(Math.random() * parts.length)];
                    survivor.bodyParts[secondPart] = true;
                    addLog(`${survivor.name}의 '벼락치기' 발동! (신체 추가 발견)`, 'event');
                }
            }
            
            survivor.bodyParts[randomPart] = true;
            
            // 중학생 스킬: 예민한 감각
            if (jobSkill && jobSkill.name === '예민한 감각') {
                const bonusChance = survivor.agility * 0.06;
                if (Math.random() < bonusChance) {
                    const bonusPart = parts[Math.floor(Math.random() * parts.length)];
                    survivor.bodyParts[bonusPart] = true;
                    addLog(`${survivor.name}의 '예민한 감각' 발동! (신체 추가 발견)`, 'event');
                }
            }
            
            // 무당 스킬: 영적 강림
            if (jobSkill && jobSkill.name === '영적 강림' && Math.random() < 0.15) {
                if (!survivor.skills.includes('생존본능(1턴)')) {
                    survivor.skills.push('생존본능(1턴)');
                    addLog(`${survivor.name}의 '영적 강림' 발동! (생존본능 1턴 획득)`, 'event');
                }
            }
            break;
    }
}

function endSubGame() {
    if (gameState.subGameType === 'trust') {
        const aliveSurvivors = gameState.survivors.filter(s => s.isAlive);
        if (aliveSurvivors.length === 0) return;
        
        const lowest = aliveSurvivors.reduce((min, s) => s.tokens < min.tokens ? s : min);
        const highest = aliveSurvivors.reduce((max, s) => s.tokens > max.tokens ? s : max);

        // 변호사: [공정 거래]
        const lowestJobSkill = JOB_SKILLS[lowest.job];
        let damageReduction = 0;
        if (lowestJobSkill && lowestJobSkill.name === '공정 거래') {
            damageReduction = 0.3;
            addLog(`${lowest.name}의 '공정 거래' 발동! (데미지 30% 감소)`, 'event');
        }

        const damagePercent = 0.1 + Math.random() * 0.6;
        let hpDamage = Math.floor(lowest.maxHp * damagePercent * (1 - damageReduction));
        let mentalDamage = Math.floor(lowest.maxMental * damagePercent * (1 - damageReduction));
        
        // 스탯 특성 적용
        if (lowest.agility >= 8) {
            hpDamage = Math.max(0, hpDamage - 5);
            addLog(`${lowest.name}의 높은 민첩으로 체력 피해 5 감소!`, 'event');
        }
        if (lowest.strength >= 8) {
            mentalDamage = Math.max(0, mentalDamage - 5);
            addLog(`${lowest.name}의 높은 힘으로 정신력 피해 5 감소!`, 'event');
        }
        
        lowest.hp = Math.max(0, lowest.hp - hpDamage);
        lowest.mental = Math.max(0, lowest.mental - mentalDamage);
        addLog(`${lowest.name}이(가) 토큰 보유 수 최하위 패널티로 체력 ${hpDamage}, 정신력 ${mentalDamage}의 피해를 입었다.`, 'death');

        // 최상위 보상
        const rewardType = Math.random();
        let statGained = false;
        let skillGained = false;
        
        if (rewardType < 0.4) {
            // 스탯만
            const stats = ['strength', 'agility', 'intelligence', 'charisma', 'charm'];
            const stat = stats[Math.floor(Math.random() * stats.length)];
            if (highest[stat] < 10) {
                highest[stat]++;
                statGained = true;
                addLog(`${highest.name}이(가) 토큰 보유 수 최상위 보상으로 ${stat} 스탯을 획득했다.`, 'reward');
            }
        } else if (rewardType < 0.8) {
            // 스킬만
            const availableSkills = getAvailableSpecialSkills(highest);
            if (availableSkills.length > 0) {
                const newSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
                highest.skills.push(newSkill.name);
                skillGained = true;
                addLog(`${highest.name}이(가) 토큰 보유 수 최상위 보상으로 [${newSkill.name}] 스킬을 획득했다.`, 'reward');
            }
        } else {
            // 둘 다
            const stats = ['strength', 'agility', 'intelligence', 'charisma', 'charm'];
            const stat = stats[Math.floor(Math.random() * stats.length)];
            if (highest[stat] < 10) {
                highest[stat]++;
                statGained = true;
            }
            
            const availableSkills = getAvailableSpecialSkills(highest);
            if (availableSkills.length > 0) {
                const newSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
                highest.skills.push(newSkill.name);
                skillGained = true;
            }
            
            if (statGained || skillGained) {
                addLog(`${highest.name}이(가) 토큰 보유 수 최상위 보상으로 스탯과 스킬을 모두 획득했다.`, 'reward');
            }
        }
        
        // 암살자: [급소 타격]
        const highestJobSkill = JOB_SKILLS[highest.job];
        if (highestJobSkill && highestJobSkill.name === '급소 타격' && !skillGained) {
            const newSkill = '급소타격(임시)';
            if (!highest.skills.includes(newSkill)) {
                highest.skills.push(newSkill);
                addLog(`${highest.name}의 '급소 타격' 발동! 스킬 획득`, 'reward');
            }
        }
        
        // 고등학생: [학습 효과]
        if (highestJobSkill && highestJobSkill.name === '학습 효과' && statGained) {
            const stats = ['strength', 'agility', 'intelligence', 'charisma', 'charm'];
            const stat = stats[Math.floor(Math.random() * stats.length)];
            if (highest[stat] < 10) {
                highest[stat]++;
                addLog(`${highest.name}의 '학습 효과' 발동! (추가 스탯 +1)`, 'reward');
            }
        }
        
        // 지능 8 이상: 아이템(스킬) 추가 획득
        if (highest.intelligence >= 8 && skillGained) {
            const bonusSkill = '지능축복(임시)';
            if (!highest.skills.includes(bonusSkill)) {
                highest.skills.push(bonusSkill);
                highest.mental = Math.min(highest.maxMental, highest.mental + 2);
                addLog(`${highest.name}의 높은 지능으로 추가 스킬을 획득했다. - 정신력 +2`, 'reward');
            }
        }
        
    } else if (gameState.subGameType === 'body') {
        const aliveSurvivors = gameState.survivors.filter(s => s.isAlive);
        let completedSurvivor = null;
        
        for (const s of aliveSurvivors) {
            const parts = Object.values(s.bodyParts);
            if (parts.every(p => p)) {
                completedSurvivor = s;
                break;
            }
        }
        
        if (completedSurvivor) {
            const isReward = Math.random() < 0.5;
            
            if (isReward) {
                const rewardType = Math.random();
                let statGained = false;
                let skillGained = false;
                
                if (rewardType < 0.4) {
                    const stats = ['strength', 'agility', 'intelligence', 'charisma', 'charm'];
                    const stat = stats[Math.floor(Math.random() * stats.length)];
                    if (completedSurvivor[stat] < 10) {
                        completedSurvivor[stat]++;
                        statGained = true;
                        addLog(`${completedSurvivor.name}이(가) 인형을 완성하여 ${stat} 스탯을 획득했다.`, 'reward');
                    }
                } else if (rewardType < 0.8) {
                    const availableSkills = getAvailableSpecialSkills(completedSurvivor);
                    if (availableSkills.length > 0) {
                        const newSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
                        completedSurvivor.skills.push(newSkill.name);
                        skillGained = true;
                        addLog(`${completedSurvivor.name}이(가) 인형을 완성하여 [${newSkill.name}] 스킬을 획득했다.`, 'reward');
                    }
                } else {
                    const stats = ['strength', 'agility', 'intelligence', 'charisma', 'charm'];
                    const stat = stats[Math.floor(Math.random() * stats.length)];
                    if (completedSurvivor[stat] < 10) {
                        completedSurvivor[stat]++;
                        statGained = true;
                    }
                    
                    const availableSkills = getAvailableSpecialSkills(completedSurvivor);
                    if (availableSkills.length > 0) {
                        const newSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
                        completedSurvivor.skills.push(newSkill.name);
                        skillGained = true;
                    }
                    
                    if (statGained || skillGained) {
                        addLog(`${completedSurvivor.name}이(가) 인형을 완성하여 스탯과 스킬을 모두 획득했다.`, 'reward');
                    }
                }
                
                // 의사: [정밀 집도]
                const jobSkill = JOB_SKILLS[completedSurvivor.job];
                if (jobSkill && jobSkill.name === '정밀 집도' && (!statGained || !skillGained)) {
                    if (!statGained) {
                        const stats = ['strength', 'agility', 'intelligence', 'charisma', 'charm'];
                        const stat = stats[Math.floor(Math.random() * stats.length)];
                        if (completedSurvivor[stat] < 10) completedSurvivor[stat]++;
                        statGained = true;
                    }
                    if (!skillGained) {
                        const tempSkill = '정밀집도(임시)';
                        if (!completedSurvivor.skills.includes(tempSkill)) {
                            completedSurvivor.skills.push(tempSkill);
                            skillGained = true;
                        }
                    }
                    addLog(`${completedSurvivor.name}의 '정밀 집도' 발동! 보너스 2개 고정`, 'event');
                }
                
                // 예술가: [영감의 원천]
                if (jobSkill && jobSkill.name === '영감의 원천') {
                    if (Math.random() < 0.5) {
                        const bonusSkill = '영감(임시)';
                        if (!completedSurvivor.skills.includes(bonusSkill)) {
                            completedSurvivor.skills.push(bonusSkill);
                            addLog(`${completedSurvivor.name}의 '영감의 원천' 발동! 추가 스킬 획득`, 'reward');
                        }
                    }
                }
                
                // 고등학생: [학습 효과]
                if (jobSkill && jobSkill.name === '학습 효과' && statGained) {
                    const stats = ['strength', 'agility', 'intelligence', 'charisma', 'charm'];
                    const stat = stats[Math.floor(Math.random() * stats.length)];
                    if (completedSurvivor[stat] < 10) {
                        completedSurvivor[stat]++;
                        addLog(`${completedSurvivor.name}의 '학습 효과' 발동! (추가 스탯 +1)`, 'reward');
                    }
                }
                
                // 지능 8 이상
                if (completedSurvivor.intelligence >= 8 && skillGained) {
                    const bonusSkill = '지능축복(임시)';
                    if (!completedSurvivor.skills.includes(bonusSkill)) {
                        completedSurvivor.skills.push(bonusSkill);
                        completedSurvivor.mental = Math.min(completedSurvivor.maxMental, completedSurvivor.mental + 2);
                        addLog(`${completedSurvivor.name}의 높은 지능으로 추가 스킬 획득! - 정신력 +2`, 'reward');
                    }
                }
            } else {
                // 패널티
                const damagePercent = 0.1 + Math.random() * 0.6;
                let hpDamage = Math.floor(completedSurvivor.maxHp * damagePercent);
                
                if (completedSurvivor.agility >= 8) {
                    hpDamage = Math.max(0, hpDamage - 5);
                    addLog(`${completedSurvivor.name}의 높은 민첩으로 체력 피해 5 감소!`, 'event');
                }
                
                completedSurvivor.hp = Math.max(0, completedSurvivor.hp - hpDamage);
                addLog(`${completedSurvivor.name}이(가) 인형을 완성했지만 ${hpDamage}의 체력 피해를 입었다.`, 'death');
            }
        }
        
    } else if (gameState.subGameType === 'banquet') {
        // 연회 종료: 더미즈 중 신뢰도 최하위 사망
        const dummies = gameState.survivors.filter(s => s.isAlive && s.status === '더미즈');
        if (dummies.length > 0) {
            const lowestTrust = dummies.reduce((min, s) => s.trust < min.trust ? s : min);
            lowestTrust.isAlive = false;
            lowestTrust.inCoffin = false;
            
            // 탈출한 더미즈 확인 및 사망 처리
            const escapedDummies = dummies.filter(d => !d.inCoffin && d.id !== lowestTrust.id);
            const shouldDischarge = escapedDummies.length < 2;
            lowestTrust.isAlive = false;
            lowestTrust.inCoffin = false;
            
            // 생존본능 스킬 제거 및 스탯 복구
            gameState.survivors = gameState.survivors.map(s => {
                if (s.status === '더미즈') {
                    const wasEscaped = !s.inCoffin && s.id !== lowestTrust.id;
                    
                    s.skills = s.skills.filter(skill => skill !== '생존본능');
                    s.maxHp -= 100;
                    s.maxMental -= 100;
                    s.hp = Math.min(s.hp, s.maxHp);
                    s.mental = Math.min(s.mental, s.maxMental);
                    
                    // 탈출한 더미즈는 사망 처리
                    if (shouldDischarge && !s.inCoffin && s.id !== lowestTrust.id && s.isAlive) {
                        return { ...s, isAlive: false, inCoffin: false };
                    }
                }
                return s;
            });
            
            addLog(`신뢰도 최하위 더미즈 ${lowestTrust.name}이(가) 절명했다.`, 'death');
            processDeathRelationships(lowestTrust);
            
            // 탈출한 더미즈 로그 출력
            if (shouldDischarge && escapedDummies.length > 0) {
                escapedDummies.forEach(dummy => {
                    addLog(`${dummy.name}이(가) 방전되었다.`, 'death');
                    processDeathRelationships(dummy);
                });
            }
        }
    }
    updateDisplay()
}

// 역할 배정
function assignRoles() {
    const alive = gameState.survivors.filter(s => s.isAlive);
    const specialRoles = ['열쇠지기', '현자', '대역'];
    const roles = [...specialRoles, ...Array(Math.max(0, alive.length - 3)).fill('평민')];
    
    const shuffled = [...alive].sort(() => Math.random() - 0.5);
    
    gameState.survivors = gameState.survivors.map(s => {
        if (!s.isAlive) return s;
        const index = shuffled.findIndex(survivor => survivor.id === s.id);
        const role = roles[index];
        
        if (['열쇠지기', '현자', '대역'].includes(role)) {
            addLog(`${s.name}의 역할: ${role}`, 'role');
        }
        
        return { ...s, role };
    });

    addLog('=== 메인게임: 역할이 배정되었다 ===', 'phase');
    addLog('【메인게임 규칙】 생존자 중 한 명을 투표로 선택한다. 열쇠지기가 선택되면 모두 사망하고 대역만 생존한다. 현자가 선택되면 대역과 함께 사망한다. 대역이 선택되면 대역과 한 명만 생존한다. 평민이 선택되면 대역과 함께 사망한다.', 'event');
}

// 메인게임 처리
function processMainGame() {
    const cyclePosition = ((gameState.turn - 1) % 13) + 1;
    if (cyclePosition === 11) {
        gameState.gamePhase = 'main';
        gameState.mainGameTurn = 1;  // 메인게임 시작
        assignRoles();
    } else {
        gameState.gamePhase = 'main';
        gameState.mainGameTurn++;  // 턴 증가
    }


    gameState.survivors = gameState.survivors.map(s => {
        if (!s.isAlive || !s.currentAction || s.currentAction === 'free') return s;

        const updated = { ...s };
        const oldTrust = s.trust;
        
        if (s.currentAction === 'explore' || s.currentAction === 'active') {
            updated.trust += Math.floor(Math.random() * 10) - 3;
            updated.trust = Math.max(0, Math.min(100, updated.trust));
            
            const diff = updated.trust - oldTrust;
            const changeText = diff !== 0 ? ` (신뢰도 ${diff > 0 ? '+' : ''}${diff})` : '';
            addLog(`${s.name}이(가) 행동했다.${changeText}`, 'action');
        } else if (s.currentAction === 'talk') {
            processTalkAction(updated);
        }
        
        return updated;
    });

    updateDisplay();

    if (gameState.mainGameTurn === 3) {
        executeVoting();
    }

    addLog(`=== 턴 ${gameState.turn}: 메인게임 진행 중 ===`, 'phase');
}

// 투표 실행
function executeVoting() {
    const alive = gameState.survivors.filter(s => s.isAlive);
    const votes = {};
    
    alive.forEach(s => {
        votes[s.id] = 0;
    });

    alive.forEach(voter => {
        let minScore = Infinity;
        let target = null;
        
        alive.forEach(candidate => {
            if (candidate.id === voter.id) return;
            
            // 신뢰도 가중치: 3.0
            // 매력 가중치: 2.0
            // 카리스마 가중치: 1.5
            // 지능 가중치: 1.5
            const score = (candidate.trust * 3.0) + 
                         (candidate.charm * 2.0) + 
                         (candidate.charisma * 1.5) + 
                         (candidate.intelligence * 1.5) + 
                         (voter.favorability[candidate.id] || 50);
            
            if (score < minScore) {
                minScore = score;
                target = candidate;
            }
        });
        
        if (target) {
            // 판사 스킬 체크는 그대로 유지
            const voterJobSkill = JOB_SKILLS[voter.job];
            if (voterJobSkill && voterJobSkill.name === '최후 판결') {
                const cancelChance = voter.charisma * 0.08;
                if (Math.random() < cancelChance) {
                    addLog(`${voter.name}의 '최후 판결' 발동! ${target.name}의 득표 1표 무효화`, 'event');
                    return;
                }
            }
            
            // 아이돌 스킬 체크는 그대로 유지
            const targetJobSkill = JOB_SKILLS[target.job];
            if (targetJobSkill && targetJobSkill.name === '팬덤 형성') {
                const voterFav = voter.favorability[target.id] || 50;
                if (voterFav >= 50) {
                    addLog(`${voter.name}은(는) ${target.name}의 '팬덤 형성'으로 투표할 수 없다.`, 'event');
                    return;
                }
            }
            
            votes[target.id]++;
        }
    });

    const maxVotes = Math.max(...Object.values(votes));
    const sacrificed = alive.find(s => votes[s.id] === maxVotes);

    if (sacrificed) {
        addLog(`=== 투표 결과: ${sacrificed.name}이(가) 선택되었다 ===`, 'vote');
        processRoleEffect(sacrificed);
    }
    gameState.gamePhase = 'sub';
    gameState.mainGameTurn = 0;
}

// 역할 효과 처리
function processRoleEffect(sacrificed) {
    const alive = gameState.survivors.filter(s => s.isAlive);
    const substitute = alive.find(s => s.role === '대역');
    
    // 득표수 계산
    const votes = {};
    alive.forEach(s => votes[s.id] = 0);
    alive.forEach(voter => {
        let minScore = Infinity;
        let target = null;
        alive.forEach(candidate => {
            if (candidate.id === voter.id) return;
            const score = candidate.trust + (voter.favorability[candidate.id] || 50);
            if (score < minScore) {
                minScore = score;
                target = candidate;
            }
        });
        if (target) votes[target.id]++;
    });
    
    const voteCount = votes[sacrificed.id];
    
    addLog(`${voteCount}표를 획득하여 ${sacrificed.name}이(가) 희생자로 선발되었다.`, 'vote');
    addLog(`${sacrificed.name}은(는) ${sacrificed.role}(이)었다.`, 'role');

    if (sacrificed.role === '열쇠지기') {
        addLog(`${sacrificed.name}이(가) 절명했다.`, 'death');
        
        if (substitute) {
            const chosen = alive.find(s => s.id !== sacrificed.id && s.id !== substitute.id);
            if (chosen) {
                addLog(`${substitute.name}, ${chosen.name} 이외의 전원이 처형당한다.`, 'death');
                addLog(`대역 ${substitute.name}의 승리!`, 'survive');
                addLog(`${chosen.name}이(가) 함께 탈출한다...`, 'survive');
                
                gameState.survivors = gameState.survivors.map(s => {
                    if (s.id === substitute.id || s.id === chosen.id) return s;
                    return { ...s, isAlive: false };
                });
            }
        } else {
            addLog(`전원이 처형당했다.`, 'death');
            gameState.survivors = gameState.survivors.map(s => ({ ...s, isAlive: false }));
        }
    } else if (sacrificed.role === '대역') {
        // 대역이 투표로 선택된 경우
        addLog(`대역 ${sacrificed.name}이(가) 선택되었다.`, 'death');
        
        // 대역을 제외한 생존자 중에서 호감도 기반으로 한 명 선택
        const others = alive.filter(s => s.id !== sacrificed.id);
        
        if (others.length > 0) {
            // 각 생존자의 전체 호감도 합계 계산
            const favorabilityScores = others.map(survivor => {
                let totalFav = 0;
                alive.forEach(other => {
                    if (other.id !== survivor.id) {
                        totalFav += (other.favorability[survivor.id] || 0);
                    }
                });
                return {
                    survivor: survivor,
                    score: Math.max(0, totalFav) // 음수는 0으로 처리
                };
            });
            
            // 가중치 기반 랜덤 선택
            const totalWeight = favorabilityScores.reduce((sum, item) => sum + item.score + 100, 0); // +100은 최소 확률 보장
            let random = Math.random() * totalWeight;
            
            let chosen = null;
            for (const item of favorabilityScores) {
                random -= (item.score + 100);
                if (random <= 0) {
                    chosen = item.survivor;
                    break;
                }
            }
            
           if (!chosen) chosen = favorabilityScores[0].survivor;
        
            addLog(`${chosen.name}이(가) 대역과 함께 살아남는다.`, 'survive');
            addLog(`${sacrificed.name}, ${chosen.name} 이외의 전원이 처형당한다.`, 'death');
            
            gameState.survivors = gameState.survivors.map(s => {
                if (s.id === sacrificed.id || s.id === chosen.id) {
                    return s;
                }
                return { ...s, isAlive: false };
            });
            
            const finalWinners = [sacrificed, chosen];
            
            const remainingSurvivors = gameState.survivors.filter(s => s.isAlive);
            if (remainingSurvivors.length <= 2 && remainingSurvivors.length > 0) {
                addLog('메인게임이 종료되었다.', 'game-end');
                setTimeout(() => showEndingScreen(finalWinners), 3500);
            }
        } else {
            // 대역만 남은 경우
            addLog(`대역 ${sacrificed.name}만 살아남았다.`, 'survive');
            gameState.survivors = gameState.survivors.map(s => {
                if (s.id === sacrificed.id) return s;
                return { ...s, isAlive: false };
            });
        }
    } else if (sacrificed.role === '현자') {
        addLog(`${sacrificed.name}이(가) 절명했다.`, 'death');
        
        if (substitute) {
            addLog(`대역 ${substitute.name}이(가) 절명했다.`, 'death');
            processDeathRelationships(substitute);
            gameState.survivors = gameState.survivors.map(s => {
                if (s.id === sacrificed.id || s.id === substitute.id) {
                    return { ...s, isAlive: false };
                }
                return s;
            });
        } else {
            gameState.survivors = gameState.survivors.map(s => {
                if (s.id === sacrificed.id) return { ...s, isAlive: false };
                return s;
            });
        }
    } else { // 평민
        addLog(`${sacrificed.name}이(가) 절명했다.`, 'death');
        
        if (substitute) {
            addLog(`대역 ${substitute.name}이(가) 절명했다.`, 'death');
            processDeathRelationships(substitute);
            gameState.survivors = gameState.survivors.map(s => {
                if (s.id === sacrificed.id || s.id === substitute.id) {
                    return { ...s, isAlive: false };
                }
                return s;
            });
        } else {
            gameState.survivors = gameState.survivors.map(s => {
                if (s.id === sacrificed.id) return { ...s, isAlive: false };
                return s;
            });
        }
    }
    
    gameState.isRunning = false;

    gameState.survivors = gameState.survivors.map(s => ({
        ...s,
        role: null
    }));

    checkLaptopEvent(sacrificed);
    
    // 메인게임 종료 후 생존자 체크
    const remainingSurvivors = gameState.survivors.filter(s => s.isAlive);
    
    // 2명 이하만 남았을 때 승리
    if (remainingSurvivors.length <= 2 && remainingSurvivors.length > 0) {
        addLog('메인게임이 종료되었다.', 'game-end');
        setTimeout(() => showEndingScreen(remainingSurvivors), 3500);
    } else if (remainingSurvivors.length === 0) {
        addLog('모든 생존자가 절명했다.', 'game-end');
    }
}

// 노트북 이벤트 체크 함수
function checkLaptopEvent(sacrificed) {
    // 노트북을 가진 생존자 찾기
    const laptopOwner = gameState.survivors.find(s => s.hasLaptop);
    
    if (!laptopOwner) return;
    
    // 노트북 소유자가 대역이나 열쇠지기인 경우 이벤트 발생 안 함
    if (laptopOwner.role === '대역' || laptopOwner.role === '열쇠지기') return;
    
    // 희생자가 대역이나 열쇠지기인 경우 이벤트 발생 안 함
    if (sacrificed.role === '대역' || sacrificed.role === '열쇠지기') return;
    
    // 노트북 소유자의 친구 이상 관계 캐릭터들
    const friends = gameState.survivors.filter(other => {
        if (other.id === laptopOwner.id) return false;
        const fav = laptopOwner.favorability[other.id] || 0;
        return fav >= 150; // 친구 이상
    });
    
    // 희생자가 친구 중 하나인지 확인
    const isFriendSacrificed = friends.some(f => f.id === sacrificed.id);
    
    // 노트북 소유자가 희생되었는지 확인
    const isOwnerSacrificed = sacrificed.id === laptopOwner.id;
    
    if (isFriendSacrificed) {
        // 친구가 희생된 경우 - 복수 이벤트
        showLaptopRevengePopup(laptopOwner, sacrificed);
    } else if (isOwnerSacrificed && friends.length > 0) {
        // 노트북 소유자가 희생되고 친구가 있는 경우 - 희망 이벤트
        showLaptopHopePopup(laptopOwner, friends);
    }
}

// 노트북 복수 팝업
function showLaptopRevengePopup(laptopOwner, sacrificedFriend) {
    const container = document.getElementById('popupContainer');
    
    container.innerHTML = `
        <div class="popup-overlay">
            <div class="popup" onclick="event.stopPropagation()">
                <div class="popup-header">
                    <h2 class="popup-title">${sacrificedFriend.name}의 죽음</h2>
                </div>
                <div class="popup-content">
                    <div class="form" style="text-align: center;">
                        ${laptopOwner.image && laptopOwner.image !== 'data:,' && laptopOwner.image !== '' 
                            ? `<img src="${laptopOwner.image}" alt="${laptopOwner.name}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; display: block; margin: 0 auto 1rem;">`
                            : `<div style="width: 100px; height: 100px; border-radius: 50%; background-color: ${getRandomColor(laptopOwner.id)}; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                                <i data-lucide="user" size="48" color="white"></i>
                            </div>`
                        }
                        <p style="margin-bottom: 1.5rem; font-size: 1.1rem; line-height: 1.6;">
                            <strong>${laptopOwner.name}은(는) ${sacrificedFriend.name}의 사망하게 한 다른 생존자들을 용서할 수 없었다.</strong>
                            <br>
                            소유중인 노트북을 이용해 모두에게 트라우마가 되는 기억을 심어주었다.
                        </p>
                        <button onclick="executeLaptopRevenge(${laptopOwner.id})" class="btn btn-purple" style="width: 100%; color: white;">
                            확인
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    lucide.createIcons();
}

// 노트북 희망 팝업
function showLaptopHopePopup(laptopOwner, friends) {
    const container = document.getElementById('popupContainer');
    
    // 친구가 없으면 이벤트 발생 안 함
    if (!friends || friends.length === 0) return;
    
    const friendNames = friends.map(f => f.name).join(', ');
    
    container.innerHTML = `
        <div class="popup-overlay">
            <div class="popup" onclick="event.stopPropagation()">
                <div class="popup-header">
                    <h2 class="popup-title">감사의 표시</h2>
                </div>
                <div class="popup-content">
                    <div class="form" style="text-align: center;">
                        ${laptopOwner.image && laptopOwner.image !== 'data:,' && laptopOwner.image !== '' 
                            ? `<img src="${laptopOwner.image}" alt="${laptopOwner.name}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; display: block; margin: 0 auto 1rem;">`
                            : `<div style="width: 100px; height: 100px; border-radius: 50%; background-color: ${getRandomColor(laptopOwner.id)}; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                                <i data-lucide="user" size="48" color="white"></i>
                            </div>`
                        }
                        <p style="margin-bottom: 1.5rem; font-size: 1.1rem; line-height: 1.6;">
                            <strong>${laptopOwner.name}은(는) ${friendNames} 대신 자신이 희생할 수 있었음에 다른 생존자들에게 감사를 느꼈다.</strong>
                            <br>
                            소유중인 노트북을 이용해 모두에게 희망이 되는 정보를 공유해주었다.
                        </p>
                        <button onclick="executeLaptopHope(${laptopOwner.id})" class="btn btn-green" style="width: 100%; color: white;">
                            확인
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    lucide.createIcons();
}

// 노트북 복수 실행
function executeLaptopRevenge(laptopOwnerId) {
    const laptopOwner = gameState.survivors.find(s => s.id === laptopOwnerId);
    
    if (!laptopOwner) return; // 안전장치 추가
    
    gameState.survivors = gameState.survivors.map(s => {
        if (s.isAlive && s.id !== laptopOwnerId) {
            return {
                ...s,
                mental: Math.max(0, s.mental - 15)
            };
        }
        return s;
    });
    
    addLog(`${laptopOwner.name}의 행동으로 생존자들의 정신력이 감소했다. - 전원 정신력 -15`, 'damage');
    
    document.getElementById('popupContainer').innerHTML = '';
    updateDisplay();
}

// 노트북 희망 실행
function executeLaptopHope(laptopOwnerId) {
    const laptopOwner = gameState.survivors.find(s => s.id === laptopOwnerId);
    
    if (!laptopOwner) return; // 안전장치 추가
    
    gameState.survivors = gameState.survivors.map(s => {
        if (s.isAlive) {
            return {
                ...s,
                mental: Math.min(s.maxMental, s.mental + 15)
            };
        }
        return s;
    });
    
    addLog(`${laptopOwner.name}의 행동으로 생존자들의 정신력이 회복되었다. - 전원 정신력 +15`, 'heal');
    
    document.getElementById('popupContainer').innerHTML = '';
    updateDisplay();
}

// 생존자 초기화
function initializeSurvivor(survivor) {
    const personalityType = getPersonalityType(survivor.personality);
    
    let calculatedHp = 100 + ((survivor.strength - 5) * 15);
    let maxHp = Math.min(150, Math.max(75, calculatedHp));
    
    const mentalAvg = (survivor.intelligence + survivor.agility) / 2;
    let maxMental;
    maxMental = 100 + ((mentalAvg - 5) * 10);

    if (personalityType === 'egocentric') {
        maxMental += 20;
    }
    maxMental = Math.max(50, Math.min(200, maxMental));
    
    const trustAvg = (survivor.charisma + survivor.charm) / 2;
    if (trustAvg > 5) {
        baseTrust = 50 + ((trustAvg - 5) * 10);
    } else if (trustAvg < 5) {
        baseTrust = 50 - ((5 - trustAvg) * 10);
    } else {
        baseTrust = 50;
    }
    
    // 직업 스킬 자동 추가
    const jobSkill = JOB_SKILLS[survivor.job];
    const initialSkills = jobSkill ? [jobSkill.name] : [];
    
    return {
        ...survivor,
        id: Date.now() + Math.random(),
        hp: maxHp,
        maxHp: maxHp,
        mental: maxMental,
        maxMental: maxMental,
        trust: baseTrust,
        tokens: 0,
        bodyParts: { leftArm: false, rightArm: false, leftLeg: false, rightLeg: false, head: false, torso: false },
        bodyPartsDisplay: [],
        isAlive: true,
        isPanic: false,
        inCoffin: false,
        role: null,
        status: survivor.status || '인간',
        skills: initialSkills,
        favorability: {},
        relationshipTypes: {},
        awkwardWith: {},
        currentAction: null,
        voteTarget: null,
        panicTurnCount: 0,
        allianceWith: []
    };
}

// 로그 추가
function addLog(message, type = 'info') {
    const newLog = {
        turn: gameState.turn,
        message,
        type,
        timestamp: new Date().toLocaleTimeString()
    };

    // phase 로그인 경우 맨 앞에 추가
    if (type === 'phase') {
        gameState.logs.unshift(newLog);
    }
    // 일반 로그는 기존대로
    else {
        gameState.logs.unshift(newLog);
    }
    
    if (gameState.logs.length > 200) {
        gameState.logs = gameState.logs.slice(0, 200);
    }
}

// 화면 업데이트
function updateDisplay() {
    const statusEl = document.getElementById('turnDisplay');
    if (!statusEl) return;

    updateStatus();
    updateSurvivorList();
    updateLogList();
    updateButtons();

    const logList = document.getElementById('logList');
    if (logList) {
        logList.scrollTop = 0;
    }
}

// 상태 표시 업데이트
function updateStatus() {
    const displayTurn = gameState.turn > 0 ? gameState.turn  : 0; 
document.getElementById('turnDisplay').textContent = displayTurn;
    
    const aliveCount = gameState.survivors.filter(s => s.isAlive).length;
    
    let phase = '';
    
    if (aliveCount <= 2 && aliveCount > 0) {
        phase = '종료';
    } else {
        if (gameState.turn === 0) {
            phase = '대기 중';
        } else if (gameState.turn === 1) {
            phase = '최초의 시련';
        } else if (gameState.gamePhase === 'sub') {
            const gameNames = {
                'trust': '신뢰매매게임',
                'body': '신체보물찾기',
                'banquet': '연회'
            };
            phase = `서브게임 (${gameNames[gameState.subGameType] || '진행중'})`;
        } else if (gameState.gamePhase === 'main') {
            phase = '메인게임';
        } else {
            const cyclePosition = ((gameState.turn - 2) % 13) + 1;
            if (cyclePosition >= 1 && cyclePosition <= 10) {
                phase = '서브게임';
            } else if (cyclePosition >= 11 && cyclePosition <= 13) {
                phase = '메인게임';
            } else {
                phase = '진행중';
            }
        }
    }
    
    document.getElementById('phaseDisplay').textContent = phase;
    document.getElementById('survivorDisplay').textContent = `${aliveCount}/${gameState.survivors.length}`;
}

// ID 기반 랜덤 색상 생성
function getRandomColor(id) {
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    const index = Math.floor(id * 7) % colors.length;
    return colors[index];
}

// 호감도 상세 보기 함수
function showFavorabilityDetails(survivorId) {
    const survivor = gameState.survivors.find(s => s.id === survivorId);
    if (!survivor) return;
    
    const container = document.getElementById('popupContainer');
    
    // 다른 생존자들과의 호감도 정보
    const favorabilityData = gameState.survivors
        .filter(s => s.id !== survivorId)
        .map(other => {
            const fav = survivor.favorability[other.id] || 0;
            const relation = survivor.relationshipTypes?.[other.id];
            const status = getRelationshipStatus(fav, relation);
            
            return {
                id: other.id,
                name: other.name,
                image: other.image,
                favorability: fav,
                relationship: status
            };
        })
        .sort((a, b) => b.favorability - a.favorability);
    
    // 동맹
    const allies = favorabilityData.filter(f => 
        survivor.allianceWith && survivor.allianceWith.includes(f.id)
    );
    
    container.innerHTML = `
        <div class="popup-overlay" onclick="closePopup(event)">
            <div class="popup" onclick="event.stopPropagation()">
                <div class="popup-header">
                    <h2 class="popup-title">${survivor.name}의 관계 현황</h2>
                    <button class="popup-close" onclick="closePopup()">
                        <i data-lucide="x" size="24"></i>
                    </button>
                </div>
                <div class="popup-content">
                    <!-- 동맹 현황 -->
                    <div class="form" style="margin-bottom: 1rem;">
                        <h3 style="font-weight: bold; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i data-lucide="heart" size="20" style="color: #ec4899;"></i>
                            동맹 현황
                        </h3>
                        ${allies.length > 0 ? `
                            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                ${allies.map(ally => `
                                    <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: #c1ffd34d; border: 2px solid #22c55e80; border-radius: 0.5rem;">
                                        ${ally.image && ally.image !== 'data:,' && ally.image !== '' 
                                            ? `<img src="${ally.image}" alt="${ally.name}" style="width: 3rem; height: 3rem; border-radius: 50%; object-fit: cover;">`
                                            : `<div style="width: 3rem; height: 3rem; border-radius: 50%; background-color: ${getRandomColor(ally.id)}; display: flex; align-items: center; justify-content: center;">
                                                <i data-lucide="user" size="20" color="white"></i>
                                            </div>`
                                        }
                                        <div style="flex: 1;">
                                            <div style="font-weight: bold; color: var(--text-primary);">
                                                ${ally.name}
                                                ${!gameState.survivors.find(s => s.id === ally.id)?.isAlive ? '<span style="color: #dc2626; margin-left: 0.5rem;">💀</span>' : ''}
                                            </div>
                                            <div style="font-size: 0.875rem; color: var(--text-tertiary);">${ally.relationship}</div>
                                        </div>
                                        <div style="text-align: right;">
                                            <div style="font-size: 1.25rem; color: #22c55e;">${ally.favorability}</div>
                                            <div style="font-size: 0.75rem; color: var(--text-tertiary);">호감도</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : '<div style="text-align: center; color: var(--text-tertiary); padding: 1rem;">동맹이 없습니다</div>'}
                    </div>
                    
                    <!-- 전체 호감도 현황 -->
                    <div class="form">
                        <h3 style="font-weight: bold; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i data-lucide="users" size="20" style="color: var(--accent-green);"></i>
                            전체 관계 현황
                        </h3>
                        ${favorabilityData.length > 0 ? `
                            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                ${favorabilityData.map(person => {
                                    let bgColor = '#f3f4f64d';
                                    let borderColor = '#d1d5db80';
                                    let favColor = '#ffffffff';
                                    
                                    if (person.favorability >= 150) {
                                        bgColor = '#c1ffd34d';
                                        borderColor = '#22c55e80';
                                        favColor = '#22c55e';
                                    } else if (person.favorability >= 60) {
                                        bgColor = '#eff6ff4d';
                                        borderColor = '#3b82f680';
                                        favColor = '#3b82f6';
                                    } else if (person.favorability < 0) {
                                        bgColor = '#fef2f24d';
                                        borderColor = '#ef444480';
                                        favColor = '#ef4444';
                                    }
                                    
                                    return `
                                        <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 0.5rem;">
                                            ${person.image && person.image !== 'data:,' && person.image !== '' 
                                                ? `<img src="${person.image}" alt="${person.name}" style="width: 2.5rem; height: 2.5rem; border-radius: 50%; object-fit: cover;">`
                                                : `<div style="width: 2.5rem; height: 2.5rem; border-radius: 50%; background-color: ${getRandomColor(person.id)}; display: flex; align-items: center; justify-content: center;">
                                                    <i data-lucide="user" size="16" color="white"></i>
                                                </div>`
                                            }
                                            <div style="flex: 1;">
                                                <div style="font-weight: 600; color: color: var(--text-primary);">
                                                    ${person.name}
                                                    ${!gameState.survivors.find(s => s.id === person.id)?.isAlive ? '<span style="color: #dc2626; margin-left: 0.5rem;">💀</span>' : ''}
                                                </div>
                                                <div style="font-size: 0.75rem; color: color: var(--text-tertiary);">${person.relationship}</div>
                                            </div>
                                            <div style="text-align: right;">
                                                <div style="font-size: 1.125rem; color: var(--text-tertiary)">${person.favorability}</div>
                                                <div style="width: 100px; height: 6px; background: #e5e7eb; border-radius: 3px; margin-top: 0.25rem;">
                                                    <div style="width: ${Math.min(100, Math.max(0, (person.favorability + 200) / 17))}%; height: 100%; background: ${favColor}; border-radius: 3px; transition: width 0.3s;"></div>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        ` : '<div style="text-align: center; color: var(--text-tertiary); padding: 1rem;">다른 생존자가 없습니다</div>'}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    lucide.createIcons();
}

// 생존자 목록 업데이트
function updateSurvivorList() {
    const container = document.getElementById('survivorList');
    
    if (gameState.survivors.length === 0) {
        container.innerHTML = '<div class="empty-message" style="grid-column: 1 / -1;">생존자를 추가해주세요</div>';
        return;
    }
    
    gameState.survivors = gameState.survivors.map(s => {
        const displayParts = [];
        if (s.bodyParts) {
            Object.keys(s.bodyParts).forEach(part => {
                if (s.bodyParts[part]) {
                    displayParts.push(part);
                }
            });
        }
        return { ...s, bodyPartsDisplay: displayParts };
    });
    
    const sorted = [...gameState.survivors].sort((a, b) => b.isAlive - a.isAlive);
    
    container.innerHTML = sorted.map(s => `
        <div class="survivor-card ${s.isAlive ? 'alive' : 'dead'}">
            <div class="survivor-actions">
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <div class="status-badge ${s.isAlive ? 'alive' : 'dead'}">${s.isAlive ? '생존' : '사망'}</div>
                    ${s.isPanic ? '<div class="status-badge" style="background-color: #dc2626; color: white;">패닉</div>' : ''}
                    ${s.currentAction && s.currentAction !== 'free' ? '<div class="action-ready-badge">준비됨</div>' : ''}
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="icon-btn rel" onclick="showFavorabilityDetails(${s.id})">
                        <i data-lucide="users" width="16" height="16" stroke-width="3"></i>
                    </button>
                    <button class="icon-btn edit" onclick="editSurvivor(${s.id})">
                        <i data-lucide="edit-2" width="16" height="16" stroke-width="3"></i>
                    </button>
                    <button class="icon-btn delete" onclick="deleteSurvivor(${s.id})">
                        <i data-lucide="trash-2" width="16" height="16" stroke-width="3"></i>
                    </button>
                </div>
            </div>
            
            <div class="survivor-header">
                <div class="survivor-info">
                    <div class="survivor-image-container">
                        ${s.image && s.image !== 'data:,' && s.image !== ''
                            ? `<img src="${s.image}" alt="${s.name}" class="survivor-image ${s.status === '인간' ? 'border-human' : 'border-dummy'}">`
                            : `<div class="survivor-image-placeholder ${s.status === '인간' ? 'border-human' : 'border-dummy'}" style="background-color: ${getRandomColor(s.id)}; display: flex; align-items: center; justify-content: center;">
                                <i data-lucide="user" size="32" color="white"></i>
                            </div>`
                        }
                        <div class="survivor-status-badge ${s.status === '인간' ? 'human' : 'dummy'}">
                            ${s.status}
                        </div>
                    </div>
                    
                    <div class="survivor-details">
                        <h3 class="survivor-name">${s.name}</h3>
                        
                        <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.75rem; align-items: center;">
                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center;">
                                <span style="border: 1px solid #62a6ffff; background-color: hsla(214, 100%, 75%, 0.50); color: var(--survivecard-job); padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;">
                                    ${s.job}
                                </span>
                                <span style="background-color: rgba(146, 146, 146, 0.5); color: var(--text-secondary); padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; border: 1px solid #d1d5db;">
                                    ${s.gender}
                                </span>
                                <span style="border: 1px solid #b168ffff; background-color: rgba(191, 132, 255, 0.5); color: var(--survivecard-role); padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;">
                                    ${s.personality}
                                </span>
                            </div>
                            
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center;">
                            ${s.tokens > 0 ? `
                                <span style="background-color: #fef3c7; color: #92400e; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.25rem;">
                                    <i data-lucide="coins" size="14"></i>${s.tokens}
                                </span>
                            ` : ''}
                            ${s.bodyPartsDisplay && s.bodyPartsDisplay.length > 0 ? `
                                <span class="body-parts-icon">
                                    🦾 ${s.bodyPartsDisplay.length}/6
                                    <div class="body-parts-tooltip">
                                        ${s.bodyPartsDisplay.map(part => {
                                            const names = {
                                                leftArm: '왼팔', rightArm: '오른팔',
                                                leftLeg: '왼다리', rightLeg: '오른다리',
                                                head: '머리', torso: '몸통'
                                            };
                                            return names[part] || part;
                                        }).join(', ')}
                                    </div>
                                </span>
                            ` : ''}
                            ${s.hasLaptop ? `
                                <span style="background-color: #dbeafe; color: #1e40af; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.25rem;">
                                    <i data-lucide="laptop" size="14"></i>
                                </span>
                            ` : ''}
                            ${s.role && ['열쇠지기', '현자', '대역'].includes(s.role) ? `
                                <span style="background-color: #fef3c7; color: #92400e; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;">
                                    ${s.role}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 1rem; width: 80%;">
                <div style="margin-bottom: 0.75rem;">
                    <div style="display: flex; justify-content: flex-start; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.25rem;">
                        <span>체력</span>
                        <span class="stat-hp">${s.isAlive ? s.hp : 0}/${s.maxHp}</span>
                    </div>
                    <div class="stat-bar">
                        <div class="stat-bar-fill hp-bar" style="width: ${s.isAlive ? (s.hp / s.maxHp) * 100 : 0}%"></div>
                    </div>
                </div>
                
                <div style="margin-bottom: 0.75rem;">
                    <div style="display: flex; justify-content: flex-start; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.25rem;">
                        <span>정신력</span>
                        <span class="stat-mental">${s.isAlive ? s.mental : 0}/${s.maxMental}</span>
                    </div>
                    <div class="stat-bar">
                        <div class="stat-bar-fill mental-bar" style="width: ${s.isAlive ? (s.mental / s.maxMental) * 100 : 0}%"></div>
                    </div>
                </div>
                
                <div>
                    <div style="display: flex; justify-content: flex-start; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.25rem;">
                        <span>신뢰도</span>
                        <span class="stat-trust">${s.trust}</span>
                    </div>
                    <div class="stat-bar">
                        <div class="stat-bar-fill trust-bar" style="width: ${s.trust}%"></div>
                    </div>
                </div>
            </div>
            
            <div class="stat-grid">
                <div class="stat-box">
                    <div class="stat-label">STR</div>
                    <div class="stat-value">${s.strength}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">AGI</div>
                    <div class="stat-value">${s.agility}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">INT</div>
                    <div class="stat-value">${s.intelligence}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">CHA</div>
                    <div class="stat-value">${s.charisma}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">CHR</div>
                    <div class="stat-value">${s.charm}</div>
                </div>
            </div>
            
            ${s.skills && s.skills.length > 0 ? `
                <div class="survivor-skills">
                    <div class="skills-toggle" onclick="toggleSkills(${s.id})">
                        <span>스킬 (${s.skills.length})</span>
                        <i data-lucide="chevron-down" size="16" class="skills-toggle-icon" id="skills-icon-${s.id}"></i>
                    </div>
                    <div class="skills-content" id="skills-content-${s.id}">
                        ${s.skills.map(skillName => {
                            const isJob = isJobSkill(s, skillName);
                            let skillInfo = null;
                            
                            // 직업 스킬 체크
                            if (isJob) {
                                skillInfo = JOB_SKILLS[s.job];
                            }
                            // 특수 스킬 체크
                            else {
                                const personalityType = getPersonalityType(s.personality);
                                if (SPECIAL_SKILLS.personality[personalityType]) {
                                    skillInfo = SPECIAL_SKILLS.personality[personalityType].find(sk => sk.name === skillName);
                                }
                                if (!skillInfo) {
                                    skillInfo = SPECIAL_SKILLS.stats.find(sk => sk.name === skillName);
                                }
                                if (!skillInfo) {
                                    skillInfo = { name: skillName, description: '특수 스킬' };
                                }
                            }
                            
                            return `
                                <div class="skill-item">
                                    <div class="skill-header">
                                        <span class="skill-name">${skillName}</span>
                                        ${isJob ? '<span class="skill-badge-job">직업스킬</span>' : ''}
                                    </div>
                                    <div class="skill-description">${skillInfo ? skillInfo.description : '스킬 설명 없음'}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${s.inCoffin ? '<div class="coffin-badge" style="margin-top: 0.75rem; text-align: center;">⚰️ 관에 갇혀있음</div>' : ''}
        </div>
        </div>
    `).join('');
    
    lucide.createIcons();
}

// 로그 목록 업데이트
function updateLogList() {
    const container = document.getElementById('logList');
    
    if (gameState.logs.length === 0) {
        container.innerHTML = '<div class="empty-message">아직 기록이 없습니다</div>';
        return;
    }
    
    container.innerHTML = gameState.logs.map(log => `
        <div class="log-entry">
            <span class="log-${log.type}">${log.message}</span>
        </div>
    `).join('');
}

// 버튼 업데이트
function updateButtons() {
    const nextTurnBtn = document.getElementById('nextTurnBtn');
    if (nextTurnBtn) {
        nextTurnBtn.disabled = gameState.isRunning;
        
        // 0턴일 때 버튼 텍스트 변경
        if (gameState.turn === 0) {
            nextTurnBtn.textContent = '시뮬레이션 시작';
        } else {
            nextTurnBtn.textContent = '다음 턴';
        }
    }
}

// 생존자 편집
function editSurvivor(id) {
    const survivor = gameState.survivors.find(s => s.id === id);
    if (!survivor) return;
    
    showPopup('editSurvivor', survivor);
}

// 생존자 삭제
function deleteSurvivor(id) {
    if (!confirm('정말로 이 생존자를 삭제하시겠습니까?')) return;
    
    const survivor = gameState.survivors.find(s => s.id === id);
    gameState.survivors = gameState.survivors.filter(s => s.id !== id);
    addLog(`${survivor.name}이(가) 목록에서 제거되었다.`, 'system');
    updateDisplay();
}

// 행동 설정
function setAction(survivorId, action) {
    gameState.survivors = gameState.survivors.map(s => 
        s.id === survivorId ? { ...s, currentAction: action } : s
    );
    
    // 메인 화면의 배지 즉시 업데이트
    updateDisplay();
    
    // 현재 팝업의 스크롤 위치 저장
    const popup = document.querySelector('.popup');
    const scrollPosition = popup ? popup.scrollTop : 0;
    
    // 팝업 내용 업데이트
    const popupContainer = document.querySelector('.popup-content');
    if (popupContainer) {
        popupContainer.innerHTML = getActionsPopup().match(/<div class="popup-content">([\s\S]*)<\/div>\s*$/)[1];
        lucide.createIcons();
        
        // 스크롤 위치 복원
        if (popup) {
            popup.scrollTop = scrollPosition;
        }
    }
}

// 데이터 저장
function saveData() {
    const data = {
        survivors: gameState.survivors,
        logs: gameState.logs,
        turn: gameState.turn,
        gamePhase: gameState.gamePhase,
        subGameType: gameState.subGameType,
        subGameTurn: gameState.subGameTurn,
        turnDialogues: gameState.turnDialogues,
        hasStarted: gameState.hasStarted,
        initialTrialPopupsShown: gameState.initialTrialPopupsShown,
        mainGameTurn: gameState.mainGameTurn,
        usedTrialEvents: gameState.usedTrialEvents,
        laptopEventOccurred: gameState.laptopEventOccurred
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `YTTD_Simulator_${data.actualTurn}turn.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// 데이터 로드
function loadData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            gameState.survivors = (data.survivors || []).map(s => ({
                ...s,
                initialRelationshipTypes: s.initialRelationshipTypes || {}  // 초기 관계 복원
            }));
            gameState.logs = data.logs || [];
            gameState.turn = data.turn || 0;
            gameState.gamePhase = data.gamePhase || 'initial';
            gameState.subGameType = data.subGameType || null;
            gameState.subGameTurn = data.subGameTurn || 0;
            gameState.turnDialogues = data.turnDialogues || {};
            gameState.hasStarted = data.hasStarted || false;
            gameState.initialTrialPopupsShown = data.initialTrialPopupsShown || {};
            gameState.mainGameTurn = data.mainGameTurn || 0;
            gameState.usedTrialEvents = data.usedTrialEvents || []; 
            addLog('데이터를 불러왔다.', 'system');
            updateDisplay();
            
            // 팝업 닫기
            closePopup();
        } catch (error) {
            alert('파일을 읽을 수 없다.');
            console.error('Load data error:', error);
        }
    };
    reader.readAsText(file);
}

function showAddSurvivorPopup() {
    const container = document.getElementById('popupContainer');
    
    container.innerHTML = `
        <div class="popup-overlay" onclick="closePopup(event)">
            <div class="popup" onclick="event.stopPropagation()">
                <div class="popup-header">
                    <h2 class="popup-title">생존자 추가</h2>
                    <button class="popup-close" onclick="closePopup()">
                        <i data-lucide="x" size="24"></i>
                    </button>
                </div>
                <div class="popup-content">
                    ${getSurvivorForm()}
                </div>
            </div>
        </div>
    `;
    
    lucide.createIcons();
}

// 팝업 표시
function showPopup(type, data = null) {
    const container = document.getElementById('popupContainer');
    
    let content = '';
    
    switch (type) {
        case 'survivors':
            content = getSurvivorsPopup();
            break;
        case 'editSurvivor':
            content = getEditSurvivorPopup(data);
            break;
        case 'actions':
            content = getActionsPopup();
            break;
        case 'relationships':
            content = getRelationshipsPopup();
            break;
        case 'settings':
            content = getSettingsPopup();
            break;
        case 'help':
            content = getHelpPopup();
            break;
    }
    
    container.innerHTML = `
        <div class="popup-overlay" onclick="closePopup(event)">
            <div class="popup" onclick="event.stopPropagation()">
                ${content}
            </div>
        </div>
    `;
    
    lucide.createIcons();
    
    if (type === 'relationships') {
        setTimeout(() => drawRelationshipGraph(), 100);
    }
}

// 팝업 닫기
function closePopup(event) {
    if (event && event.target.className !== 'popup-overlay') return;
    document.getElementById('popupContainer').innerHTML = '';
}

// 스킬 토글
function toggleSkills(survivorId) {
    const content = document.getElementById(`skills-content-${survivorId}`);
    const icon = document.getElementById(`skills-icon-${survivorId}`);
    
    if (content && icon) {
        content.classList.toggle('expanded');
        icon.classList.toggle('expanded');
    }
}

// 생존자 관리 팝업
function getSurvivorsPopup() {
    return `
        <div class="popup-header">
            <h2 class="popup-title">생존자 관리</h2>
            <button class="popup-close" onclick="closePopup()">
                <i data-lucide="x" size="24"></i>
            </button>
        </div>
        <div class="popup-content">
            <button onclick="showAddSurvivorForm()" class="btn btn-purple" style="margin-bottom: 1rem;">
                <i data-lucide="plus"></i> 생존자 추가
            </button>
            
            <div id="addSurvivorForm" style="display: none;"></div>
            
            <div style="text-align: center; color: var(--text-secondary); padding: 1rem;">
                ${gameState.survivors.length === 0 ? '생존자를 추가해주세요' : `이 ${gameState.survivors.length}명의 생존자가 등록되었다`}
            </div>
        </div>
    `;
}

// 생존자 추가 폼 표시
function showAddSurvivorForm() {
    const form = document.getElementById('addSurvivorForm');
    form.style.display = 'block';
    form.innerHTML = getSurvivorForm();
    lucide.createIcons();
}

// 전역 함수로 이동 (getSurvivorForm 밖으로)
window.tempRelationships = [];

function updateRelationshipsList() {
    const list = document.getElementById('relationshipsList');
    if (!list) return;
    
    if (!window.tempRelationships || window.tempRelationships.length === 0) {
        list.innerHTML = '<font-size: 0.875rem; color: var(--text-tertiary);">설정된 관계가 없다</div>';
        return;
    }
    
    list.innerHTML = window.tempRelationships.map((rel, idx) => {
        const target = gameState.survivors.find(s => s.id === rel.targetId);
        return target ? `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: var(--bg-primary-tran); border-radius: 0.5rem;">
                <span style="font-size: 0.875rem;">${target.name} - ${rel.type}</span>
                <button onclick="removeRelationship(${idx})" class="icon-btn delete" style="padding: 0.25rem;">
                    <i data-lucide="x" size="10"></i>
                </button>
            </div>
        ` : '';
    }).join('');
    lucide.createIcons();
}

function addRelationship() {
    const targetId = parseFloat(document.getElementById('relationshipTarget').value);
    const type = document.getElementById('relationshipType').value;
    
    if (!targetId || !type) {
        alert('대상과 관계를 모두 선택해주세요');
        return;
    }
    
    if (window.tempRelationships.some(r => r.targetId === targetId)) {
        alert('이미 설정된 대상입니다');
        return;
    }
    
    window.tempRelationships.push({ targetId, type });
    document.getElementById('relationshipTarget').value = '';
    document.getElementById('relationshipType').value = '';
    updateRelationshipsList();
}

function removeRelationship(idx) {
    window.tempRelationships.splice(idx, 1);
    updateRelationshipsList();
}

function updateStatPreview() {
    const strEl = document.getElementById('survivorStrength');
    const agiEl = document.getElementById('survivorAgility');
    const intEl = document.getElementById('survivorIntelligence');
    const chaEl = document.getElementById('survivorCharisma');
    const chrEl = document.getElementById('survivorCharm');
    const perEl = document.getElementById('survivorPersonality');
    
    if (!strEl || !agiEl || !intEl || !chaEl || !chrEl || !perEl) return;
    
    const str = parseInt(strEl.value);
    const agi = parseInt(agiEl.value);
    const int = parseInt(intEl.value);
    const cha = parseInt(chaEl.value);
    const chr = parseInt(chrEl.value);
    const personality = perEl.value;
    
    let hp;
    if (str > 5) {
        hp = 100 + ((str - 5) * 10);
    } else if (str < 5) {
        hp = 100 - ((5 - str) * 10);
    } else {
        hp = 100;
    }
    
    const mentalAvg = (int + agi) / 2;
    let mental;
    if (mentalAvg > 5) {
        mental = 100 + ((mentalAvg - 5) * 10);
    } else if (mentalAvg < 5) {
        mental = 100 - ((5 - mentalAvg) * 10);
    } else {
        mental = 100;
    }
    
    const egoPersonalities = ['냉정한', '지능적인', '사이코패스', '소시오패스', '생명경시', '염세적인'];
    if (egoPersonalities.includes(personality)) {
        mental += 20;
    }
    
    const trustAvg = (cha + chr) / 2;
    let trust;
    if (trustAvg > 5) {
        trust = 50 + ((trustAvg - 5) * 10);
    } else if (trustAvg < 5) {
        trust = 50 - ((5 - trustAvg) * 10);
    } else {
        trust = 50;
    }
    
    const previewHp = document.getElementById('previewHp');
    const previewMental = document.getElementById('previewMental');
    const previewTrust = document.getElementById('previewTrust');
    
    if (previewHp) previewHp.textContent = Math.round(hp);
    if (previewMental) previewMental.textContent = Math.round(mental);
    if (previewTrust) previewTrust.textContent = Math.round(trust);
}

// getSurvivorForm 함수에서 <script> 태그 완전히 제거하고
// 마지막 부분만 수정
function getSurvivorForm(survivor = null) {
    const isEdit = survivor !== null;
    const s = survivor || {
        name: '', job: '고등학생', strength: 5, agility: 5, intelligence: 5,
        charisma: 5, charm: 5, gender: '남성', personality: '평범함', status: '인간', image: null,
        relationships: []
    };
    
    const otherSurvivors = gameState.survivors.filter(sv => !survivor || sv.id !== survivor.id);
    
    // tempRelationships 초기화
    if (isEdit) {
        window.tempRelationships = Object.entries(s.relationshipTypes || {}).map(([id, type]) => ({ 
            targetId: parseFloat(id), 
            type 
        }));
    } else {
        window.tempRelationships = [];
    }
    
    const formHTML = `
        <div class="form">
            <div class="form-grid">
                <input type="text" id="survivorName" placeholder="이름" value="${s.name}" class="form-input">
                
                <select id="survivorJob" class="form-select">
                    ${Object.entries(JOB_CATEGORIES).map(([category, jobs]) => `
                        <optgroup label="${category}">
                            ${jobs.map(job => `<option ${s.job === job ? 'selected' : ''}>${job}</option>`).join('')}
                        </optgroup>
                    `).join('')}
                </select>
                
                ${['strength', 'agility', 'intelligence', 'charisma', 'charm'].map(stat => {
                    const labels = { strength: '힘', agility: '민첩', intelligence: '지능', charisma: '카리스마', charm: '매력' };
                    return `
                        <div class="form-group">
                            <label class="form-label">${labels[stat]}: <span id="${stat}Value">${s[stat]}</span></label>
                            <input type="range" id="survivor${stat.charAt(0).toUpperCase() + stat.slice(1)}" 
                                   min="1" max="10" value="${s[stat]}" class="form-range"
                                   oninput="document.getElementById('${stat}Value').textContent = this.value; updateStatPreview()">
                        </div>
                    `;
                }).join('')}
                
                <select id="survivorGender" class="form-select">
                    ${GENDERS.map(g => `<option ${s.gender === g ? 'selected' : ''}>${g}</option>`).join('')}
                </select>
                
                <select id="survivorPersonality" class="form-select" onchange="updateStatPreview()">
                    ${Object.entries(PERSONALITY_CATEGORIES).map(([category, personalities]) => `
                        <optgroup label="${category}">
                            ${personalities.map(p => `<option ${s.personality === p ? 'selected' : ''}>${p}</option>`).join('')}
                        </optgroup>
                    `).join('')}
                </select>
                
                <div class="col-span-2" style="display: flex; flex-direction: column; align-items: center;">
                    <label class="form-label">스탯에 따른 능력치 미리보기</label>
                    <div id="statPreview" style="font-size: 0.875rem;text-align: center;color: var(--text-tertiary);padding: 0.5rem;background: var(--bg-primary-tran);border-radius: 0.25rem;width: 100%;">
                        체력: <span id="previewHp">100</span> | 정신력: <span id="previewMental">100</span> | 신뢰도: <span id="previewTrust">50</span>
                    </div>
                </div>
                
                <div class="col-span-2">
                    <label class="form-label">캐릭터 이미지 (선택사항)</label>
                    <input type="file" id="survivorImage" accept="image/*" onchange="previewImage(event)" style="width: 100%;">
                    <img id="imagePreview" src="${s.image || ''}" style="display: ${s.image ? 'block' : 'none'};" class="preview-image">
                </div>
                
                ${otherSurvivors.length > 0 ? `
                    <div class="col-span-2">
                        <label class="form-label">다른 캐릭터와의 관계 설정 (선택사항)</label>
                        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <select id="relationshipTarget" class="form-select" style="flex: 1;">
                                <option value="">대상 선택</option>
                                ${otherSurvivors.map(other => `<option value="${other.id}">${other.name}</option>`).join('')}
                            </select>
                            <select id="relationshipType" class="form-select" style="flex: 1;">
                                <option value="낯선 사람">낯선 사람</option>
                                <option value="서먹함">서먹함</option>
                                <option value="친구">친구</option>
                                <option value="동료">동료</option>
                                <option value="연인">연인</option>
                                <option value="부부">부부</option>
                                <option value="형제/자매">형제/자매</option>
                                <option value="부모/자식">부모/자식</option>
                                <option value="짝사랑">짝사랑</option>
                                <option value="유사가족">유사가족</option>
                                <option value="친척">친척</option>
                            </select>
                            <button onclick="addRelationship()" class="btn btn-green" style="padding: 0.5rem 1rem;">추가</button>
                        </div>
                        <div id="relationshipsList" style="display: flex; flex-direction: column; gap: 0.25rem;">
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <button onclick="${isEdit ? `updateSurvivor(${survivor.id})` : 'addSurvivor()'}" 
                    class="btn ${isEdit ? 'btn-blue' : 'btn-green'}" 
                    style="width: 50%;margin-top: 1rem;text-align: center;align-items: center;margin-left: auto;margin-right: auto;display: flex;justify-content: center;">
                ${isEdit ? '수정 완료' : '생존자 추가'}
            </button>
        </div>
    `;
    
    // DOM에 추가된 후 초기화 함수 실행
    setTimeout(() => {
        updateStatPreview();
        updateRelationshipsList();
    }, 0);
    
    return formHTML;
}

// 이미지 미리보기
function previewImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            // 이미지 리사이즈 (최대 200x200)
            const canvas = document.createElement('canvas');
            const maxSize = 200;
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
                if (width > maxSize) {
                    height *= maxSize / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width *= maxSize / height;
                    height = maxSize;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // 압축된 이미지 데이터
            const compressedData = canvas.toDataURL('image/jpeg', 0.7);
            
            const preview = document.getElementById('imagePreview');
            preview.src = compressedData;
            preview.style.display = 'block';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 생존자 추가
function addSurvivor() {
    const name = document.getElementById('survivorName').value.trim();
    if (!name) {
        alert('이름을 입력해주세요!');
        return;
    }
    
    const newSurvivor = {
        name,
        job: document.getElementById('survivorJob').value,
        strength: parseInt(document.getElementById('survivorStrength').value),
        agility: parseInt(document.getElementById('survivorAgility').value),
        intelligence: parseInt(document.getElementById('survivorIntelligence').value),
        charisma: parseInt(document.getElementById('survivorCharisma').value),
        charm: parseInt(document.getElementById('survivorCharm').value),
        gender: document.getElementById('survivorGender').value,
        personality: document.getElementById('survivorPersonality').value,
        image: (document.getElementById('imagePreview').src && 
        document.getElementById('imagePreview').src !== window.location.href) 
        ? document.getElementById('imagePreview').src : null
    };
    
    const survivor = initializeSurvivor(newSurvivor);
    
    gameState.survivors.forEach(s => {
        survivor.favorability[s.id] = 0;
        s.favorability[survivor.id] = 0;
    });
    
    if (window.tempRelationships && window.tempRelationships.length > 0) {
        window.tempRelationships.forEach(rel => {
            const favorabilityValue = INITIAL_RELATIONSHIP_VALUES[rel.type];
            survivor.favorability[rel.targetId] = favorabilityValue;
            survivor.relationshipTypes[rel.targetId] = rel.type;

            const familyRelations = ['형제/자매', '부모/자식', '유사가족', '친척'];
            if (familyRelations.includes(rel.type)) {
                if (!survivor.allianceWith) survivor.allianceWith = [];
                survivor.allianceWith.push(rel.targetId);
            }
            
            // 짝사랑은 한쪽만 설정
            if (rel.type !== '짝사랑') {
                gameState.survivors = gameState.survivors.map(s => {
                    if (s.id === rel.targetId) {
                        const updatedSurvivor = {
                            ...s,
                            favorability: { ...s.favorability, [survivor.id]: favorabilityValue },
                            relationshipTypes: { ...s.relationshipTypes, [survivor.id]: rel.type }
                        };
                        
                        if (familyRelations.includes(rel.type)) {
                            if (!updatedSurvivor.allianceWith) updatedSurvivor.allianceWith = [];
                            updatedSurvivor.allianceWith.push(survivor.id);
                        }
                        return updatedSurvivor;
                    }
                    return s;
                });
            }
        });
    }
    
    gameState.survivors.push(survivor);
    if (gameState.hasStarted) {
        const joinMessages = [
            `숨어있던 ${name}을(를) 발견했다.`,
            `${name}이(가) 합류했다.`,
            `정신을 잃고 쓰러져있던 ${name}을(를) 발견했다.`
        ];
        const randomMessage = joinMessages[Math.floor(Math.random() * joinMessages.length)];
        addLog(randomMessage, 'join');
    } else {
        addLog(`${name}이(가) 참가했다.`, 'join');
    }
    
    closePopup();
    updateDisplay();
}

// 생존자 편집 팝업
function getEditSurvivorPopup(survivor) {
    return `
        <div class="popup-header">
            <h2 class="popup-title">생존자 수정</h2>
            <button class="popup-close" onclick="closePopup()">
                <i data-lucide="x" size="24"></i>
            </button>
        </div>
        <div class="popup-content">
            ${getSurvivorForm(survivor)}
        </div>
    `;
}

// 생존자 업데이트
function updateSurvivor(id) {
    const name = document.getElementById('survivorName').value.trim();
    if (!name) {
        alert('이름을 입력해주세요!');
        return;
    }
    
    const survivor = gameState.survivors.find(s => s.id === id);
    if (!survivor) {
        alert('생존자를 찾을 수 없습니다.');
        return;
    }
    
    const strength = parseInt(document.getElementById('survivorStrength').value);
    const agility = parseInt(document.getElementById('survivorAgility').value);
    const intelligence = parseInt(document.getElementById('survivorIntelligence').value);
    const charisma = parseInt(document.getElementById('survivorCharisma').value);
    const charm = parseInt(document.getElementById('survivorCharm').value);
    const personality = document.getElementById('survivorPersonality').value;
    const personalityType = getPersonalityType(personality);
    
    let calculatedHp = 100 + ((strength - 5) * 15);
    let newMaxHp = Math.min(150, Math.max(75, calculatedHp));
    
    const mentalAvg = (intelligence + agility) / 2;
    let newMaxMental = 100 + ((mentalAvg - 5) * 10);
    if (personalityType === 'egocentric') {
        newMaxMental += 20;
    }
    newMaxMental = Math.max(50, Math.min(200, newMaxMental));
    
    const trustAvg = (charisma + charm) / 2;
    let newBaseTrust;
    if (trustAvg > 5) {
        newBaseTrust = 50 + ((trustAvg - 5) * 10);
    } else if (trustAvg < 5) {
        newBaseTrust = 50 - ((5 - trustAvg) * 10);
    } else {
        newBaseTrust = 50;
    }
    const newInitialRelationships = {};

    // 관계 업데이트 - 기존 관계 초기화하고 새로 설정
    if (window.tempRelationships && window.tempRelationships.length > 0) {
        // 기존 관계 타입 초기화
        survivor.relationshipTypes = {};
        
        // 설정되지 않은 관계는 0(낯선 사람)으로 초기화
        gameState.survivors.forEach(s => {
            if (s.id !== id) {
                const hasRelation = window.tempRelationships.some(rel => rel.targetId === s.id);
                if (!hasRelation) {
                    survivor.favorability[s.id] = 0;
                    // 상대방도 관계가 없으면 0으로
                    if (!s.relationshipTypes || !s.relationshipTypes[id]) {
                        s.favorability[id] = 0;
                    }
                }
            }
        });
        
        // 새로 설정된 관계 적용
        window.tempRelationships.forEach(rel => {
            const favorabilityValue = INITIAL_RELATIONSHIP_VALUES[rel.type];
            
            // 현재 호감도가 설정 값보다 낮으면 업데이트
            if ((survivor.favorability[rel.targetId] || 0) < favorabilityValue) {
                survivor.favorability[rel.targetId] = favorabilityValue;
            }
            survivor.relationshipTypes[rel.targetId] = rel.type;
            
            // 짝사랑이 아니면 양방향 설정
            if (rel.type !== '짝사랑') {
                gameState.survivors = gameState.survivors.map(s => {
                    if (s.id === rel.targetId) {
                        const minFav = INITIAL_RELATIONSHIP_VALUES[rel.type];
                        if ((s.favorability[id] || 0) < minFav) {
                            s.favorability[id] = minFav;
                        }
                        if (!s.relationshipTypes) s.relationshipTypes = {};
                        s.relationshipTypes[id] = rel.type;
                    }
                    return s;
                });
            }
        });
    } else {
        // 관계 설정이 없으면 모두 0(낯선 사람)으로
        survivor.relationshipTypes = {};
        gameState.survivors.forEach(s => {
            if (s.id !== id) {
                survivor.favorability[s.id] = 0;
                // 상대방도 관계가 없으면 0으로
                if (!s.relationshipTypes || !s.relationshipTypes[id]) {
                    s.favorability[id] = 0;
                }
            }
        });
    }
    
    gameState.survivors = gameState.survivors.map(s => {
        if (s.id !== id) return s;
        
        const newHp = Math.min(s.hp, newMaxHp);
        const newMental = Math.min(s.mental, newMaxMental);
        
        return {
            ...s,
            name,
            job: document.getElementById('survivorJob').value,
            strength,
            agility,
            intelligence,
            charisma,
            charm,
            gender: document.getElementById('survivorGender').value,
            personality,
            status: '인간',
            image: (document.getElementById('imagePreview').src && 
                document.getElementById('imagePreview').src !== window.location.href)
                ? document.getElementById('imagePreview').src : s.image,
            maxHp: newMaxHp,
            hp: newHp,
            maxMental: newMaxMental,
            mental: newMental,
            trust: newBaseTrust
        };
    });

    closePopup();
    updateDisplay();
}

// 행동 준비 팝업
function getActionsPopup() {
    const aliveSurvivors = gameState.survivors.filter(s => s.isAlive);
    
    return `
        <div class="popup-header">
            <h2 class="popup-title">행동 준비</h2>
            <p class="action-hint">행동을 선택하지 않으면 자유 행동을 합니다</p>
            <button class="popup-close" onclick="closePopup()">
                <i data-lucide="x" size="24"></i>
            </button>
        </div>
        <div class="popup-content">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                ${aliveSurvivors.map(s => {
                    const allyCount = Object.values(s.allianceWith).length;
                    const isAllianceFull = allyCount > aliveSurvivors.length / 2;
                    const hasOthers = aliveSurvivors.length > 1;
                    
                    return `
                    <div class="form" style="margin-bottom: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                            <h3 style="font-weight: bold; font-size: 1rem; margin: 0;">
                                ${s.name}
                                ${s.isPanic ? '<span style="color: #dc2626; font-size: 0.75rem; display: block;">(패닉 상태 - 행동 불가)</span>' : ''}
                            </h3>
                            ${s.currentAction && s.currentAction !== 'free' ? `
                                <button onclick="setAction(${s.id}, null)" class="icon-btn delete" style="padding: 0.25rem;" title="행동 취소">
                                    <i data-lucide="x" size="10"></i>
                                </button>
                            ` : ''}
                        </div>
                        
                        <!-- 캐릭터 정보 추가 -->
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.75rem; line-height: 1.5;">
                            <div style="display: flex; justify-content: space-between;">
                                <span>체력: ${s.hp}/${s.maxHp}</span>
                                <span>정신력: ${s.mental}/${s.maxMental}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-top: 0.25rem;">
                                <span>신뢰도: ${s.trust}</span>
                                ${s.tokens > 0 || (s.bodyPartsDisplay && s.bodyPartsDisplay.length > 0) ? `
                                    <span>
                                        ${s.tokens > 0 ? `🪙${s.tokens}` : ''}
                                        ${s.bodyPartsDisplay && s.bodyPartsDisplay.length > 0 ? `🦾${s.bodyPartsDisplay.length}/6` : ''}
                                    </span>
                                ` : '<span>-</span>'}
                            </div>
                            <div style="margin-top: 0.25rem;">
                                <span>동맹: ${allyCount}명</span>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                            ${[
                                { id: 'explore', label: '정보탐색', disabled: s.isPanic },
                                { id: 'active', label: '적극행동', disabled: s.isPanic },
                                { id: 'rest', label: '휴식', disabled: s.isPanic || gameState.gamePhase === 'main' || s.inCoffin },
                                { id: 'heal', label: '부상치료', disabled: s.isPanic || gameState.gamePhase === 'main' || s.inCoffin },
                                { id: 'talk', label: '대화하기', disabled: s.isPanic || !hasOthers },
                                { id: 'alliance', label: '동맹제의', disabled: s.isPanic || gameState.gamePhase === 'main' || isAllianceFull }
                            ].map(action => `
                                <button class="action-btn ${s.currentAction === action.id ? 'selected' : ''}"
                                        ${action.disabled ? 'disabled' : ''}
                                        onclick="setAction(${s.id}, '${action.id}')"
                                        ${action.id === 'alliance' && isAllianceFull ? 'title="동맹을 맺은 생존자가 너무 많아 의심을 받을 것 같다"' : ''}
                                        ${action.id === 'talk' && !hasOthers ? 'title="대화할 상대가 없다"' : ''}>
                                    ${action.label}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `}).join('')}
            </div>
        </div>
    `;
}

// 인물 관계도 팝업
function getRelationshipsPopup() {
    const aliveSurvivors = gameState.survivors.filter(s => s.isAlive);
    
    if (aliveSurvivors.length === 0) {
        return `
            <div class="popup-header">
                <h2 class="popup-title">인물 관계도</h2>
                <button class="popup-close" onclick="closePopup()">
                    <i data-lucide="x" size="24"></i>
                </button>
            </div>
            <div class="popup-content">
                <div style="text-align: center; color: var(--text-tertiary); padding: 2rem;">생존자 없음</div>
            </div>
        `;
    }
    
    return `
        <div class="popup-header">
            <h2 class="popup-title">인물 관계도</h2>
            <button class="popup-close" onclick="closePopup()">
                <i data-lucide="x" size="24"></i>
            </button>
        </div>
        <div class="popup-content">
            <canvas id="relationshipCanvas" width="800" height="800" style="width: 100%; max-width: 800px; height: auto; display: block; margin: 0 auto;"></canvas>
            <div style="margin-top: 1rem; padding: 1rem; background: transparent; border-radius: 0.5rem;">
                <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.5rem; font-size: 0.8rem;">
                    <div><span style="color: #dc2626;">━━</span> 부부</div>
                    <div><span style="color: #f43f5e;">━━</span> 연인</div>
                    <div><span style="color: #ec4899;">━━</span> 짝사랑</div>
                    <div><span style="color: #22c55e;">━━</span> 친구</div>
                    <div><span style="color: #3b82f6;">━━</span> 동료</div>
                    <div><span style="color: #8b5cf6;">━━</span> 유사가족</div>
                    <div><span style="color: #eab308;">━━</span> 형제/자매</div>
                    <div><span style="color: #f59e0b;">━━</span> 부모/자식</div>
                    <div><span style="color: #6b7280;">━━</span> 낯선 사람</div>
                    <div><span style="color: #ef4444;">━━</span> 라이벌</div>
                    <div><span style="color: #991b1b;">━━</span> 증오</div>
                </div>
            </div>
        </div>
    `;
}

// 팝업이 표시된 직후 캔버스 그리기
function showPopup(type, data = null) {
    const container = document.getElementById('popupContainer');
    
    let content = '';
    
    switch (type) {
        case 'survivors':
            content = getSurvivorsPopup();
            break;
        case 'editSurvivor':
            content = getEditSurvivorPopup(data);
            break;
        case 'actions':
            content = getActionsPopup();
            break;
        case 'relationships':
            content = getRelationshipsPopup();
            break;
        case 'settings':
            content = getSettingsPopup();
            break;
        case 'help':
            content = getHelpPopup();
            break;
    }
    
    container.innerHTML = `
        <div class="popup-overlay" onclick="closePopup(event)">
            <div class="popup" onclick="event.stopPropagation()">
                ${content}
            </div>
        </div>
    `;
    
    lucide.createIcons();
    
    // 관계도 캔버스 그리기
    if (type === 'relationships') {
        setTimeout(() => drawRelationshipGraph(), 100);
    }
}

// 새로운 함수: 관계도 그리기
function drawRelationshipGraph() {
    const canvas = document.getElementById('relationshipCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const survivors = gameState.survivors.map(s => ({
        id: s.id,
        name: s.name,
        image: s.image,
        favorability: s.favorability,
        relationshipTypes: s.relationshipTypes || {}
    }));
    
    if (survivors.length === 0) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 300;
    const nodeRadius = 50;
    
    const positions = survivors.map((s, i) => {
        const angle = (i / survivors.length) * Math.PI * 2 - Math.PI / 2;
        return {
            ...s,
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
        };
    });
    
    function getRelationshipColor(type) {
        const colors = {
            '부부': '#dc2626',
            '연인': '#f43f5e',
            '짝사랑': '#ec4899',
            '친구': '#22c55e',
            '동료': '#3b82f6',
            '형제/자매': '#eab308',
            '부모/자식': '#f59e0b',
            '유사가족': '#8b5cf6',
            '친척': '#a78bfa',
            '낯선 사람': '#6b7280',
            '서먹함': '#9ca3af',
            '어색함': '#f97316',
            '라이벌': '#ef4444',
            '증오': '#991b1b'
        };
        return colors[type] || '#9ca3af';
    }
    
    // 배경 초기화
    ctx.fillStyle = "transparent";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 관계선 그리기
    positions.forEach(person => {
        positions.forEach(target => {
            if (person.id >= target.id) return;
            
            const fav = person.favorability[target.id] || 50;
            const baseRelation = person.relationshipTypes[target.id];
            
            let relationType;
            if (baseRelation && ['형제/자매', '부모/자식', '유사가족', '친척'].includes(baseRelation)) {
                relationType = baseRelation;
            } else if (baseRelation === '짝사랑') {
                // 짝사랑은 한쪽 방향으로만
                const color = getRelationshipColor('짝사랑');
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(person.x, person.y);
                ctx.lineTo(target.x, target.y);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // 화살표
                const angle = Math.atan2(target.y - person.y, target.x - person.x);
                const arrowX = target.x - Math.cos(angle) * nodeRadius;
                const arrowY = target.y - Math.sin(angle) * nodeRadius;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(arrowX, arrowY);
                ctx.lineTo(arrowX - 10 * Math.cos(angle - Math.PI / 6), arrowY - 10 * Math.sin(angle - Math.PI / 6));
                ctx.lineTo(arrowX - 10 * Math.cos(angle + Math.PI / 6), arrowY - 10 * Math.sin(angle + Math.PI / 6));
                ctx.closePath();
                ctx.fill();
                return;
            } else {
                if (fav >= 1500) relationType = '부부';
                else if (fav >= 900) relationType = '연인';
                else if (fav >= 250) relationType = '친구';
                else if (fav >= 80) relationType = '동료';
                else if (fav >= 40) relationType = '서먹함';
                else if (fav >= 0) relationType = '낯선 사람';
                else if (fav >= -10) relationType = '어색함';
                else if (fav >= -80) relationType = '라이벌';
                else relationType = '증오';
            }
            
            const color = getRelationshipColor(relationType);
            const lineWidth = relationType === '부부' ? 5 : relationType === '연인' ? 4 : 2;
            
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(person.x, person.y);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();
        });
    });
    
    // 노드 그리기
    positions.forEach(person => {
        // 원 테두리
        ctx.fillStyle = 'white';
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(person.x, person.y, nodeRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // 이미지 또는 아이콘
        if (person.image && person.image !== 'data:,' && person.image !== '') {
            const img = new Image();
            img.onload = () => {
                ctx.save();
                ctx.beginPath();
                ctx.arc(person.x, person.y, nodeRadius - 5, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(img, person.x - nodeRadius + 5, person.y - nodeRadius + 5, (nodeRadius - 5) * 2, (nodeRadius - 5) * 2);
                ctx.restore();
                
                // 이미지 로드 후 죽음 배지와 이름 그리기
                drawDeathBadgeAndName(person);
            };
            img.src = person.image;
        } else {
            // 기본 아이콘
            ctx.fillStyle = '#6b7280';
            ctx.font = 'bold 32px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('👤', person.x, person.y);
            
            // 기본 아이콘 후 죽음 배지와 이름 그리기
            drawDeathBadgeAndName(person);
        }
    });
    
    // 죽음 배지와 이름을 그리는 헬퍼 함수
    function drawDeathBadgeAndName(person) {
        const survivor = gameState.survivors.find(s => s.id === person.id);
        
        // 사망 배지 (이미지/아이콘 위에 그려짐)
        if (survivor && !survivor.isAlive) {
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.arc(person.x + nodeRadius - 15, person.y - nodeRadius + 15, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💀', person.x + nodeRadius - 15, person.y - nodeRadius + 15);
        }
        
        // 이름 (흰색 아웃라인 추가)
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // 아웃라인 (흰색)
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 4;
        ctx.strokeText(person.name, person.x, person.y + nodeRadius + 20);

        // 텍스트 (검은색)
        ctx.fillStyle = '#111827';
        ctx.fillText(person.name, person.x, person.y + nodeRadius + 20);
    }
}

// 설정 팝업
function getSettingsPopup() {
    return `
        <div class="popup-header">
            <h2 class="popup-title">시스템 설정</h2>
            <button class="popup-close" onclick="closePopup()">
                <i data-lucide="x" size="24"></i>
            </button>
        </div>
        <div class="popup-content">
            <div class="form">
                <h3 style="font-weight: bold; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="database" size="20" style="color: #16a34a;"></i>
                    데이터 관리
                </h3>
                <p style="font-size: 0.875rem; color: var(--text-tertiary); margin-bottom: 1rem;">
                    현재 시뮬레이션 데이터를 JSON 형식으로 저장하거나 불러올 수 있습니다.
                </p>
                <div style="display: flex; gap: 0.75rem;">
                    <button onclick="saveData()" class="btn btn-save" style="flex: 1; color: white; font-size: 1rem; font-weight: 600;">
                        <i data-lucide="download"></i> 데이터 저장
                    </button>
                    <label class="btn btn-load" style="flex: 1; color: white; font-size: 1rem; font-weight: 600;">
                        <i data-lucide="upload"></i> 데이터 불러오기
                        <input type="file" accept=".json" onchange="loadData(event)" style="display: none;">
                    </label>
                </div>
            </div>

            <div class="form" style="margin-top: 1rem;">
                <h3 style="font-weight: bold; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="help-circle" size="20" style="color: #ffbb00;"></i>
                    도움말
                </h3>
                <p style="font-size: 0.875rem; color: var(--text-tertiary); margin-bottom: 1rem;">
                    게임 규칙과 조작법이 필요하신가요?
                </p>
                <button onclick="closePopup(); showPopup('help');" class="btn btn-purple" style="width: 100%; color: white; font-size: 1rem; font-weight: 600;">
                    <i data-lucide="book-open"></i> 게임 규칙 보기
                </button>
            </div>
        </div>
    `;
}

// 도움말 팝업
function getHelpPopup() {
    return `
        <div class="popup-header">
            <h2 class="popup-title">게임 규칙 안내</h2>
            <button class="popup-close" onclick="closePopup()">
                <i data-lucide="x" size="24"></i>
            </button>
        </div>
        <div class="popup-content">
            <div class="form">
                <h3 style="font-weight: bold; margin-bottom: 0.75rem;">
                    📋 기본 규칙
                </h3>
                <div style="padding: 0.75rem; background: var(--bg-primary); border-radius: 0.5rem; margin-bottom: 1rem;">
                    <p style="margin-bottom: 0.5rem; color: var(--text-primary);">• 첫 턴은 최초의 시련을 진행하며 확률로 탈락자가 나타나거나, 더미즈가 됩니다.</p>
                    <p style="margin-bottom: 0.5rem; color: var(--text-primary);">• 10턴 동안은 서브게임을 진행합니다. (신뢰매매/신체보물찾기/연회)</p>
                    <p style="margin-bottom: 0.5rem; color: var(--text-primary);">• 서브게임 이후 3턴동안은 메인게임을 진행합니다.</p>
                    <p style="margin-bottom: 0.5rem; color: var(--text-primary);">• 극소확률로 탈출구를 발견하여 나가는 것이 가능합니다.</p>
                    <p style="color: var(--text-primary);">• 행동을 선택하지 않으면 생존자가 자유롭게 행동합니다.</p>
                </div>
            </div>

            <div class="form">
                <h3 style="font-weight: bold; margin-bottom: 0.75rem;">
                    👥 생존자 특성
                </h3>
                <div style="padding: 0.75rem; background: var(--bg-primary); border-radius: 0.5rem; margin-bottom: 1rem;">
                    <p style="margin-bottom: 0.5rem; color: var(--text-primary);">• 생존자의 직업 및 성격 특성에 따라 호감도 증감률, 스탯, 신뢰도 증감률에 영향이 있습니다.</p>
                    <p style="margin-bottom: 0.5rem; color: var(--text-primary);">• 각 직업마다 고유한 직업 스킬이 자동으로 부여됩니다.</p>
                    <p style="margin-bottom: 0.5rem; color: var(--text-primary);">• 스탯이 높으면 특수 스킬을 획득할 수 있습니다.</p>
                    <p style="color: var(--text-primary);">• 정신력이 30% 이하로 떨어지면 패닉 상태가 됩니다.</p>
                </div>
            </div>

            <div class="form">
                <h3 style="font-weight: bold; margin-bottom: 0.75rem;">
                    🎮 서브게임 안내
                </h3>
                <div style="padding: 0.75rem; background: var(--bg-primary); border-radius: 0.5rem; margin-bottom: 0.5rem;">
                    <h4 style="font-weight: 600; margin-bottom: 0.5rem; color: var(--primary-color);">신뢰매매게임</h4>
                    <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6;"> 행동 시마다 토큰을 획득/분실합니다.</p>
                    <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6;"> 게임 종료 시 토큰이 가장 낮은 생존자는 체력과 정신력을 크게 잃고, 가장 높은 자는 스탯이나 스킬을 얻습니다.</p>
                </div>
                <div style="padding: 0.75rem; background: var(--bg-primary); border-radius: 0.5rem; margin-bottom: 0.5rem;">
                    <h4 style="font-weight: 600; margin-bottom: 0.5rem; color: var(--primary-color);">신체보물찾기</h4>
                    <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6;">행동 시마다 인형의 신체 부위(팔2, 다리2, 머리, 몸통)를 찾습니다.</p>
                    <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6;"> 가장 먼저 완성한 생존자는 체력을 잃거나 스탯/스킬을 얻습니다.</p>
                </div>
                <div style="padding: 0.75rem; background: var(--bg-primary); border-radius: 0.5rem; margin-bottom: 1rem;">
                    <h4 style="font-weight: 600; margin-bottom: 0.5rem; color: var(--primary-color);">연회</h4>
                    <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6;"> 더미즈는 관에 갇히며 치료/휴식이 불가능합니다.</p>
                    <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6;">게임 종료 시 신뢰도가 가장 낮은 더미즈는 사망합니다.</p>
                    <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6;">관에서 탈출한 더미즈도 게임 종료 시 방전되어 사망합니다.</p>
                </div>
            </div>

            <div class="form">
                <h3 style="font-weight: bold; margin-bottom: 0.75rem;">
                    🎯 메인게임 안내
                </h3>
                <div style="padding: 0.75rem; background: var(--bg-primary); border-radius: 0.5rem; margin-bottom: 1rem;">
                    <p style="margin-bottom: 0.5rem; color: var(--text-primary);">• 생존자 중 한 명을 투표로 선택합니다.</p>
                    <p style="margin-bottom: 0.5rem; color: var(--text-primary);">• <strong style="color: #eab308;">열쇠지기</strong>가 선택되면 대역을 제외한 모두가 사망합니다.</p>
                    <p style="margin-bottom: 0.5rem; color: var(--text-primary);">• <strong style="color: #22c55e;">현자</strong>가 선택되면 대역과 현자가 함께 사망합니다.</p>
                    <p style="margin-bottom: 0.5rem; color: var(--text-primary);">• <strong style="color: #ef4444;">대역</strong>이 선택되면 대역을 제외한 모두가 사망합니다.</p>
                    <p style="color: var(--text-primary);">• <strong style="color: #6b7280;">평민</strong>이 선택되면 대역과 평민이 함께 사망합니다.</p>
                </div>
            </div>

            <div class="form">
                <h3 style="font-weight: bold; margin-bottom: 0.75rem;">
                    ⌨️ 조작 안내
                </h3>
                <div style="padding: 0.75rem; background: var(--bg-primary); border-radius: 0.5rem;">
                    <p style="margin-bottom: 0.5rem; color: var(--text-primary);">• <strong>행동 준비:</strong> 각 생존자의 다음 턴 행동을 미리 설정할 수 있습니다.</p>
                    <p style="margin-bottom: 0.5rem; color: var(--text-primary);">• <strong>인물 관계도:</strong> 생존자들 간의 호감도와 관계를 한눈에 확인할 수 있습니다.</p>
                    <p style="margin-bottom: 0.5rem; color: var(--text-primary);">• <strong>관계 상세보기:</strong> 각 생존자 카드의 👥 버튼을 클릭하면 해당 생존자의 모든 관계를 확인할 수 있습니다.</p>
                    <p style="color: var(--text-primary);">• <strong>데이터 저장/불러오기:</strong> 설정 메뉴에서 현재 진행 상황을 저장하고 나중에 불러올 수 있습니다.</p>
                </div>
            </div>
        </div>
    `;
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', init);

// 엔딩 화면 표시
function showEndingScreen(winners) {
    if (winners.length === 0) return;
    
    const mainWinner = winners[0];
    const container = document.getElementById('popupContainer');
    
    let titleText = '';
    let subtitleText = '';
    
    if (winners.length === 1) {
        titleText = `${mainWinner.name}은(는) 홀로 살아남았다.`;
        subtitleText = '승리';
    } else if (winners.length === 2) {
        titleText = `${mainWinner.name}이(가) 승리했다.`;
        const otherWinner = winners[1];
        subtitleText = `${otherWinner.name}이(가) 함께 살아남았다.`;
    } else {
        titleText = `${mainWinner.name}이(가) 승리했습니다.`;
        const otherNames = winners.slice(1).map(w => w.name).join(', ');
        subtitleText = `${otherNames}이(가) 함께 살아남았다.`;
    }
    
    const survivorsHTML = winners.map(winner => {
        const personalityType = getPersonalityType(winner.personality);
        const quotes = ENDING_QUOTES[personalityType] || ENDING_QUOTES.stable;
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        
        return `
            <div class="ending-survivor">
                ${winner.image && winner.image !== 'data:,' && winner.image !== '' 
                    ? `<img src="${winner.image}" alt="${winner.name}" class="ending-survivor-image">`
                    : `<div class="ending-survivor-placeholder" style="background-color: ${getRandomColor(winner.id)};">
                        <i data-lucide="user" size="80" color="white"></i>
                    </div>`
                }
                <div class="ending-survivor-name">${winner.name}</div>
                <div class="ending-survivor-quote">"${randomQuote}"</div>
            </div>
        `;
    }).join('');
    
    // 로그 HTML 생성
    const logsHTML = gameState.logs.map(log => `
        <div class="log-entry">
            <span class="log-${log.type}">${log.message}</span>
        </div>
    `).join('');
    
    container.innerHTML = `
        <div class="ending-overlay">
            <div class="ending-content" id="endingContent">
                <div class="ending-title">${titleText}</div>
                <div class="ending-subtitle">${subtitleText}</div>
                <div class="ending-survivors">
                    ${survivorsHTML}
                </div>
                <div style="display: flex; gap: 1rem; margin-top: 2rem; justify-content: center;">
                    <button onclick="showEndingLogs()" class="btn btn-blue" style="padding: 0.75rem 1.5rem; font-size: 1rem;">
                        <i data-lucide="file-text"></i> 로그 확인하기
                    </button>
                    <button onclick="resetSimulation()" class="btn btn-green" style="padding: 0.75rem 1.5rem; font-size: 1rem;">
                        <i data-lucide="refresh-cw"></i> 새 시뮬레이션 시작
                    </button>
                </div>
            </div>
            
            <div class="ending-logs" id="endingLogs" style="display: none;">
                <div style="max-width: 800px; width: 100%; background: var(--bg-secondary); border-radius: 1rem; padding: 2rem; max-height: 80vh; display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h2 style="font-size: 1.5rem; font-weight: bold; color: var(--text-primary);">
                            <i data-lucide="file-text"></i> 시뮬레이션 로그
                        </h2>
                        <button onclick="hideEndingLogs()" class="btn btn-purple" style="padding: 0.5rem 1rem;">
                            <i data-lucide="eye"></i> 엔딩화면 보기
                        </button>
                    </div>
                    <div style="overflow-y: auto; flex: 1; background: var(--bg-primary); border-radius: 0.5rem; padding: 1rem;">
                        ${logsHTML}
                    </div>
                    <button onclick="resetSimulation()" class="btn btn-green" style="margin-top: 1rem; padding: 0.75rem; font-size: 1rem;">
                        <i data-lucide="refresh-cw"></i> 새 시뮬레이션 시작
                    </button>
                </div>
            </div>
        </div>
    `;
    
    lucide.createIcons();
}

// 엔딩 로그 표시
function showEndingLogs() {
    const endingContent = document.getElementById('endingContent');
    const endingLogs = document.getElementById('endingLogs');
    
    if (endingContent && endingLogs) {
        endingContent.style.display = 'none';
        endingLogs.style.display = 'flex';
        endingLogs.style.alignItems = 'center';
        endingLogs.style.justifyContent = 'center';
        
        lucide.createIcons();
    }
}

// 엔딩 로그 숨기기
function hideEndingLogs() {
    const endingContent = document.getElementById('endingContent');
    const endingLogs = document.getElementById('endingLogs');
    
    if (endingContent && endingLogs) {
        endingLogs.style.display = 'none';
        endingContent.style.display = 'block';
        
        lucide.createIcons();
    }
}

// 시뮬레이션 리셋 (생존자 목록은 유지)
function resetSimulation() {
    // 기존 생존자 정보 백업 (관계 정보 제외)
    const savedSurvivors = gameState.survivors.map(s => ({
        name: s.name,
        job: s.job,
        strength: s.strength,
        agility: s.agility,
        intelligence: s.intelligence,
        charisma: s.charisma,
        charm: s.charm,
        gender: s.gender,
        personality: s.personality,
        status: '인간',
        image: s.image,
        relationshipTypes: { ...s.relationshipTypes },
        savedFavorability: { ...s.favorability }
    }));
    
    // 게임 상태 완전 초기화
    gameState = {
        survivors: [],
        logs: [],
        turn: 0,
        actualTurn: 0,
        gamePhase: 'initial',
        subGameType: null,
        subGameTurn: 0,
        isRunning: false,
        timer: null,
        pendingAlliances: [],
        turnDialogues: {},
        hasStarted: false,
        initialTrialPopupsShown: {},
        mainGameTurn: 0,
        usedTrialEvents: [],
        pendingDiceRolls: 0,
        laptopEventOccurred: false
    };
    
    // 생존자 재등록
     savedSurvivors.forEach(survivorData => {
        const survivor = initializeSurvivor(survivorData);
        
        // 모든 생존자에 대한 호감도를 0으로 초기화
        gameState.survivors.forEach(s => {
            survivor.favorability[s.id] = 0;
            s.favorability[survivor.id] = 0;
        });
        
        gameState.survivors.push(survivor);
    });

    // ID 매핑 생성 (이름 기반)
    const idMapping = {};
    savedSurvivors.forEach((saved, index) => {
        const newSurvivor = gameState.survivors[index];
        // 이전 ID들과 새 ID 매핑
        const oldIds = savedSurvivors.map(s => 
            Object.keys(saved.relationshipTypes).find(id => 
                savedSurvivors.find(ss => ss === s && saved.relationshipTypes[id])
            )
        );
        idMapping[saved.name] = newSurvivor.id;
    });

    // 관계 재설정
    savedSurvivors.forEach((savedData, index) => {
        const survivor = gameState.survivors[index];
        
        // relationshipTypes 복원
        Object.entries(savedData.relationshipTypes).forEach(([oldTargetId, relationType]) => {
            // 이전 ID로 저장된 생존자의 이름 찾기
            const targetName = savedSurvivors.find((s, i) => {
                const targetSurvivor = gameState.survivors[i];
                return Object.keys(savedData.relationshipTypes).includes(String(targetSurvivor.id)) ||
                       savedSurvivors[i] === savedSurvivors.find(ss => 
                           Object.keys(ss.savedFavorability || {}).includes(oldTargetId)
                       );
            });
            
            // 새로운 ID 찾기
            const newTarget = gameState.survivors.find(s => 
                savedSurvivors.find((saved, i) => 
                    gameState.survivors[i].id === s.id && 
                    Object.keys(saved.relationshipTypes).includes(oldTargetId)
                )
            );
            
            if (!newTarget) return;
            
            const favorabilityValue = INITIAL_RELATIONSHIP_VALUES[relationType];
            if (favorabilityValue === undefined) return;
            
            // 현재 생존자 → 대상에 대한 호감도 설정
            survivor.favorability[newTarget.id] = favorabilityValue;
            survivor.relationshipTypes[newTarget.id] = relationType;
            
            // 짝사랑이 아니면 양방향 설정
            if (relationType !== '짝사랑') {
                newTarget.favorability[survivor.id] = favorabilityValue;
                if (!newTarget.relationshipTypes) newTarget.relationshipTypes = {};
                newTarget.relationshipTypes[survivor.id] = relationType;
            }
            
            // 가족 관계면 동맹 추가
            const familyRelations = ['형제/자매', '부모/자식', '유사가족', '친척'];
            if (familyRelations.includes(relationType)) {
                if (!survivor.allianceWith) survivor.allianceWith = [];
                if (!survivor.allianceWith.includes(newTarget.id)) {
                    survivor.allianceWith.push(newTarget.id);
                }
                
                // 양방향 동맹
                if (relationType !== '짝사랑') {
                    if (!newTarget.allianceWith) newTarget.allianceWith = [];
                    if (!newTarget.allianceWith.includes(survivor.id)) {
                        newTarget.allianceWith.push(survivor.id);
                    }
                }
            }
        });
    });
    
    addLog('새로운 시뮬레이션이 시작되었다.', 'system');
    
    localStorage.removeItem('yttd_simulator_autosave');

    // 엔딩 화면 닫기
    document.getElementById('popupContainer').innerHTML = '';
    gameState.initialTrialPopupsShown === 0;
    
    // 화면 업데이트
    updateDisplay();
}

async function rollDiceWithAnimation(targetValue, statName, bonusValue = 0) {

    gameState.pendingDiceRolls++;
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'dice-overlay';
        
        // 애니메이션 스킵 플래그
        let isSkipped = false;
        
        // 0~9까지 숫자를 나열 (자연스러운 회전을 위해 세 번 반복)
        const numbers = [0,1,2,3,4,5,6,7,8,9, 0,1,2,3,4,5,6,7,8,9, 0,1,2,3,4,5,6,7,8,9];
        const numHTML = numbers.map(n => `<div class="slot-number">${n}</div>`).join('');

        overlay.innerHTML = `
            <div style="color:white; margin-bottom:20px; font-size:1.2rem; font-family:'DungGeunMo'; text-align:center;">
                ${statName} 판정 중... (목표: ${targetValue} 이상)
                <div style="font-size:0.9rem; margin-top:10px; opacity:0.7;">클릭하여 스킵</div>
            </div>
            <div class="slot-container">
                <div class="slot-box"><div id="slot-10" class="slot-column">${numHTML}</div></div>
                <div class="slot-box"><div id="slot-1" class="slot-column">${numHTML}</div></div>
            </div>
            <div id="dice-result-text" class="roll-result-text" style="display:none; text-align:center;"></div>
        `;
        
        // 클릭 이벤트로 스킵 처리
        overlay.addEventListener('click', () => {
            if (!isSkipped) {
                isSkipped = true;
                skipAnimation();
            }
        });
        
        document.body.appendChild(overlay);

        // 1~100 사이의 실제 값 결정
        const rollValue = Math.floor(Math.random() * 100) + 1;
        
        let displayValue = rollValue === 100 ? 99 : rollValue;
        if (rollValue === 100) displayValue = 0;

        const tens = Math.floor(rollValue / 10) % 10;
        const ones = rollValue % 10;

        const slotHeight = 90;
        
        let animationTimeout1, animationTimeout2, animationTimeout3, animationTimeout4;

        function checkAndLogCompletion() {
            gameState.pendingDiceRolls--;
            
            const stillRemaining = gameState.survivors.filter(s => 
                s.isAlive && !gameState.initialTrialPopupsShown[s.id]
            );

            if (stillRemaining.length === 0 && gameState.turn === 1 && gameState.pendingDiceRolls === 0) {
                const nextTurnBtn = document.getElementById('nextTurnBtn');
                if (nextTurnBtn) {
                    nextTurnBtn.disabled = true;
                    nextTurnBtn.style.opacity = '0.5';
                    nextTurnBtn.style.cursor = 'not-allowed';
                    nextTurnBtn.style.pointerEvents = 'none';
                }
                
                setTimeout(() => {
                    addLog(`=== 턴 ${gameState.turn}: 모든 최초의 시련 완료 ===`, 'phase');
                    updateDisplay();
                    
                    if (nextTurnBtn) {
                        nextTurnBtn.disabled = false;
                        nextTurnBtn.style.opacity = '1';
                        nextTurnBtn.style.cursor = 'pointer';
                        nextTurnBtn.style.pointerEvents = 'auto';
                    }
                }, 500); // 🔴 2500ms에서 500ms로 단축
            }
        }
        
        // 애니메이션 스킵 함수
        function skipAnimation() {
            // 모든 타이머 클리어
            clearTimeout(animationTimeout1);
            clearTimeout(animationTimeout2);
            clearTimeout(animationTimeout3);
            clearTimeout(animationTimeout4);
            
            const col10 = document.getElementById('slot-10');
            const col1 = document.getElementById('slot-1');
            
            if (col10 && col1) {
                // 애니메이션 클래스 제거
                col10.classList.remove('slot-rolling');
                col1.classList.remove('slot-rolling');
                
                // 최종 위치로 즉시 이동
                col10.style.transition = 'none';
                col1.style.transition = 'none';
                col10.style.transform = `translateY(-${(10 + tens) * slotHeight}px)`;
                col1.style.transform = `translateY(-${(10 + ones) * slotHeight}px)`;
            }
            
            // 결과 즉시 표시
            showResult();
            checkAndLogCompletion();
        }
        
        // 결과 표시 함수
        function showResult() {
            const resultDisplay = document.getElementById('dice-result-text');
            const total = rollValue + bonusValue;
            const isSuccess = total >= targetValue;

            if (resultDisplay) {
                resultDisplay.style.display = 'block';
                resultDisplay.style.color = isSuccess ? '#16a34a' : '#ff4444';
                
                const bonusText = bonusValue > 0 ? ` ${statName} 보너스 +${bonusValue}` : '';

                resultDisplay.innerHTML = `
                    <div>
                        <div style="font-size: 2.5rem;">${total}</div>
                        ${bonusValue > 0 ? `<div style="font-size: 0.9rem; margin-top: 5px; opacity: 0.9;">${bonusText}</div>` : ''}
                    </div>
                    <div style="font-size: 1.5rem; margin-top: 5px;">${isSuccess ? '판정 성공' : '판정 실패'}</div>
                `;
            }

            animationTimeout4 = setTimeout(() => {
                if (document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                }

                // 1. 먼저 이번 주사위 판정 결과를 반환(resolve)합니다.
                resolve({ isSuccess, roll: rollValue });

            }, isSkipped ? 500 : 2000);

        }

        // 애니메이션 시작
        animationTimeout1 = setTimeout(() => {
            if (isSkipped) return;
            
            const col10 = document.getElementById('slot-10');
            const col1 = document.getElementById('slot-1');
            
            if (!col10 || !col1) return;
            
            col10.classList.add('slot-rolling');
            col1.classList.add('slot-rolling');

            col10.style.transform = `translateY(-${(10 + tens) * slotHeight}px)`;
            
            animationTimeout2 = setTimeout(() => {
                if (isSkipped) return;
                col1.style.transform = `translateY(-${(10 + ones) * slotHeight}px)`;
            }, 200);

            animationTimeout3 = setTimeout(() => {
                if (isSkipped) return;
                
                col10.classList.remove('slot-rolling');
                col1.classList.remove('slot-rolling');
                
                showResult();
                checkAndLogCompletion();
            }, 1700);
        }, 100);
    });
}
