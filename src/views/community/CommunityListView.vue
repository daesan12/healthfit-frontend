<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { normalizeCaughtError } from '@/api/client'
import { getSavedMealsPage } from '@/api/diet'
import { getWorkoutRoutinesPage } from '@/api/workout'
import { useAuthStore } from '@/stores/auth'
import { useCommunityStore } from '@/stores/community'
import { useToastStore } from '@/stores/toast'

const ALL_CATEGORY = '전체'

const authStore = useAuthStore()
const communityStore = useCommunityStore()
const toastStore = useToastStore()

const filters = reactive({
  search: '',
  category: ALL_CATEGORY,
})

const draftPost = reactive({
  title: '',
  category: 'diet',
  content: '',
  shareType: 'none',
  sharedSavedMealId: '',
  sharedWorkoutRoutineId: '',
})

const savedMealOptions = ref([])
const routineOptions = ref([])
const isShareOptionsLoading = ref(false)
const formMessage = ref('')
const listErrorMessage = ref('')
const deletingPostId = ref(null)
const pendingDeletePostId = ref(null)
const isCreateModalOpen = ref(false)

const posts = computed(() => communityStore.posts)
const pagination = computed(() => communityStore.pagination)
const categoryOptions = [
  { label: ALL_CATEGORY, value: ALL_CATEGORY },
  { label: '식단', value: 'diet' },
  { label: '운동', value: 'workout' },
  { label: '자유', value: 'free' },
]

const resultSummary = computed(() => {
  if (communityStore.isLoading) return '조회 중'
  return `${communityStore.postCount.toLocaleString()}개 게시글`
})

function categoryLabel(value) {
  return categoryOptions.find((category) => category.value === value)?.label || value
}

function sharedLabel(post) {
  if (post.sharedType === 'saved_meal') return `공유 식단 · ${post.sharedSavedMeal?.name || '저장 식단'}`
  if (post.sharedType === 'workout_routine') return `공유 루틴 · ${post.sharedWorkoutRoutine?.name || '운동 루틴'}`
  return ''
}

function isPostOwner(post) {
  return Boolean(authStore.user?.id && post.authorId && Number(authStore.user.id) === Number(post.authorId))
}

function buildParams() {
  const params = { page: pagination.value.page || 1 }
  const keyword = filters.search.trim()

  if (keyword) params.search = keyword
  if (filters.category !== ALL_CATEGORY) params.category = filters.category

  return params
}

async function fetchPosts() {
  listErrorMessage.value = ''

  try {
    await communityStore.fetchPosts(buildParams())
  } catch (error) {
    listErrorMessage.value = normalizeCaughtError(error).message
  }
}

async function fetchShareOptions() {
  if (!authStore.isAuthenticated) return
  isShareOptionsLoading.value = true

  try {
    const [savedMeals, routines] = await Promise.all([
      getSavedMealsPage({ page_size: 100 }),
      getWorkoutRoutinesPage({ page_size: 100 }),
    ])
    savedMealOptions.value = savedMeals.results
    routineOptions.value = routines.results
  } catch (error) {
    formMessage.value = normalizeCaughtError(error).message
  } finally {
    isShareOptionsLoading.value = false
  }
}

function searchPosts() {
  communityStore.pagination.page = 1
  fetchPosts()
}

function movePage(page) {
  if (page < 1 || page === pagination.value.page) return
  communityStore.pagination.page = page
  fetchPosts()
}

function resetFilters() {
  filters.search = ''
  filters.category = ALL_CATEGORY
  communityStore.pagination.page = 1
  fetchPosts()
}

function resetDraft() {
  draftPost.title = ''
  draftPost.category = 'diet'
  draftPost.content = ''
  draftPost.shareType = 'none'
  draftPost.sharedSavedMealId = ''
  draftPost.sharedWorkoutRoutineId = ''
}

function openCreateModal() {
  formMessage.value = ''
  isCreateModalOpen.value = true
}

function closeCreateModal() {
  isCreateModalOpen.value = false
  formMessage.value = ''
}

