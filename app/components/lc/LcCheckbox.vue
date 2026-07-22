<template>
    <label class="lc-checkbox-wrapper">
        <input type="checkbox" :checked="checked" class="lc-checkbox" />
        <span class="lc-checkbox-label">{{label}}</span>
    </label>
</template>
<script setup>
defineOptions({ name: 'LcCheckbox' })
defineProps({
    checked: {
        type: Boolean,
        default: false
    },
    label: {
        type: String,
        default: ''
    }
})
</script>
<style scoped>
.lc-checkbox-wrapper {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 6px 0;
    cursor: pointer;
    font-size: 14px;
}
.lc-checkbox {
    width: 16px;
    height: 16px;
    cursor: pointer;
}
.lc-checkbox-label {
    color: var(--color-text);
}
</style>