<script setup>
import { computed, reactive, ref } from 'vue'
import { Camera, Eye, EyeOff, LogOut, Save, Settings, ArrowLeft } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import AppModal from '@/components/AppModal.vue'
import AppToast from '@/components/AppToast.vue'
import AvatarCropModal from '@/components/modals/AvatarCropModal.vue'

const router = useRouter()
const authStore = useAuthStore()

const profileForm = reactive({
  displayName: authStore.user?.displayName || authStore.user?.profileName || authStore.user?.loginName || authStore.user?.username || '',
  bio: authStore.user?.bio || '',
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
})

const avatarPreview = ref(authStore.user?.avatarUrl || '')
const displayNameText = (user) => user?.displayName || user?.profileName || user?.loginName || user?.username || ''
const selectedAvatarFile = ref(null)
const pendingCropFile = ref(null)
const showCropModal = ref(false)
const avatarInputRef = ref(null)

const initialProfile = reactive({
  displayName: displayNameText(authStore.user),
  bio: authStore.user?.bio || '',
  avatarUrl: authStore.user?.avatarUrl || '',
})

const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const isSavingProfile = ref(false)
const isSavingPassword = ref(false)
const isLoggingOut = ref(false)
const showLogoutModal = ref(false)

const toast = reactive({
  show: false,
  type: 'success',
  message: '',
})

let toastTimer = null

const profileValidationError = computed(() => {
  if (profileForm.displayName.length > 50) {
    return 'Tên hiển thị tối đa 50 ký tự.'
  }

  if (profileForm.bio.length > 150) {
    return 'Bio tối đa 150 ký tự.'
  }

  return ''
})

const passwordValidationError = computed(() => {
  const hasAnyInput = passwordForm.currentPassword || passwordForm.newPassword || passwordForm.confirmNewPassword

  if (!hasAnyInput) return ''

  if (!passwordForm.currentPassword) {
    return 'Vui lòng nhập mật khẩu hiện tại.'
  }

  if (passwordForm.newPassword.length < 8) {
    return 'Mật khẩu mới phải có ít nhất 8 ký tự.'
  }

  if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
    return 'Mật khẩu mới và xác nhận mật khẩu không khớp.'
  }

  return ''
})

const hasPasswordInput = computed(() => {
  return Boolean(passwordForm.currentPassword || passwordForm.newPassword || passwordForm.confirmNewPassword)
})

const hasAvatarChanged = computed(() => {
  return Boolean(selectedAvatarFile.value) || (avatarPreview.value || '') !== (initialProfile.avatarUrl || '')
})

const hasProfileChanged = computed(() => {
  return (
    profileForm.displayName.trim() !== (initialProfile.displayName || '').trim() ||
    profileForm.bio.trim() !== (initialProfile.bio || '').trim() ||
    hasAvatarChanged.value
  )
})

const canSaveProfile = computed(() => hasProfileChanged.value && !profileValidationError.value)
const canSavePassword = computed(() => hasPasswordInput.value && !passwordValidationError.value)

const canSave = computed(() => {
  if (isSavingProfile.value || isSavingPassword.value || isLoggingOut.value) return false
  return canSaveProfile.value || canSavePassword.value
})

const showToast = (message, type = 'success') => {
  if (toastTimer) {
    clearTimeout(toastTimer)
  }

  toast.show = true
  toast.type = type
  toast.message = message

  toastTimer = setTimeout(() => {
    toast.show = false
  }, 2800)
}

const openAvatarPicker = () => {
  avatarInputRef.value?.click()
}

const onAvatarSelected = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    showToast('Vui lòng chọn file ảnh hợp lệ.', 'error')
    event.target.value = ''
    return
  }

  pendingCropFile.value = file
  showCropModal.value = true
  event.target.value = ''
}

const onAvatarCropped = ({ file, previewUrl }) => {
  selectedAvatarFile.value = file
  avatarPreview.value = previewUrl
  pendingCropFile.value = null
  showCropModal.value = false
}

