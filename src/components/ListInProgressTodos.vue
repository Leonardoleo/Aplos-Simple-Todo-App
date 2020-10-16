<template>
  <div>
    <h2 class="tasks">
      Tasks In Progress
      <span class="meta">({{ todos.length }})</span>
    </h2>
    <item-todo
      v-for="(todo, index) in todos"
      :todo.sync="todo"
      :index.sync="index"
      :key="todo.dateCreated"
      :init-collapsed="false"
      @delete-todo="deleteTodo"
      @complete-todo="completeTodo"
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
        return []
      }
    }
  },
  methods: {
    completeTodo(todo) {
      this.$emit('complete-todo', todo);
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
