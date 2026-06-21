<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { normalizeCaughtError } from '@/api/client'
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
const deletingCommentId = ref(null)
const pendingDeleteCommentId = ref(null)

const post = computed(() => communityStore.currentPost)
const comments = computed(() => post.value?.commentItems || [])

const categoryLabels = {
  diet: '식단',
  workout: '운동',
  free: '자유',
}

function categoryLabel(value) {
  return categoryLabels[value] || value
}

async function fetchPost() {
  errorMessage.value = ''

  try {
    await communityStore.fetchPost(route.params.id)
  } catch (error) {
    const apiError = normalizeCaughtError(error)
    errorMessage.value = apiError.message
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
    formMessage.value = '댓글이 작성되었습니다.'
    toastStore.success('댓글 작성 완료', '게시글에 댓글이 추가되었습니다.')
  } catch (error) {
    const apiError = normalizeCaughtError(error)
    formMessage.value = apiError.message
  } finally {
    isCommentSubmitting.value = false
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
    formMessage.value = '댓글을 삭제하려면 같은 버튼을 한 번 더 눌러주세요.'
    return
  }

  deletingCommentId.value = commentId

  try {
    await communityStore.removeComment(route.params.id, commentId)
    pendingDeleteCommentId.value = null
    formMessage.value = '댓글이 삭제되었습니다.'
  } catch (error) {
    const apiError = normalizeCaughtError(error)
    formMessage.value = apiError.message
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
    const apiError = normalizeCaughtError(error)
    formMessage.value = apiError.message
  } finally {
    isLikeSubmitting.value = false
  }
}

onMounted(fetchPost)
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
          <span class="chip">{{ categoryLabel(post.category) }}</span>
          <p class="post-body">{{ post.content }}</p>
          <p class="meta-text">좋아요 {{ post.likes }} · 댓글 {{ comments.length }}</p>
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
            <RouterLink class="btn btn-secondary" to="/community">목록</RouterLink>
          </div>
          <p v-if="!authStore.isAuthenticated" class="meta-text">
            로그인하면 좋아요와 댓글을 남길 수 있습니다.
          </p>
        </aside>

        <section class="surface-card comments-panel" style="grid-column: span 8">
          <div class="section-heading-row">
            <div>
              <p class="section-label">Comments</p>
              <h2>댓글 {{ comments.length }}개</h2>
            </div>
          </div>

          <form class="comment-form" @submit.prevent="addComment">
            <textarea id="comment-input" v-model="newComment" placeholder="댓글을 입력하세요." />
            <button class="btn btn-primary" type="submit" :disabled="isCommentSubmitting">
              {{ isCommentSubmitting ? '작성 중...' : '댓글 작성' }}
            </button>
          </form>

          <p v-if="formMessage" class="form-message">{{ formMessage }}</p>

          <article v-for="comment in comments" :key="comment.id" class="comment-item">
            <div>
              <strong>{{ comment.author }}</strong>
              <span>{{ comment.createdAt }}</span>
              <p>{{ comment.content }}</p>
            </div>
            <div class="delete-actions">
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

          <StateBlock
            v-if="comments.length === 0"
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
