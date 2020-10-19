<template>
  <div class="ui basic content right aligned segment">
    <button
      v-show="!showForm && !isEdit"
      class="ui basic button icon"
      @click="openTodoForm"
    >
      <i class="plus icon"/> Add a task
    </button>
    <div
      v-show="showForm"
      class="ui centered card"
    >
      <div class="content">
        <div class="ui form">
          <div class="field">
            <label>Title *</label>
            <input
              v-model="title"
              type="text"
            >
          </div>
          <div class="field">
            <label>Project Description *</label>
            <textarea
              v-model="project"
            />
          </div>
          <div class="field">
            <label>Note / Comment</label>
            <textarea
              v-model="note"
            />
          </div>
          <div class="field">
            <label>Date Due</label>
            <input
              v-model="dateDue"
              type="date"
            >
          </div>
          <div class="ui two button attached buttons">
            <button
              class="ui basic blue button"
              @click="createEditTodo()"
            >
              {{ createEditButtonText }}
            </button>
            <button
              class="ui basic red button"
              @click="cancelTodo"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    todo: {
      type: Object,
      default: function() {
        return {}
      }
    }
  },
  data() {
    return {
      title: this.todo && this.todo.title || '',
      project: this.todo && this.todo.project || '',
      note: this.todo && this.todo.note || '',
      dateDue: this.todo && this.todo.dateDue || '',
      showForm: !!(this.todo && this.todo.title)
    };
  },
  computed: {
    formattedDate: {
      get: function(){
        return this.dateDue;
      },
      set: function(to){
        this.dueDate = to;
      }
    },
    isEdit: function(){
      return !!(this.todo && this.todo.title);
    },
    createEditButtonText: function(){
      return this.isEdit? "Edit" : "Create";
    }
  },
  methods: {
    openTodoForm() {
      this.showForm = true;
    },
    cancelTodo() {
      if (this.isEdit) {
        this.$emit('cancel-edit');
      }
      this.closeTodoForm();
    },
    closeTodoForm() {
      if (this.isEdit) {
        this.resetTodoForm();
      } else {
        this.clearTodoForm();
      }
    },
    resetTodoForm() {
      this.title = this.todo.title;
      this.project = this.todo.project;
      this.note = this.todo.note;
      this.dateDue = this.todo.dateDue;
    },
    clearTodoForm() {
      this.title = '';
      this.project = '';
      this.note = '';
      this.dateDue = '';
      this.showForm = false;
    },
    createEditTodo() {
      const msgType = this.isEdit? 'edit-todo' : 'create-todo';
      if (this.title.length > 0 && this.project.length > 0) {
        this.$emit(msgType, {
          dateCreated: Date.now(),
          title: this.title,
          project: this.project,
          note: this.note,
          dateDue: this.dateDue,
          done: false,
        });
        this.closeTodoForm();
      } else {
        let txt = (this.title.length === 0)? "Please provide a title." : "";
        txt += (this.title.length === 0 && this.project.length === 0)? "\n" : "";
        txt += this.project.length === 0? "Please provide a project description." : "";
        this.$emit(msgType + '-warning', {
          title: 'Missing input',
          text: txt
        });
      }
    },
  },
};
</script>

<style scoped>
.ui.form textarea:not([rows]){
  min-height:4em;
  height:8em;
}
</style>
