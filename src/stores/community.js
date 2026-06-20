import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as communityApi from '@/api/community'

export const useCommunityStore = defineStore('community', () => {
  const posts = ref([])
  const currentPost = ref(null)
  const pagination = ref({
    count: 0,
    page: 1,
    pageSize: 10,
  })
  const isLoading = ref(false)
  const errorMessage = ref('')

  const postCount = computed(() => pagination.value.count || posts.value.length)

  async function fetchPosts(params = {}) {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const data = await communityApi.getPosts(params)
      posts.value = data.results
      pagination.value = {
        count: data.count,
        page: data.page,
        pageSize: data.pageSize,
      }
      return data
    } finally {
      isLoading.value = false
    }
  }

  async function fetchPost(postId) {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const data = await communityApi.getPost(postId)
      currentPost.value = data
      return data
    } finally {
      isLoading.value = false
    }
  }

  async function addPost(post) {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const data = await communityApi.createPost(post)
      posts.value.unshift(data)
      pagination.value.count += 1
      currentPost.value = data
      return data
    } finally {
      isLoading.value = false
    }
  }

  function findPost(postId) {
    const id = Number(postId)

    if (currentPost.value?.id === id) {
      return currentPost.value
    }

    return posts.value.find((post) => post.id === id)
  }

  function updatePostLike(postId, likeState) {
    const post = findPost(postId)
    if (!post) return

    post.isLiked = Boolean(likeState.is_liked)
    post.likes = likeState.like_count ?? post.likes
  }

  async function toggleLike(postId) {
    const data = await communityApi.togglePostLike(postId)
    updatePostLike(postId, data)
    return data
  }

  async function addComment(postId, content) {
    const comment = await communityApi.createComment(postId, { content })

    if (currentPost.value?.id === Number(postId)) {
      currentPost.value.commentItems = [comment, ...(currentPost.value.commentItems || [])]
      currentPost.value.comments = currentPost.value.commentItems.length
    }

    const listPost = posts.value.find((post) => post.id === Number(postId))
    if (listPost) {
      listPost.comments += 1
    }

    return comment
  }

  async function removeComment(postId, commentId) {
    await communityApi.deleteComment(commentId)

    if (currentPost.value?.id === Number(postId)) {
      currentPost.value.commentItems = (currentPost.value.commentItems || []).filter(
        (comment) => comment.id !== Number(commentId),
      )
      currentPost.value.comments = currentPost.value.commentItems.length
    }

    const listPost = posts.value.find((post) => post.id === Number(postId))
    if (listPost && listPost.comments > 0) {
      listPost.comments -= 1
    }
  }

  return {
    posts,
    currentPost,
    pagination,
    isLoading,
    errorMessage,
    postCount,
    fetchPosts,
    fetchPost,
    addPost,
    findPost,
    updatePostLike,
    toggleLike,
    addComment,
    removeComment,
  }
})