const handleSaveChanges = async () => {
  if (!canSave.value) return

  if (canSaveProfile.value) {
    isSavingProfile.value = true
    try {
      const updatedUser = await authStore.updateProfile({
        displayName: profileForm.displayName.trim(),
        bio: profileForm.bio.trim(),
      }, selectedAvatarFile.value)

      selectedAvatarFile.value = null
      avatarPreview.value = updatedUser?.avatarUrl || avatarPreview.value

      initialProfile.displayName = updatedUser?.displayName || profileForm.displayName.trim()
      initialProfile.bio = updatedUser?.bio || profileForm.bio.trim()
      initialProfile.avatarUrl = updatedUser?.avatarUrl || initialProfile.avatarUrl

      profileForm.displayName = updatedUser?.displayName || profileForm.displayName.trim()
      profileForm.bio = updatedUser?.bio || profileForm.bio.trim()

      showToast('Cập nhật hồ sơ thành công.')
    } catch (error) {
      showToast(error.response?.data?.message || 'Cập nhật hồ sơ thất bại.', 'error')
    } finally {
      isSavingProfile.value = false
    }
  }

  if (canSavePassword.value) {
    isSavingPassword.value = true
    try {
      await authStore.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmNewPassword: passwordForm.confirmNewPassword,
      })

      passwordForm.currentPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmNewPassword = ''
      showToast('Đổi mật khẩu thành công.')
    } catch (error) {
      showToast(error.response?.data?.message || 'Đổi mật khẩu thất bại.', 'error')
    } finally {
      isSavingPassword.value = false
    }
  }
}

const handleLogout = () => {
  showLogoutModal.value = true
}

const closeLogoutModal = () => {
  if (isLoggingOut.value) return
  showLogoutModal.value = false
}

const confirmLogout = async () => {
  isLoggingOut.value = true
  try {
    authStore.logout()
    await router.push({ name: 'login' })
  } finally {
    isLoggingOut.value = false
    showLogoutModal.value = false
  }
}
</script>

