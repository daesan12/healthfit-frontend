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

export function mapPost(apiPost) {
  return {
    id: apiPost.id,
    category: apiPost.category,
    title: apiPost.title,
    author: apiPost.author?.username || apiPost.username || 'unknown',
    preview: apiPost.content,
    likes: apiPost.like_count ?? apiPost.likes ?? 0,
    comments: apiPost.comment_count ?? apiPost.comments ?? 0,
    isLiked: Boolean(apiPost.is_liked),
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