async function createDraftPost() {
  formMessage.value = ''

  if (!authStore.isAuthenticated) {
    formMessage.value = '로그인 후 게시글을 작성할 수 있습니다.'
    return
  }

  if (!draftPost.title.trim() || !draftPost.content.trim()) {
    formMessage.value = '제목과 내용을 입력해주세요.'
    return
  }

  if (draftPost.shareType === 'saved_meal' && !draftPost.sharedSavedMealId) {
    formMessage.value = '공유할 저장 식단을 선택해주세요.'
    return
  }

  if (draftPost.shareType === 'workout_routine' && !draftPost.sharedWorkoutRoutineId) {
    formMessage.value = '공유할 운동 루틴을 선택해주세요.'
    return
  }

  try {
    await communityStore.addPost({
      title: draftPost.title.trim(),
      category: draftPost.category,
      content: draftPost.content.trim(),
      sharedSavedMealId: draftPost.shareType === 'saved_meal' ? Number(draftPost.sharedSavedMealId) : null,
      sharedWorkoutRoutineId:
        draftPost.shareType === 'workout_routine' ? Number(draftPost.sharedWorkoutRoutineId) : null,
    })

    resetDraft()
    formMessage.value = '게시글을 작성했습니다.'
    toastStore.success('게시글 작성 완료', '커뮤니티 목록에 게시글을 추가했습니다.')
    await fetchPosts()
    closeCreateModal()
  } catch (error) {
    formMessage.value = normalizeCaughtError(error).message
  }
}

async function removePost(postId) {
  listErrorMessage.value = ''

  if (pendingDeletePostId.value !== postId) {
    pendingDeletePostId.value = postId
    return
  }

  deletingPostId.value = postId

  try {
    await communityStore.removePost(postId)
    pendingDeletePostId.value = null
    toastStore.success('게시글 삭제 완료', '커뮤니티 게시글이 삭제되었습니다.')
    await fetchPosts()
  } catch (error) {
    listErrorMessage.value = normalizeCaughtError(error).message
  } finally {
    deletingPostId.value = null
  }
}

function cancelPostDelete() {
  pendingDeletePostId.value = null
}

watch(
  () => draftPost.shareType,
  (shareType) => {
    draftPost.sharedSavedMealId = ''
    draftPost.sharedWorkoutRoutineId = ''
    if (shareType === 'saved_meal') draftPost.category = 'diet'
    if (shareType === 'workout_routine') draftPost.category = 'workout'
  },
)

onMounted(() => {
  fetchPosts()
  fetchShareOptions()
})
</script>

