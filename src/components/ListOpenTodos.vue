<template>
  <div>
    <h2 class="tasks">
      Open Tasks
      <span class="meta">({{ todos.length }})</span>
    </h2>
    <item-todo
      v-for="(todo, index) in todos"
      :todo.sync="todo"
      :index.sync="index"
      :status="status"
      :key="todo.dateCreated"
      @delete-todo="deleteTodo"
      @progress-todo="progressTodo"
      @edit-todo="editTodo"
    />
  </div>
</template>

<script type = "text/javascript" >
import ItemTodo from './ItemTodo';

export default {
  components: {
    ItemTodo,
  },
  props: {
    todos: {
      type: Array,
      default: function() {
        return [];
      }
    },
    status: {
      type: String,
      default: function() {
        return ""
      }
    }
  },
  methods: {
    progressTodo(todo) {
      this.$emit('progress-todo', todo);
    },
    deleteTodo(todo) {
      this.$emit('delete-todo', todo);
    },
    editTodo(todo) {
      this.$emit('edit-todo', todo);
    }
  }
};
</script>