<template>
  <main class="settings-view">
    <div class="settings-view__container">
      <header class="settings-view__header">
        <div class="settings-view__title-wrap">
          <button type="button" class="settings-icon-btn" @click="router.back()" title="Quay lại">
            <ArrowLeft :size="24" />
          </button>
          <h1 class="settings-view__title">
            <Settings :size="22" />
            <span>Settings</span>
          </h1>
        </div>
        <p class="settings-view__subtitle">Quản lý hồ sơ và bảo mật tài khoản của bạn</p>
      </header>

      <section class="settings-card settings-card--center">
        <div class="settings-avatar-wrap">
          <img
            v-if="avatarPreview || authStore.user?.avatarUrl"
            :src="avatarPreview || authStore.user?.avatarUrl"
            alt="Avatar"
            class="settings-avatar"
          />
          <div v-else class="settings-avatar settings-avatar--fallback">
            {{ (profileForm.displayName || displayNameText(authStore.user) || 'U').charAt(0).toUpperCase() }}
          </div>

          <button type="button" class="settings-secondary-btn" @click="openAvatarPicker">
            <Camera :size="14" />
            <span>Chỉnh sửa</span>
          </button>

          <input
            ref="avatarInputRef"
            type="file"
            accept="image/*"
            class="settings-hidden-input"
            @change="onAvatarSelected"
          />
        </div>
      </section>

      <section class="settings-card">
        <h2 class="settings-card__title">Thông tin hiển thị</h2>

        <label class="settings-label">Display Name</label>
        <input
          v-model="profileForm.displayName"
          type="text"
          maxlength="50"
          class="settings-input"
          placeholder="Nhập tên hiển thị (tối đa 50 ký tự)"
        />
        <p class="settings-count">{{ profileForm.displayName.length }}/50</p>

        <label class="settings-label">Description / Bio</label>
        <textarea
          v-model="profileForm.bio"
          maxlength="150"
          rows="4"
          class="settings-textarea"
          placeholder="Viết giới thiệu bản thân (tối đa 150 ký tự)"
        />
        <p class="settings-count">{{ profileForm.bio.length }}/150</p>
      </section>

      <section class="settings-card">
        <h2 class="settings-card__title">Đổi mật khẩu</h2>

        <label class="settings-label">Mật khẩu hiện tại</label>
        <div class="settings-password-wrap">
          <input
            v-model="passwordForm.currentPassword"
            :type="showCurrentPassword ? 'text' : 'password'"
            class="settings-input"
            placeholder="Nhập mật khẩu hiện tại"
          />
          <button type="button" class="settings-eye" @click="showCurrentPassword = !showCurrentPassword">
            <EyeOff v-if="showCurrentPassword" :size="14" />
            <Eye v-else :size="14" />
          </button>
        </div>

        <label class="settings-label">Mật khẩu mới</label>
        <div class="settings-password-wrap">
          <input
            v-model="passwordForm.newPassword"
            :type="showNewPassword ? 'text' : 'password'"
            class="settings-input"
            placeholder="Ít nhất 8 ký tự"
          />
          <button type="button" class="settings-eye" @click="showNewPassword = !showNewPassword">
            <EyeOff v-if="showNewPassword" :size="14" />
            <Eye v-else :size="14" />
          </button>
        </div>

        <label class="settings-label">Xác nhận mật khẩu mới</label>
        <div class="settings-password-wrap">
          <input
            v-model="passwordForm.confirmNewPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            class="settings-input"
            placeholder="Nhập lại mật khẩu mới"
          />
          <button type="button" class="settings-eye" @click="showConfirmPassword = !showConfirmPassword">
            <EyeOff v-if="showConfirmPassword" :size="14" />
            <Eye v-else :size="14" />
          </button>
        </div>
      </section>

      <p v-if="profileValidationError" class="settings-error">{{ profileValidationError }}</p>
      <p v-else-if="passwordValidationError" class="settings-error">{{ passwordValidationError }}</p>

      <div class="settings-actions">
        <button
          type="button"
          class="settings-primary-btn"
          :disabled="!canSave"
          @click="handleSaveChanges"
        >
          <span v-if="isSavingProfile || isSavingPassword" class="settings-spinner"></span>
          <Save v-else :size="14" />
          <span>{{ isSavingProfile || isSavingPassword ? 'Đang lưu...' : 'Lưu thay đổi' }}</span>
        </button>

        <button
          type="button"
          class="settings-danger-btn"
          :disabled="isLoggingOut"
          @click="handleLogout"
        >
          <span v-if="isLoggingOut" class="settings-spinner"></span>
          <LogOut v-else :size="14" />
          <span>{{ isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất' }}</span>
        </button>
      </div>
    </div>

    <AppModal
      :show="showLogoutModal"
      title="Xác nhận đăng xuất"
      subtitle="Bạn có chắc muốn đăng xuất khỏi tài khoản hiện tại?"
      confirm-text="Đăng xuất"
      cancel-text="Hủy"
      :loading="isLoggingOut"
      @close="closeLogoutModal"
      @confirm="confirmLogout"
    />

    <AppToast :show="toast.show" :message="toast.message" :type="toast.type" />

    <AvatarCropModal
      v-model:show="showCropModal"
      :file="pendingCropFile"
      title="Cắt ảnh đại diện"
      @cropped="onAvatarCropped"
    />
  </main>
</template>

<style scoped>
.settings-view {
  min-height: 100dvh;
  height: 100dvh;
  background: linear-gradient(180deg, rgba(12, 16, 28, 0.96), rgba(8, 12, 20, 0.98));
  color: #f3f7ff;
  padding: 28px 22px 36px;
  box-sizing: border-box;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}

.settings-view__container {
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
  animation: settings-enter 360ms cubic-bezier(.2,.8,.2,1);
  padding-bottom: 8px;
}

.settings-view__header {
  margin-bottom: 18px;
}

.settings-view__title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.settings-view__title {
  margin: 0;
  font-size: 28px;
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: 0.01em;
}

.settings-icon-btn {
  background: rgba(255, 255, 255, 0.03);
  border: none;
  color: #c1cbe3;
  cursor: pointer;
  padding: 10px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    transform var(--transition-fast),
    background-color var(--transition-fast),
    color var(--transition-fast),
    box-shadow var(--transition-fast);
  margin-left: -8px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}

.settings-icon-btn:hover {
  background: rgba(124, 140, 255, 0.12);
  color: #fff;
  transform: translateY(-1px);
}

.settings-view__subtitle {
  margin: 8px 0 0;
  color: #99a6c5;
}

.settings-card {
  border: 1px solid rgba(129, 140, 248, 0.12);
  background: linear-gradient(180deg, rgba(17, 23, 38, 0.96), rgba(11, 15, 25, 0.98));
  border-radius: 22px;
  padding: 18px;
  margin-bottom: 14px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.22);
}

.settings-card--center {
  display: flex;
  justify-content: center;
}

.settings-card__title {
  margin: 0 0 14px;
  font-size: 18px;
  font-weight: 800;
}

.settings-avatar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.settings-avatar {
  width: 112px;
  height: 112px;
  border-radius: 9999px;
  object-fit: cover;
  border: 2px solid rgba(124, 140, 255, 0.42);
  box-shadow: 0 16px 28px rgba(0, 0, 0, 0.28);
}

.settings-avatar--fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(124, 140, 255, 0.36), rgba(86, 104, 255, 0.22));
  font-size: 30px;
  font-weight: 800;
}

