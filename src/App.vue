<template>
  <div id="app">
    <h1 class="ui dividing centered header">
      ToDo Tasks Activity Board
    </h1>
    <span class="_today">
      {{ dateToday }}
    </span>
    <div
      v-show="showUndo"
      class="_undo"
      @click="toggleUndo()"
    >
      <span class="_undotext">
        {{ undoText }}
      </span>
      <span
        v-if="showUndoIcon"
        class="undo _icon"
      >&#8630;</span>
      <span
        v-else
        class="redo _icon"
      >&#8631;</span>
    </div>
    <create-todo
      @create-todo="createTodo"
      @create-todo-warning="createTodoWarning"
    />
    <div class="ui three column centered grid">
      <div class="column">
        <list-open-todos
          :todos="openTodos"
          @delete-todo="deleteTodo"
          @progress-todo="progressTodo"
          @edit-todo="editTodo"
        />
      </div>
      <div class="column">
        <list-in-progress-todos
          :todos="inProgressTodos"
          @delete-todo="deleteTodo"
          @complete-todo="completeTodo"
          @edit-todo="editTodo"
        />
      </div>
      <div class="column">
        <list-completed-todos
          :todos="completedTodos"
          @delete-todo="deleteTodo"
        />
      </div>
    </div>
    <create-dummy-todos
      @create-todo="createTodo"
    />
  </div>
</template>

<script>
import swalModal from 'sweetalert';
import ListOpenTodos from './components/ListOpenTodos';
import ListInProgressTodos from './components/ListInProgressTodos';
import ListCompletedTodos from './components/ListCompletedTodos';
import CreateTodo from './components/CreateEditTodo';
import CreateDummyTodos from './components/CreateDummyTodos';
import storage from './storage.js';
const STATUS = {
  OPEN: "open",
  PROGRESS: "progress",
  COMPLETE: "complete"
};
const UNDODELAYTIME = 60 * 1000;
const STORAGEKEY = "todos";
storage.setType("local");
storage.enableUndo();

function dateObj(dateStr) {
  // convert yyyy-MM-dd string to date object
  return dateStr? new Date(dateStr + "T00:00:00") : null;
}
function sortByDateDue(a,b) {
  return !a.dateDue? 1
    : !b.dateDue? -1
    : dateObj(a.dateDue) - dateObj(b.dateDue);
}
function sortByDateCreated(a,b) {
  return b.dateCreated - a.dateCreated;
}
export default {
  name: 'App',
  components: {
    ListOpenTodos,
    ListInProgressTodos,
    ListCompletedTodos,
    CreateTodo,
    CreateDummyTodos
  },
  constants: {
    STATUS
  },
  data() {
    return {
      todos: this.getFromStore() || [],
      showUndo: false,
      showUndoIcon: true,
      undoAction: ""
    };
  },
  computed: {
    openTodos: function() {
      // order by due date (earliest due on top)
      return this.todos
        .filter(todo => {return todo.status === STATUS.OPEN})
        .sort((a,b) => {return sortByDateCreated(a,b)})
        .sort((a,b) => {return sortByDateDue(a,b)});
    },
    inProgressTodos: function() {
      // order by due date (earliest due on top)
      return this.todos
        .filter(todo => {return todo.status === STATUS.PROGRESS})
        .sort((a,b) => {return sortByDateCreated(a,b)})
        .sort((a,b) => {return sortByDateDue(a,b)});
    },
    completedTodos: function() {
      // order by date completed (latest on top)
      return this.todos
        .filter(todo => {return todo.status === STATUS.COMPLETE})
        .sort((a,b) => {return b.dateCompleted - a.dateCompleted});
    },
    undoText: function() {
      return (this.showUndoIcon? "Undo" : "Redo") + " 'task " + this.undoAction + "' ";
    },
    dateToday: function() {
      return new Date().toLocaleDateString('en-US', {
        weekday:'short',
        month:'short',
        day:'numeric'
      });
    }
  },
  methods: {
    hideUndoOption(){
      this.showUndo = false;
    },
    restartHideUndoTimer(){
      window.clearTimeout(this.timeoutID);
      this.timeoutID = window.setTimeout(this.hideUndoOption, UNDODELAYTIME);
    },
    setInStore(value, action){
      storage.setItem(STORAGEKEY, value);
      this.undoAction = action;
      this.showUndo = this.showUndoIcon = true;
      this.restartHideUndoTimer();
    },
    getFromStore(){
      return storage.getItem(STORAGEKEY);
    },
    toggleUndo(){
      this.todos = storage.undoItem(STORAGEKEY);
      this.showUndoIcon = !this.showUndoIcon;
      this.restartHideUndoTimer();
    },
    createTodo(todo) {
      todo.status = STATUS.OPEN;
      this.todos.push(todo);
      this.setInStore(this.todos, "create");
    },
    progressTodo(todo) {
      todo.status = STATUS.PROGRESS;
      this.setInStore(this.todos, "progress");
    },
    deleteTodo(todo) {
      const todoIndex = this.todos.indexOf(todo);
      this.todos.splice(todoIndex, 1);
      this.setInStore(this.todos, "delete");
    },
    completeTodo(todo) {
      todo.dateCompleted = Date.now();
      todo.status = STATUS.COMPLETE;
      this.setInStore(this.todos, "complete");
    },
    editTodo(obj) {
      let todo = obj.todo;
      const mod = obj.mod;
      todo.title = mod.title;
      todo.project = mod.project;
      todo.note = mod.note;
      todo.dateDue = mod.dateDue;
      this.setInStore(this.todos, "edit");
    },
    createTodoWarning(warning) {
      swalModal(warning.title, warning.text, 'warning');
    },
    editTodoWarning(warning) {
      swalModal(warning.title, warning.text, 'warning');
    }
  }
};
</script>

<style>
#app{
  padding:1em;
}
body{
  font-size:13px;
}
h2.tasks {
  text-align: center;
  font-size:1.5rem;
}
i.icon.caret{
  margin: 0;
}
.ui.form input,
.ui.form textarea{
  padding: .3em!important;
}
.swal-modal {
  animation: unset!important;
}
._titlewrapper{
  margin:0 -.6em;
}
._today{
  position: fixed;
  top:1em;
  left:1em;
  z-index:99;
  background-color:#f5f6f9e3;
  padding:.2em .5em;
  border:1px solid #c5c5c5;
  border-radius:5px;
  line-height:1.8em;
}
._undo{
  position: fixed;
  top:1em;
  right:1em;
  z-index:99;
  background-color:#dbecf9cc;
  padding:.2em .5em;
  border:1px solid #c5c5c5;
  border-radius:5px;
  color:#2185D0;
  cursor: pointer;
}
._undotext{
  position: relative;
  bottom:.2em;
}
._icon{
  font-size: 2em;
}
</style>
