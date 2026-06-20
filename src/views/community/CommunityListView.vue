<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { normalizeCaughtError } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useCommunityStore } from '@/stores/community'

const ALL_CATEGORY = '전체'

const authStore = useAuthStore()
const communityStore = useCommunityStore()

const filters = reactive({
  search: '',
  category: ALL_CATEGORY,
})

const draftPost = reactive({
  title: '',
  category: 'diet',
  content: '',
})

const formMessage = ref('')
const listErrorMessage = ref('')

const posts = computed(() => communityStore.posts)
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

function buildParams() {
  const params = {}
  const keyword = filters.search.trim()

  if (keyword) {
    params.search = keyword
  }

  if (filters.category !== ALL_CATEGORY) {
    params.category = filters.category
  }

  return params
}

async function fetchPosts() {
  listErrorMessage.value = ''

  try {
    await communityStore.fetchPosts(buildParams())
  } catch (error) {
    const apiError = normalizeCaughtError(error)
    listErrorMessage.value = apiError.message
  }
}

function resetFilters() {
  filters.search = ''
  filters.category = ALL_CATEGORY
  fetchPosts()
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

  try {
    await communityStore.addPost({
      title: draftPost.title.trim(),
      category: draftPost.category,
      content: draftPost.content.trim(),
    })

    draftPost.title = ''
    draftPost.category = 'diet'
    draftPost.content = ''
    formMessage.value = '게시글이 작성되었습니다.'
  } catch (error) {
    const apiError = normalizeCaughtError(error)
    formMessage.value = apiError.message
  }
}

onMounted(fetchPosts)
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Community"
      title="커뮤니티"
      description="식단, 운동 루틴, 기록 경험을 게시글로 공유합니다."
    />

    <section class="content-grid">
      <form class="form-card" style="grid-column: span 4" @submit.prevent="createDraftPost">
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
          <label for="post-content">내용</label>
          <textarea id="post-content" v-model="draftPost.content" placeholder="공유할 내용을 입력하세요." />
        </div>

        <p v-if="formMessage" class="form-message">{{ formMessage }}</p>

        <button class="btn btn-primary" type="submit" :disabled="communityStore.isLoading">
          {{ communityStore.isLoading ? '처리 중...' : '게시글 작성' }}
        </button>
      </form>

      <section class="post-list" style="grid-column: span 8">
        <form class="surface-card filter-panel" @submit.prevent="fetchPosts">
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
          <p class="section-label">게시글 목록</p>
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
          <article v-for="post in posts" :key="post.id" class="surface-card">
            <div class="section-heading-row">
              <div>
                <span class="chip">{{ categoryLabel(post.category) }}</span>
                <h2>{{ post.title }}</h2>
              </div>
              <span class="chip">{{ post.author }}</span>
            </div>
            <p class="card-description">{{ post.preview }}</p>
            <p class="meta-text">
              {{ post.author }} · 좋아요 {{ post.likes }} · 댓글 {{ post.comments }}
            </p>
            <RouterLink class="btn btn-secondary card-action" :to="`/posts/${post.id}`">
              상세 보기
            </RouterLink>
          </article>

          <StateBlock
            v-if="posts.length === 0"
            type="empty"
            title="게시글이 없습니다"
            message="검색 조건을 바꾸거나 첫 게시글을 작성해보세요."
          />
        </template>
      </section>
    </section>
  </main>
</template>
