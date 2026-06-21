<script setup>
import { onMounted, reactive, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { normalizeCaughtError } from '@/api/client'
import { createBodyRecord, deleteBodyRecord, getBodyRecords } from '@/api/health'
import { useToastStore } from '@/stores/toast'

const today = new Date().toISOString().slice(0, 10)
const toastStore = useToastStore()

const form = reactive({
  recordDate: today,
  weight: null,
  bodyFatPercentage: null,
  skeletalMuscleMass: null,
})

const records = ref([])
const isLoading = ref(false)
const isSaving = ref(false)
const deletingId = ref(null)
const pendingDeleteId = ref(null)
const formMessage = ref('')
const errorMessage = ref('')

function formatValue(value, unit) {
  if (value === null || value === undefined || value === '') return '미입력'
  return `${Number(value).toFixed(1)}${unit}`
}

async function fetchRecords() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    records.value = await getBodyRecords()
  } catch (error) {
    const apiError = normalizeCaughtError(error)
    errorMessage.value = apiError.message
  } finally {
    isLoading.value = false
  }
}

async function saveRecord() {
  formMessage.value = ''

  if (!form.recordDate) {
    formMessage.value = '기록 날짜를 선택해주세요.'
    return
  }

  if (!form.weight && !form.bodyFatPercentage && !form.skeletalMuscleMass) {
    formMessage.value = '몸무게, 체지방률, 골격근량 중 1개 이상 입력해주세요.'
    return
  }

  isSaving.value = true

  try {
    await createBodyRecord({ ...form })
    form.weight = null
    form.bodyFatPercentage = null
    form.skeletalMuscleMass = null
    pendingDeleteId.value = null
    formMessage.value = '신체 기록이 저장되었습니다.'
    toastStore.success('신체 기록 저장 완료', '진행 현황에서 변화를 확인할 수 있습니다.')
    await fetchRecords()
  } catch (error) {
    const apiError = normalizeCaughtError(error)
    formMessage.value = apiError.message
  } finally {
    isSaving.value = false
  }
}

async function removeRecord(recordId) {
  formMessage.value = ''

  if (pendingDeleteId.value !== recordId) {
    pendingDeleteId.value = recordId
    formMessage.value = '삭제하려면 같은 버튼을 한 번 더 눌러주세요.'
    return
  }

  deletingId.value = recordId

  try {
    await deleteBodyRecord(recordId)
    records.value = records.value.filter((record) => record.id !== recordId)
    pendingDeleteId.value = null
    formMessage.value = '신체 기록이 삭제되었습니다.'
  } catch (error) {
    const apiError = normalizeCaughtError(error)
    formMessage.value = apiError.message
  } finally {
    deletingId.value = null
  }
}

function cancelDelete() {
  pendingDeleteId.value = null
  formMessage.value = ''
}

onMounted(fetchRecords)
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Health"
      title="신체 기록"
      description="체중, 체지방률, 골격근량을 기록해 진행 현황에 반영합니다."
    />

    <section class="content-grid">
      <form class="form-card" style="grid-column: span 5" @submit.prevent="saveRecord">
        <div class="field-group">
          <label for="record-date">기록 날짜</label>
          <input id="record-date" v-model="form.recordDate" type="date" />
        </div>

        <div class="field-group">
          <label for="weight">몸무게(kg)</label>
          <input id="weight" v-model.number="form.weight" type="number" inputmode="decimal" min="0" step="0.1" placeholder="72.4" />
        </div>

        <div class="field-group">
          <label for="body-fat">체지방률(%)</label>
          <input id="body-fat" v-model.number="form.bodyFatPercentage" type="number" inputmode="decimal" min="0" step="0.1" placeholder="18.5" />
        </div>

        <div class="field-group">
          <label for="muscle">골격근량(kg)</label>
          <input id="muscle" v-model.number="form.skeletalMuscleMass" type="number" inputmode="decimal" min="0" step="0.1" placeholder="32.0" />
        </div>

        <button class="btn btn-primary" type="submit" :disabled="isSaving">
          {{ isSaving ? '저장 중...' : '신체 기록 저장' }}
        </button>
        <p v-if="formMessage" class="form-message">{{ formMessage }}</p>
      </form>

      <section class="surface-card" style="grid-column: span 7">
        <div class="section-heading-row">
          <div>
            <p class="section-label">Records</p>
            <h2>최근 신체 기록</h2>
          </div>
          <span class="chip">{{ records.length }}개</span>
        </div>

        <StateBlock
          v-if="isLoading"
          type="loading"
          title="신체 기록을 불러오는 중입니다"
          message="저장된 기록을 조회하고 있습니다."
        />

        <StateBlock
          v-else-if="errorMessage"
          type="error"
          title="신체 기록을 불러오지 못했습니다"
          :message="errorMessage"
        />

        <div v-else class="meal-list">
          <article v-for="record in records" :key="record.id" class="meal-item">
            <div>
              <strong>{{ record.recordDate }}</strong>
              <span>
                체중 {{ formatValue(record.weight, 'kg') }} · 체지방
                {{ formatValue(record.bodyFatPercentage, '%') }} · 골격근량
                {{ formatValue(record.skeletalMuscleMass, 'kg') }}
              </span>
            </div>
            <div class="delete-actions">
              <strong>BMI {{ record.bmi ?? '-' }}</strong>
              <button
                type="button"
                :class="{ 'is-danger': pendingDeleteId === record.id }"
                :disabled="deletingId === record.id"
                @click="removeRecord(record.id)"
              >
                {{ deletingId === record.id ? '삭제 중...' : pendingDeleteId === record.id ? '확인 삭제' : '삭제' }}
              </button>
              <button v-if="pendingDeleteId === record.id" type="button" @click="cancelDelete">취소</button>
            </div>
          </article>

          <StateBlock
            v-if="records.length === 0"
            type="empty"
            title="저장된 신체 기록이 없습니다"
            message="왼쪽 폼에서 오늘의 신체 정보를 기록해보세요."
          >
            <a class="btn btn-primary" href="#weight">신체 정보 입력하기</a>
            <RouterLink class="btn btn-secondary" to="/progress">진행 현황 보기</RouterLink>
          </StateBlock>
        </div>
      </section>
    </section>
  </main>
</template>
