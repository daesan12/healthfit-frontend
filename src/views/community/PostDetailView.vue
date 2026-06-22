<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { normalizeCaughtError } from '@/api/client'
import { saveSharedMeal, saveSharedRoutine } from '@/api/community'
import { useAuthStore } from '@/stores/auth'
import { useCommunityStore } from '@/stores/community'
import { useToastStore } from '@/stores/toast'

const route = useRoute()
const authStore = useAuthStore()
const communityStore = useCommunityStore()
const toastStore = useToastStore()
const newComment = ref('')
const formMessage = ref('')
const errorMessage = ref('')
const isCommentSubmitting = ref(false)
const isLikeSubmitting = ref(false)
const isPostEditing = ref(false)
const isSavingShared = ref(false)
const editingCommentId = ref(null)
const editingCommentContent = ref('')
const deletingCommentId = ref(null)
const pendingDeleteCommentId = ref(null)

const post = computed(() => communityStore.currentPost)
const comments = computed(() => communityStore.commentItems)
const commentPagination = computed(() => communityStore.commentPagination)
const hasSharedSnapshot = computed(() => Boolean(post.value?.sharedSavedMeal || post.value?.sharedWorkoutRoutine))
const sharedAlreadySaved = computed(() => Boolean(post.value?.viewerSaveStatus?.saved))
const commentSummary = computed(() => {
  if (!commentPagination.value.count) return '댓글 0개'
  const start = (commentPagination.value.page - 1) * commentPagination.value.pageSize + 1
  const end = Math.min(start + comments.value.length - 1, commentPagination.value.count)
  return `댓글 ${commentPagination.value.count}개 중 ${start}-${end}`
})

const postForm = reactive({
  title: '',
  category: 'free',
  content: '',
})

const categoryOptions = [
  { label: '식단', value: 'diet' },
  { label: '운동', value: 'workout' },
  { label: '자유', value: 'free' },
]

function categoryLabel(value) {
  return categoryOptions.find((category) => category.value === value)?.label || value
}

function itemName(item) {
  return item.food_name || item.foodName || item.name || item.exercise_name || item.exercise?.name || '항목'
}

async function fetchPost() {
  errorMessage.value = ''

  try {
    await communityStore.fetchPost(route.params.id)
  } catch (error) {
    errorMessage.value = normalizeCaughtError(error).message
  }
}

async function fetchComments(page = commentPagination.value.page) {
  errorMessage.value = ''

  try {
    await communityStore.fetchComments(route.params.id, {
      page,
      page_size: commentPagination.value.pageSize,
    })
  } catch (error) {
    errorMessage.value = normalizeCaughtError(error).message
  }
}

async function fetchPostDetail() {
  await fetchPost()
  await fetchComments(1)
}

function startEditPost() {
  if (!post.value) return
  isPostEditing.value = true
  postForm.title = post.value.title
  postForm.category = post.value.category
  postForm.content = post.value.content
}

function cancelEditPost() {
  isPostEditing.value = false
  formMessage.value = ''
}

async function submitPostEdit() {
  formMessage.value = ''

  if (!authStore.isAuthenticated) {
    formMessage.value = '로그인 후 게시글을 수정할 수 있습니다.'
    return
  }

  if (!postForm.title.trim() || !postForm.content.trim()) {
    formMessage.value = '제목과 내용을 입력해주세요.'
    return
  }

  try {
    await communityStore.editPost(route.params.id, {
      title: postForm.title.trim(),
      category: postForm.category,
      content: postForm.content.trim(),
    })
    isPostEditing.value = false
    formMessage.value = '게시글을 수정했습니다.'
    toastStore.success('게시글 수정 완료', '커뮤니티 게시글 내용이 변경되었습니다.')
  } catch (error) {
    formMessage.value = normalizeCaughtError(error).message
  }
}

