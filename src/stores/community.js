import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { mockPosts } from '@/data/mockData'

export const useCommunityStore = defineStore('community', () => {
  const posts = ref(
    mockPosts.map((post) => ({
      ...post,
      isLiked: false,
    })),
  )

  const postCount = computed(() => posts.value.length)

  function addPost(post) {
    posts.value.unshift({
      id: Date.now(),
      likes: 0,
      comments: 0,
      author: 'user01',
      isLiked: false,
      ...post,
    })
  }

  function findPost(postId) {
    return posts.value.find((post) => post.id === Number(postId))
  }

  function toggleLike(postId) {
    const post = findPost(postId)
    if (!post) return

    post.isLiked = !post.isLiked
    post.likes += post.isLiked ? 1 : -1
  }

  return {
    posts,
    postCount,
    addPost,
    findPost,
    toggleLike,
  }
})
