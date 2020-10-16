<template>
  <div
    :id="'todo-'+todo.dateCreated"
    :class="dueClass"
    class="ui centered card"
  >
    <div
      v-show="!isEditing"
      class="content"
    >
      <div
        v-if="dueDateText && !isCompleted"
        class="_due"
      >
        Due: {{ dueDateText }}
      </div>
      <div
        v-else
        class="_spacer"
      />
      <div class="header _titlewrapper">
        <div class="_titlemeta">
          <i
            v-if="isCollapsed"
            class="caret right icon"
            @click="toggleCollapse()"
          />
          <i
            v-else
            class="caret down icon"
            @click="toggleCollapse()"
          />
          <span class="meta">{{ index+1 }}.</span>
        </div>
        <div class="_title">{{ todo.title }}</div>
      </div>
      <div
        v-show="!isCollapsed"
      >
        <div
          class="_project"
          v-html="projectAsHtml"
        />
        <div
          v-if="todo.note"
          class="meta _note"
          v-html="noteAsHtml"
        />
        <div class="right floated extra content ui mini basic icon buttons">
          <span
            v-show="!isCompleted"
            class="edit ui primary basic icon button"
            title="edit"
            @click="showForm()"
          >
            <i class="edit icon"/> edit
          </span>
          <span
            v-show="!isCompleted"
            class="or"
          />
          <span
            class="trash ui negative basic icon button"
            title="delete"
            @click="deleteTodo(todo)"
          >
            <i class="trash outline icon"/> delete
          </span>
        </div>
      </div>
    </div>
    <div
      v-show="!isCollapsed"
    >
      <div
        v-show="isOpen"
        class="ui bottom attached blue basic button"
        @click="progressTodo(todo)"
      >
        Start this task &nbsp; <i class="play icon"/>
      </div>
      <div
        v-show="isInProgress"
        class="ui bottom attached blue basic button"
        @click="completeTodo(todo)"
      >
        Complete this task &nbsp; <i class="stop icon"/>
      </div>
    </div>
    <edit-todo
      v-show="isEditing"
      :todo="todo"
      @edit-todo="editTodo"
      @cancel-edit="cancelEdit"
      @edit-todo-warning="editTodoWarning"
    />
  </div>
</template>

<script type="text/javascript">
  import app from '../App';
  import EditTodo from './CreateEditTodo';

  function simpleFormat(inp){
    return inp
      .replace(/</g, "&lt;")
      .replace(/\* /g, "⊛ ")
      .replace(/(http.+\b)/g, '<a href="$1" target="_blank">$1</a>')
      .replace(/\n/g, "<br>");
  }

  const DAY = 1000 * 60 * 60 * 24;

  export default {
    components: {
      EditTodo
    },
    props: {
      index: {
        type: Number,
        default: 0
      },
      todo: {
        type: Object,
        default: function() {
          return {
            dateCreated:"",
            dateDue:"",
            dateCompleted:"",
            title:"",
            project:"",
            note:"",
            status:""
          }
        }
      },
      initCollapsed: {
        type: Boolean,
        default: true
      }
    },
    data() {
      return {
        isEditing: false,
        isCollapsed: !!this.initCollapsed && true,
        STATUS: app.constants.STATUS
      };
    },
    computed: {
      projectAsHtml: function() {
        return simpleFormat(this.todo.project);
      },
      noteAsHtml: function() {
        return simpleFormat(this.todo.note);
      },
      dueDateObj: function() {
        return this.todo.dateDue? new Date(this.todo.dateDue + "T00:00:00") : null;
      },
      dueDateText: function() {
        let dateText = "";
        if (this.dueDateObj && !Number.isNaN(this.dueDateObj.getTime())){
          let dateFormat = {
            //weekday:'short',
            month:'short',
            day:'numeric',
            //year:'numeric'
          }
          let window = 7;
          let dueInNrDays = Math.ceil((this.dueDateObj.getTime() - new Date().getTime()) / DAY);
          if (dueInNrDays < window) {
            dateText = dueInNrDays===0? "today!"
            : dueInNrDays===1? "tomorrow"
            : dueInNrDays===-1? "yesterday!!"
            : dueInNrDays<-1? -dueInNrDays + " days ago!!!"
            : "in " + dueInNrDays + " days";
          } else {
            dateText = this.dueDateObj.toLocaleDateString('en-US', dateFormat);
          }
        }
        return dateText;
      },
      isPastDue: function() {
        return this.dueDateObj && (this.dueDateObj.setHours(0,0,0,0)) < (new Date().setHours(0,0,0,0));
      },
      isDueToday: function() {
        const window = DAY;
        return this.dueDateObj && ((this.dueDateObj.setHours(0,0,0,0)) - (new Date().setHours(0,0,0,0))) < window;
      },
      isDueSoon: function() {
        const window = DAY * 3;
        return this.dueDateObj && ((this.dueDateObj.setHours(0,0,0,0)) - (new Date().setHours(0,0,0,0))) < window;
      },
      isOpen: function() {
        return !this.isEditing && this.todo.status === this.STATUS.OPEN
      },
      isInProgress: function() {
        return !this.isEditing && this.todo.status === this.STATUS.PROGRESS
      },
      isCompleted: function() {
        return !this.isEditing && this.todo.status === this.STATUS.COMPLETE
      },
      dueClass: function() {
        return this.isCompleted? 'complete'
          : this.isPastDue? 'pastdue'
          : this.isDueToday? 'duetoday'
          : this.isDueSoon? 'duesoon'
          : 'notyetdue'
      }
    },
    methods: {
      toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;
      },
      progressTodo(todo) {
        this.$emit('progress-todo', todo);
      },
      completeTodo(todo) {
        this.$emit('complete-todo', todo);
      },
      deleteTodo(todo) {
        this.$emit('delete-todo', todo);
      },
      showForm() {
        this.isEditing = true;
        this.origTodo = Object.assign({}, this.todo);
      },
      editTodo(mod) {
        this.isEditing = false;
        this.$emit('edit-todo', {todo:this.todo, mod:mod});
      },
      cancelEdit() {
        this.todo.title = this.origTodo.title;
        this.todo.project = this.origTodo.project;
        this.todo.note = this.origTodo.note;
        this.todo.dateDue = this.origTodo.dateDue;
        this.isEditing = false;
      },
      editTodoWarning(warning) {
        this.$emit('edit-todo-warning', warning);
      }
    }
  };
</script>

<style>
.ui.card{
  margin:.5em 0;
}
.ui.card>.content{
  padding:.4em .7em;
}
h2 .meta{
  font-size:.75em;
  color:#00000063;
}
.ui.card .header .meta{
  color:#00000063;
}
.ui.card .meta{
  font-size:.85em;
  line-height: normal;
  color:#000000bf;
  font-style: italic;
}
.ui.card.notyetdue{
  background-color: #2bff0410;
}
.ui.card.duesoon{
  background-color: #ff6a0020;
}
.ui.card.duetoday{
  background-color: #ff000030;
}
.ui.card.pastdue{
  background-color: #ff000050;
}
.ui.card.complete{
  background-color: #415ca710;
}
.caret{
  cursor: pointer;
}
._spacer{
  height:.4em;
}
._due{
  text-align: right;
  position: relative;
  top:-.4em;
}
._titlemeta{
  display:inline-block;
  vertical-align: top;
}
._title{
  display:inline-block;
  width:75%;
  font-size:1.1rem;
}
._project,
._note{
  margin-top: .5em;
  padding-top: 1em;
  margin-bottom: .5em;
  border-top: 1px dotted #ccc;
}
</style>