async function saveSharedToMine() {
  formMessage.value = ''

  if (!authStore.isAuthenticated) {
    formMessage.value = '로그인 후 공유 항목을 내 계정에 저장할 수 있습니다.'
    return
  }

  if (!post.value?.sharedType) return

  isSavingShared.value = true

  try {
    const result =
      post.value.sharedType === 'saved_meal'
        ? await saveSharedMeal(route.params.id)
        : await saveSharedRoutine(route.params.id)
    await fetchPost()
    formMessage.value = result.already_saved ? '이미 내 계정에 저장된 항목입니다.' : '공유 항목을 내 계정에 저장했습니다.'
    toastStore.success('공유 항목 저장 완료', '내 식단/루틴 목록에서 확인할 수 있습니다.')
  } catch (error) {
    formMessage.value = normalizeCaughtError(error).message
  } finally {
    isSavingShared.value = false
  }
}

async function addComment() {
  formMessage.value = ''

  if (!authStore.isAuthenticated) {
    formMessage.value = '로그인 후 댓글을 작성할 수 있습니다.'
    return
  }

  const content = newComment.value.trim()
  if (!content) {
    formMessage.value = '댓글 내용을 입력해주세요.'
    return
  }

  isCommentSubmitting.value = true

  try {
    await communityStore.addComment(route.params.id, content)
    newComment.value = ''
    pendingDeleteCommentId.value = null
    const lastPage = Math.max(1, Math.ceil(commentPagination.value.count / commentPagination.value.pageSize))
    await fetchComments(lastPage)
    formMessage.value = '댓글을 작성했습니다.'
    toastStore.success('댓글 작성 완료', '게시글에 댓글을 추가했습니다.')
  } catch (error) {
    formMessage.value = normalizeCaughtError(error).message
  } finally {
    isCommentSubmitting.value = false
  }
}

function startEditComment(comment) {
  editingCommentId.value = comment.id
  editingCommentContent.value = comment.content
  pendingDeleteCommentId.value = null
  formMessage.value = ''
}

function cancelEditComment() {
  editingCommentId.value = null
  editingCommentContent.value = ''
}

async function submitCommentEdit(commentId) {
  formMessage.value = ''

  if (!authStore.isAuthenticated) {
    formMessage.value = '로그인 후 댓글을 수정할 수 있습니다.'
    return
  }

  const content = editingCommentContent.value.trim()
  if (!content) {
    formMessage.value = '댓글 내용을 입력해주세요.'
    return
  }

  try {
    await communityStore.editComment(commentId, content)
    await fetchComments(commentPagination.value.page)
    cancelEditComment()
    formMessage.value = '댓글을 수정했습니다.'
  } catch (error) {
    formMessage.value = normalizeCaughtError(error).message
  }
}

async function removeComment(commentId) {
  formMessage.value = ''

  if (!authStore.isAuthenticated) {
    formMessage.value = '로그인 후 댓글을 삭제할 수 있습니다.'
    return
  }

  if (pendingDeleteCommentId.value !== commentId) {
    pendingDeleteCommentId.value = commentId
    editingCommentId.value = null
    formMessage.value = '댓글을 삭제하려면 같은 버튼을 한 번 더 눌러주세요.'
    return
  }

  deletingCommentId.value = commentId

  try {
    await communityStore.removeComment(route.params.id, commentId)
    pendingDeleteCommentId.value = null
    const nextPage = comments.value.length === 0 && commentPagination.value.page > 1
      ? commentPagination.value.page - 1
      : commentPagination.value.page
    await fetchComments(nextPage)
    formMessage.value = '댓글을 삭제했습니다.'
  } catch (error) {
    formMessage.value = normalizeCaughtError(error).message
  } finally {
    deletingCommentId.value = null
  }
}

function cancelDeleteComment() {
  pendingDeleteCommentId.value = null
  formMessage.value = ''
}

async function toggleLike() {
  formMessage.value = ''

  if (!authStore.isAuthenticated) {
    formMessage.value = '로그인 후 좋아요를 누를 수 있습니다.'
    return
  }

  isLikeSubmitting.value = true

  try {
    await communityStore.toggleLike(route.params.id)
  } catch (error) {
    formMessage.value = normalizeCaughtError(error).message
  } finally {
    isLikeSubmitting.value = false
  }
}

onMounted(fetchPostDetail)
</script>

