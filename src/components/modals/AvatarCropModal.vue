<script setup>
import { computed, ref, watch } from 'vue'
import AppModal from '@/components/AppModal.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  file: {
    type: Object,
    default: null,
  },
  title: {
    type: String,
    default: 'Cắt ảnh đại diện',
  },
})

const emit = defineEmits(['update:show', 'cropped'])

const imageElement = ref(null)
const sourceUrl = ref('')
const previewDataUrl = ref('')

const zoom = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)

const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const dragOriginOffsetX = ref(0)
const dragOriginOffsetY = ref(0)

const previewSize = 256

const cursorStyle = computed(() => (isDragging.value ? 'grabbing' : 'grab'))

const resetState = () => {
  zoom.value = 1
  offsetX.value = 0
  offsetY.value = 0
  previewDataUrl.value = ''
  imageElement.value = null
  isDragging.value = false
}

const close = () => {
  emit('update:show', false)
}

const loadImage = (file) => {
  if (!file) return

  sourceUrl.value = URL.createObjectURL(file)

  const img = new Image()
  img.onload = () => {
    imageElement.value = img
    renderPreview()
  }
  img.src = sourceUrl.value
}

const getBounds = () => {
  const img = imageElement.value
  if (!img) {
    return {
      minX: -160,
      maxX: 160,
      minY: -160,
      maxY: 160,
    }
  }

  const baseScale = Math.max(previewSize / img.width, previewSize / img.height)
  const scale = baseScale * zoom.value
  const drawWidth = img.width * scale
  const drawHeight = img.height * scale

  const maxX = Math.max(0, (drawWidth - previewSize) / 2)
  const maxY = Math.max(0, (drawHeight - previewSize) / 2)

  return {
    minX: -maxX,
    maxX,
    minY: -maxY,
    maxY,
  }
}

const clampOffsets = () => {
  const bounds = getBounds()
  offsetX.value = Math.min(bounds.maxX, Math.max(bounds.minX, offsetX.value))
  offsetY.value = Math.min(bounds.maxY, Math.max(bounds.minY, offsetY.value))
}

const renderPreview = () => {
  const img = imageElement.value
  if (!img) return

  clampOffsets()

  const canvas = document.createElement('canvas')
  canvas.width = previewSize
  canvas.height = previewSize

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, previewSize, previewSize)

  const baseScale = Math.max(previewSize / img.width, previewSize / img.height)
  const scale = baseScale * zoom.value

  const drawWidth = img.width * scale
  const drawHeight = img.height * scale

  const drawX = (previewSize - drawWidth) / 2 + offsetX.value
  const drawY = (previewSize - drawHeight) / 2 + offsetY.value

  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)

  previewDataUrl.value = canvas.toDataURL('image/png')
}

const onWheelZoom = (event) => {
  event.preventDefault()
  const delta = event.deltaY > 0 ? -0.08 : 0.08
  const nextZoom = Math.min(4, Math.max(1, zoom.value + delta))
  zoom.value = Number(nextZoom.toFixed(2))
}

const startDrag = (event) => {
  if (!previewDataUrl.value) return

  isDragging.value = true
  dragStartX.value = event.clientX
  dragStartY.value = event.clientY
  dragOriginOffsetX.value = offsetX.value
  dragOriginOffsetY.value = offsetY.value
}

const onDrag = (event) => {
  if (!isDragging.value) return

  const dx = event.clientX - dragStartX.value
  const dy = event.clientY - dragStartY.value

  offsetX.value = dragOriginOffsetX.value + dx
  offsetY.value = dragOriginOffsetY.value + dy
  renderPreview()
}

const stopDrag = () => {
  isDragging.value = false
}

const confirmCrop = async () => {
  if (!previewDataUrl.value) return

  const response = await fetch(previewDataUrl.value)
  const blob = await response.blob()
  const croppedFile = new File([blob], `avatar-${Date.now()}.png`, { type: 'image/png' })

  emit('cropped', { file: croppedFile, previewUrl: previewDataUrl.value })
  close()
}

watch(
  () => props.show,
  (visible) => {
    if (!visible) {
      resetState()
      return
    }

    resetState()
    loadImage(props.file)
  },
)

watch([zoom], () => {
  if (props.show) {
    renderPreview()
  }
})

watch([offsetX, offsetY], () => {
  if (props.show && !isDragging.value) {
    renderPreview()
  }
})
</script>

<template>
  <AppModal
    :show="show"
    :title="title"
    subtitle="Giữ chuột trái để kéo ảnh, cuộn chuột để phóng to/thu nhỏ"
    confirm-text="Dùng ảnh này"
    cancel-text="Hủy"
    width="520px"
    @close="close"
    @confirm="confirmCrop"
  >
    <div class="avatar-crop__body">
      <div
        class="avatar-crop__preview-wrap"
        :style="{ cursor: cursorStyle }"
        @wheel="onWheelZoom"
        @mousedown="startDrag"
        @mousemove="onDrag"
        @mouseleave="stopDrag"
        @mouseup="stopDrag"
      >
        <div class="avatar-crop__preview-circle">
          <img v-if="previewDataUrl" :src="previewDataUrl" alt="Avatar preview" class="avatar-crop__preview-image" draggable="false" />
        </div>
      </div>

      <div class="avatar-crop__controls">
        <p class="avatar-crop__hint">
          Zoom: {{ zoom.toFixed(2) }}x
        </p>
        <button type="button" class="avatar-crop__btn" @click="zoom = Math.min(4, Number((zoom + 0.1).toFixed(2)))">Phóng to</button>
        <button type="button" class="avatar-crop__btn" @click="zoom = Math.max(1, Number((zoom - 0.1).toFixed(2)))">Thu nhỏ</button>
      </div>
    </div>
  </AppModal>
</template>

<style scoped>
.avatar-crop__body {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 16px;
  align-items: center;
}

.avatar-crop__preview-wrap {
  display: flex;
  justify-content: center;
  user-select: none;
}

.avatar-crop__preview-circle {
  width: 180px;
  height: 180px;
  border-radius: 9999px;
  border: 2px solid #6366f1;
  overflow: hidden;
  background: #111827;
}

.avatar-crop__preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
  pointer-events: none;
}

.avatar-crop__controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.avatar-crop__hint {
  margin: 0 0 4px;
  color: #cbd5e1;
  font-size: 13px;
}

.avatar-crop__btn {
  border: 1px solid #4b5563;
  background: #111827;
  color: #f9fafb;
  border-radius: 8px;
  padding: 8px 10px;
  cursor: pointer;
}

.avatar-crop__btn:hover {
  border-color: #6366f1;
}
</style>