<template>
  <main class="page-shell">
    <div class="page-header-row">
      <PageHeader
        eyebrow="Community"
        title="커뮤니티"
        description="식단, 운동 루틴, 기록 경험을 게시글로 공유합니다."
      />
      <button class="btn btn-primary page-action" type="button" @click="openCreateModal">게시글 작성</button>
    </div>

    <BaseModal :open="isCreateModalOpen" title="게시글 작성" @close="closeCreateModal">
      <form class="form-card modal-form" @submit.prevent="createDraftPost">
        <div class="field-group">
          <label for="post-title">제목</label>
          <input id="post-title" v-model="draftPost.title" type="text" placeholder="오늘의 식단 공유" />
        </div>

        <div class="field-group">
          <label for="post-category">카테고리</label>
          <select id="post-category" v-model="draftPost.category">
            <option value="diet">식단</option>
            <option value="workout">운동</option>
            <option value="free">자유</option>
          </select>
        </div>

        <div class="field-group">
          <label for="post-share-type">공유 항목</label>
          <select id="post-share-type" v-model="draftPost.shareType" :disabled="isShareOptionsLoading">
            <option value="none">없음</option>
            <option value="saved_meal">저장 식단</option>
            <option value="workout_routine">운동 루틴</option>
          </select>
        </div>

        <div v-if="draftPost.shareType === 'saved_meal'" class="field-group">
          <label for="shared-saved-meal">저장 식단 선택</label>
          <select id="shared-saved-meal" v-model="draftPost.sharedSavedMealId">
            <option value="">선택</option>
            <option v-for="meal in savedMealOptions" :key="meal.id" :value="meal.id">
              {{ meal.name }} · {{ meal.totalCalories }} kcal
            </option>
          </select>
        </div>

        <div v-if="draftPost.shareType === 'workout_routine'" class="field-group">
          <label for="shared-routine">운동 루틴 선택</label>
          <select id="shared-routine" v-model="draftPost.sharedWorkoutRoutineId">
            <option value="">선택</option>
            <option v-for="routine in routineOptions" :key="routine.id" :value="routine.id">
              {{ routine.name }} · {{ routine.items.length }}개 운동
            </option>
          </select>
        </div>

        <div class="field-group">
          <label for="post-content">내용</label>
          <textarea id="post-content" v-model="draftPost.content" placeholder="공유할 내용을 입력하세요" />
        </div>

        <p v-if="formMessage" class="form-message">{{ formMessage }}</p>

        <button class="btn btn-primary" type="submit" :disabled="communityStore.isLoading">
          {{ communityStore.isLoading ? '처리 중...' : '게시글 작성' }}
        </button>
      </form>
    </BaseModal>

    <section class="community-layout">
      <section class="post-list">
        <form class="surface-card filter-panel search-panel" @submit.prevent="searchPosts">
          <div class="field-group">
            <label for="community-search">게시글 검색</label>
            <input id="community-search" v-model="filters.search" type="text" placeholder="제목 또는 내용 검색" />
          </div>

          <div class="field-group">
            <label for="community-category">카테고리</label>
            <select id="community-category" v-model="filters.category">
              <option v-for="category in categoryOptions" :key="category.value" :value="category.value">
                {{ category.label }}
              </option>
            </select>
          </div>

          <button class="btn btn-primary" type="submit" :disabled="communityStore.isLoading">검색</button>
          <button class="btn btn-secondary" type="button" :disabled="communityStore.isLoading" @click="resetFilters">
            초기화
          </button>
        </form>

        <div class="section-toolbar">
          <div>
            <p class="section-label">게시글 목록</p>
            <h2>HealthFit 피드</h2>
          </div>
          <strong>{{ resultSummary }}</strong>
        </div>

        <StateBlock
          v-if="communityStore.isLoading && posts.length === 0"
          type="loading"
          title="게시글을 불러오는 중입니다"
          message="커뮤니티 게시글 목록을 조회하고 있습니다."
        />

        <StateBlock
          v-else-if="listErrorMessage"
          type="error"
          title="게시글을 불러오지 못했습니다"
          :message="listErrorMessage"
        />

        <template v-else>
          <article v-for="post in posts" :key="post.id" class="surface-card feed-card">
            <div class="section-heading-row">
              <div>
                <span class="badge" :class="`badge-${post.category}`">{{ categoryLabel(post.category) }}</span>
                <span v-if="post.sharedType" class="badge badge-share">{{ sharedLabel(post) }}</span>
                <h2>{{ post.title }}</h2>
              </div>
              <RouterLink v-if="post.authorId" class="chip author-chip" :to="`/users/${post.authorId}`">{{ post.author }}</RouterLink>
              <span v-else class="chip author-chip">{{ post.author }}</span>
            </div>
            <p class="card-description">{{ post.preview }}</p>
            <div class="post-meta">
              <span>작성자 {{ post.author }}</span>
              <span>좋아요 {{ post.likes }}</span>
              <span>댓글 {{ post.comments }}</span>
            </div>
            <div class="button-row">
              <RouterLink class="btn btn-secondary" :to="`/posts/${post.id}`">
                상세 보기
              </RouterLink>
              <button
                v-if="isPostOwner(post)"
                class="btn btn-secondary"
                type="button"
                :class="{ 'is-danger': pendingDeletePostId === post.id }"
                :disabled="deletingPostId === post.id"
                @click="removePost(post.id)"
              >
                {{
                  deletingPostId === post.id
                    ? '삭제 중...'
                    : pendingDeletePostId === post.id
                      ? '확인 삭제'
                      : '삭제'
                }}
              </button>
              <button
                v-if="pendingDeletePostId === post.id"
                class="btn btn-secondary"
                type="button"
                @click="cancelPostDelete"
              >
                취소
              </button>
            </div>
          </article>

          <div v-if="posts.length > 0" class="surface-card pagination-panel" style="grid-column: 1 / -1">
            <button
              class="btn btn-secondary"
              type="button"
              :disabled="!pagination.hasPrevious || communityStore.isLoading"
              @click="movePage(pagination.page - 1)"
            >
              이전
            </button>
            <strong>{{ pagination.page }} / {{ pagination.totalPages }}</strong>
            <button
              class="btn btn-secondary"
              type="button"
              :disabled="!pagination.hasNext || communityStore.isLoading"
              @click="movePage(pagination.page + 1)"
            >
              다음
            </button>
          </div>

          <StateBlock
            v-if="posts.length === 0"
            type="empty"
            title="게시글이 없습니다"
            message="검색 조건을 바꾸거나 첫 게시글을 작성해보세요."
          >
            <button class="btn btn-secondary" type="button" @click="resetFilters">검색 초기화</button>
            <button class="btn btn-primary" type="button" @click="openCreateModal">게시글 작성하기</button>
          </StateBlock>
        </template>
      </section>
    </section>
  </main>
</template>
