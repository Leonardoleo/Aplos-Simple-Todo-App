<template>
  <div class="ui basic center aligned segment">
    <hr class="ui">
    <div class="ui">
      Create a few dummy Todos:<br>
      (for quick test of features)
    </div>
    <div class="ui action input">
      <input
        v-model="nrOfDummyTodos"
        class="ui action input"
        placeholder="enter a number > 0"
        type="number"
      >
      <button
        class="ui button"
        @click="createDummyTodos()"
      >
        Go!
      </button>
    </div>
  </div>
</template>


<script>
export default {
  data() {
    return {
      nrOfDummyTodos: null,
      dummyTodoCounter: 0,
    };
  },
  methods: {
    createDummyTodos() {
      for (let i=0; i<this.nrOfDummyTodos; i++) {
        let cntr = ++this.dummyTodoCounter;
        let due = new Date();
        due.setDate(due.getDate() + 1 + Math.floor(10*Math.random()));
        this.$emit('create-todo', {
          dateCreated: Date.now()+i*100,
          title: 'Todo title ' + cntr,
          project: 'Short project description ' + cntr,
          note: 'A note or comment ' + cntr + ' (' + due.toISOString().substring(5,10) + ')',
          dateDue: due.toISOString().substring(0,10)
        });
      }
    },
  }
}
</script>
