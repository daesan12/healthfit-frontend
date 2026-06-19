<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import { mockComments } from '@/data/mockData'
import { useCommunityStore } from '@/stores/community'

const route = useRoute()
const communityStore = useCommunityStore()
const post = computed(() => communityStore.findPost(route.params.id))
const newComment = ref('')
const formMessage = ref('')
const comments = ref(mockComments.filter((comment) => comment.postId === Number(route.params.id)))

function addComment() {
  formMessage.value = ''

  if (!newComment.value.trim()) {
    formMessage.value = '댓글 내용을 입력해주세요.'
    return
  }

  comments.value.unshift({
    id: Date.now(),
    postId: Number(route.params.id),
    author: 'user01',
    content: newComment.value.trim(),
    createdAt: '방금 전',
  })

  newComment.value = ''
  formMessage.value = '댓글을 임시 작성했습니다. 백엔드 연결 후 comments API로 저장합니다.'
}

function removeComment(commentId) {
  comments.value = comments.value.filter((comment) => comment.id !== commentId)
}
</script>

<template>
  <main class="page-shell">
    <template v-if="post">
      <PageHeader
        eyebrow="Post Detail"
        :title="post.title"
        :description="`${post.author}님의 ${post.category} 게시글입니다.`"
      />

      <section class="content-grid">
        <article class="surface-card" style="grid-column: span 8">
          <span class="chip">{{ post.category }}</span>
          <p class="post-body">{{ post.preview }}</p>
          <p class="meta-text">좋아요 {{ post.likes }} · 댓글 {{ comments.length }}</p>
        </article>

        <aside class="surface-card" style="grid-column: span 4">
          <p class="section-label">Actions</p>
          <div class="button-row">
            <button
              class="btn"
              :class="post.isLiked ? 'btn-primary' : 'btn-secondary'"
              type="button"
              @click="communityStore.toggleLike(post.id)"
            >
              {{ post.isLiked ? '좋아요 취소' : '좋아요' }}
            </button>
            <RouterLink class="btn btn-secondary" to="/community">목록</RouterLink>
          </div>
        </aside>

        <section class="surface-card comments-panel" style="grid-column: span 8">
          <div class="section-heading-row">
            <div>
              <p class="section-label">Comments</p>
              <h2>댓글 {{ comments.length }}개</h2>
            </div>
          </div>

          <form class="comment-form" @submit.prevent="addComment">
            <textarea v-model="newComment" placeholder="댓글을 입력하세요." />
            <button class="btn btn-primary" type="submit">댓글 작성</button>
          </form>

          <p v-if="formMessage" class="form-message">{{ formMessage }}</p>

          <article v-for="comment in comments" :key="comment.id" class="comment-item">
            <div>
              <strong>{{ comment.author }}</strong>
              <span>{{ comment.createdAt }}</span>
              <p>{{ comment.content }}</p>
            </div>
            <button type="button" @click="removeComment(comment.id)">삭제</button>
          </article>
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
