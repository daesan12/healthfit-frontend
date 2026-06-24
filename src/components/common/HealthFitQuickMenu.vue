<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const isOpen = ref(false)

const authPaths = ['/login', '/signup']

const isHidden = computed(() => authPaths.some((p) => route.path.startsWith(p)))

const quickLinks = [
  {
    label: '진행 현황',
    caption: '체중·식단·운동 변화 확인',
    to: '/progress',
    icon: '📈',
  },
  {
    label: '음식 찾기',
    caption: '음식 영양성분 검색',
    to: '/foods',
    icon: '🍚',
  },
  {
    label: '운동 찾기',
    caption: '운동 목록과 동작 확인',
    to: '/workouts',
    icon: '🏋️',
  },
  {
    label: 'AI 식단 추천',
    caption: '목표에 맞는 식단 생성',
    to: '/diet/recommend',
    icon: '🥗',
  },
  {
    label: 'AI 식단 평가',
    caption: '오늘 식단 피드백 받기',
    to: '/diet/evaluation',
    icon: '✅',
  },
  {
    label: 'AI 운동 추천',
    caption: '운동 루틴 추천 받기',
    to: '/workout/recommend',
    icon: '💪',
  },
  
]

function toggle() {
  isOpen.value = !isOpen.value
}

function close() {
  isOpen.value = false
}
</script>

<template>
  <Teleport to="body">
    <div v-if="!isHidden" class="hfqm">
      <Transition name="hfqm-panel">
        <nav
          v-if="isOpen"
          class="hfqm__panel"
          aria-label="빠른 이동"
          @mouseleave="close"
        >
          <div class="hfqm__head">
            <p class="hfqm__head-label">Quick Menu</p>
            <button class="hfqm__close" type="button" aria-label="닫기" @click="close">✕</button>
          </div>

          <RouterLink
            v-for="link in quickLinks"
            :key="link.to"
            class="hfqm__link"
            :to="link.to"
            @click="close"
          >
            <span class="hfqm__icon">{{ link.icon }}</span>
            <span class="hfqm__text">
              <strong>{{ link.label }}</strong>
              <small>{{ link.caption }}</small>
            </span>
          </RouterLink>
        </nav>
      </Transition>

      <button
        class="hfqm__trigger"
        type="button"
        :aria-label="isOpen ? '빠른 메뉴 닫기' : '빠른 메뉴 열기'"
        :aria-expanded="isOpen"
        @mouseenter="isOpen = true"
        @click="toggle"
      >
        <span class="hfqm__trigger-pill">Quick</span>
      </button>
    </div>
  </Teleport>
</template>

<style scoped>
/* ─── positioning ─── */
.hfqm {
  position: fixed;
  left: 1rem;
  right: auto;
  top: 50%;
  transform: translateY(-50%);
  z-index: 900;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  pointer-events: none;
}

.hfqm > * {
  pointer-events: auto;
}

/* ─── trigger pill ─── */
.hfqm__trigger {
  flex-shrink: 0;
  border: none;
  padding: 0;
  background: transparent;
  cursor: pointer;
  outline: none;
}

.hfqm__trigger-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  height: 40px;
  padding: 0 1rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #1f6b3f, #2f8f5b);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  box-shadow:
    0 8px 24px rgba(31, 107, 63, 0.28),
    0 2px 6px rgba(31, 107, 63, 0.12);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.hfqm__trigger:hover .hfqm__trigger-pill {
  transform: translateY(-2px);
  box-shadow:
    0 12px 32px rgba(31, 107, 63, 0.34),
    0 4px 10px rgba(31, 107, 63, 0.16);
}

