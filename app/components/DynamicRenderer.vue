<template>
  <component :is="componentMap[node.type]" v-bind="node.props" class="dynamic-node">
    <template v-if="node.props?.text || node.props?.value">{{ node.props.text || node.props.value }}</template>
    <DynamicRenderer v-for="(child, i) in node.children" :key="i" :node="child" />
  </component>
</template>

<script setup>
import LcButton from './lc/LcButton.vue'
import LcInput from './lc/LcInput.vue'
import LcImage from './lc/LcImage.vue'
import LcSelect from './lc/LcSelect.vue'
import LcLink from './lc/LcLink.vue'
import LcCheckbox from './lc/LcCheckbox.vue'
defineOptions({ name: 'DynamicRenderer' })
const props = defineProps({
  node: { type: Object, required: true }
})

const componentMap = {
  title: 'h3',
  text: 'p',
  input: LcInput,
  textarea: 'textarea',
  button: LcButton,
  image: LcImage,
  select: LcSelect,
  link: LcLink,
  checkbox: LcCheckbox,
  card: 'div',
  row: 'div',
  col: 'div',
}
</script>

<style scoped>
.dynamic-node {
  margin: 4px 0;
}
input, textarea, button {
  display: block;
  width: 100%;
  padding: 8px;
  margin: 4px 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  box-sizing: border-box;
}
button {
  background: var(--color-primary);
  color: #fff;
  border: none;
  cursor: pointer;
}
button:hover {
  opacity: 0.9;
}
h3 { margin: 8px 0; font-size: 16px; }
p { margin: 4px 0; color: var(--color-text-secondary); }
</style>
