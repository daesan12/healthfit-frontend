export function mapFood(apiFood) {
  return {
    id: apiFood.id,
    name: apiFood.name,
    category: apiFood.category,
    calories: Number(apiFood.calories || 0),
    carbohydrate: Number(apiFood.carbohydrate || 0),
    protein: Number(apiFood.protein || 0),
    fat: Number(apiFood.fat || 0),
  }
}

export function mapMeal(apiMeal) {
  return {
    id: apiMeal.id,
    mealType: apiMeal.meal_type,
    intakeDate: apiMeal.intake_date,
    totalCalories: Number(apiMeal.total_calories || 0),
    totalCarbohydrate: Number(apiMeal.total_carbohydrate || 0),
    totalProtein: Number(apiMeal.total_protein || 0),
    totalFat: Number(apiMeal.total_fat || 0),
    mealItems: (apiMeal.meal_items || []).map((item) => ({
      id: item.id,
      foodId: item.food_id,
      foodName: item.food_name,
      amount: Number(item.amount || 0),
      calories: Number(item.calories || 0),
      carbohydrate: Number(item.carbohydrate || 0),
      protein: Number(item.protein || 0),
      fat: Number(item.fat || 0),
    })),
  }
}

export function mapMealDashboard(apiDashboard) {
  return {
    date: apiDashboard.date,
    totalCalories: Number(apiDashboard.total_calories || 0),
    totalCarbohydrate: Number(apiDashboard.total_carbohydrate || 0),
    totalProtein: Number(apiDashboard.total_protein || 0),
    totalFat: Number(apiDashboard.total_fat || 0),
    recommendedCalories: apiDashboard.recommended_calories,
    carbohydrateRatio: apiDashboard.carbohydrate_ratio,
    proteinRatio: apiDashboard.protein_ratio,
    fatRatio: apiDashboard.fat_ratio,
    recommendedCarbohydrate: apiDashboard.recommended_carbohydrate,
    recommendedProtein: apiDashboard.recommended_protein,
    recommendedFat: apiDashboard.recommended_fat,
    remainingCalories: apiDashboard.remaining_calories,
    mealTypeSummary: apiDashboard.meal_type_summary || {},
  }
}

export function mapProgress(apiProgress) {
  const bodySummary = apiProgress.body_summary || {}
  const mealSummary = apiProgress.meal_summary || {}
  const workoutSummary = apiProgress.workout_summary || {}

  return {
    startDate: apiProgress.start_date,
    endDate: apiProgress.end_date,
    profile: apiProgress.profile,
    bodySummary: {
      startingWeight: bodySummary.starting_weight,
      latestWeight: bodySummary.latest_weight,
      weightChange: bodySummary.weight_change,
      recentRecords: bodySummary.recent_records || [],
    },
    mealSummary: {
      mealCount: mealSummary.meal_count || 0,
      totalCalories: Number(mealSummary.total_calories || 0),
      totalCarbohydrate: Number(mealSummary.total_carbohydrate || 0),
      totalProtein: Number(mealSummary.total_protein || 0),
      totalFat: Number(mealSummary.total_fat || 0),
      mealScore: mealSummary.meal_score,
      daily: mealSummary.daily || [],
    },
    workoutSummary: {
      workoutCount: workoutSummary.workout_count || 0,
      totalWorkoutTime: workoutSummary.total_workout_time || 0,
      daily: workoutSummary.daily || [],
    },
  }
}

export function mapWorkout(apiWorkout) {
  return {
    id: apiWorkout.id,
    exerciseId: apiWorkout.exercise_id,
    name: apiWorkout.name,
    gifUrl: apiWorkout.gif_url,
    bodyParts: apiWorkout.body_parts || [],
    equipments: apiWorkout.equipments || [],
    targetMuscles: apiWorkout.target_muscles || [],
    secondaryMuscles: apiWorkout.secondary_muscles || [],
    instructions: apiWorkout.instructions || [],
  }
}

export function mapProfile(apiProfile) {
  if (!apiProfile) return null

  return {
    id: apiProfile.id,
    gender: apiProfile.gender,
    age: apiProfile.age,
    height: apiProfile.height,
    weight: apiProfile.weight,
    bodyType: apiProfile.body_type,
    activityLevel: apiProfile.activity_level,
    workoutGoal: apiProfile.workout_goal,
    workoutExperience: apiProfile.workout_experience,
  }
}

export function mapPost(apiPost) {
  return {
    id: apiPost.id,
    category: apiPost.category,
    title: apiPost.title,
    author: apiPost.author?.username || apiPost.username || 'unknown',
    preview: apiPost.content,
    content: apiPost.content,
    likes: apiPost.like_count ?? apiPost.likes ?? 0,
    comments: apiPost.comment_count ?? apiPost.comments ?? 0,
    isLiked: Boolean(apiPost.is_liked),
    createdAt: apiPost.created_at,
    updatedAt: apiPost.updated_at,
  }
}

export function mapComment(apiComment) {
  return {
    id: apiComment.id,
    postId: apiComment.post_id,
    author: apiComment.author?.username || 'unknown',
    content: apiComment.content,
    createdAt: apiComment.created_at,
    updatedAt: apiComment.updated_at,
  }
}

export function mapPostDetail(apiPost) {
  return {
    ...mapPost(apiPost),
    commentItems: Array.isArray(apiPost.comments) ? apiPost.comments.map(mapComment) : [],
  }
}

export function mapDietRecommendation(apiRecommendation) {
  const content = apiRecommendation.content || apiRecommendation

  return {
    id: apiRecommendation.id,
    title: apiRecommendation.title || content.title || '추천 식단',
    reason: apiRecommendation.reason || content.reason || '',
    totalCalories: content.total_calories || content.totalCalories || 0,
    totalCarbohydrate: content.total_carbohydrate || content.totalCarbohydrate || 0,
    totalProtein: content.total_protein || content.totalProtein || 0,
    totalFat: content.total_fat || content.totalFat || 0,
    meals: content.meals || [],
  }
}

export function mapDietFeedback(apiFeedback) {
  return {
    id: apiFeedback.id,
    date: apiFeedback.date || apiFeedback.created_at,
    score: apiFeedback.score,
    totalCalories: apiFeedback.total_calories,
    carbohydrate: apiFeedback.total_carbohydrate,
    protein: apiFeedback.total_protein,
    fat: apiFeedback.total_fat,
    feedback: apiFeedback.feedback,
  }
}
