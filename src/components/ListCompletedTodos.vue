<template>
  <div>
    <h2 class="tasks">
      Completed Tasks
      <span class="meta">({{ todos.length }})</span>
    </h2>
    <item-todo
      v-for="(todo, index) in todos"
      :todo.sync="todo"
      :index.sync="index"
      :key="todo.dateCreated"
      @edit-todo="edit-todo"
      @delete-todo="deleteTodo"
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
    editTodo(todo) {
      this.$emit('edit-todo', todo);
    },
    deleteTodo(todo) {
      this.$emit('delete-todo', todo);
    }
  }
};
</script>
