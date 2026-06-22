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

export function mapSavedMeal(apiSavedMeal) {
  return {
    id: apiSavedMeal.id,
    name: apiSavedMeal.name,
    description: apiSavedMeal.description || '',
    totalCalories: Number(apiSavedMeal.total_calories || 0),
    totalCarbohydrate: Number(apiSavedMeal.total_carbohydrate || 0),
    totalProtein: Number(apiSavedMeal.total_protein || 0),
    totalFat: Number(apiSavedMeal.total_fat || 0),
    items: (apiSavedMeal.saved_meal_items || apiSavedMeal.items || []).map((item) => ({
      id: item.id,
      foodId: item.food_id,
      foodName: item.food_name,
      amount: Number(item.amount || 0),
      calories: Number(item.calories || 0),
      carbohydrate: Number(item.carbohydrate || 0),
      protein: Number(item.protein || 0),
      fat: Number(item.fat || 0),
    })),
    createdAt: apiSavedMeal.created_at,
    updatedAt: apiSavedMeal.updated_at,
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

export function mapWorkoutRoutine(apiRoutine) {
  return {
    id: apiRoutine.id,
    name: apiRoutine.name,
    description: apiRoutine.description || '',
    items: (apiRoutine.items || []).map((item) => ({
      id: item.id,
      exercise: item.exercise ? mapWorkout(item.exercise) : null,
      order: item.order,
      sets: item.sets,
      reps: item.reps,
      weight: item.weight,
      restSeconds: item.rest_seconds,
    })),
    createdAt: apiRoutine.created_at,
    updatedAt: apiRoutine.updated_at,
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

export function mapBodyRecord(apiRecord) {
  return {
    id: apiRecord.id,
    recordDate: apiRecord.record_date,
    weight: apiRecord.weight,
    bodyFatPercentage: apiRecord.body_fat_percentage,
    skeletalMuscleMass: apiRecord.skeletal_muscle_mass,
    bmi: apiRecord.bmi,
    createdAt: apiRecord.created_at,
  }
}

export function mapWorkoutLog(apiLog) {
  const sets = (apiLog.sets || []).map((set) => ({
    id: set.id,
    setOrder: set.set_order,
    weightKg: set.weight_kg,
    repetition: set.repetition,
    durationSeconds: set.duration_seconds,
    rpe: set.rpe,
    isWarmup: Boolean(set.is_warmup),
  }))

  return {
    id: apiLog.id,
    logId: apiLog.log_id,
    workoutId: apiLog.workout_id,
    exerciseId: apiLog.exercise_id,
    exercise: apiLog.exercise ? mapWorkout(apiLog.exercise) : null,
    routineId: apiLog.routine_id,
    workoutDate: apiLog.workout_date,
    workoutTime: apiLog.workout_time,
    setCount: apiLog.set_count ?? sets.length,
    repetition: apiLog.repetition ?? sets.find((set) => set.repetition != null)?.repetition,
    sets,
    memo: apiLog.memo,
    createdAt: apiLog.created_at,
    updatedAt: apiLog.updated_at,
  }
}

export function mapPost(apiPost) {
  const sharedSavedMeal = apiPost.shared_saved_meal
    ? {
        id: apiPost.shared_saved_meal.id,
        name: apiPost.shared_saved_meal.name,
        description: apiPost.shared_saved_meal.description || '',
        totalCalories: Number(apiPost.shared_saved_meal.total_calories || 0),
        items: apiPost.shared_saved_meal.items || apiPost.shared_saved_meal.saved_meal_items || [],
      }
    : null
  const sharedWorkoutRoutine = apiPost.shared_workout_routine
    ? {
        id: apiPost.shared_workout_routine.id,
        name: apiPost.shared_workout_routine.name,
        description: apiPost.shared_workout_routine.description || '',
        exerciseCount: apiPost.shared_workout_routine.exercise_count || apiPost.shared_workout_routine.items?.length || 0,
        items: apiPost.shared_workout_routine.items || [],
      }
    : null

  return {
    id: apiPost.id,
    category: apiPost.category,
    title: apiPost.title,
    authorId: apiPost.author?.id || apiPost.user_id || null,
    author: apiPost.author?.username || apiPost.username || 'unknown',
    preview: apiPost.content,
    content: apiPost.content,
    likes: apiPost.like_count ?? apiPost.likes ?? 0,
    comments: apiPost.comment_count ?? apiPost.comments ?? 0,
    isLiked: Boolean(apiPost.is_liked),
    sharedType: apiPost.shared_type || null,
    sharedSavedMeal,
    sharedWorkoutRoutine,
    viewerSaveStatus: apiPost.viewer_save_status || null,
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
  const totals = content.daily_totals || content.dailyTotals || content
  const meals = (content.meals || []).map((meal, index) => ({
    mealOrder: meal.meal_order ?? index + 1,
    mealType: meal.meal_label || meal.meal_type || `${index + 1}번째 식사`,
    targetCalories: Number(meal.target_calories || 0),
    foods: (meal.items || meal.foods || []).map((item) => ({
      foodId: item.food_id ?? null,
      aiFoodKey: item.ai_food_key ?? null,
      name: item.name || item.food_name,
      amount: Number(item.amount || 0),
      calories: Number(item.calories || 0),
      carbohydrate: Number(item.carbohydrate || 0),
      protein: Number(item.protein || 0),
      fat: Number(item.fat || 0),
      role: item.role || '',
      sourceType: item.source_type || '',
    })),
  }))

    return {
      id: apiRecommendation.recommendation_id || apiRecommendation.id,
      title: apiRecommendation.title || content.title || '추천 식단',
      reason: apiRecommendation.reason || content.reason || '',
      scope: apiRecommendation.scope || content.scope || '',
      targetDate: apiRecommendation.target_date || content.target_date || '',
      foodSource: apiRecommendation.food_source || content.food_source || '',
      createdAt: apiRecommendation.created_at || '',
      parentRecommendationId: apiRecommendation.parent_recommendation || apiRecommendation.parent_recommendation_id,
      totalCalories: totals.total_calories || totals.totalCalories || 0,
      totalCarbohydrate: totals.total_carbohydrate || totals.totalCarbohydrate || 0,
      totalProtein: totals.total_protein || totals.totalProtein || 0,
      totalFat: totals.total_fat || totals.totalFat || 0,
      meals,
    }
  }

export function mapDietFeedback(apiFeedback) {
  return {
    id: apiFeedback.feedback_id || apiFeedback.id,
    date: apiFeedback.date || apiFeedback.created_at,
    score: apiFeedback.score,
    totalCalories: apiFeedback.total_calories,
    recommendedCalories: apiFeedback.recommended_calories || apiFeedback.target_calories || apiFeedback.total_calories,
    carbohydrate: apiFeedback.total_carbohydrate,
    protein: apiFeedback.total_protein,
    fat: apiFeedback.total_fat,
    feedback: apiFeedback.feedback,
    checks: [
      ...(apiFeedback.strengths || []).map((detail) => ({ label: '강점', status: '좋음', detail })),
      ...(apiFeedback.improvements || []).map((detail) => ({ label: '개선점', status: '주의', detail })),
      ...(apiFeedback.recommended_actions || []).map((detail) => ({ label: '추천 행동', status: '제안', detail })),
    ],
  }
}