<template>
  <main class="page-shell">
    <StateBlock
      v-if="communityStore.isLoading && !post"
      type="loading"
      title="게시글을 불러오는 중입니다"
      message="선택한 게시글과 댓글을 조회하고 있습니다."
    />

    <StateBlock
      v-else-if="errorMessage"
      type="error"
      title="게시글을 찾을 수 없습니다"
      :message="errorMessage"
    />

    <template v-else-if="post">
      <PageHeader
        eyebrow="Post Detail"
        :title="post.title"
        :description="`${post.author}님의 ${categoryLabel(post.category)} 게시글입니다.`"
      />

      <section class="content-grid">
        <article class="surface-card" style="grid-column: span 8">
          <template v-if="isPostEditing">
            <form class="stacked-form" @submit.prevent="submitPostEdit">
              <div class="field-group">
                <label for="edit-post-title">제목</label>
                <input id="edit-post-title" v-model="postForm.title" type="text" />
              </div>
              <div class="field-group">
                <label for="edit-post-category">카테고리</label>
                <select id="edit-post-category" v-model="postForm.category">
                  <option v-for="category in categoryOptions" :key="category.value" :value="category.value">
                    {{ category.label }}
                  </option>
                </select>
              </div>
              <div class="field-group">
                <label for="edit-post-content">내용</label>
                <textarea id="edit-post-content" v-model="postForm.content" />
              </div>
              <div class="button-row">
                <button class="btn btn-primary" type="submit">게시글 수정</button>
                <button class="btn btn-secondary" type="button" @click="cancelEditPost">취소</button>
              </div>
            </form>
          </template>

          <template v-else>
            <span class="chip">{{ categoryLabel(post.category) }}</span>
            <span v-if="post.sharedType" class="chip">
              {{ post.sharedType === 'saved_meal' ? '공유 식단' : '공유 루틴' }}
            </span>
            <p class="post-body">{{ post.content }}</p>
            <p class="meta-text">좋아요 {{ post.likes }} · 댓글 {{ commentPagination.count || post.comments }}</p>
          </template>
        </article>

        <aside class="surface-card" style="grid-column: span 4">
          <p class="section-label">Actions</p>
          <div class="button-row">
            <button
              class="btn"
              :class="post.isLiked ? 'btn-primary' : 'btn-secondary'"
              type="button"
              :disabled="isLikeSubmitting"
              @click="toggleLike"
            >
              {{ isLikeSubmitting ? '처리 중...' : post.isLiked ? '좋아요 취소' : '좋아요' }}
            </button>
            <button class="btn btn-secondary" type="button" @click="startEditPost">수정</button>
            <RouterLink v-if="post.authorId" class="btn btn-secondary" :to="`/users/${post.authorId}`">작성자 프로필</RouterLink>
            <RouterLink class="btn btn-secondary" to="/community">목록</RouterLink>
          </div>
          <p v-if="!authStore.isAuthenticated" class="meta-text">
            로그인하면 좋아요, 게시글 수정, 댓글 작성이 가능합니다.
          </p>
        </aside>

        <section v-if="hasSharedSnapshot" class="surface-card" style="grid-column: span 8">
          <div class="section-heading-row">
            <div>
              <p class="section-label">Shared Snapshot</p>
              <h2>{{ post.sharedSavedMeal?.name || post.sharedWorkoutRoutine?.name }}</h2>
            </div>
            <button
              class="btn btn-primary"
              type="button"
              :disabled="isSavingShared || sharedAlreadySaved"
              @click="saveSharedToMine"
            >
              {{ sharedAlreadySaved ? '저장됨' : isSavingShared ? '저장 중...' : '내 계정에 저장' }}
            </button>
          </div>

          <template v-if="post.sharedSavedMeal">
            <p class="card-description">{{ post.sharedSavedMeal.description || '설명 없음' }}</p>
            <p class="meta-text">총 {{ post.sharedSavedMeal.totalCalories }} kcal</p>
            <div class="meal-list">
              <article v-for="item in post.sharedSavedMeal.items" :key="item.id || item.food_id || item.food_name" class="meal-item">
                <div>
                  <strong>{{ itemName(item) }}</strong>
                  <span>{{ item.amount }}g · {{ item.calories ?? 0 }} kcal</span>
                </div>
              </article>
            </div>
          </template>

          <template v-else-if="post.sharedWorkoutRoutine">
            <p class="card-description">{{ post.sharedWorkoutRoutine.description || '설명 없음' }}</p>
            <p class="meta-text">{{ post.sharedWorkoutRoutine.exerciseCount }}개 운동</p>
            <div class="routine-list">
              <article v-for="item in post.sharedWorkoutRoutine.items" :key="item.id || item.exercise_id || item.exercise_name" class="routine-item">
                <span>{{ item.order }}</span>
                <div>
                  <strong>{{ itemName(item) }}</strong>
                  <p>{{ item.sets }}세트 · {{ item.reps }}회 · {{ item.weight || 0 }}kg · 휴식 {{ item.rest_seconds || item.restSeconds || 0 }}초</p>
                </div>
              </article>
            </div>
          </template>
        </section>

        <section class="surface-card comments-panel" style="grid-column: span 8">
          <div class="section-heading-row">
            <div>
              <p class="section-label">댓글</p>
              <h2>{{ commentSummary }}</h2>
            </div>
          </div>

          <form class="comment-form" @submit.prevent="addComment">
            <textarea id="comment-input" v-model="newComment" placeholder="댓글을 입력하세요" />
            <button class="btn btn-primary" type="submit" :disabled="isCommentSubmitting">
              {{ isCommentSubmitting ? '작성 중...' : '댓글 작성' }}
            </button>
          </form>

          <p v-if="formMessage" class="form-message">{{ formMessage }}</p>

          <StateBlock
            v-if="communityStore.isCommentsLoading && comments.length === 0"
            type="loading"
            title="댓글을 불러오는 중입니다"
            message="댓글 목록 페이지를 조회하고 있습니다."
          />

          <article v-for="comment in comments" v-else :key="comment.id" class="comment-item">
            <div>
              <strong>{{ comment.author }}</strong>
              <span>{{ comment.createdAt }}</span>
              <form v-if="editingCommentId === comment.id" class="stacked-form" @submit.prevent="submitCommentEdit(comment.id)">
                <textarea v-model="editingCommentContent" />
                <div class="button-row">
                  <button class="btn btn-primary" type="submit">댓글 수정</button>
                  <button class="btn btn-secondary" type="button" @click="cancelEditComment">취소</button>
                </div>
              </form>
              <p v-else>{{ comment.content }}</p>
            </div>
            <div class="delete-actions">
              <button v-if="editingCommentId !== comment.id" type="button" @click="startEditComment(comment)">
                수정
              </button>
              <button
                type="button"
                :class="{ 'is-danger': pendingDeleteCommentId === comment.id }"
                :disabled="deletingCommentId === comment.id"
                @click="removeComment(comment.id)"
              >
                {{
                  deletingCommentId === comment.id
                    ? '삭제 중...'
                    : pendingDeleteCommentId === comment.id
                      ? '확인 삭제'
                      : '삭제'
                }}
              </button>
              <button v-if="pendingDeleteCommentId === comment.id" type="button" @click="cancelDeleteComment">
                취소
              </button>
            </div>
          </article>

          <div v-if="comments.length > 0" class="pagination-panel">
            <button
              class="btn btn-secondary"
              type="button"
              :disabled="!commentPagination.hasPrevious || communityStore.isCommentsLoading"
              @click="fetchComments(commentPagination.page - 1)"
            >
              이전
            </button>
            <strong>{{ commentPagination.page }} / {{ commentPagination.totalPages }}</strong>
            <button
              class="btn btn-secondary"
              type="button"
              :disabled="!commentPagination.hasNext || communityStore.isCommentsLoading"
              @click="fetchComments(commentPagination.page + 1)"
            >
              다음
            </button>
          </div>

          <StateBlock
            v-if="!communityStore.isCommentsLoading && comments.length === 0"
            type="empty"
            title="댓글이 없습니다"
            message="첫 댓글로 대화를 시작해보세요."
          >
            <a class="btn btn-primary" href="#comment-input">댓글 작성하기</a>
          </StateBlock>
        </section>
      </section>
    </template>

    <section v-else class="placeholder-panel">
      <p class="section-label">Not Found</p>
      <h1>게시글을 찾을 수 없습니다.</h1>
      <RouterLink class="btn btn-primary" to="/community">커뮤니티로 이동</RouterLink>
    </section>
  </main>
</template>
