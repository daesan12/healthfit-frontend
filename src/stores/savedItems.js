import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useSavedItemsStore = defineStore('savedItems', () => {
  const savedMeals = ref([])
  const workoutRoutines = ref([])

  const savedMealCount = computed(() => savedMeals.value.length)
  const routineCount = computed(() => workoutRoutines.value.length)

  function saveMeal(meal) {
    savedMeals.value.unshift({
      id: Date.now(),
      savedAt: new Date().toISOString(),
      ...meal,
    })
  }

  function saveRoutine(routine) {
    workoutRoutines.value.unshift({
      id: Date.now(),
      savedAt: new Date().toISOString(),
      ...routine,
    })
  }

  return {
    savedMeals,
    workoutRoutines,
    savedMealCount,
    routineCount,
    saveMeal,
    saveRoutine,
  }
})