.hfqm__trigger[aria-expanded='true'] .hfqm__trigger-pill {
  background: linear-gradient(135deg, #2f8f5b, #3aad70);
}

/* ─── panel ─── */
.hfqm__panel {
  position: absolute;
  left: calc(100% + 0.5rem);
  right: auto;
  top: 50%;
  transform: translateY(-50%);
  width: 264px;
  max-height: min(calc(100vh - 140px), 560px);
  overflow-y: auto;
  padding: 1rem;
  border-radius: 24px;
  border: 1px solid rgba(31, 107, 63, 0.14);
  background:
    radial-gradient(circle at 0% 0%, rgba(255, 216, 104, 0.18), transparent 36%),
    rgba(255, 255, 255, 0.96);
  box-shadow:
    0 18px 50px rgba(31, 107, 63, 0.1),
    0 4px 12px rgba(31, 107, 63, 0.06);
  backdrop-filter: blur(18px);
}

.hfqm__panel::-webkit-scrollbar {
  width: 5px;
}

.hfqm__panel::-webkit-scrollbar-thumb {
  background: rgba(31, 107, 63, 0.2);
  border-radius: 999px;
}

/* ─── head ─── */
.hfqm__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.85rem;
}

.hfqm__head-label {
  display: inline-flex;
  min-height: 26px;
  padding: 0 0.7rem;
  border-radius: 999px;
  background: rgba(31, 107, 63, 0.1);
  color: #1f6b3f;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  align-items: center;
}

.hfqm__close {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: rgba(31, 107, 63, 0.08);
  color: rgba(23, 38, 29, 0.6);
  font-size: 0.72rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;
}

.hfqm__close:hover {
  background: rgba(31, 107, 63, 0.18);
}

/* ─── links ─── */
.hfqm__link {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 0.65rem;
  align-items: center;
  padding: 0.65rem;
  border: 1px solid rgba(31, 107, 63, 0.12);
  border-radius: 16px;
  color: #17261d;
  text-decoration: none;
  background: rgba(248, 252, 247, 0.78);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease;
}

.hfqm__link + .hfqm__link {
  margin-top: 0.45rem;
}

.hfqm__link:hover {
  transform: translateY(-2px);
  border-color: rgba(31, 107, 63, 0.34);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 12px 24px rgba(31, 107, 63, 0.1);
}

.hfqm__link.router-link-active {
  border-color: rgba(31, 107, 63, 0.45);
  background: rgba(31, 107, 63, 0.08);
}

/* ─── icon ─── */
.hfqm__icon {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(31, 107, 63, 0.12), rgba(255, 216, 104, 0.26));
  font-size: 1.1rem;
}

/* ─── text ─── */
.hfqm__text strong,
.hfqm__text small {
  display: block;
}

.hfqm__text strong {
  color: #14251b;
  font-size: 0.88rem;
}

.hfqm__text small {
  margin-top: 0.15rem;
  color: rgba(23, 38, 29, 0.52);
  font-size: 0.72rem;
  line-height: 1.3;
}

/* ─── transition ─── */
.hfqm-panel-enter-active,
.hfqm-panel-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.hfqm-panel-enter-from,
.hfqm-panel-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(-12px);
}

/* ─── mobile: bottom floating ─── */
@media (max-width: 768px) {
  .hfqm {
    right: auto;
    left: 50%;
    top: auto;
    bottom: 1rem;
    transform: translateX(-50%);
  }

  .hfqm__panel {
    right: auto;
    top: auto;
    bottom: calc(100% + 0.6rem);
    left: 50%;
    transform: translateX(-50%);
    width: calc(100vw - 2rem);
    max-width: 360px;
    max-height: min(60vh, 420px);
  }

  .hfqm__panel {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.4rem;
  }

  .hfqm__head {
    grid-column: span 2;
  }

  .hfqm__link + .hfqm__link {
    margin-top: 0;
  }

  .hfqm-panel-enter-from,
  .hfqm-panel-leave-to {
    transform: translateX(-50%) translateY(12px);
  }

  .hfqm__trigger-pill {
    min-width: 72px;
    height: 44px;
    font-size: 0.82rem;
  }
}
</style>
