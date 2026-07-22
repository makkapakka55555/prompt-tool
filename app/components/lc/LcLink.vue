<template>
    <a :href="href" target="_blank" rel="noopener noreferrer" class="lc-link">{{ text }}</a>
</template>
<script setup>
defineOptions({ name: 'LcLink' })
const props = defineProps({
    text :{type:String, default: ''},
    href :{type:String, default: '#'}
})
</script>
<style scoped>
.lc-link {
    color: var(--color-primary);
    text-decoration: none;
    font-size: 14px;
}
.lc-link:hover {
    text-decoration: underline;
}
</style>
