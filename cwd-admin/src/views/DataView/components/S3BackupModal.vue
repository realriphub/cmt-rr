<template>
  <div v-if="visible" class="modal-overlay" @click.self="handleClose">
    <div class="modal s3-backup-modal">
      <div class="modal-header">
        <h3 class="modal-title">{{ t("data.sections.s3.backupListTitle") }}</h3>
        <button class="modal-close" @click="handleClose">&times;</button>
      </div>
      <div class="modal-content">
        <div v-if="loading" class="loading">
          <div class="loading-spinner"></div>
          <div class="loading-text">{{ t("data.sections.s3.loadingBackups") }}</div>
        </div>
        <div v-else-if="backups.length === 0" class="empty-backup-list">
          {{ t("data.sections.s3.emptyBackupList") }}
        </div>
        <div v-else class="backup-list">
          <div v-for="item in backups" :key="item.key" class="backup-item">
            <div class="backup-info">
              <div class="backup-name" :title="item.key">{{ item.key }}</div>
              <div class="backup-meta">
                <span class="backup-size">{{ formatFileSize(item.size) }}</span>
                <span class="backup-date">{{ new Date(item.lastModified).toLocaleString() }}</span>
              </div>
            </div>
            <div class="backup-actions">
              <button
                class="backup-btn download"
                @click="handleDownload(item.key)"
                :title="t('data.sections.s3.download')"
              >
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
              </button>
              <button
                class="backup-btn delete"
                @click="handleDelete(item.key)"
                :disabled="deletingKey === item.key"
                :title="t('data.sections.s3.delete')"
              >
                <svg v-if="deletingKey !== item.key" viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
                <span v-else class="loading-spinner small"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import {
  fetchS3BackupList,
  deleteS3Backup,
  downloadS3BackupUrl,
  S3BackupItem,
} from "../../../api/admin";

const props = defineProps<{
  visible: boolean;
  onClose?: () => void;
}>();

const emit = defineEmits<{
  close: [];
}>();

const { t } = useI18n();

const loading = ref(false);
const backups = ref<S3BackupItem[]>([]);
const deletingKey = ref<string | null>(null);

const handleClose = () => {
  if (loading.value || deletingKey.value) {
    return;
  }
  emit("close");
};

const handleDownload = (key: string) => {
  const url = downloadS3BackupUrl(key);
  window.open(url, "_blank");
};

const handleDelete = async (key: string) => {
  if (!confirm(t("data.sections.s3.confirmDelete", { file: key }))) {
    return;
  }

  deletingKey.value = key;
  try {
    await deleteS3Backup(key);
    backups.value = backups.value.filter((item) => item.key !== key);
  } catch (e: any) {
    console.error("Delete error:", e);
  } finally {
    deletingKey.value = null;
  }
};

const fetchBackups = async () => {
  if (!props.visible) return;

  loading.value = true;
  try {
    const res = await fetchS3BackupList();
    backups.value = res.files;
  } catch (e: any) {
    console.error("Fetch backups error:", e);
  } finally {
    loading.value = false;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      fetchBackups();
    } else {
      backups.value = [];
    }
  }
);
</script>

<style scoped lang="less">
.s3-backup-modal {
  max-width: 600px;
  width: 90%;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 5px;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.modal-content {
  overflow-y: auto;
  flex: 1;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 8px;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-spinner.small {
  width: 14px;
  height: 14px;
}

.loading-text {
  color: var(--text-secondary);
  font-size: 14px;
}

.empty-backup-list {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.backup-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.backup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  gap: 12px;
}

.backup-info {
  flex: 1;
  min-width: 0;
}

.backup-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.backup-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--text-secondary);
}

.backup-size {
  background: var(--bg-primary);
  padding: 2px 8px;
  border-radius: 4px;
}

.backup-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.backup-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.backup-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
  border-color: var(--border-hover);
}

.backup-btn.download:hover {
  color: var(--primary-color);
}

.backup-btn.delete:hover {
  color: #ef4444;
}

.backup-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
