<template>
  <div id="comments" ref="commentsRoot"></div>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import { useData } from "vitepress";

const commentsRoot = ref(null);
const commentsInstance = ref(null);
const { isDark } = useData();

const getTheme = () => (isDark.value ? "dark" : "light");

onMounted(async () => {
  if (!commentsRoot.value || typeof window === "undefined") return;

  const apiBaseUrl = "https://cwd-api.zishu.me";

  if (!apiBaseUrl) return;

  if (!window.CWDComments) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cwd.js.org/cwd.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = (e) => reject(e);
      document.head.appendChild(script);
    }).catch(() => {});
  }

  if (!window.CWDComments) return;

  const comments = new window.CWDComments({
    el: commentsRoot.value,
    apiBaseUrl,
    siteId: 'cwd-doc',
    theme: getTheme(),
  });

  commentsInstance.value = comments;

  comments.mount();

  watch(
    isDark,
    (value) => {
      if (!commentsInstance.value) return;
      commentsInstance.value.updateConfig({
        theme: value ? "dark" : "light",
      });
    },
    { immediate: false }
  );
});
</script>
