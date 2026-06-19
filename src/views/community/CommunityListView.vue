<script setup>
import { computed, reactive, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { useCommunityStore } from '@/stores/community'

const communityStore = useCommunityStore()
const draftPost = reactive({
  title: '',
  category: 'diet',
  content: '',
})
const formMessage = ref('')

const posts = computed(() => communityStore.posts)

function createDraftPost() {
  formMessage.value = ''

  if (!draftPost.title.trim() || !draftPost.content.trim()) {
    formMessage.value = '제목과 내용을 입력해주세요.'
    return
  }

  communityStore.addPost({
    title: draftPost.title.trim(),
    category: draftPost.category,
    preview: draftPost.content.trim(),
  })

  draftPost.title = ''
  draftPost.category = 'diet'
  draftPost.content = ''
  formMessage.value = '게시글을 임시 작성했습니다. 백엔드 연결 후 posts API로 저장합니다.'
}
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Community"
      title="커뮤니티"
      description="식단, 운동 루틴, 운동 기록을 게시글로 공유합니다."
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

        <button class="btn btn-primary" type="submit">게시글 작성</button>
      </form>

      <section class="post-list" style="grid-column: span 8">
        <article v-for="post in posts" :key="post.id" class="surface-card">
          <div class="section-heading-row">
            <div>
              <span class="chip">{{ post.category }}</span>
              <h2>{{ post.title }}</h2>
            </div>
            <button
              class="btn"
              :class="post.isLiked ? 'btn-primary' : 'btn-secondary'"
              type="button"
              @click="communityStore.toggleLike(post.id)"
            >
              {{ post.isLiked ? '좋아요 취소' : '좋아요' }}
            </button>
          </div>
          <p class="card-description">{{ post.preview }}</p>
          <p class="meta-text">
            {{ post.author }} · 좋아요 {{ post.likes }} · 댓글 {{ post.comments }}
          </p>
          <RouterLink class="btn btn-secondary card-action" :to="`/posts/${post.id}`">
            상세 보기
          </RouterLink>
        </article>
      </section>
    </section>
  </main>
</template>