.settings-label {
  display: block;
  font-size: 13px;
  color: #c9d3e8;
  margin-bottom: 8px;
}

.settings-input,
.settings-textarea {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(18, 24, 40, 0.96);
  border-radius: 14px;
  color: #f8fbff;
  padding: 12px 14px;
  font-size: 14px;
  box-sizing: border-box;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast),
    background-color var(--transition-fast);
}

.settings-input:focus,
.settings-textarea:focus {
  outline: none;
  border-color: rgba(124, 140, 255, 0.45);
  box-shadow: 0 0 0 4px rgba(124, 140, 255, 0.12);
  background: rgba(20, 26, 43, 0.98);
}

.settings-textarea {
  resize: vertical;
  min-height: 96px;
}

.settings-count {
  margin: 6px 0 10px;
  color: #8c9ab6;
  font-size: 12px;
  text-align: right;
}

.settings-password-wrap {
  position: relative;
  margin-bottom: 10px;
}

.settings-password-wrap .settings-input {
  padding-right: 58px;
}

.settings-eye {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: #9cc0ff;
  cursor: pointer;
  font-size: 12px;
}

.settings-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.settings-primary-btn,
.settings-danger-btn,
.settings-secondary-btn {
  border: none;
  border-radius: 14px;
  padding: 11px 16px;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast),
    background-color var(--transition-fast),
    opacity var(--transition-fast);
}

.settings-primary-btn:hover,
.settings-danger-btn:hover,
.settings-secondary-btn:hover {
  transform: translateY(-1px);
}

.settings-primary-btn {
  background: linear-gradient(180deg, rgba(124, 140, 255, 0.96), rgba(86, 104, 255, 0.96));
  box-shadow: 0 12px 24px rgba(86, 104, 255, 0.24);
}

.settings-primary-btn:hover {
  box-shadow: 0 14px 28px rgba(86, 104, 255, 0.34);
}

.settings-danger-btn {
  background: linear-gradient(180deg, rgba(248, 113, 113, 0.96), rgba(220, 38, 38, 0.96));
  box-shadow: 0 12px 24px rgba(220, 38, 38, 0.2);
}

.settings-secondary-btn {
  background: rgba(255, 255, 255, 0.04);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}

.settings-primary-btn:disabled,
.settings-danger-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.settings-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 9999px;
  animation: settings-spin 0.8s linear infinite;
}

.settings-hidden-input {
  display: none;
}

.settings-error {
  margin: 0 0 12px;
  color: #ffb3c0;
  font-size: 13px;
}

@keyframes settings-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes settings-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 640px) {
  .settings-view {
    padding: 16px 12px 24px;
  }

  .settings-view__header {
    margin-bottom: 14px;
  }

  .settings-view__title {
    font-size: 22px;
  }

  .settings-view__subtitle {
    font-size: 13px;
  }

  .settings-card {
    border-radius: 18px;
    padding: 16px;
  }

  .settings-card__title {
    font-size: 17px;
  }

  .settings-actions {
    flex-direction: column;
  }

  .settings-primary-btn,
  .settings-danger-btn,
  .settings-secondary-btn {
    width: 100%;
    justify-content: center;
  }

  .settings-input,
  .settings-textarea {
    font-size: 16px;
  }

  .settings-avatar {
    width: 96px;
    height: 96px;
  }
}
</style>
