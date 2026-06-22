export const mockFoods = [
  {
    id: 1,
    name: '시금치 된장국',
    category: '국/탕류',
    calories: 11,
    carbohydrate: 1.6,
    protein: 0.7,
    fat: 0.26,
  },
  {
    id: 2,
    name: '닭가슴살 구이',
    category: '구이류',
    calories: 165,
    carbohydrate: 0,
    protein: 31,
    fat: 3.6,
  },
  {
    id: 3,
    name: '현미밥',
    category: '밥류',
    calories: 153,
    carbohydrate: 33.2,
    protein: 3.2,
    fat: 1,
  },
]

export const mockWorkouts = [
  {
    id: 1,
    name: '푸시업',
    bodyParts: ['가슴', '상완'],
    equipments: ['맨몸'],
    targetMuscles: ['대흉근', '삼두근'],
    instructions: ['손을 어깨너비로 짚습니다.', '몸을 곧게 유지하며 팔을 굽혔다가 밀어 올립니다.'],
  },
  {
    id: 2,
    name: '덤벨 로우',
    bodyParts: ['등'],
    equipments: ['덤벨'],
    targetMuscles: ['광배근', '승모근'],
    instructions: ['상체를 살짝 숙입니다.', '팔꿈치를 뒤로 당기며 덤벨을 들어 올립니다.'],
  },
  {
    id: 3,
    name: '스쿼트',
    bodyParts: ['하체', '둔근'],
    equipments: ['맨몸'],
    targetMuscles: ['대퇴사두근', '둔근'],
    instructions: ['발을 어깨너비로 벌립니다.', '무릎과 고관절을 굽히며 앉았다가 일어납니다.'],
  },
]

export const mockPosts = [
  {
    id: 1,
    category: 'diet',
    title: '감량 식단 공유합니다',
    author: 'user01',
    preview: '현미밥, 닭가슴살, 된장국으로 구성한 점심 식단입니다.',
    likes: 12,
    comments: 4,
  },
  {
    id: 2,
    category: 'workout',
    title: '초보자 전신 루틴',
    author: 'fitmin',
    preview: '푸시업, 스쿼트, 로우 중심으로 40분 루틴을 구성했습니다.',
    likes: 18,
    comments: 6,
  },
  {
    id: 3,
    category: 'free',
    title: '식단 기록 오래 하는 팁',
    author: 'steady',
    preview: '처음부터 완벽하게 기록하기보다 자주 먹는 음식부터 저장하면 편합니다.',
    likes: 9,
    comments: 2,
  },
]

export const mockProgress = [
  { date: '06/15', weight: 100.2, calories: 2240, score: 72, workouts: 1 },
  { date: '06/16', weight: 99.8, calories: 2100, score: 78, workouts: 1 },
  { date: '06/17', weight: 99.4, calories: 1980, score: 84, workouts: 2 },
  { date: '06/18', weight: 99.1, calories: 2050, score: 81, workouts: 1 },
  { date: '06/19', weight: 98.7, calories: 1920, score: 86, workouts: 2 },
]

export const mockDietRecommendation = {
  title: '감량 목표 고단백 하루 식단',
  reason:
    '권장 칼로리 2,200kcal 안에서 단백질 비율을 높이고 조리 부담이 적은 음식으로 구성했습니다.',
  totalCalories: 2085,
  totalCarbohydrate: 232,
  totalProtein: 158,
  totalFat: 54,
  meals: [
    {
      mealType: '아침',
      foods: [
        { name: '현미밥', amount: 150, calories: 230 },
        { name: '시금치 된장국', amount: 200, calories: 22 },
      ],
    },
    {
      mealType: '점심',
      foods: [
        { name: '닭가슴살 구이', amount: 160, calories: 264 },
        { name: '현미밥', amount: 180, calories: 275 },
      ],
    },
    {
      mealType: '저녁',
      foods: [
        { name: '닭가슴살 구이', amount: 140, calories: 231 },
        { name: '채소 샐러드', amount: 250, calories: 28 },
      ],
    },
    {
      mealType: '간식',
      foods: [{ name: '견과류', amount: 30, calories: 185 }],
    },
  ],
}

export const mockDietFeedback = {
  date: '2026-06-19',
  score: 86,
  totalCalories: 1640,
  recommendedCalories: 2200,
  carbohydrate: 218,
  protein: 124,
  fat: 42,
  feedback:
    '오늘 식단은 단백질 비율이 좋고 전체 칼로리는 목표보다 낮습니다. 간식에서 복합 탄수화물과 건강한 지방을 조금 보완하면 더 안정적인 감량 식단이 됩니다.',
  checks: [
    { label: '단백질', status: '좋음', detail: '목표 대비 충분한 섭취량입니다.' },
    { label: '칼로리', status: '부족', detail: '권장량보다 약 560kcal 낮습니다.' },
    { label: '지방', status: '주의', detail: '지방 섭취가 낮아 견과류나 생선을 보완하면 좋습니다.' },
  ],
}

export const mockWorkoutRecommendation = {
  title: '초보자 감량 전신 루틴',
  reason:
    '운동 경험이 적고 감량이 목표인 사용자를 위해 관절 부담이 낮은 맨몸 운동과 기본 근력 운동으로 구성했습니다.',
  availableTime: 40,
  weeklyFrequency: 3,
  items: [
    { workoutId: 1, name: '푸시업', sets: 3, reps: 10, minutes: 10, order: 1 },
    { workoutId: 3, name: '스쿼트', sets: 3, reps: 15, minutes: 12, order: 2 },
    { workoutId: 2, name: '덤벨 로우', sets: 3, reps: 12, minutes: 12, order: 3 },
  ],
  cautions: ['운동 전 5분 이상 가볍게 몸을 풉니다.', '무릎이나 손목 통증이 있으면 반복 횟수를 줄입니다.'],
}

export const mockAiChats = [
  {
    id: 1,
    role: 'user',
    message: '다이어트 중 단백질은 얼마나 먹어야 하나요?',
  },
  {
    id: 2,
    role: 'assistant',
    message:
      '운동을 병행하는 감량 목표라면 체중 1kg당 약 1.6g 전후를 기준으로 잡고, 식단 기록에서 하루 총 단백질 섭취량을 함께 확인하는 것이 좋습니다.',
  },
]

export const mockComments = [
  {
    id: 1,
    postId: 1,
    author: 'fitmin',
    content: '구성이 깔끔하네요. 점심 식단 참고할게요!',
    createdAt: '2026-06-19',
  },
  {
    id: 2,
    postId: 1,
    author: 'steady',
    content: '된장국을 같이 넣은 게 포만감에 좋아 보여요.',
    createdAt: '2026-06-19',
  },
  {
    id: 3,
    postId: 2,
    author: 'user01',
    content: '초보자 루틴으로 따라 하기 좋겠습니다.',
    createdAt: '2026-06-18',
  },
]
