<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { normalizeCaughtError } from '@/api/client'
import { getPublicProfile } from '@/api/community'

const route = useRoute()
const profileData = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

const user = computed(() => profileData.value?.user || {})
const profile = computed(() => profileData.value?.profile || null)
const posts = computed(() => profileData.value?.posts || [])
const savedMeal = computed(() => profileData.value?.representative_saved_meal || null)
const routine = computed(() => profileData.value?.representative_workout_routine || null)

const goalLabels = {
  fat_loss: '감량',
  muscle_gain: '근성장',
  maintenance: '유지',
  health: '건강 관리',
}

async function fetchPublicProfile() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    profileData.value = await getPublicProfile(route.params.id)
  } catch (error) {
    errorMessage.value = normalizeCaughtError(error).message
  } finally {
    isLoading.value = false
  }
}

function goalLabel(value) {
  return goalLabels[value] || value || '목표 미등록'
}

onMounted(fetchPublicProfile)
watch(() => route.params.id, fetchPublicProfile)
</script>

<template>
  <main class="page-shell">
    <StateBlock
      v-if="isLoading"
      type="loading"
      title="공개 프로필 조회 중"
      message="사용자의 공개 정보와 게시글을 불러오고 있습니다."
    />

    <StateBlock
      v-else-if="errorMessage"
      type="error"
      title="공개 프로필을 찾을 수 없습니다"
      :message="errorMessage"
    />

    <template v-else-if="profileData">
      <PageHeader
        eyebrow="Public Profile"
        :title="user.username || '사용자'"
        :description="`게시글 ${profileData.post_count || posts.length}개 · ${goalLabel(profile?.workout_goal)}`"
      />

      <section class="content-grid">
        <section class="surface-card" style="grid-column: span 4">
          <p class="section-label">Profile</p>
          <h2>{{ user.username }}</h2>
          <p class="meta-text">가입일 {{ user.created_at || '정보 없음' }}</p>
          <div class="chip-list">
            <span class="chip">{{ goalLabel(profile?.workout_goal) }}</span>
          </div>
        </section>

        <section class="surface-card" style="grid-column: span 4">
          <p class="section-label">Representative Meal</p>
          <h2>{{ savedMeal?.name || '대표 식단 없음' }}</h2>
          <p class="card-description">{{ savedMeal?.description || '공개된 대표 저장 식단이 없습니다.' }}</p>
        </section>

        <section class="surface-card" style="grid-column: span 4">
          <p class="section-label">Representative Routine</p>
          <h2>{{ routine?.name || '대표 루틴 없음' }}</h2>
          <p class="card-description">{{ routine?.description || '공개된 대표 운동 루틴이 없습니다.' }}</p>
        </section>

        <section class="post-list" style="grid-column: span 12">
          <div class="section-toolbar">
            <p class="section-label">Posts</p>
            <strong>{{ posts.length }}개</strong>
          </div>

          <article v-for="post in posts" :key="post.id" class="surface-card">
            <div class="section-heading-row">
              <div>
                <span class="chip">{{ post.category }}</span>
                <h2>{{ post.title }}</h2>
              </div>
              <span class="chip">좋아요 {{ post.like_count ?? post.likes ?? 0 }}</span>
            </div>
            <p class="card-description">{{ post.content }}</p>
            <RouterLink class="btn btn-secondary card-action" :to="`/posts/${post.id}`">게시글 보기</RouterLink>
          </article>

          <StateBlock
            v-if="posts.length === 0"
            type="empty"
            title="공개 게시글이 없습니다"
            message="이 사용자가 아직 공개 게시글을 작성하지 않았습니다."
          />
        </section>
      </section>
    </template>
  </main>
</template>
