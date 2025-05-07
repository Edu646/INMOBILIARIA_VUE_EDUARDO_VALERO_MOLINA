<script setup>
import { ref } from "vue";

function generateUniqueId(prefix = "prefix") {
  return prefix + "-" + Math.floor(Math.random() * Date.now());
}

function createTask(name) {
  return {
    name,
    prioridad,
    id: generateUniqueId("todo")
  };
}

function handleFormSubmit() {
  if (taskName.value.trim() === "") return;
  tasks.value.push(createTask(taskName.value));
  taskName.value = "";
}

function handleTodoDelete(id) {
  tasks.value = tasks.value.filter(task => task.id !== id);
}

const taskName = ref("");
const tasks = ref([
  {
    id: "todo-0",
    name: "Learn some frameworks!"
  }
]);
</script>

<template>
  <div class="todo-app">
    <h1>TodoMatic</h1>
    <form @submit.prevent="handleFormSubmit">
      <label for="todo-input">What needs to be done?</label>
      <input 
        type="text" 
        id="todo-input" 
        name="mozTodoDemoItemName" 
        autocomplete="on"
        v-model="taskName" 
      />
      <button type="submit">Add</button>
    </form>
    <ul id="todo-list">
      <li v-for="task in tasks" :key="task.id" :id="task.id">
        <span>{{ task.name }}</span>
        <button type="button" @click="handleTodoDelete(task.id)">Delete</button>
      </li>
    </ul>
  </div>
</template>
