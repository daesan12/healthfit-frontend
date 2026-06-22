import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as communityApi from '@/api/community'

export const useCommunityStore = defineStore('community', () => {
  const posts = ref([])
  const currentPost = ref(null)
  const commentItems = ref([])
  const pagination = ref({
    count: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  })
  const commentPagination = ref({
    count: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  })
  const isLoading = ref(false)
  const isCommentsLoading = ref(false)
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
        totalPages: data.totalPages,
        hasNext: data.hasNext,
        hasPrevious: data.hasPrevious,
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
      commentItems.value = data.commentItems || []
      return data
    } finally {
      isLoading.value = false
    }
  }

  async function fetchComments(postId, params = {}) {
    isCommentsLoading.value = true
    errorMessage.value = ''

    try {
      const data = await communityApi.getComments(postId, params)
      commentItems.value = data.results
      commentPagination.value = {
        count: data.count,
        page: data.page,
        pageSize: data.pageSize,
        totalPages: data.totalPages,
        hasNext: data.hasNext,
        hasPrevious: data.hasPrevious,
      }

      if (currentPost.value?.id === Number(postId)) {
        currentPost.value.commentItems = data.results
        currentPost.value.comments = data.count
      }

      return data
    } finally {
      isCommentsLoading.value = false
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

  async function editPost(postId, payload) {
    const data = await communityApi.updatePost(postId, payload)
    const index = posts.value.findIndex((post) => post.id === Number(postId))

    if (index !== -1) {
      posts.value[index] = {
        ...posts.value[index],
        ...data,
      }
    }

    if (currentPost.value?.id === Number(postId)) {
      currentPost.value = data
    }

    return data
  }

  async function removePost(postId) {
    await communityApi.deletePost(postId)
    posts.value = posts.value.filter((post) => post.id !== Number(postId))
    pagination.value.count = Math.max((pagination.value.count || 1) - 1, 0)

    if (currentPost.value?.id === Number(postId)) {
      currentPost.value = null
      commentItems.value = []
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
      currentPost.value.comments = (currentPost.value.comments || commentPagination.value.count || 0) + 1
    }

    commentPagination.value.count += 1

    const listPost = posts.value.find((post) => post.id === Number(postId))
    if (listPost) {
      listPost.comments += 1
    }

    return comment
  }

  async function editComment(commentId, content) {
    const comment = await communityApi.updateComment(commentId, { content })

    if (currentPost.value) {
      commentItems.value = commentItems.value.map((item) => (item.id === Number(commentId) ? comment : item))
      currentPost.value.commentItems = commentItems.value
    }

    return comment
  }

  async function removeComment(postId, commentId) {
    await communityApi.deleteComment(commentId)

    if (currentPost.value?.id === Number(postId)) {
      commentItems.value = commentItems.value.filter((comment) => comment.id !== Number(commentId))
      currentPost.value.commentItems = commentItems.value
      currentPost.value.comments = Math.max((currentPost.value.comments || commentPagination.value.count || 1) - 1, 0)
    }

    commentPagination.value.count = Math.max(commentPagination.value.count - 1, 0)

    const listPost = posts.value.find((post) => post.id === Number(postId))
    if (listPost && listPost.comments > 0) {
      listPost.comments -= 1
    }
  }

  return {
    posts,
    currentPost,
    commentItems,
    pagination,
    commentPagination,
    isLoading,
    isCommentsLoading,
    errorMessage,
    postCount,
    fetchPosts,
    fetchPost,
    fetchComments,
    addPost,
    editPost,
    removePost,
    findPost,
    updatePostLike,
    toggleLike,
    addComment,
    editComment,
    removeComment,
  }
})
